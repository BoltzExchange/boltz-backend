use crate::types;
use crate::utils::TimeoutMap;
use crate::webhook::invoice_caller::InvoiceHook;
use alloy::hex;
use anyhow::{Result, anyhow};
use bitcoin::secp256k1::schnorr::Signature;
use bitcoin::secp256k1::{Message, PublicKey, Secp256k1};
use dashmap::DashMap;
use elements_miniscript::ToPublicKey;
use serde::{Deserialize, Serialize};
use std::hash::{DefaultHasher, Hash, Hasher};
use std::sync::Arc;
use std::time::Duration;
use tokio::sync::{broadcast, mpsc};

type HookId = u64;
type OfferId = u64;
type ConnectionId = u64;

const OFFER_SUBSCRIBE_MESSAGE: &str = "SUBSCRIBE";
const INVOICE_REQUEST_TIMEOUT: Duration = Duration::from_secs(60);

#[derive(Serialize, Deserialize, Debug, PartialEq)]
pub struct InvoiceRequestParams {
    pub offer: String,
    pub signature: String,
}

#[derive(Debug, Clone)]
pub struct OfferSubscriptions {
    network: crate::wallet::Network,

    pending_hooks: Arc<TimeoutMap<HookId, InvoiceHook<types::False>>>,

    all_offers: Arc<DashMap<OfferId, ConnectionId>>,
    offer_subscriptions: Arc<DashMap<ConnectionId, mpsc::Sender<InvoiceHook<types::False>>>>,

    invoice_response_tx: broadcast::Sender<(InvoiceHook<types::False>, String)>,
}

impl OfferSubscriptions {
    pub fn new(network: crate::wallet::Network) -> Self {
        Self {
            network,
            pending_hooks: Arc::new(TimeoutMap::new(INVOICE_REQUEST_TIMEOUT)),
            all_offers: Arc::new(DashMap::new()),
            offer_subscriptions: Arc::new(DashMap::new()),
            invoice_response_tx: broadcast::channel::<(InvoiceHook<types::False>, String)>(256).0,
        }
    }

    pub fn connection_added(
        &self,
        connection_id: u64,
    ) -> mpsc::Receiver<InvoiceHook<types::False>> {
        let (tx, rx) = mpsc::channel(64);
        self.offer_subscriptions.entry(connection_id).insert(tx);

        rx
    }

    pub fn connection_dropped(&self, connection_id: u64) {
        self.offer_subscriptions.remove(&connection_id);
        self.all_offers.retain(|_, id| *id != connection_id);
    }

    pub fn connection_id_known(&self, connection_id: u64) -> bool {
        self.offer_subscriptions.contains_key(&connection_id)
    }

    pub async fn request_invoice(&self, hook: InvoiceHook<types::False>) -> Result<bool> {
        match self.all_offers.get(&self.hash_offer(&hook.offer)?.1) {
            Some(connection_id) => {
                self.pending_hooks.insert(hook.id(), hook.clone());
                self.offer_subscriptions
                    .get_mut(&connection_id)
                    .unwrap()
                    .send(hook)
                    .await?;
                Ok(true)
            }
            None => Ok(false),
        }
    }

    pub fn received_invoice_response(&self, hook_id: u64, invoice: String) {
        if let Some(hook) = self.pending_hooks.remove(&hook_id) {
            let _ = self.invoice_response_tx.send((hook, invoice));
        }
    }

    pub fn subscribe_invoice_responses(
        &self,
    ) -> broadcast::Receiver<(InvoiceHook<types::False>, String)> {
        self.invoice_response_tx.subscribe()
    }

    pub fn offers_subscribe(
        &self,
        connection_id: u64,
        offers: &[InvoiceRequestParams],
    ) -> Result<()> {
        let secp = Secp256k1::verification_only();
        let mut to_insert = vec![];

        let message = Message::from_digest(
            *bitcoin_hashes::Sha256::hash(OFFER_SUBSCRIBE_MESSAGE.as_bytes()).as_byte_array(),
        );

        // Only add the offers if all signatures are valid
        for offer in offers {
            let sig_bytes = hex::decode(&offer.signature)
                .map_err(|err| anyhow!("invalid signature: {}", err))?;

            let (signing_pubkey, offer_id) = self.hash_offer(&offer.offer)?;
            if secp
                .verify_schnorr(
                    &Signature::from_slice(&sig_bytes)?,
                    &message,
                    &signing_pubkey.to_x_only_pubkey(),
                )
                .is_err()
            {
                return Err(anyhow!("invalid signature"));
            }

            to_insert.push(offer_id);
        }

        if !self.offer_subscriptions.contains_key(&connection_id) {
            return Ok(());
        }

        for id in to_insert {
            self.all_offers.insert(id, connection_id);
        }

        Ok(())
    }

    fn hash_offer(&self, offer: &str) -> Result<(PublicKey, OfferId)> {
        let signing_pubkey = match crate::lightning::invoice::decode(self.network, offer)? {
            crate::lightning::invoice::Invoice::Offer(offer) => {
                match offer.issuer_signing_pubkey() {
                    Some(pubkey) => pubkey,
                    None => return Err(anyhow!("no signing public key in offer")),
                }
            }
            _ => return Err(anyhow!("invalid offer")),
        };

        let mut hasher = DefaultHasher::new();
        signing_pubkey.hash(&mut hasher);
        Ok((signing_pubkey, hasher.finish()))
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use crate::wallet::Network;
    use bitcoin::secp256k1::Keypair;

    const OFFER_KEY: &str = "13a3f5913d777484ec60786e9059d50590f00d466495e50e895c32f3de89a94e";
    const OFFER: &str = "lno1qgsqvgnwgcg35z6ee2h3yczraddm72xrfua9uve2rlrm9deu7xyfzrcsmgphhx6zv669lvdcuhk32zxn5kmr2jmeuuqeg6yr3zv4q7sk7rqymzqr4g6hpm45dvz4jkypdahmye00cch44n4c7erwy2h6kgjs72hpsxpszqn4ks5hmdjksx2x8lrwx4a0ca7uxpqy3yjhecy8xh5d27mcjs726gq8f7vak7euk7n4pyfjlkma8z9rrkjdgpj8twuhg0s4usnh8hysz67mgt6aumnp73xx3vqwaedgtg3mkyph8e3f7huhnzw9tdfhss92h5wqj68a9wl8898j2wxg39g7nw7thadqum494x52qmrn80q3hkla4gchv5q3nejdhfhd87jzkmyeruj690d5h5gkyypxs2na8v0puhs59lljcwha9k34hngyvl9jndntfc386f4hl0utsdg";

    #[tokio::test]
    async fn connection_added() {
        let id = 1;

        let subs = OfferSubscriptions::new(Network::Regtest);
        assert!(!subs.connection_id_known(id));

        let mut recv = subs.connection_added(id);
        assert!(subs.connection_id_known(id));

        let hook = InvoiceHook::new("offer".to_string(), &[0u8; 32], None);
        subs.offer_subscriptions
            .get_mut(&id)
            .unwrap()
            .send(hook.clone())
            .await
            .unwrap();

        assert_eq!(recv.recv().await.unwrap(), hook);
    }

    #[test]
    fn connection_dropped() {
        let id = 1;

        let subs = OfferSubscriptions::new(Network::Regtest);
        let mut recv = subs.connection_added(id);
        assert!(subs.connection_id_known(id));

        subs.offers_subscribe(
            id,
            &[InvoiceRequestParams {
                offer: OFFER.to_string(),
                signature: hex::encode(sign_message(OFFER_SUBSCRIBE_MESSAGE).serialize()),
            }],
        )
        .unwrap();

        let (_, offer_id) = subs.hash_offer(OFFER).unwrap();

        assert!(subs.all_offers.contains_key(&offer_id));
        assert_eq!(subs.all_offers.get(&offer_id).unwrap().value(), &id);

        subs.connection_dropped(id);

        assert!(!subs.connection_id_known(id));
        assert!(!subs.all_offers.contains_key(&offer_id));
        assert!(recv.try_recv().is_err());
    }

    #[tokio::test]
    async fn request_invoice() {
        let subs = OfferSubscriptions::new(Network::Regtest);

        let id = 1;
        let mut recv = subs.connection_added(id);
        subs.offers_subscribe(
            id,
            &[InvoiceRequestParams {
                offer: OFFER.to_string(),
                signature: hex::encode(sign_message(OFFER_SUBSCRIBE_MESSAGE).serialize()),
            }],
        )
        .unwrap();

        let hook = InvoiceHook::new(OFFER.to_string(), &[0u8; 32], None);
        assert!(subs.request_invoice(hook.clone()).await.unwrap());

        assert!(subs.pending_hooks.contains_key(&hook.id()));

        assert_eq!(recv.recv().await.unwrap(), hook);

        let invoice = "invoice";
        let mut invoice_sub = subs.subscribe_invoice_responses();
        subs.received_invoice_response(hook.id(), invoice.to_string());

        assert_eq!(
            invoice_sub.recv().await.unwrap(),
            (hook.clone(), invoice.to_string())
        );

        assert!(!subs.pending_hooks.contains_key(&hook.id()));
    }

    #[test]
    fn offers_subscribe() {
        let subs = OfferSubscriptions::new(Network::Regtest);

        let connection_id = 21;
        subs.connection_added(connection_id);
        subs.offers_subscribe(
            connection_id,
            &[InvoiceRequestParams {
                offer: OFFER.to_string(),
                signature: hex::encode(sign_message(OFFER_SUBSCRIBE_MESSAGE).serialize()),
            }],
        )
        .unwrap();

        assert_eq!(
            subs.all_offers
                .get(&subs.hash_offer(OFFER).unwrap().1)
                .unwrap()
                .value(),
            &connection_id
        );
    }

    #[test]
    fn offers_subscribe_invalid_signature() {
        let subs = OfferSubscriptions::new(Network::Regtest);

        let connection_id = 21;
        subs.connection_added(connection_id);

        assert_eq!(
            subs.offers_subscribe(
                connection_id,
                &[InvoiceRequestParams {
                    offer: OFFER.to_string(),
                    signature: "not hex".to_string(),
                }],
            )
            .unwrap_err()
            .to_string(),
            "invalid signature: odd number of digits"
        );
        assert!(subs.all_offers.is_empty());

        assert_eq!(
            subs.offers_subscribe(
                connection_id,
                &[InvoiceRequestParams {
                    offer: OFFER.to_string(),
                    signature: hex::encode(sign_message("invalid").serialize()),
                }],
            )
            .unwrap_err()
            .to_string(),
            "invalid signature"
        );
        assert!(subs.all_offers.is_empty());
    }

    #[test]
    fn hash_offer() {
        let subs = OfferSubscriptions::new(Network::Regtest);
        let (pubkey, offer_id) = subs.hash_offer(OFFER).unwrap();

        assert_eq!(
            pubkey.to_string(),
            Keypair::from_seckey_str(&Secp256k1::signing_only(), OFFER_KEY)
                .unwrap()
                .public_key()
                .to_string()
        );

        let mut hasher = DefaultHasher::new();
        pubkey.hash(&mut hasher);
        assert_eq!(offer_id, hasher.finish());
    }

    #[test]
    fn hash_offer_invalid() {
        let subs = OfferSubscriptions::new(Network::Regtest);
        assert!(subs.hash_offer("invalid").is_err());
    }

    fn sign_message(message: &str) -> Signature {
        let secp = Secp256k1::signing_only();
        Keypair::from_seckey_str(&secp, OFFER_KEY)
            .unwrap()
            .sign_schnorr(Message::from_digest(
                *bitcoin_hashes::Sha256::hash(message.as_bytes()).as_byte_array(),
            ))
    }
}

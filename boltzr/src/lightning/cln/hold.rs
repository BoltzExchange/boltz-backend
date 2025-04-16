use crate::api::ws::OfferSubscriptions;
use crate::chain::BaseClient;
use crate::db::helpers::offer::OfferHelper;
use crate::db::models::Offer;
use crate::lightning::cln::cln_rpc::{GetinfoRequest, InjectonionmessageRequest};
use crate::lightning::cln::hold::hold_rpc::onion_message::ReplyBlindedPath;
use crate::lightning::cln::hold::hold_rpc::{GetInfoRequest, OnionMessageResponse};
use crate::lightning::invoice::Invoice;
use crate::types;
use crate::wallet;
use crate::webhook::caller::validate_url;
use crate::webhook::invoice_caller::{InvoiceCaller, InvoiceHook};
use anyhow::{Result, anyhow};
use async_trait::async_trait;
use bitcoin::secp256k1::schnorr::Signature;
use bitcoin::secp256k1::{Message, PublicKey, Secp256k1};
use elements_miniscript::ToPublicKey;
use hold_rpc::HookAction;
use lightning::blinded_path::message::BlindedMessagePath;
use lightning::blinded_path::{BlindedHop, EmptyNodeIdLookUp};
use lightning::ln::channelmanager::PaymentId;
use lightning::ln::inbound_payment::ExpandedKey;
use lightning::offers::invoice::Bolt12Invoice;
use lightning::offers::invoice_request::InvoiceRequest;
use lightning::offers::nonce::Nonce;
use lightning::offers::parse::Bolt12SemanticError;
use lightning::onion_message::messenger::{Destination, OnionMessagePath, create_onion_message};
use lightning::onion_message::offers::OffersMessage;
use lightning::sign::{KeysManager, RandomBytes};
use lightning::util::ser::Writeable;
use rand::RngCore;
use serde::{Deserialize, Serialize};
use std::fs;
use std::sync::Arc;
use tokio::sync::{broadcast, mpsc};
use tokio_util::sync::CancellationToken;
use tonic::transport::{Certificate, Channel, ClientTlsConfig, Identity};
use tracing::{debug, error, info, instrument, warn};

const ERR_INVALID_SIGNATURE: &str = "invalid signature";
const ERR_NO_OFFER_REGISTERED: &str = "no offer for this signing public key was registered";

const OFFER_DELETE_MESSAGE: &str = "DELETE";

const INVOICE_FETCH_TIMEOUT_SECONDS: u64 = 30;

#[derive(Debug, Deserialize)]
struct InvoiceRequestResponse {
    pub invoice: String,
}

pub mod hold_rpc {
    tonic::include_proto!("hold");
}

#[derive(Deserialize, Serialize, PartialEq, Clone, Debug)]
pub struct Config {
    pub host: String,
    pub port: u16,

    #[serde(rename = "rootCertPath")]
    pub root_cert_path: String,
    #[serde(rename = "privateKeyPath")]
    pub private_key_path: String,
    #[serde(rename = "certChainPath")]
    pub cert_chain_path: String,
}

#[derive(Clone)]
pub struct Hold {
    symbol: String,
    network: wallet::Network,
    offer_helper: Arc<dyn OfferHelper + Send + Sync + 'static>,
    offer_subscriptions: OfferSubscriptions,
    invoice_caller: InvoiceCaller,
    cln: crate::lightning::cln::cln_rpc::node_client::NodeClient<Channel>,
    hold: hold_rpc::hold_client::HoldClient<Channel>,
}

impl Hold {
    pub async fn new(
        cancellation_token: CancellationToken,
        symbol: &str,
        network: wallet::Network,
        config: &Config,
        cln: crate::lightning::cln::cln_rpc::node_client::NodeClient<Channel>,
        offer_helper: Arc<dyn OfferHelper + Send + Sync + 'static>,
        offer_subscriptions: OfferSubscriptions,
    ) -> Result<Self> {
        let tls = ClientTlsConfig::new()
            .domain_name("hold")
            .ca_certificate(Certificate::from_pem(fs::read_to_string(
                &config.root_cert_path,
            )?))
            .identity(Identity::from_pem(
                fs::read_to_string(&config.cert_chain_path)?,
                fs::read_to_string(&config.private_key_path)?,
            ));

        let channel = Channel::from_shared(format!("https://{}:{}", config.host, config.port))?
            .tls_config(tls)?
            .connect()
            .await?;

        let invoice_caller = InvoiceCaller::new(
            cancellation_token,
            // Tight limits because the invoice requests time out quickly
            crate::webhook::caller::Config {
                request_timeout: Some(15),
                max_retries: Some(2),
                retry_interval: Some(10),
            },
            network == wallet::Network::Regtest,
        );

        {
            let invoice_caller = invoice_caller.clone();
            tokio::spawn(async move {
                invoice_caller.start().await;
            });
        }

        Ok(Self {
            cln,
            network,
            offer_helper,
            invoice_caller,
            offer_subscriptions,
            symbol: symbol.to_string(),
            hold: hold_rpc::hold_client::HoldClient::new(channel),
        })
    }

    pub fn add_offer(&self, offer: String, url: Option<String>) -> Result<()> {
        let signer = Self::prepare_offer(self.network, &offer, url.as_deref())?;
        if self.offer_helper.get_by_signer(&signer)?.is_some() {
            return Err(anyhow!(
                "an offer for this signing public key was registered already"
            ));
        }

        self.offer_helper.insert(&Offer {
            signer,
            // Needed when we lookup if we know an offer when fetching
            offer: offer.to_lowercase(),
            url,
        })?;
        info!("Registered offer");
        Ok(())
    }

    pub fn update_offer(&self, offer: String, url: String, signature: &[u8]) -> Result<()> {
        let signer = Self::prepare_offer(self.network, &offer, Some(&url))?;
        if self.offer_helper.get_by_signer(&signer)?.is_none() {
            return Err(anyhow!(ERR_NO_OFFER_REGISTERED));
        }

        if !Self::schnor_signature_valid(&signer, signature, &url)? {
            return Err(anyhow!(ERR_INVALID_SIGNATURE));
        }

        self.offer_helper.update(&signer, url)?;
        info!("Updated offer");
        Ok(())
    }

    pub fn delete_offer(&self, offer: String, signature: &[u8]) -> Result<()> {
        let signer = Self::prepare_offer(self.network, &offer, None)?;
        if self.offer_helper.get_by_signer(&signer)?.is_none() {
            return Err(anyhow!(ERR_NO_OFFER_REGISTERED));
        }

        if !Self::schnor_signature_valid(&signer, signature, OFFER_DELETE_MESSAGE)? {
            return Err(anyhow!(ERR_INVALID_SIGNATURE));
        }

        self.offer_helper.delete(&signer)?;
        info!("Deleted offer");
        Ok(())
    }

    pub async fn fetch_invoice(&self, offer: Offer, amount_msat: u64) -> Result<String> {
        let parsed = match crate::lightning::invoice::decode(self.network, &offer.offer)? {
            Invoice::Offer(offer) => offer,
            _ => return Err(anyhow!("invalid offer")),
        };

        let (entropy_bytes, entropy) = Self::entropy_source();
        let expanded_key = ExpandedKey::new(entropy_bytes);
        let nonce = Nonce::from_entropy_source(&entropy);
        let payment_id = PaymentId(Self::entropy_source().0);
        let secp_ctx = Secp256k1::signing_only();

        // To avoid annoying error mapping
        let build_invoice_request =
            move || -> std::result::Result<InvoiceRequest, Bolt12SemanticError> {
                (parsed.request_invoice(&expanded_key, nonce, &secp_ctx, payment_id)?)
                    .chain(self.network.bitcoin())?
                    .amount_msats(amount_msat)?
                    .build_and_sign()
            };

        let request = build_invoice_request().map_err(|e| anyhow!("{:?}", e))?;

        let mut request_bytes = vec![];
        request.write(&mut request_bytes)?;

        let hook = InvoiceHook::new(offer.offer, &request_bytes, None);
        let hook_id = hook.id();

        let receiver = self.offer_subscriptions.subscribe_invoice_responses();
        if self
            .offer_subscriptions
            .request_invoice(hook.clone())
            .await?
        {
            debug!("Sending BOLT12 invoice Websocket request");
            Self::wait_for_response(hook_id, receiver, Ok).await
        } else if let Some(url) = offer.url {
            let receiver = self.invoice_caller.subscribe_successful_calls();
            self.invoice_caller.call(hook.with_url(url)).await?;

            Self::wait_for_response(hook_id, receiver, |data| {
                Ok(serde_json::from_slice::<InvoiceRequestResponse>(&data)?.invoice)
            })
            .await
        } else {
            Err(anyhow!("no way to reach client"))
        }
    }

    async fn stream_onion_messages(&mut self) -> Result<()> {
        let our_pubkey = self.cln.getinfo(GetinfoRequest {}).await?.into_inner().id;
        let our_pubkey = PublicKey::from_slice(&our_pubkey)?;

        {
            let mut self_cp = self.clone();
            tokio::spawn(async move {
                self_cp
                    .handle_response_stream(
                        our_pubkey,
                        self_cp.invoice_caller.subscribe_successful_calls(),
                        |data| Ok(serde_json::from_slice::<InvoiceRequestResponse>(&data)?.invoice),
                    )
                    .await;
            });
        }

        {
            let mut self_cp = self.clone();
            tokio::spawn(async move {
                self_cp
                    .handle_response_stream(
                        our_pubkey,
                        self_cp.offer_subscriptions.subscribe_invoice_responses(),
                        Ok,
                    )
                    .await;
            });
        }

        let (response_tx, response_rx) = mpsc::channel(256);
        let mut stream = self
            .hold
            .onion_messages(tokio_stream::wrappers::ReceiverStream::new(response_rx))
            .await?
            .into_inner();

        let self_cp = self.clone();
        tokio::spawn(async move {
            let response_msg = async |id: u64, action: HookAction| {
                if let Err(err) = response_tx
                    .send(OnionMessageResponse {
                        id,
                        action: action.into(),
                    })
                    .await
                {
                    error!("Could not send onion message response: {}", err);
                }
            };

            loop {
                match stream.message().await {
                    Ok(msg) => {
                        let msg = match msg {
                            Some(msg) => msg,
                            None => continue,
                        };
                        let invoice_request = match msg.invoice_request {
                            Some(req) => req,
                            None => {
                                response_msg(msg.id, HookAction::Continue).await;
                                continue;
                            }
                        };

                        let reply_blinded_path = match msg.reply_blindedpath {
                            Some(path) => path,
                            None => {
                                debug!("Not handling invoice request: blinded reply path missing");
                                response_msg(msg.id, HookAction::Continue).await;
                                continue;
                            }
                        };

                        let offer =
                            match self_cp.get_offer_for_invoice_request(invoice_request.clone()) {
                                Ok(Some(offer)) => offer,
                                Ok(None) => {
                                    debug!("Not handling invoice request: no offer found");
                                    response_msg(msg.id, HookAction::Continue).await;
                                    continue;
                                }
                                Err(err) => {
                                    warn!("Could not get offer for invoice request: {}", err);
                                    response_msg(msg.id, HookAction::Continue).await;
                                    continue;
                                }
                            };

                        // When it's our offer, we resolve the hook
                        response_msg(msg.id, HookAction::Resolve).await;

                        let hook = InvoiceHook::new(
                            offer.offer,
                            &invoice_request,
                            Some(reply_blinded_path),
                        );

                        // When there is a WebSocket connection, use it
                        match self_cp
                            .offer_subscriptions
                            .request_invoice(hook.clone())
                            .await
                        {
                            Ok(true) => {
                                debug!("Sending BOLT12 invoice Websocket request");
                                continue;
                            }
                            Err(err) => {
                                warn!("Sending BOLT12 invoice Websocket request failed: {}", err);
                                continue;
                            }
                            _ => {}
                        }

                        if let Some(url) = offer.url {
                            if let Err(error) =
                                self_cp.invoice_caller.call(hook.with_url(url)).await
                            {
                                warn!("Sending BOLT12 invoice Webhook failed: {}", error);
                            }
                        } else {
                            debug!("No way to reach client for invoice request");
                        }
                    }
                    Err(err) => {
                        error!(
                            "{} CLN {} onion message subscription failed: {}",
                            self_cp.symbol,
                            self_cp.kind(),
                            err
                        );
                        break;
                    }
                }
            }
        });

        Ok(())
    }

    async fn handle_response_stream<T, R>(
        &mut self,
        our_pubkey: PublicKey,
        mut receiver: broadcast::Receiver<(InvoiceHook<T>, R)>,
        parse_response: impl Fn(R) -> Result<String>,
    ) where
        T: types::Bool + Clone,
        R: Clone,
    {
        loop {
            let (hook, res) = match receiver.recv().await {
                Ok(msg) => msg,
                Err(err) => {
                    error!(
                        "Subscribing to BOLT12 invoice subscription responses failed: {}",
                        err
                    );
                    break;
                }
            };
            if !hook.respond_with_onion() {
                continue;
            }

            let invoice = match parse_response(res) {
                Ok(invoice) => invoice,
                Err(err) => {
                    warn!("Could not parse BOLT12 invoice response: {}", err);
                    continue;
                }
            };
            if let Err(err) = self.handle_response(our_pubkey, hook, &invoice).await {
                warn!("Handling BOLT12 invoice response failed: {}", err);
            }
        }
    }

    #[instrument(name = "hold::handle_response", skip_all)]
    async fn handle_response<T: types::Bool>(
        &mut self,
        our_pubkey: PublicKey,
        hook: InvoiceHook<T>,
        invoice: &str,
    ) -> Result<()> {
        let reply_blinded_path = match hook.reply_blinded_path.clone() {
            Some(path) => path,
            None => return Ok(()),
        };

        let invoice = match crate::lightning::invoice::decode(self.network, invoice)? {
            Invoice::Bolt12(invoice) => invoice,
            _ => return Err(anyhow!("invalid invoice")),
        };

        let (blinding_point, onion) = Self::blind_onion(*invoice, reply_blinded_path, our_pubkey)?;
        self.cln
            .inject_onion_message(InjectonionmessageRequest {
                message: onion,
                path_key: blinding_point.serialize().to_vec(),
            })
            .await?;
        debug!("Injected BOLT12 invoice response for {}", hook.id());

        Ok(())
    }

    fn get_offer_for_invoice_request(&self, invoice_request: Vec<u8>) -> Result<Option<Offer>> {
        let invoice_request = InvoiceRequest::try_from(invoice_request)
            .map_err(|err| anyhow!("could node decode invoice request: {:?}", err))?;
        let signing_pubkey = match invoice_request.issuer_signing_pubkey() {
            Some(pubkey) => pubkey,
            None => return Err(anyhow!("no issuer signing public key")),
        };

        self.offer_helper.get_by_signer(&signing_pubkey.serialize())
    }

    async fn wait_for_response<T, R>(
        id: u64,
        mut receiver: broadcast::Receiver<(InvoiceHook<T>, R)>,
        parse_response: impl Fn(R) -> Result<String>,
    ) -> Result<String>
    where
        T: types::Bool + Clone,
        R: Clone,
    {
        let timeout = tokio::time::sleep(std::time::Duration::from_secs(
            INVOICE_FETCH_TIMEOUT_SECONDS,
        ));
        tokio::pin!(timeout);

        loop {
            tokio::select! {
                response = receiver.recv() => {
                    match response {
                        Ok((hook, res)) => {
                            if hook.id() == id {
                                return parse_response(res);
                            }
                        },
                        Err(err) => {
                            return Err(anyhow!("failed to receive invoice response: {}", err));
                        }
                    }
                },
                _ = &mut timeout => {
                    return Err(anyhow!("timeout waiting for invoice response"));
                }
            }
        }
    }

    fn prepare_offer(network: wallet::Network, offer: &str, url: Option<&str>) -> Result<Vec<u8>> {
        if let Some(url) = url {
            if let Err(err) = validate_url(url, network == wallet::Network::Regtest) {
                return Err(anyhow!("invalid URL: {}", err));
            }
        }

        let decoded = match crate::lightning::invoice::decode(network, offer)? {
            Invoice::Offer(offer) => offer,
            _ => return Err(anyhow!("invalid offer")),
        };
        Ok(match decoded.issuer_signing_pubkey() {
            Some(signer) => signer.serialize().to_vec(),
            None => return Err(anyhow!("no signing public key specified")),
        })
    }

    fn blind_onion(
        invoice: Bolt12Invoice,
        path: ReplyBlindedPath,
        our_pubkey: PublicKey,
    ) -> Result<(PublicKey, Vec<u8>)> {
        let (entropy_bytes, random) = Self::entropy_source();
        let keys_manager = KeysManager::new(&entropy_bytes, 0, 0);

        let secp_ctx = Secp256k1::new();

        let onion = create_onion_message(
            &Box::new(random),
            &Box::new(keys_manager),
            &EmptyNodeIdLookUp {},
            &secp_ctx,
            OnionMessagePath {
                first_node_addresses: None,
                intermediate_nodes: vec![our_pubkey],
                destination: Destination::BlindedPath(BlindedMessagePath::from_blinded_path(
                    match (path.first_node_id, path.first_scid, path.first_scid_dir) {
                        (Some(first_node_id), None, None) => PublicKey::from_slice(&first_node_id)?,
                        _ => return Err(anyhow!("scid implementation to be done")),
                    },
                    PublicKey::from_slice(&match path.first_path_key {
                        Some(key) => key,
                        None => return Err(anyhow!("no path key")),
                    })?,
                    path.hops
                        .into_iter()
                        .map(|hop| {
                            Ok(BlindedHop {
                                blinded_node_id: PublicKey::from_slice(
                                    match &hop.blinded_node_id {
                                        Some(id) => id,
                                        None => return Err(anyhow!("no blinded node id")),
                                    },
                                )?,
                                encrypted_payload: match hop.encrypted_recipient_data {
                                    Some(id) => id,
                                    None => return Err(anyhow!("no blinded node id")),
                                },
                            })
                        })
                        .collect::<Result<Vec<BlindedHop>>>()?,
                )),
            },
            OffersMessage::Invoice(invoice),
            None,
        )
        .map_err(|e| anyhow!("creating onion failed: {:?}", e))?;

        let mut packet_bytes = vec![];
        onion.1.onion_routing_packet.write(&mut packet_bytes)?;
        Ok((onion.1.blinding_point, packet_bytes))
    }

    fn schnor_signature_valid(signer: &[u8], signature: &[u8], message: &str) -> Result<bool> {
        let secp = Secp256k1::verification_only();
        Ok(secp
            .verify_schnorr(
                &Signature::from_slice(signature)?,
                &Message::from_digest(
                    *bitcoin_hashes::Sha256::hash(message.as_bytes()).as_byte_array(),
                ),
                &PublicKey::from_slice(signer)?.to_x_only_pubkey(),
            )
            .is_ok())
    }

    fn entropy_source() -> ([u8; 32], RandomBytes) {
        let mut entropy_bytes = [0u8; 32];
        let mut rng = rand::rng();
        rng.fill_bytes(&mut entropy_bytes);
        (entropy_bytes, RandomBytes::new(entropy_bytes))
    }
}

#[async_trait]
impl BaseClient for Hold {
    fn kind(&self) -> String {
        "hold".to_string()
    }

    fn symbol(&self) -> String {
        self.symbol.clone()
    }

    async fn connect(&mut self) -> Result<()> {
        let info = self.hold.get_info(GetInfoRequest {}).await?.into_inner();
        info!(
            "Connected to {} CLN {} v{}",
            self.symbol,
            self.kind(),
            info.version
        );

        self.stream_onion_messages().await?;

        Ok(())
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use crate::lightning::cln::test::cln_client;
    use alloy::hex;
    use bitcoin::key::Keypair;
    use mockall::predicate::eq;

    const OFFER: &str = "lno1qgsqvgnwgcg35z6ee2h3yczraddm72xrfua9uve2rlrm9deu7xyfzrcsjgp07s6z7e3lz8gun0tfslclfs8w48v6uq9vfwuura5g4kn60fffu4qzwrsgl9ed40gujkc3s0ln56ek2yn5xcj289m5mwgpeagkr20dkdvqzqe4h4njxfj9j9fl2smkxg66ctcrcznw47d95jpnnaax2e327judevqzczqa77ng8hpls7wnwknm2t7v93swf9du4j90l58yclfza9ju87aer5vklmwt0veucef7lch3vggrkj0u253wznwv0ganr2mfr9hhymtj3q8spuwlemh2n4sghlmqf5qq";
    const HOOK: &str = "https://bol.tz/nice_hook";
    const PRIVATE_KEY: &str = "ac0ee106ecc58bfff9b106d6e26b51ee2d37c8a85eb2eed0b6c71d0a9d910b61";
    const PRIVATE_KEY_INVALID: &str =
        "f73ef753b278653899d79b8b0ca525a48be5c2902b6b21303c86f9a3c62c216a";

    #[tokio::test]
    async fn test_add_offer() {
        let signer = Hold::prepare_offer(wallet::Network::Regtest, OFFER, Some(HOOK)).unwrap();

        let mut hold = cln_client().await.hold;
        let mut offer_helper = crate::db::helpers::offer::test::MockOfferHelper::new();
        offer_helper
            .expect_get_by_signer()
            .with(eq(signer.clone()))
            .returning(|_| Ok(None));
        offer_helper
            .expect_insert()
            .with(eq(Offer {
                signer,
                offer: OFFER.to_lowercase(),
                url: Some(HOOK.to_string()),
            }))
            .returning(|_| Ok(1));

        hold.offer_helper = Arc::new(offer_helper);

        hold.add_offer(OFFER.to_uppercase(), Some(HOOK.to_string()))
            .unwrap();
    }

    #[tokio::test]
    async fn test_add_offer_already_registered() {
        let signer = Hold::prepare_offer(wallet::Network::Regtest, OFFER, Some(HOOK)).unwrap();

        let mut hold = cln_client().await.hold;
        let mut offer_helper = crate::db::helpers::offer::test::MockOfferHelper::new();
        offer_helper
            .expect_get_by_signer()
            .with(eq(signer.clone()))
            .returning(move |_| {
                Ok(Some(Offer {
                    signer: signer.clone(),
                    offer: OFFER.to_lowercase(),
                    url: Some(HOOK.to_string()),
                }))
            });

        hold.offer_helper = Arc::new(offer_helper);

        assert_eq!(
            hold.add_offer(OFFER.to_uppercase(), Some(HOOK.to_string()))
                .unwrap_err()
                .to_string(),
            "an offer for this signing public key was registered already"
        );
    }

    #[tokio::test]
    async fn test_update_offer() {
        let signer = Hold::prepare_offer(wallet::Network::Regtest, OFFER, Some(HOOK)).unwrap();

        let mut hold = cln_client().await.hold;
        let mut offer_helper = crate::db::helpers::offer::test::MockOfferHelper::new();

        let signer_cp = signer.clone();
        offer_helper
            .expect_get_by_signer()
            .with(eq(signer_cp.clone()))
            .returning(move |_| {
                Ok(Some(Offer {
                    signer: signer_cp.clone(),
                    offer: OFFER.to_lowercase(),
                    url: Some(HOOK.to_string()),
                }))
            });

        let new_hook = "https://bol.tz/new_hook";
        offer_helper
            .expect_update()
            .with(eq(signer.clone()), eq(new_hook.to_string()))
            .returning(|_, _| Ok(1));

        hold.offer_helper = Arc::new(offer_helper);

        let secp = Secp256k1::signing_only();
        let keypair = Keypair::from_seckey_str(&secp, PRIVATE_KEY).unwrap();
        let sig = secp.sign_schnorr_no_aux_rand(
            &Message::from_digest(
                *bitcoin_hashes::Sha256::hash(new_hook.as_bytes()).as_byte_array(),
            ),
            &keypair,
        );

        hold.update_offer(OFFER.to_uppercase(), new_hook.to_string(), &sig.serialize())
            .unwrap();
    }

    #[tokio::test]
    async fn test_update_offer_not_registered() {
        let signer = Hold::prepare_offer(wallet::Network::Regtest, OFFER, Some(HOOK)).unwrap();

        let mut hold = cln_client().await.hold;
        let mut offer_helper = crate::db::helpers::offer::test::MockOfferHelper::new();

        let signer_cp = signer.clone();
        offer_helper
            .expect_get_by_signer()
            .with(eq(signer_cp.clone()))
            .returning(move |_| Ok(None));

        hold.offer_helper = Arc::new(offer_helper);

        assert_eq!(
            hold.update_offer(
                OFFER.to_uppercase(),
                "https://bol.tz/new_hook".to_string(),
                &[],
            )
            .unwrap_err()
            .to_string(),
            "no offer for this signing public key was registered"
        );
    }

    #[tokio::test]
    async fn test_update_offer_invalid_signature() {
        let signer = Hold::prepare_offer(wallet::Network::Regtest, OFFER, Some(HOOK)).unwrap();

        let mut hold = cln_client().await.hold;
        let mut offer_helper = crate::db::helpers::offer::test::MockOfferHelper::new();

        let signer_cp = signer.clone();
        offer_helper
            .expect_get_by_signer()
            .with(eq(signer_cp.clone()))
            .returning(move |_| {
                Ok(Some(Offer {
                    signer: signer_cp.clone(),
                    offer: OFFER.to_lowercase(),
                    url: Some(HOOK.to_string()),
                }))
            });

        hold.offer_helper = Arc::new(offer_helper);

        let new_hook = "https://bol.tz/new_hook";

        let secp = Secp256k1::signing_only();
        let keypair = Keypair::from_seckey_str(&secp, PRIVATE_KEY_INVALID).unwrap();
        let sig = secp.sign_schnorr_no_aux_rand(
            &Message::from_digest(
                *bitcoin_hashes::Sha256::hash(new_hook.as_bytes()).as_byte_array(),
            ),
            &keypair,
        );

        assert_eq!(
            hold.update_offer(OFFER.to_uppercase(), new_hook.to_string(), &sig.serialize(),)
                .unwrap_err()
                .to_string(),
            "invalid signature"
        );
    }

    #[tokio::test]
    async fn test_delete_offer() {
        let signer = Hold::prepare_offer(wallet::Network::Regtest, OFFER, None).unwrap();

        let mut hold = cln_client().await.hold;
        let mut offer_helper = crate::db::helpers::offer::test::MockOfferHelper::new();

        let signer_cp = signer.clone();
        offer_helper
            .expect_get_by_signer()
            .with(eq(signer_cp.clone()))
            .returning(move |_| {
                Ok(Some(Offer {
                    signer: signer_cp.clone(),
                    offer: OFFER.to_lowercase(),
                    url: Some(HOOK.to_string()),
                }))
            });

        offer_helper
            .expect_delete()
            .with(eq(signer.clone()))
            .returning(|_| Ok(1));

        hold.offer_helper = Arc::new(offer_helper);

        let secp = Secp256k1::signing_only();
        let keypair = Keypair::from_seckey_str(&secp, PRIVATE_KEY).unwrap();
        let sig = secp.sign_schnorr_no_aux_rand(
            &Message::from_digest(
                *bitcoin_hashes::Sha256::hash(OFFER_DELETE_MESSAGE.as_bytes()).as_byte_array(),
            ),
            &keypair,
        );

        hold.delete_offer(OFFER.to_uppercase(), &sig.serialize())
            .unwrap();
    }

    #[tokio::test]
    async fn test_delete_offer_not_registered() {
        let signer = Hold::prepare_offer(wallet::Network::Regtest, OFFER, None).unwrap();

        let mut hold = cln_client().await.hold;
        let mut offer_helper = crate::db::helpers::offer::test::MockOfferHelper::new();

        let signer_cp = signer.clone();
        offer_helper
            .expect_get_by_signer()
            .with(eq(signer_cp.clone()))
            .returning(move |_| Ok(None));

        hold.offer_helper = Arc::new(offer_helper);

        assert_eq!(
            hold.delete_offer(OFFER.to_uppercase(), &[])
                .unwrap_err()
                .to_string(),
            ERR_NO_OFFER_REGISTERED
        );
    }

    #[tokio::test]
    async fn test_delete_offer_invalid_signature() {
        let signer = Hold::prepare_offer(wallet::Network::Regtest, OFFER, None).unwrap();

        let mut hold = cln_client().await.hold;
        let mut offer_helper = crate::db::helpers::offer::test::MockOfferHelper::new();

        let signer_cp = signer.clone();
        offer_helper
            .expect_get_by_signer()
            .with(eq(signer_cp.clone()))
            .returning(move |_| {
                Ok(Some(Offer {
                    signer: signer_cp.clone(),
                    offer: OFFER.to_lowercase(),
                    url: Some(HOOK.to_string()),
                }))
            });

        hold.offer_helper = Arc::new(offer_helper);

        let secp = Secp256k1::signing_only();
        let keypair = Keypair::from_seckey_str(&secp, PRIVATE_KEY_INVALID).unwrap();
        let sig = secp.sign_schnorr_no_aux_rand(
            &Message::from_digest(
                *bitcoin_hashes::Sha256::hash(OFFER_DELETE_MESSAGE.as_bytes()).as_byte_array(),
            ),
            &keypair,
        );

        assert_eq!(
            hold.delete_offer(OFFER.to_uppercase(), &sig.serialize())
                .unwrap_err()
                .to_string(),
            ERR_INVALID_SIGNATURE
        );
    }

    #[test]
    fn test_prepare_offer() {
        assert_eq!(
            Hold::prepare_offer(wallet::Network::Regtest, OFFER, Some(HOOK)).unwrap(),
            hex::decode("03b49fc5522e14dcc7a3b31ab69196f726d72880f00f1dfceeea9d608bff604d00")
                .unwrap()
        );
    }

    #[test]
    fn test_prepare_offer_invalid_url() {
        assert_eq!(
            Hold::prepare_offer(wallet::Network::Regtest, "OFFER", Some("INVALID URL"))
                .unwrap_err()
                .to_string(),
            "invalid URL: relative URL without a base"
        );
    }

    #[test]
    fn test_prepare_offer_allow_http_regtest() {
        assert_eq!(
            Hold::prepare_offer(wallet::Network::Regtest, OFFER, Some("http://bol.tz")).unwrap(),
            hex::decode("03b49fc5522e14dcc7a3b31ab69196f726d72880f00f1dfceeea9d608bff604d00")
                .unwrap()
        );
    }

    #[test]
    fn test_prepare_offer_no_http_mainnet() {
        assert_eq!(
            Hold::prepare_offer(wallet::Network::Mainnet, "invalid", Some("http://bol.tz"))
                .unwrap_err()
                .to_string(),
            "invalid URL: only HTTPS URLs are permitted"
        );
    }

    #[test]
    fn test_prepare_offer_invalid_offer() {
        assert_eq!(
            Hold::prepare_offer(wallet::Network::Regtest, "invalid", Some(HOOK))
                .unwrap_err()
                .to_string(),
            "invalid invoice: ParseError(Bech32Error(Parse(Char(InvalidChar('i')))))"
        );
    }
}

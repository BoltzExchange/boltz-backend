use crate::api::ws::OfferSubscriptions;
use crate::chain::BaseClient;
use crate::db::helpers::offer::OfferHelper;
use crate::db::models::Offer;
use crate::lightning::cln::cln_rpc::{GetinfoRequest, InjectonionmessageRequest};
use crate::lightning::cln::hold::hold_rpc::onion_message::ReplyBlindedPath;
use crate::lightning::cln::hold::hold_rpc::{GetInfoRequest, OnionMessageResponse};
use crate::lightning::cln::invoice_fetcher::InvoiceFetcher;
use crate::lightning::invoice::Invoice;
use crate::types;
use crate::wallet;
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
use lightning::offers::invoice_error::InvoiceError;
use lightning::offers::invoice_request::InvoiceRequest;
use lightning::offers::nonce::Nonce;
use lightning::offers::parse::Bolt12SemanticError;
use lightning::onion_message::messenger::{Destination, OnionMessagePath, create_onion_message};
use lightning::onion_message::offers::OffersMessage;
use lightning::sign::{KeysManager, RandomBytes};
use lightning::util::ser::Writeable;
use rand::RngCore;
use serde::{Deserialize, Serialize};
use std::fmt::{Display, Formatter};
use std::fs;
use std::sync::Arc;
use tokio::sync::mpsc;
use tokio_util::sync::CancellationToken;
use tonic::transport::{Certificate, Channel, ClientTlsConfig, Identity};
use tracing::{debug, error, info, instrument, warn};

pub mod hold_rpc {
    tonic::include_proto!("hold");
}

const OFFER_DELETE_MESSAGE: &str = "DELETE";
const OFFER_UPDATE_NO_URL_MESSAGE: &str = "UPDATE";

#[derive(Debug, Clone, Copy, Eq, PartialEq)]
pub enum OfferError {
    InvalidSignature,
    NoOfferRegistered,
}

impl Display for OfferError {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        match self {
            OfferError::InvalidSignature => write!(f, "invalid signature"),
            OfferError::NoOfferRegistered => {
                write!(f, "no offer registered for this signing public key")
            }
        }
    }
}

impl std::error::Error for OfferError {}

enum InvoiceResponse {
    Invoice(Box<Bolt12Invoice>),
    InvoiceError(String),
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
    cln: crate::lightning::cln::cln_rpc::node_client::NodeClient<Channel>,
    hold: hold_rpc::hold_client::HoldClient<Channel>,
    invoice_fetcher: Arc<InvoiceFetcher>,
}

impl Hold {
    #[allow(clippy::too_many_arguments)]
    pub async fn new(
        cancellation_token: CancellationToken,
        symbol: &str,
        network: wallet::Network,
        config: &Config,
        webhook_block_list: Option<Vec<String>>,
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

        let invoice_caller = Arc::new(InvoiceCaller::new(
            cancellation_token,
            crate::webhook::caller::Config {
                // To give mobile clients a chance to wake up and respond
                request_timeout: Some(60),
                max_retries: Some(2),
                retry_interval: Some(10),
                block_list: webhook_block_list,
            },
            network == wallet::Network::Regtest,
        ));

        {
            let invoice_caller = invoice_caller.clone();
            tokio::spawn(async move {
                invoice_caller.start().await;
            });
        }

        let invoice_fetcher = Arc::new(InvoiceFetcher::new(
            network,
            offer_subscriptions,
            invoice_caller,
        ));

        Ok(Self {
            cln,
            network,
            offer_helper,
            symbol: symbol.to_string(),
            hold: hold_rpc::hold_client::HoldClient::new(channel),
            invoice_fetcher,
        })
    }

    pub fn add_offer(&self, offer: String, url: Option<String>) -> Result<()> {
        let signer = self.prepare_offer(self.network, &offer, url.as_deref())?;
        if self.offer_helper.get_by_signer(&signer)?.is_some() {
            return Err(anyhow!(
                "an offer for this signing public key was registered already"
            ));
        }

        let signer_hex = alloy::hex::encode(&signer);
        self.offer_helper.insert(&Offer {
            signer,
            // Needed when we lookup if we know an offer when fetching
            offer: offer.to_lowercase(),
            url,
        })?;
        info!("Registered offer of {}", signer_hex);
        Ok(())
    }

    pub fn update_offer(&self, offer: String, url: Option<String>, signature: &[u8]) -> Result<()> {
        let signer = self.prepare_offer(self.network, &offer, url.as_deref())?;
        if self.offer_helper.get_by_signer(&signer)?.is_none() {
            return Err(OfferError::NoOfferRegistered.into());
        }

        if !Self::schnorr_signature_valid(
            &signer,
            signature,
            url.as_deref().unwrap_or(OFFER_UPDATE_NO_URL_MESSAGE),
        )? {
            return Err(OfferError::InvalidSignature.into());
        }

        self.offer_helper.update(&signer, &url)?;
        debug!(
            "Updated offer of {} to {}",
            alloy::hex::encode(signer),
            match url {
                Some(url) => format!("webhook: {}", url),
                None => "no webhook".to_string(),
            }
        );
        Ok(())
    }

    pub fn delete_offer(&self, offer: String, signature: &[u8]) -> Result<()> {
        let signer = self.prepare_offer(self.network, &offer, None)?;
        if self.offer_helper.get_by_signer(&signer)?.is_none() {
            return Err(OfferError::NoOfferRegistered.into());
        }

        if !Self::schnorr_signature_valid(&signer, signature, OFFER_DELETE_MESSAGE)? {
            return Err(OfferError::InvalidSignature.into());
        }

        self.offer_helper.delete(&signer)?;
        info!("Deleted offer of {}", alloy::hex::encode(signer));
        Ok(())
    }

    pub async fn fetch_invoice(
        &self,
        offer: Offer,
        amount_msat: u64,
        note: Option<String>,
    ) -> Result<(String, Box<Bolt12Invoice>)> {
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
                let mut req =
                    (parsed.request_invoice(&expanded_key, nonce, &secp_ctx, payment_id)?)
                        .chain(self.network.bitcoin())?
                        .amount_msats(amount_msat)?;
                if let Some(note) = note {
                    req = req.payer_note(note);
                }

                req.build_and_sign()
            };

        let request = build_invoice_request().map_err(|e| anyhow!("{:?}", e))?;

        let mut request_bytes = vec![];
        request.write(&mut request_bytes)?;

        let hook: InvoiceHook<types::False> =
            InvoiceHook::new(offer.offer.clone(), &request_bytes, None);
        self.invoice_fetcher.fetch_invoice(offer, hook).await
    }

    async fn stream_onion_messages(&mut self) -> Result<()> {
        let our_pubkey = self.cln.getinfo(GetinfoRequest {}).await?.into_inner().id;
        let our_pubkey = PublicKey::from_slice(&our_pubkey)?;

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
                            offer.offer.clone(),
                            &invoice_request,
                            Some(reply_blinded_path),
                        );

                        let mut self_cp = self_cp.clone();
                        // To not block the subscription
                        tokio::spawn(async move {
                            let res = match self_cp
                                .invoice_fetcher
                                .fetch_invoice(offer, hook.clone())
                                .await
                            {
                                Ok((_, decoded)) => InvoiceResponse::Invoice(decoded),
                                Err(err) => InvoiceResponse::InvoiceError(err.to_string()),
                            };

                            if let Err(err) = self_cp.handle_response(our_pubkey, hook, res).await {
                                error!("Could not handle invoice response: {}", err);
                            }
                        });
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

    #[instrument(name = "hold::handle_response", skip_all)]
    async fn handle_response<T: types::Bool>(
        &mut self,
        our_pubkey: PublicKey,
        hook: InvoiceHook<T>,
        response: InvoiceResponse,
    ) -> Result<()> {
        let reply_blinded_path = match hook.reply_blinded_path.clone() {
            Some(path) => path,
            None => return Ok(()),
        };

        let (blinding_point, onion) = Self::blind_onion(response, reply_blinded_path, our_pubkey)?;
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

    fn prepare_offer(
        &self,
        network: wallet::Network,
        offer: &str,
        url: Option<&str>,
    ) -> Result<Vec<u8>> {
        if let Some(url) = url {
            self.invoice_fetcher
                .validate_url(url, network == wallet::Network::Regtest)
                .map_err(|err| anyhow!("invalid URL: {}", err))?;
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
        response: InvoiceResponse,
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
            match response {
                InvoiceResponse::Invoice(invoice) => OffersMessage::Invoice(*invoice),
                InvoiceResponse::InvoiceError(error) => {
                    OffersMessage::InvoiceError(InvoiceError::from_string(error))
                }
            },
            None,
        )
        .map_err(|e| anyhow!("creating onion failed: {:?}", e))?;

        let mut packet_bytes = vec![];
        onion.1.onion_routing_packet.write(&mut packet_bytes)?;
        Ok((onion.1.blinding_point, packet_bytes))
    }

    fn schnorr_signature_valid(signer: &[u8], signature: &[u8], message: &str) -> Result<bool> {
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
        let mut rng = rand::thread_rng();
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
        let mut hold = cln_client().await.hold;
        let signer = hold
            .prepare_offer(wallet::Network::Regtest, OFFER, Some(HOOK))
            .unwrap();

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
        let mut hold = cln_client().await.hold;
        let signer = hold
            .prepare_offer(wallet::Network::Regtest, OFFER, Some(HOOK))
            .unwrap();

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
        let mut hold = cln_client().await.hold;
        let signer = hold
            .prepare_offer(wallet::Network::Regtest, OFFER, Some(HOOK))
            .unwrap();

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
            .with(eq(signer.clone()), eq(Some(new_hook.to_string())))
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

        hold.update_offer(
            OFFER.to_uppercase(),
            Some(new_hook.to_string()),
            &sig.serialize(),
        )
        .unwrap();
    }

    #[tokio::test]
    async fn test_update_offer_no_url() {
        let mut hold = cln_client().await.hold;
        let signer = hold
            .prepare_offer(wallet::Network::Regtest, OFFER, Some(HOOK))
            .unwrap();

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
            .expect_update()
            .with(eq(signer.clone()), eq(None))
            .returning(|_, _| Ok(1));

        hold.offer_helper = Arc::new(offer_helper);

        let secp = Secp256k1::signing_only();
        let keypair = Keypair::from_seckey_str(&secp, PRIVATE_KEY).unwrap();
        let sig = secp.sign_schnorr_no_aux_rand(
            &Message::from_digest(
                *bitcoin_hashes::Sha256::hash(OFFER_UPDATE_NO_URL_MESSAGE.as_bytes())
                    .as_byte_array(),
            ),
            &keypair,
        );

        hold.update_offer(OFFER.to_uppercase(), None, &sig.serialize())
            .unwrap();
    }

    #[tokio::test]
    async fn test_update_offer_not_registered() {
        let mut hold = cln_client().await.hold;
        let signer = hold
            .prepare_offer(wallet::Network::Regtest, OFFER, Some(HOOK))
            .unwrap();

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
                Some("https://bol.tz/new_hook".to_string()),
                &[],
            )
            .unwrap_err()
            .to_string(),
            OfferError::NoOfferRegistered.to_string()
        );
    }

    #[tokio::test]
    async fn test_update_offer_invalid_signature() {
        let mut hold = cln_client().await.hold;
        let signer = hold
            .prepare_offer(wallet::Network::Regtest, OFFER, Some(HOOK))
            .unwrap();

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
            hold.update_offer(
                OFFER.to_uppercase(),
                Some(new_hook.to_string()),
                &sig.serialize(),
            )
            .unwrap_err()
            .to_string(),
            OfferError::InvalidSignature.to_string()
        );
    }

    #[tokio::test]
    async fn test_delete_offer() {
        let mut hold = cln_client().await.hold;
        let signer = hold
            .prepare_offer(wallet::Network::Regtest, OFFER, None)
            .unwrap();

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
        let mut hold = cln_client().await.hold;
        let signer = hold
            .prepare_offer(wallet::Network::Regtest, OFFER, None)
            .unwrap();

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
            OfferError::NoOfferRegistered.to_string()
        );
    }

    #[tokio::test]
    async fn test_delete_offer_invalid_signature() {
        let mut hold = cln_client().await.hold;
        let signer = hold
            .prepare_offer(wallet::Network::Regtest, OFFER, None)
            .unwrap();

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
            OfferError::InvalidSignature.to_string()
        );
    }

    #[tokio::test]
    async fn test_prepare_offer() {
        assert_eq!(
            cln_client()
                .await
                .hold
                .prepare_offer(wallet::Network::Regtest, OFFER, Some(HOOK))
                .unwrap(),
            hex::decode("03b49fc5522e14dcc7a3b31ab69196f726d72880f00f1dfceeea9d608bff604d00")
                .unwrap()
        );
    }

    #[tokio::test]
    async fn test_prepare_offer_invalid_url() {
        assert_eq!(
            cln_client()
                .await
                .hold
                .prepare_offer(wallet::Network::Regtest, "OFFER", Some("INVALID URL"))
                .unwrap_err()
                .to_string(),
            "invalid URL: relative URL without a base"
        );
    }

    #[tokio::test]
    async fn test_prepare_offer_allow_http_regtest() {
        assert_eq!(
            cln_client()
                .await
                .hold
                .prepare_offer(wallet::Network::Regtest, OFFER, Some("http://bol.tz"))
                .unwrap(),
            hex::decode("03b49fc5522e14dcc7a3b31ab69196f726d72880f00f1dfceeea9d608bff604d00")
                .unwrap()
        );
    }

    #[tokio::test]
    async fn test_prepare_offer_no_http_mainnet() {
        assert_eq!(
            cln_client()
                .await
                .hold
                .prepare_offer(wallet::Network::Mainnet, "invalid", Some("http://bol.tz"))
                .unwrap_err()
                .to_string(),
            "invalid URL: only HTTPS URLs are permitted"
        );
    }

    #[tokio::test]
    async fn test_prepare_offer_invalid_offer() {
        assert_eq!(
            cln_client()
                .await
                .hold
                .prepare_offer(wallet::Network::Regtest, "invalid", Some(HOOK))
                .unwrap_err()
                .to_string(),
            "invalid invoice: ParseError(Bech32Error(Parse(Char(InvalidChar('i')))))"
        );
    }
}

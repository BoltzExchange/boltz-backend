use crate::chain::BaseClient;
use crate::db::helpers::offer::OfferHelper;
use crate::db::models::Offer;
use crate::lightning::cln::cln_rpc::{GetinfoRequest, InjectonionmessageRequest};
use crate::lightning::cln::hold::hold_rpc::onion_message::ReplyBlindedPath;
use crate::lightning::cln::hold::hold_rpc::{GetInfoRequest, OnionMessagesRequest};
use crate::lightning::invoice::{Invoice, decode_bolt12_invoice, decode_bolt12_offer};
use crate::webhook::caller::{Hook, validate_url};
use crate::webhook::invoice_caller::{InvoiceCaller, InvoiceHook};
use anyhow::{Result, anyhow};
use async_trait::async_trait;
use bitcoin::secp256k1::{PublicKey, Secp256k1};
use lightning::blinded_path::message::BlindedMessagePath;
use lightning::blinded_path::{BlindedHop, BlindedPath, EmptyNodeIdLookUp, IntroductionNode};
use lightning::offers::invoice::Bolt12Invoice;
use lightning::offers::invoice_request::InvoiceRequest;
use lightning::onion_message::messenger::{Destination, OnionMessagePath, create_onion_message};
use lightning::onion_message::offers::OffersMessage;
use lightning::sign::{KeysManager, RandomBytes};
use lightning::util::ser::Writeable;
use rand::RngCore;
use serde::{Deserialize, Serialize};
use std::fs;
use std::sync::Arc;
use tokio_util::sync::CancellationToken;
use tonic::transport::{Certificate, Channel, ClientTlsConfig, Identity};
use tracing::{debug, error, info, instrument, warn};

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
    offer_helper: Arc<dyn OfferHelper + Send + Sync + 'static>,
    invoice_caller: InvoiceCaller,
    cln: crate::lightning::cln::cln_rpc::node_client::NodeClient<Channel>,
    hold: hold_rpc::hold_client::HoldClient<Channel>,
}

impl Hold {
    pub async fn new(
        cancellation_token: CancellationToken,
        symbol: &str,
        cln: crate::lightning::cln::cln_rpc::node_client::NodeClient<Channel>,
        offer_helper: Arc<dyn OfferHelper + Send + Sync + 'static>,
        config: &Config,
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
        );

        {
            let invoice_caller = invoice_caller.clone();
            tokio::spawn(async move {
                invoice_caller.start().await;
            });
        }

        Ok(Self {
            cln,
            offer_helper,
            invoice_caller,
            symbol: symbol.to_string(),
            hold: hold_rpc::hold_client::HoldClient::new(channel),
        })
    }

    pub fn add_offer(&self, offer: String, url: String) -> Result<()> {
        if let Some(err) = validate_url(&url) {
            return Err(anyhow!("invalid URl: {}", err));
        };

        let decoded = match decode_bolt12_offer(&offer)? {
            Invoice::Offer(offer) => offer,
            _ => return Err(anyhow!("invalid offer")),
        };
        let signer = match decoded.issuer_signing_pubkey() {
            Some(signer) => signer.serialize().to_vec(),
            None => return Err(anyhow!("no signing public key specified")),
        };

        if self.offer_helper.get_by_signer(&signer)?.is_some() {
            return Err(anyhow!(
                "an offer for this signing public key was registered already"
            ));
        }

        self.offer_helper.insert(&Offer { signer, offer, url })?;

        Ok(())
    }

    async fn stream_onion_messages(&mut self) -> Result<()> {
        let our_pubkey = self.cln.getinfo(GetinfoRequest {}).await?.into_inner().id;
        let our_pubkey = PublicKey::from_slice(&our_pubkey)?;

        let mut self_cp = self.clone();
        tokio::spawn(async move {
            let mut receiver = self_cp.invoice_caller.subscribe_successful_calls();
            loop {
                let (hook, res) = match receiver.recv().await {
                    Ok(msg) => msg,
                    Err(err) => {
                        error!("Subscribing to Webhook calls failed: {}", err);
                        break;
                    }
                };

                if let Err(err) = self_cp.handle_response(our_pubkey, hook, &res).await {
                    warn!("Handling BOLT12 invoice response failed: {}", err);
                }
            }
        });

        let mut stream = self
            .hold
            .onion_messages(OnionMessagesRequest {})
            .await?
            .into_inner();

        let self_cp = self.clone();
        tokio::spawn(async move {
            loop {
                match stream.message().await {
                    Ok(msg) => {
                        let msg = match msg {
                            Some(msg) => msg,
                            None => continue,
                        };
                        let invoice_request = match msg.invoice_request {
                            Some(req) => req,
                            None => continue,
                        };

                        let reply_blinded_path = match msg.reply_blindedpath {
                            Some(path) => path,
                            None => {
                                warn!("Not handling invoice request: blinded reply path missing");
                                continue;
                            }
                        };

                        let offer =
                            match self_cp.get_offer_for_invoice_request(invoice_request.clone()) {
                                Ok(offer) => offer,
                                Err(err) => {
                                    warn!("Could not get offer for invoice request: {}", err);
                                    continue;
                                }
                            };

                        if let Err(error) = self_cp
                            .invoice_caller
                            .call(offer.url, reply_blinded_path, &invoice_request)
                            .await
                        {
                            warn!("Sending BOLT12 invoice Webhook failed: {}", error);
                        }
                    }
                    Err(err) => {
                        error!(
                            "{} CLN {} onion message subscription failed: {}",
                            self_cp.symbol,
                            self_cp.kind(),
                            err
                        );
                    }
                }
            }
        });

        Ok(())
    }

    #[instrument(name = "hold::handle_response", skip_all)]
    async fn handle_response(
        &mut self,
        our_pubkey: PublicKey,
        hook: InvoiceHook,
        res: &[u8],
    ) -> Result<()> {
        let res: InvoiceRequestResponse = serde_json::from_slice(res)?;
        let invoice = match decode_bolt12_invoice(&res.invoice)? {
            Invoice::Bolt12(invoice) => invoice,
            _ => return Err(anyhow!("invalid invoice")),
        };

        let (blinding_point, onion) =
            Self::blind_onion(*invoice, hook.reply_blinded_path.clone(), our_pubkey)?;
        self.cln
            .inject_onion_message(InjectonionmessageRequest {
                message: onion,
                path_key: blinding_point.serialize().to_vec(),
            })
            .await?;
        debug!("Injected BOLT12 invoice response for {}", hook.id());

        Ok(())
    }

    fn get_offer_for_invoice_request(&self, invoice_request: Vec<u8>) -> Result<Offer> {
        let invoice_request = InvoiceRequest::try_from(invoice_request)
            .map_err(|err| anyhow!("could node decode invoice request: {:?}", err))?;
        let signing_pubkey = match invoice_request.issuer_signing_pubkey() {
            Some(pubkey) => pubkey,
            None => return Err(anyhow!("no issuer signing public key")),
        };

        match self
            .offer_helper
            .get_by_signer(&signing_pubkey.serialize())?
        {
            Some(offer) => Ok(offer),
            None => Err(anyhow!("no offer for signing public key")),
        }
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
                intermediate_nodes: vec![our_pubkey],
                destination: Destination::BlindedPath(BlindedMessagePath(BlindedPath {
                    introduction_node: match (
                        path.first_node_id,
                        path.first_scid,
                        path.first_scid_dir,
                    ) {
                        (Some(first_node_id), None, None) => {
                            IntroductionNode::NodeId(PublicKey::from_slice(&first_node_id)?)
                        }
                        _ => return Err(anyhow!("scid implementation to be done")),
                    },
                    blinding_point: PublicKey::from_slice(&match path.first_path_key {
                        Some(key) => key,
                        None => return Err(anyhow!("no path key")),
                    })?,
                    blinded_hops: path
                        .hops
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
                })),
                first_node_addresses: None,
            },
            OffersMessage::Invoice(invoice),
            None,
        )
        .map_err(|e| anyhow!("creating onion failed: {:?}", e))?;

        let mut packet_bytes = vec![];
        onion.1.onion_routing_packet.write(&mut packet_bytes)?;
        Ok((onion.1.blinding_point, packet_bytes))
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

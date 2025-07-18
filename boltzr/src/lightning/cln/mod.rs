use crate::api::MagicRoutingHint;
use crate::api::ws::OfferSubscriptions;
use crate::chain::BaseClient;
use crate::chain::types::Type;
use crate::chain::utils::encode_address;
use crate::db::helpers::offer::OfferHelper;
use crate::db::helpers::reverse_swap::ReverseSwapHelper;
use crate::lightning::cln::cln_rpc::{
    Amount, FetchinvoiceRequest, GetinfoRequest, GetinfoResponse, ListchannelsChannels,
    ListchannelsRequest, ListconfigsRequest, ListconfigsResponse, ListnodesNodes, ListnodesRequest,
};
use crate::{utils, wallet};
use alloy::hex;
use anyhow::anyhow;
use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use std::fs;
use std::str::FromStr;
use std::sync::Arc;
use tokio_util::sync::CancellationToken;
use tonic::transport::{Certificate, Channel, ClientTlsConfig, Identity};
use tracing::{debug, info, instrument};

mod hold;
mod invoice_fetcher;

pub use crate::lightning::cln::hold::hold_rpc::onion_message::ReplyBlindedPath;

#[allow(clippy::enum_variant_names)]
pub(crate) mod cln_rpc {
    tonic::include_proto!("cln");
}

#[derive(Deserialize, Serialize, PartialEq, Clone, Debug)]
pub struct Config {
    #[serde(flatten)]
    pub cln: hold::Config,

    pub hold: hold::Config,
}

#[derive(Clone)]
pub struct Cln {
    pub hold: hold::Hold,

    symbol: String,
    network: wallet::Network,
    cln: cln_rpc::node_client::NodeClient<Channel>,
    offer_helper: Arc<dyn OfferHelper + Send + Sync + 'static>,
    reverse_swap_helper: Arc<dyn ReverseSwapHelper + Send + Sync + 'static>,
}

impl Cln {
    #[allow(clippy::too_many_arguments)]
    #[instrument(
        name = "Cln::new",
        skip(
            cancellation_token,
            network,
            config,
            webhook_block_list,
            offer_helper,
            reverse_swap_helper,
            offer_subscriptions
        )
    )]
    pub async fn new(
        cancellation_token: CancellationToken,
        symbol: &str,
        network: wallet::Network,
        config: &Config,
        webhook_block_list: Option<Vec<String>>,
        offer_helper: Arc<dyn OfferHelper + Send + Sync + 'static>,
        reverse_swap_helper: Arc<dyn ReverseSwapHelper + Send + Sync + 'static>,
        offer_subscriptions: OfferSubscriptions,
    ) -> anyhow::Result<Self> {
        let tls = ClientTlsConfig::new()
            .domain_name("cln")
            .ca_certificate(Certificate::from_pem(fs::read_to_string(
                &config.cln.root_cert_path,
            )?))
            .identity(Identity::from_pem(
                fs::read_to_string(&config.cln.cert_chain_path)?,
                fs::read_to_string(&config.cln.private_key_path)?,
            ));

        let channel =
            Channel::from_shared(format!("https://{}:{}", config.cln.host, config.cln.port))?
                .tls_config(tls)?
                .connect()
                .await?;
        let cln = cln_rpc::node_client::NodeClient::new(channel)
            .max_decoding_message_size(1024 * 1024 * 1024);

        Ok(Self {
            symbol: symbol.to_string(),
            network,
            hold: hold::Hold::new(
                cancellation_token,
                symbol,
                network,
                &config.hold,
                webhook_block_list,
                cln.clone(),
                offer_helper.clone(),
                offer_subscriptions,
            )
            .await?,
            cln,
            offer_helper,
            reverse_swap_helper,
        })
    }

    pub async fn fetch_invoice(
        &mut self,
        offer: String,
        amount_msat: u64,
        note: Option<String>,
    ) -> anyhow::Result<(String, Option<MagicRoutingHint>)> {
        let (invoice, decoded) = if let Some(offer) = self.offer_helper.get_offer(&offer)? {
            debug!("Fetching invoice for offer directly");
            self.hold.fetch_invoice(offer, amount_msat, note).await?
        } else {
            let res = self
                .cln
                .fetch_invoice(FetchinvoiceRequest {
                    offer: offer.clone(),
                    amount_msat: Some(Amount { msat: amount_msat }),
                    bip353: None,
                    timeout: None,
                    quantity: None,
                    payer_note: note,
                    payer_metadata: None,
                    recurrence_start: None,
                    recurrence_label: None,
                    recurrence_counter: None,
                })
                .await
                .map_err(Self::parse_error)?;
            debug!(
                "Fetched invoice for {}msat for offer {}",
                amount_msat, offer
            );

            let invoice = res.into_inner().invoice;
            let decoded = match crate::lightning::invoice::decode(self.network, &invoice)? {
                crate::lightning::invoice::Invoice::Bolt12(invoice) => invoice,
                _ => return Err(anyhow!("not a BOLT12 invoice")),
            };
            (invoice, decoded)
        };

        let magic_routing_hint = self
            .reverse_swap_helper
            .get_routing_hint(&hex::encode(decoded.payment_hash().0))
            .and_then(|res| {
                res.map(|mrh| {
                    let address_type = Type::from_str(&mrh.symbol)?;
                    let address = encode_address(
                        address_type,
                        mrh.scriptPubkey,
                        mrh.blindingPubkey,
                        self.network,
                    )?;

                    Ok(MagicRoutingHint {
                        bip21: utils::bip21::encode(
                            self.network,
                            address_type,
                            address.as_str(),
                            mrh.params.as_deref(),
                        ),
                        signature: hex::encode(mrh.signature),
                    })
                })
                .transpose()
            })?;

        Ok((invoice, magic_routing_hint))
    }

    pub async fn list_nodes(&mut self, id: Option<Vec<u8>>) -> anyhow::Result<Vec<ListnodesNodes>> {
        Ok(self
            .cln
            .list_nodes(ListnodesRequest { id })
            .await
            .map_err(Self::parse_error)?
            .into_inner()
            .nodes)
    }

    pub async fn list_channels(
        &mut self,
        destination: Option<Vec<u8>>,
    ) -> anyhow::Result<Vec<ListchannelsChannels>> {
        Ok(self
            .cln
            .list_channels(ListchannelsRequest {
                destination,
                source: None,
                short_channel_id: None,
            })
            .await
            .map_err(Self::parse_error)?
            .into_inner()
            .channels)
    }

    async fn get_info(&mut self) -> anyhow::Result<GetinfoResponse> {
        let res = self.cln.getinfo(GetinfoRequest {}).await?;
        Ok(res.into_inner())
    }

    async fn list_configs(&mut self) -> anyhow::Result<ListconfigsResponse> {
        let res = self
            .cln
            .list_configs(ListconfigsRequest { config: None })
            .await?;
        Ok(res.into_inner())
    }

    fn parse_error(status: tonic::Status) -> anyhow::Error {
        let mut msg = status.message();

        const MESSAGE_PREFIXES: &[&str] = &["message: \"", "message\":\"", "message\\\":\\\""];
        const MESSAGE_SUFFIXES: &[&str] = &["\", data:", "\\\"}", "\"}"];

        'outer: loop {
            for prefix in MESSAGE_PREFIXES {
                if let Some(start) = msg.find(prefix) {
                    for suffix in MESSAGE_SUFFIXES {
                        if let Some(end) = msg.rfind(suffix) {
                            msg = &msg[start + prefix.len()..end];
                            continue 'outer;
                        }
                    }
                }
            }

            break;
        }

        if msg.is_empty() {
            return anyhow!("{}", status.code().to_string());
        }

        anyhow!(msg.to_owned())
    }
}

#[async_trait]
impl BaseClient for Cln {
    fn kind(&self) -> String {
        "CLN".to_string()
    }

    fn symbol(&self) -> String {
        self.symbol.clone()
    }

    #[instrument(name = "Cln::connect", skip_all)]
    async fn connect(&mut self) -> anyhow::Result<()> {
        let info = self.get_info().await?;
        let version = info.version.split(".").collect::<Vec<&str>>();

        if version[0] == "24" && version[1] == "08" {
            let configs = self.list_configs().await?;
            let experimental_offers = match configs.configs {
                Some(config) => match config.experimental_offers {
                    Some(option) => option.set,
                    None => false,
                },
                None => false,
            };

            if !experimental_offers {
                return Err(crate::lightning::Error::NoBolt12Support(
                    "experimental-offers not enabled".into(),
                )
                .into());
            }
        }

        info!(
            "Connected to {} CLN {} ({})",
            self.symbol,
            info.version,
            info.alias.unwrap_or(hex::encode(info.id))
        );

        self.hold.connect().await?;

        Ok(())
    }
}

#[cfg(test)]
pub mod test {
    use super::*;
    use crate::api::ws::OfferSubscriptions;
    use crate::lightning::cln::cln_rpc::{OfferRequest, OfferResponse};
    use rstest::*;
    use std::path::Path;

    impl Cln {
        pub async fn offer(&mut self) -> anyhow::Result<OfferResponse> {
            let res = self
                .cln
                .offer(OfferRequest {
                    amount: "any".to_string(),
                    ..Default::default()
                })
                .await?;
            Ok(res.into_inner())
        }
    }

    const CLN_CERTS_PATH: &str = "../docker/regtest/data/cln/certs";
    const HOLD_CERTS_PATH: &str = "../docker/regtest/data/cln/hold";

    pub async fn cln_client() -> Cln {
        let mut offer_helper = crate::db::helpers::offer::test::MockOfferHelper::new();
        offer_helper.expect_get_offer().returning(|_| Ok(None));

        let mut reverse_swap_helper =
            crate::db::helpers::reverse_swap::test::MockReverseSwapHelper::new();
        reverse_swap_helper
            .expect_get_routing_hint()
            .returning(|_| Ok(None));

        Cln::new(
            CancellationToken::new(),
            "BTC",
            wallet::Network::Regtest,
            &Config {
                cln: hold::Config {
                    host: "127.0.0.1".to_string(),
                    port: 9291,
                    root_cert_path: Path::new(CLN_CERTS_PATH)
                        .join("ca.pem")
                        .to_str()
                        .unwrap()
                        .to_string(),
                    private_key_path: Path::new(CLN_CERTS_PATH)
                        .join("client-key.pem")
                        .to_str()
                        .unwrap()
                        .to_string(),
                    cert_chain_path: Path::new(CLN_CERTS_PATH)
                        .join("client.pem")
                        .to_str()
                        .unwrap()
                        .to_string(),
                },
                hold: hold::Config {
                    host: "127.0.0.1".to_string(),
                    port: 9292,
                    root_cert_path: Path::new(HOLD_CERTS_PATH)
                        .join("ca.pem")
                        .to_str()
                        .unwrap()
                        .to_string(),
                    private_key_path: Path::new(HOLD_CERTS_PATH)
                        .join("client-key.pem")
                        .to_str()
                        .unwrap()
                        .to_string(),
                    cert_chain_path: Path::new(HOLD_CERTS_PATH)
                        .join("client.pem")
                        .to_str()
                        .unwrap()
                        .to_string(),
                },
            },
            None,
            Arc::new(offer_helper),
            Arc::new(reverse_swap_helper),
            OfferSubscriptions::new(crate::wallet::Network::Regtest),
        )
        .await
        .unwrap()
    }

    #[rstest]
    #[case(
        "Error calling method Xpay: RpcError { code: Some(203), message: \"Destination said it doesn't know invoice: incorrect_or_unknown_payment_details\", data: None }",
        "Destination said it doesn't know invoice: incorrect_or_unknown_payment_details"
    )]
    #[case(
        "Failed: could not route or connect directly to 02ead25af6e0271c5167d6fd05545d2d538995ce3e16ad780a1010fc4e91522202: {\"code\":400,\"message\":\"Unable to connect, no address known for peer\"}",
        "Unable to connect, no address known for peer"
    )]
    #[case(
        "Error calling method FetchInvoice: RpcError { code: Some(1003), message: \"Failed: could not route or connect directly to 02ee337aec2b12fef609a57d1c32834fe3107d315acaf8f5206ccf94dc2a9baa8c: {\"code\":400,\"message\":\"Unable to connect, no address known for peer\"}\", data: None }",
        "Unable to connect, no address known for peer"
    )]
    #[case(
        "Error calling method FetchInvoice: RpcError { code: Some(1003), message: \"Failed: could not route or connect directly to 02ee337aec2b12fef609a57d1c32834fe3107d315acaf8f5206ccf94dc2a9baa8c: {\\\"code\\\":400,\\\"message\\\":\\\"Unable to connect, no address known for peer\\\"}\", data: None }",
        "Unable to connect, no address known for peer"
    )]
    #[case("gRPC error", "gRPC error")]
    #[case("", "The operation was cancelled")]
    fn test_parse_error(#[case] msg: &str, #[case] expected: &str) {
        let error = Cln::parse_error(tonic::Status::new(tonic::Code::Cancelled, msg));
        assert_eq!(error.to_string(), expected);
    }
}

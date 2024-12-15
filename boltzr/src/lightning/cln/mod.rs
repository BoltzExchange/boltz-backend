use crate::chain::BaseClient;
use crate::lightning::cln::cln_rpc::{
    Amount, FetchinvoiceRequest, GetinfoRequest, GetinfoResponse, ListconfigsRequest,
    ListconfigsResponse,
};
use alloy::hex;
use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use std::fs;
use tonic::transport::{Certificate, Channel, ClientTlsConfig, Identity};
use tracing::{info, instrument};

#[allow(clippy::enum_variant_names)]
mod cln_rpc {
    tonic::include_proto!("cln");
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

#[derive(Clone, Debug)]
pub struct Cln {
    symbol: String,
    cln: cln_rpc::node_client::NodeClient<Channel>,
}

impl Cln {
    #[instrument(name = "Cln::new", skip(config))]
    pub async fn new(symbol: &str, config: Config) -> anyhow::Result<Self> {
        let tls = ClientTlsConfig::new()
            .domain_name("cln")
            .ca_certificate(Certificate::from_pem(fs::read_to_string(
                config.root_cert_path,
            )?))
            .identity(Identity::from_pem(
                fs::read_to_string(config.cert_chain_path)?,
                fs::read_to_string(config.private_key_path)?,
            ));

        let channel = Channel::from_shared(format!("https://{}:{}", config.host, config.port))?
            .tls_config(tls)?
            .connect()
            .await?;

        Ok(Cln {
            symbol: symbol.to_string(),
            cln: cln_rpc::node_client::NodeClient::new(channel),
        })
    }

    pub async fn fetch_invoice(
        &mut self,
        offer: String,
        amount_msat: u64,
    ) -> anyhow::Result<String> {
        let res = self
            .cln
            .fetch_invoice(FetchinvoiceRequest {
                offer,
                amount_msat: Some(Amount { msat: amount_msat }),
                timeout: None,
                quantity: None,
                payer_note: None,
                payer_metadata: None,
                recurrence_start: None,
                recurrence_label: None,
                recurrence_counter: None,
            })
            .await?;

        Ok(res.into_inner().invoice)
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
}

#[async_trait]
impl BaseClient for Cln {
    fn kind(&self) -> String {
        "CLN".to_string()
    }

    fn symbol(&self) -> String {
        self.symbol.clone()
    }

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

        Ok(())
    }
}

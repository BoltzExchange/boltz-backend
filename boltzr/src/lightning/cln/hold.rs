use crate::chain::BaseClient;
use crate::lightning::cln::hold::hold_rpc::{GetInfoRequest, OnionMessagesRequest};
use alloy::hex;
use anyhow::Result;
use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use std::fs;
use tonic::transport::{Certificate, Channel, ClientTlsConfig, Identity};
use tracing::{error, info};

#[derive(Debug, Serialize)]
struct OnionMessageCall {
    pub invoice_request: String,
}

#[derive(Debug, Deserialize)]
struct WebhookResponse {
    pub invoice: String,
}

mod hold_rpc {
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

#[derive(Clone, Debug)]
pub struct Hold {
    symbol: String,
    hold: hold_rpc::hold_client::HoldClient<Channel>,
}

impl Hold {
    pub async fn new(symbol: &str, config: &Config) -> Result<Self> {
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

        Ok(Self {
            symbol: symbol.to_string(),
            hold: hold_rpc::hold_client::HoldClient::new(channel),
        })
    }

    async fn stream_onion_messages(&mut self) -> Result<()> {
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
                        info!("Received onion message: {:?}", msg);

                        let client = reqwest::Client::builder().build().unwrap();
                        let hook_res = client
                            .post("http://127.0.0.1:7678")
                            .json(&OnionMessageCall {
                                invoice_request: msg
                                    .invoice_request
                                    .map(hex::encode)
                                    .unwrap_or("".to_string()),
                            })
                            .send()
                            .await
                            .unwrap()
                            .json::<WebhookResponse>()
                            .await;
                        info!("Hook result: {:#?}", hook_res);
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

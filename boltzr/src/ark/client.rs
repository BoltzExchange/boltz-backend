use crate::ark::client::ark_rpc::{GetInfoRequest, GetInfoResponse};
use crate::chain::BaseClient;
use anyhow::{Result, anyhow};
use async_trait::async_trait;
use bitcoin::secp256k1;
use std::sync::{Arc, RwLock};
use tonic::transport::Channel;
use tracing::{info, instrument};

const MAX_MESSAGE_SIZE: usize = 1024 * 1024 * 1024;

#[allow(dead_code)]
mod ark_rpc {
    tonic::include_proto!("fulmine.v1");
}

#[derive(Clone)]
pub struct ArkClient {
    symbol: String,
    client: ark_rpc::service_client::ServiceClient<Channel>,

    pubkey: Arc<RwLock<Option<secp256k1::PublicKey>>>,
}

impl ArkClient {
    #[instrument(name = "ArkClient::new", skip(config))]
    pub async fn new(symbol: String, config: &super::Config) -> Result<Self> {
        let channel = Channel::from_shared(format!("http://{}:{}", config.host, config.port))?
            .connect()
            .await?;

        Ok(Self {
            symbol,
            client: ark_rpc::service_client::ServiceClient::new(channel)
                .max_decoding_message_size(MAX_MESSAGE_SIZE),
            pubkey: Arc::new(RwLock::new(None)),
        })
    }

    pub fn pubkey(&self) -> Option<secp256k1::PublicKey> {
        self.pubkey.read().map(|v| *v).ok().flatten()
    }

    async fn get_info(&mut self) -> anyhow::Result<GetInfoResponse> {
        let info = self.client.get_info(GetInfoRequest {}).await?;
        Ok(info.into_inner())
    }
}

#[async_trait]
impl BaseClient for ArkClient {
    fn kind(&self) -> String {
        "Fulmine".to_string()
    }

    fn symbol(&self) -> String {
        self.symbol.clone()
    }

    #[instrument(name = "ArkClient::connect", skip_all)]
    async fn connect(&mut self) -> anyhow::Result<()> {
        let info = self.get_info().await?;
        let pubkey = secp256k1::PublicKey::from_slice(&alloy::hex::decode(&info.pubkey)?)?;
        let mut pubkey_guard = self
            .pubkey
            .write()
            .map_err(|e| anyhow!("failed to acquire pubkey lock: {}", e))?;
        *pubkey_guard = Some(pubkey);

        info!(
            "Connected to {} {} {}: {}@{}",
            self.symbol,
            self.kind(),
            info.build_info
                .map(|info| info.version)
                .unwrap_or("unknown version".to_string()),
            info.pubkey,
            info.server_url,
        );

        Ok(())
    }
}

#[cfg(test)]
pub mod tests {
    use super::*;

    const HOST: &str = "127.0.0.1";
    const PORT: u16 = 7000;

    pub async fn get_client() -> ArkClient {
        ArkClient::new(
            "ARK".to_string(),
            &crate::ark::Config {
                host: HOST.to_string(),
                port: PORT,
            },
        )
        .await
        .unwrap()
    }

    #[tokio::test]
    async fn test_connect_pubkey() {
        let mut client = get_client().await;

        assert!(client.pubkey().is_none());

        client.connect().await.unwrap();

        let pubkey = client.pubkey();
        assert!(pubkey.is_some());
        assert!(!pubkey.unwrap().to_string().is_empty());
    }
}

use crate::chain::chain_client::ChainClient;
use crate::chain::types::NetworkInfo;
use crate::chain::utils::{Outpoint, Transaction};
use crate::chain::{BaseClient, Client, LiquidConfig};
use async_trait::async_trait;
use std::collections::HashSet;
use tracing::{debug, info, instrument, warn};

pub const SYMBOL: &str = "L-BTC";

const TYPE: crate::chain::types::Type = crate::chain::types::Type::Elements;

#[derive(Debug, Clone)]
pub struct ElementsClient {
    client: ChainClient,
    lowball_client: Option<ChainClient>,
}

impl ElementsClient {
    #[instrument(name = "ElementsClient::new", skip(config))]
    pub fn new(config: LiquidConfig) -> anyhow::Result<Self> {
        let client = ChainClient::new(TYPE, SYMBOL.to_string(), config.base)?;
        let lowball_client = match config.lowball {
            Some(lowball_config) => {
                Some(ChainClient::new(TYPE, SYMBOL.to_string(), lowball_config)?)
            }
            None => {
                debug!("No {} lowball client configured", SYMBOL);
                None
            }
        };

        Ok(Self {
            client,
            lowball_client,
        })
    }

    fn wallet_client(&self) -> &ChainClient {
        match &self.lowball_client {
            Some(lowball) => lowball,
            None => &self.client,
        }
    }
}

#[async_trait]
impl BaseClient for ElementsClient {
    fn kind(&self) -> String {
        "Elements client".to_string()
    }

    fn symbol(&self) -> String {
        SYMBOL.to_string()
    }

    async fn connect(&mut self) -> anyhow::Result<()> {
        self.client.connect().await?;

        if let Some(mut lowball_client) = self.lowball_client.clone() {
            info!("Connecting to {} lowball client", SYMBOL);
            lowball_client.connect().await?;
            self.lowball_client = Some(lowball_client);
        }

        Ok(())
    }
}

#[async_trait]
impl Client for ElementsClient {
    async fn scan_mempool(
        &self,
        relevant_inputs: &HashSet<Outpoint>,
        relevant_outputs: &HashSet<Vec<u8>>,
    ) -> anyhow::Result<Vec<Transaction>> {
        self.wallet_client()
            .scan_mempool(relevant_inputs, relevant_outputs)
            .await
    }

    async fn network_info(&self) -> anyhow::Result<NetworkInfo> {
        self.wallet_client().network_info().await
    }
}

#[cfg(test)]
pub mod test {
    use crate::chain::elements_client::ElementsClient;
    use crate::chain::{Config, LiquidConfig};
    use std::sync::OnceLock;

    const PORT: u16 = 18_884;

    pub fn get_client() -> (ElementsClient, Config) {
        let config = Config {
            host: "127.0.0.1".to_string(),
            port: PORT,
            cookie: None,
            user: Some("boltz".to_string()),
            password: Some("anoVB0m1KvX0SmpPxvaLVADg0UQVLQTEx3jCD3qtuRI".to_string()),
        };

        static CLIENT: OnceLock<(ElementsClient, Config)> = OnceLock::new();
        CLIENT
            .get_or_init(|| {
                (
                    ElementsClient::new(LiquidConfig {
                        base: config.clone(),
                        lowball: Some(config.clone()),
                    })
                    .unwrap(),
                    config,
                )
            })
            .clone()
    }

    #[test]
    fn test_wallet_client() {
        let (_, config) = get_client();
        let client = ElementsClient::new(LiquidConfig {
            base: config.clone(),
            lowball: None,
        })
        .unwrap();
        assert!(client.lowball_client.clone().is_none());
        assert_eq!(client.wallet_client().clone(), client.client);

        let mut config_lowball = config.clone();
        config_lowball.port = 123;
        let client = ElementsClient::new(LiquidConfig {
            base: config,
            lowball: Some(config_lowball),
        })
        .unwrap();
        assert!(client.lowball_client.clone().is_some());
        assert_eq!(
            client.wallet_client().clone(),
            client.lowball_client.unwrap()
        );
    }
}

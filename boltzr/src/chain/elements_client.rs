use crate::chain::chain_client::ChainClient;
use crate::chain::types::NetworkInfo;
use crate::chain::utils::Transaction;
use crate::chain::{Client, LiquidConfig};
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
impl Client for ElementsClient {
    fn symbol(&self) -> String {
        SYMBOL.to_string()
    }

    async fn connect(&self) -> anyhow::Result<()> {
        self.client.connect().await?;

        if let Some(lowball_client) = &self.lowball_client {
            info!("Connecting to {} lowball client", SYMBOL);
            lowball_client.connect().await?;
        }

        Ok(())
    }

    async fn scan_mempool(
        &self,
        relevant_inputs: HashSet<Vec<u8>>,
        relevant_outputs: HashSet<Vec<u8>>,
    ) -> anyhow::Result<Vec<Transaction>> {
        self.wallet_client()
            .scan_mempool(relevant_inputs, relevant_outputs)
            .await
    }

    async fn network_info(&self) -> anyhow::Result<NetworkInfo> {
        self.wallet_client().network_info().await
    }
}

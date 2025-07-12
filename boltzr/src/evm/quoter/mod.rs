use alloy::primitives::{Address, U256};
use alloy::providers::Provider;
use alloy::providers::network::Network;
use anyhow::Result;
use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tracing::instrument;

mod uniswap_v3;

#[derive(Deserialize, Serialize, PartialEq, Clone, Debug)]
pub struct Config {
    #[serde(rename = "uniswapV3")]
    pub uniswap_v3: Option<uniswap_v3::Config>,
}

#[derive(Serialize, Debug, Clone, PartialEq, Eq)]
#[serde(tag = "type")]
pub enum Data {
    #[serde(rename = "uniswapV3")]
    UniswapV3(uniswap_v3::Data),
}

#[async_trait]
trait Quoter {
    async fn quote(
        &self,
        token_in: Address,
        token_out: Address,
        amount_in: U256,
    ) -> Result<(U256, Data)>;
}

#[derive(Clone)]
pub struct QuoteAggregator {
    quoters: Vec<Arc<dyn Quoter + Send + Sync>>,
}

impl QuoteAggregator {
    pub async fn new<P, N>(symbol: &str, provider: P, config: Option<Config>) -> Result<Self>
    where
        P: Provider<N> + Clone + 'static,
        N: Network,
    {
        let mut quoters: Vec<Arc<dyn Quoter + Send + Sync>> = Vec::new();

        if let Some(config) = config {
            if let Some(uniswap_v3) = config.uniswap_v3 {
                quoters.push(Arc::new(
                    uniswap_v3::UniswapV3::new(symbol, provider, uniswap_v3).await?,
                ));
            }
        }

        Ok(Self { quoters })
    }

    #[instrument(name = "QuoteAggregator::quote", skip(self))]
    pub async fn quote(
        &self,
        token_in: Address,
        token_out: Address,
        amount_in: U256,
    ) -> Result<Vec<(U256, Data)>> {
        let results = futures::future::join_all(
            self.quoters
                .iter()
                .map(|quoter| quoter.quote(token_in, token_out, amount_in)),
        )
        .await
        .into_iter()
        .flatten()
        .collect();

        Ok(results)
    }
}

use crate::utils::check_contract_exists;
use alloy::primitives::{Address, U256};
use alloy::providers::Provider;
use alloy::providers::network::Network;
use anyhow::Result;
use async_trait::async_trait;
use boltz_cache::Cache;
use serde::{Deserialize, Serialize};
use std::fmt;
use std::str::FromStr;
use std::sync::Arc;
use tracing::{debug, instrument, warn};

mod uniswap_v3;

#[derive(Deserialize, Serialize, PartialEq, Clone, Debug)]
pub struct Config {
    pub weth: String,

    #[serde(rename = "uniswapV3")]
    pub uniswap_v3: Option<uniswap_v3::Config>,
}

#[derive(Deserialize, Serialize, PartialEq, Clone, Copy, Debug)]
pub enum QuoterType {
    UniswapV3,
}

impl fmt::Display for QuoterType {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            QuoterType::UniswapV3 => write!(f, "UniswapV3"),
        }
    }
}

#[derive(Deserialize, Serialize, Debug, Clone, PartialEq, Eq)]
#[serde(tag = "type")]
pub enum Data {
    #[serde(rename = "uniswapV3")]
    UniswapV3(uniswap_v3::Data),
}

impl Data {
    pub fn quoter_type(&self) -> QuoterType {
        match self {
            Data::UniswapV3(_) => QuoterType::UniswapV3,
        }
    }
}

#[derive(Deserialize, Serialize, Debug, Clone, PartialEq, Eq)]
pub struct Call {
    pub to: Address,
    #[serde(serialize_with = "crate::serde_utils::u256::serialize")]
    pub value: U256,
    #[serde(serialize_with = "crate::serde_utils::hex::serialize")]
    pub data: Vec<u8>,
}

#[async_trait]
trait Quoter {
    fn quoter_type(&self) -> QuoterType;

    async fn quote_input(
        &self,
        token_in: Address,
        token_out: Address,
        amount_in: U256,
    ) -> Result<(U256, Data)>;

    async fn quote_output(
        &self,
        token_in: Address,
        token_out: Address,
        amount_out: U256,
    ) -> Result<(U256, Data)>;

    fn encode(
        &self,
        data: Data,
        recipient: Address,
        amount_in: U256,
        amount_out_min: U256,
    ) -> Result<Vec<Call>>;
}

#[derive(Clone)]
pub struct QuoteAggregator {
    symbol: String,
    quoters: Vec<Arc<dyn Quoter + Send + Sync>>,
}

impl QuoteAggregator {
    pub async fn new<P, N>(
        symbol: String,
        cache: Cache,
        provider: P,
        config: Option<Config>,
    ) -> Result<Self>
    where
        P: Provider<N> + Clone + 'static,
        N: Network,
    {
        let mut quoters: Vec<Arc<dyn Quoter + Send + Sync>> = Vec::new();

        if let Some(config) = config {
            let weth = Address::from_str(&config.weth)?;
            check_contract_exists(&provider, weth).await?;

            if let Some(uniswap_v3) = config.uniswap_v3 {
                quoters.push(Arc::new(
                    uniswap_v3::UniswapV3::new(symbol.clone(), cache, provider, weth, uniswap_v3)
                        .await?,
                ));
            }
        }

        Ok(Self { symbol, quoters })
    }

    #[instrument(name = "QuoteAggregator::quote_input", skip(self, amount_in))]
    pub async fn quote_input(
        &self,
        token_in: Address,
        token_out: Address,
        amount_in: U256,
    ) -> Result<Vec<(U256, Data)>> {
        if amount_in.is_zero() {
            return Ok(vec![]);
        }

        debug!("Quoting {}", self.symbol);

        Ok(Self::filter_quotes(
            futures::future::join_all(self.quoters.iter().map(async |quoter| {
                (
                    quoter.quoter_type(),
                    quoter.quote_input(token_in, token_out, amount_in).await,
                )
            }))
            .await,
        ))
    }

    #[instrument(name = "QuoteAggregator::quote_output", skip(self, amount_out))]
    pub async fn quote_output(
        &self,
        token_in: Address,
        token_out: Address,
        amount_out: U256,
    ) -> Result<Vec<(U256, Data)>> {
        if amount_out.is_zero() {
            return Ok(vec![]);
        }

        debug!("Quoting {}", self.symbol);

        Ok(Self::filter_quotes(
            futures::future::join_all(self.quoters.iter().map(async |quoter| {
                (
                    quoter.quoter_type(),
                    quoter.quote_output(token_in, token_out, amount_out).await,
                )
            }))
            .await,
        ))
    }

    pub fn encode(
        &self,
        data: Data,
        recipient: Address,
        amount_in: U256,
        amount_out_min: U256,
    ) -> Result<Vec<Call>> {
        let quoter = self
            .quoters
            .iter()
            .find(|quoter| quoter.quoter_type() == data.quoter_type());

        if let Some(quoter) = quoter {
            quoter.encode(data, recipient, amount_in, amount_out_min)
        } else {
            Err(anyhow::anyhow!(
                "no quoter found for type: {:?}",
                data.quoter_type()
            ))
        }
    }

    fn filter_quotes(result: Vec<(QuoterType, Result<(U256, Data)>)>) -> Vec<(U256, Data)> {
        result
            .into_iter()
            .filter_map(|(quoter_type, res)| {
                if let Err(err) = &res {
                    warn!("Quote {quoter_type} failed: {:#}", err);
                }

                res.ok()
            })
            .collect()
    }
}

use crate::utils::check_contract_exists;
use alloy::network::TransactionBuilder;
use alloy::primitives::{Address, U256};
use alloy::providers::bindings::IMulticall3::{Call3, aggregate3Call};
use alloy::providers::network::AnyNetwork;
use alloy::providers::{DynProvider, Provider};
use alloy::sol_types::SolCall;
use anyhow::{Result, anyhow};
use boltz_cache::Cache;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::str::FromStr;
use tracing::{debug, instrument};

mod common;
mod route;
mod router;
mod uniswap_v3;
mod uniswap_v4;

use route::RouteQuoter;
pub use route::{Data, Dex, Hop, QuoteCall, QuoteCallResult, UniswapV3Hop, UniswapV4Hop};
pub use router::Router;

#[derive(Deserialize, Serialize, PartialEq, Clone, Debug)]
pub struct Config {
    pub weth: String,

    /// Tokens with lots of liquidity that route search may use as one-hop intermediates.
    #[serde(rename = "liquidTokens")]
    pub liquid_tokens: Option<Vec<Address>>,

    #[serde(rename = "uniswapV3")]
    pub uniswap_v3: Option<uniswap_v3::Config>,

    #[serde(rename = "uniswapV4")]
    pub uniswap_v4: Option<uniswap_v4::Config>,
}

#[derive(Deserialize, Serialize, Debug, Clone, PartialEq, Eq)]
pub struct Call {
    pub to: Address,
    #[serde(serialize_with = "crate::serde_utils::u256::serialize")]
    pub value: U256,
    #[serde(serialize_with = "crate::serde_utils::hex::serialize")]
    pub data: Vec<u8>,
}

#[derive(Clone)]
pub struct QuoteAggregator {
    symbol: String,
    router: Option<Router>,
    multicall: Option<AlloyQuoteMulticall>,
    liquid_tokens: Vec<Address>,
    quoters: Vec<Quoter>,
}

#[derive(Clone)]
enum Quoter {
    UniswapV3(uniswap_v3::UniswapV3),
    UniswapV4(uniswap_v4::UniswapV4),
}

impl RouteQuoter for Quoter {
    fn dex(&self) -> Dex {
        match self {
            Quoter::UniswapV3(quoter) => quoter.dex(),
            Quoter::UniswapV4(quoter) => quoter.dex(),
        }
    }

    fn router(&self) -> Address {
        match self {
            Quoter::UniswapV3(quoter) => quoter.router(),
            Quoter::UniswapV4(quoter) => quoter.router(),
        }
    }

    fn multicall(&self) -> Address {
        match self {
            Quoter::UniswapV3(quoter) => quoter.multicall(),
            Quoter::UniswapV4(quoter) => quoter.multicall(),
        }
    }

    async fn candidates(
        &self,
        pairs: &[(Address, Address)],
    ) -> Result<HashMap<(Address, Address), Vec<Hop>>> {
        match self {
            Quoter::UniswapV3(quoter) => quoter.candidates(pairs).await,
            Quoter::UniswapV4(quoter) => quoter.candidates(pairs).await,
        }
    }

    fn quote_input_call(&self, token_in: Address, hop: &Hop, amount_in: U256) -> Result<QuoteCall> {
        match self {
            Quoter::UniswapV3(quoter) => quoter.quote_input_call(token_in, hop, amount_in),
            Quoter::UniswapV4(quoter) => quoter.quote_input_call(token_in, hop, amount_in),
        }
    }

    fn quote_output_call(
        &self,
        token_in: Address,
        hop: &Hop,
        amount_out: U256,
    ) -> Result<QuoteCall> {
        match self {
            Quoter::UniswapV3(quoter) => quoter.quote_output_call(token_in, hop, amount_out),
            Quoter::UniswapV4(quoter) => quoter.quote_output_call(token_in, hop, amount_out),
        }
    }

    fn decode_quote_input(&self, return_data: &[u8]) -> Result<U256> {
        match self {
            Quoter::UniswapV3(quoter) => quoter.decode_quote_input(return_data),
            Quoter::UniswapV4(quoter) => quoter.decode_quote_input(return_data),
        }
    }

    fn decode_quote_output(&self, return_data: &[u8]) -> Result<U256> {
        match self {
            Quoter::UniswapV3(quoter) => quoter.decode_quote_output(return_data),
            Quoter::UniswapV4(quoter) => quoter.decode_quote_output(return_data),
        }
    }
}

#[derive(Clone)]
struct AlloyQuoteMulticall {
    provider: DynProvider<AnyNetwork>,
    multicall: Address,
}

impl AlloyQuoteMulticall {
    fn new(provider: DynProvider<AnyNetwork>, multicall: Address) -> Self {
        Self {
            provider,
            multicall,
        }
    }

    async fn aggregate(&self, calls: Vec<QuoteCall>) -> Result<Vec<QuoteCallResult>> {
        let calls = calls
            .into_iter()
            .map(|call| Call3 {
                target: call.target,
                allowFailure: true,
                callData: call.data,
            })
            .collect::<Vec<_>>();
        let data = aggregate3Call { calls }.abi_encode();
        let tx = <AnyNetwork as alloy::network::Network>::TransactionRequest::default()
            .with_to(self.multicall)
            .with_input(data);
        let return_data = self.provider.call(tx).await?;
        let results = aggregate3Call::abi_decode_returns(&return_data)?;

        Ok(results
            .into_iter()
            .map(|result| QuoteCallResult {
                success: result.success,
                return_data: result.returnData,
            })
            .collect())
    }
}

impl QuoteAggregator {
    pub async fn new(
        symbol: String,
        cache: Cache,
        provider: DynProvider<AnyNetwork>,
        config: Option<Config>,
    ) -> Result<Self> {
        let Some(config) = config else {
            return Ok(Self {
                symbol,
                router: None,
                multicall: None,
                liquid_tokens: Vec::new(),
                quoters: Vec::new(),
            });
        };

        let weth = Address::from_str(&config.weth)?;
        check_contract_exists(&provider, weth).await?;

        let liquid_tokens = config.liquid_tokens.unwrap_or_default();

        let mut quoters = Vec::new();

        if let Some(uniswap_v3) = config.uniswap_v3 {
            quoters.push(Quoter::UniswapV3(
                uniswap_v3::UniswapV3::new(
                    symbol.clone(),
                    cache.clone(),
                    provider.clone(),
                    weth,
                    uniswap_v3,
                )
                .await?,
            ));
        }

        if let Some(uniswap_v4) = config.uniswap_v4 {
            quoters.push(Quoter::UniswapV4(
                uniswap_v4::UniswapV4::new(
                    symbol.clone(),
                    cache.clone(),
                    provider.clone(),
                    uniswap_v4,
                )
                .await?,
            ));
        }

        let router_address = Self::router_address(&quoters)?;
        let router = router_address.map(|router| Router::new(weth, router));
        let multicall_address = Self::multicall_address(&quoters)?;
        let multicall =
            multicall_address.map(|multicall| AlloyQuoteMulticall::new(provider, multicall));

        Ok(Self {
            symbol,
            router,
            multicall,
            liquid_tokens,
            quoters,
        })
    }

    #[instrument(name = "QuoteAggregator::quote_input", skip(self, amount_in))]
    pub async fn quote_input(
        &self,
        token_in: Address,
        token_out: Address,
        amount_in: U256,
    ) -> Result<Vec<(U256, Data)>> {
        let Some((routes, multicall)) = self.quote_context(token_in, token_out, amount_in).await?
        else {
            return Ok(Vec::new());
        };

        Ok(Self::quote_pairs(
            route::quote_input_routes(
                &self.quoters,
                |calls| multicall.aggregate(calls),
                routes,
                amount_in,
            )
            .await?,
        ))
    }

    #[instrument(name = "QuoteAggregator::quote_output", skip(self, amount_out))]
    pub async fn quote_output(
        &self,
        token_in: Address,
        token_out: Address,
        amount_out: U256,
    ) -> Result<Vec<(U256, Data)>> {
        let Some((routes, multicall)) = self.quote_context(token_in, token_out, amount_out).await?
        else {
            return Ok(Vec::new());
        };

        Ok(Self::quote_pairs(
            route::quote_output_routes(
                &self.quoters,
                |calls| multicall.aggregate(calls),
                routes,
                amount_out,
            )
            .await?,
        ))
    }

    pub fn encode(
        &self,
        data: Data,
        recipient: Address,
        amount_in: U256,
        amount_out_min: U256,
    ) -> Result<Vec<Call>> {
        self.router
            .as_ref()
            .ok_or_else(|| anyhow!("no quoter router configured"))?
            .encode(data, recipient, amount_in, amount_out_min)
    }

    async fn quote_context(
        &self,
        token_in: Address,
        token_out: Address,
        amount: U256,
    ) -> Result<Option<(Vec<Data>, &AlloyQuoteMulticall)>> {
        if amount.is_zero() {
            return Ok(None);
        }

        debug!("Quoting {}", self.symbol);

        let routes =
            route::generate_routes(token_in, token_out, &self.liquid_tokens, &self.quoters).await;

        if routes.is_empty() {
            return Ok(None);
        }

        let multicall = self
            .multicall
            .as_ref()
            .ok_or_else(|| anyhow!("no quoter multicall configured"))?;

        Ok(Some((routes, multicall)))
    }

    fn quote_pairs(quotes: Vec<route::Quote>) -> Vec<(U256, Data)> {
        quotes
            .into_iter()
            .map(|quote| (quote.quote, quote.data))
            .collect()
    }

    fn router_address(quoters: &[Quoter]) -> Result<Option<Address>> {
        let mut router = None;

        for quoter in quoters {
            let new_router = quoter.router();
            match router {
                Some(existing_router) if existing_router != new_router => {
                    return Err(anyhow!(
                        "configured quoters use different routers: {} and {}",
                        existing_router,
                        new_router,
                    ));
                }
                Some(_) => {}
                None => router = Some(new_router),
            }
        }

        Ok(router)
    }

    fn multicall_address(quoters: &[Quoter]) -> Result<Option<Address>> {
        let mut multicall = None;

        for quoter in quoters {
            let new_multicall = quoter.multicall();
            match multicall {
                Some(existing_multicall) if existing_multicall != new_multicall => {
                    return Err(anyhow!(
                        "configured quoters use different multicalls: {} and {}",
                        existing_multicall,
                        new_multicall,
                    ));
                }
                Some(_) => {}
                None => multicall = Some(new_multicall),
            }
        }

        Ok(multicall)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use alloy::providers::ProviderBuilder;
    use boltz_cache::MemCache;
    use serial_test::serial;

    const ARBITRUM_RPC_URL: &str = "https://arbitrum-one-rpc.publicnode.com";

    const WETH: Address = alloy::primitives::address!("82aF49447D8a07e3bd95BD0d56f35241523fBab1");
    const USDC: Address = alloy::primitives::address!("af88d065e77c8cC2239327C5EDb3A432268e5831");
    const USDT: Address = alloy::primitives::address!("Fd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9");

    const UNISWAP_V3_FACTORY: Address =
        alloy::primitives::address!("1F98431c8aD98523631AE4a59f267346ea31F984");
    const UNISWAP_V3_QUOTER: Address =
        alloy::primitives::address!("61fFE014bA17989E743c5F6cB21bF9697530B21e");
    const UNISWAP_V4_POOL_MANAGER: Address =
        alloy::primitives::address!("360E68faCcca8cA495c1B759Fd9EEe466db9FB32");
    const UNISWAP_V4_QUOTER: Address =
        alloy::primitives::address!("3972C00f7ed4885e145823eb7C655375d275A1C5");
    const UNISWAP_V4_STATE_VIEW: Address =
        alloy::primitives::address!("76fd297e2d437cd7f76d50f01afe6160f86e9990");
    const UNIVERSAL_ROUTER: Address =
        alloy::primitives::address!("a51afafe0263b40edaef0df8781ea9aa03e381a3");
    const MULTICALL3: Address =
        alloy::primitives::address!("cA11bde05977b3631167028862bE2a173976CA11");

    fn arbitrum_provider() -> DynProvider<AnyNetwork> {
        let rpc_url =
            std::env::var("ARBITRUM_RPC_URL").unwrap_or_else(|_| ARBITRUM_RPC_URL.to_string());

        DynProvider::new(
            ProviderBuilder::new()
                .network::<AnyNetwork>()
                .connect_http(rpc_url.parse().unwrap()),
        )
    }

    fn v3_config() -> uniswap_v3::Config {
        uniswap_v3::Config {
            factory: UNISWAP_V3_FACTORY,
            quoter: UNISWAP_V3_QUOTER,
            router: UNIVERSAL_ROUTER,
            multicall: MULTICALL3,
        }
    }

    fn v4_config() -> uniswap_v4::Config {
        uniswap_v4::Config {
            quoter: UNISWAP_V4_QUOTER,
            router: UNIVERSAL_ROUTER,
            pool_manager: UNISWAP_V4_POOL_MANAGER,
            state_view: UNISWAP_V4_STATE_VIEW,
            multicall: MULTICALL3,
            pools: vec![uniswap_v4::PoolConfig {
                fee: 500,
                tick_spacing: 10,
            }],
        }
    }

    fn config(
        liquid_tokens: Option<Vec<Address>>,
        uniswap_v3: Option<uniswap_v3::Config>,
        uniswap_v4: Option<uniswap_v4::Config>,
    ) -> Config {
        Config {
            weth: WETH.to_string(),
            liquid_tokens,
            uniswap_v3,
            uniswap_v4,
        }
    }

    #[tokio::test]
    #[serial]
    async fn live_arbitrum_v3_aggregator_quotes_and_encodes() {
        let amount_in = U256::from(100_000_000_000_000u64);
        let aggregator = QuoteAggregator::new(
            "ARB".to_string(),
            Cache::Memory(MemCache::new()),
            arbitrum_provider(),
            Some(config(None, Some(v3_config()), None)),
        )
        .await
        .unwrap();

        let quotes = aggregator.quote_input(WETH, USDT, amount_in).await.unwrap();
        let (amount_out, data) = quotes
            .iter()
            .find(|(_, data)| matches!(data.hops.as_slice(), [Hop::UniswapV3(_)]))
            .expect("v3 quote");

        assert!(!amount_out.is_zero());
        assert_eq!(data.token_in, WETH);

        let output_quotes = aggregator
            .quote_output(WETH, USDT, U256::from(1_000_000u64))
            .await
            .unwrap();
        assert!(output_quotes.iter().any(|(amount_in, data)| {
            !amount_in.is_zero() && matches!(data.hops.as_slice(), [Hop::UniswapV3(_)])
        }));

        let calls = aggregator
            .encode(
                data.clone(),
                alloy::primitives::address!("0000000000000000000000000000000000000001"),
                amount_in,
                *amount_out * U256::from(99) / U256::from(100),
            )
            .unwrap();
        assert_eq!(calls.len(), 2);
        assert_eq!(calls[0].to, WETH);
        assert_eq!(calls[1].to, UNIVERSAL_ROUTER);
    }

    #[tokio::test]
    #[serial]
    async fn live_arbitrum_v4_quotes_hookless_native_usdc_pool() {
        let quoter = uniswap_v4::UniswapV4::new(
            "ARB".to_string(),
            Cache::Memory(MemCache::new()),
            arbitrum_provider(),
            v4_config(),
        )
        .await
        .unwrap();
        let hop = quoter
            .candidates(&[(Address::ZERO, USDC)])
            .await
            .unwrap()
            .remove(&(Address::ZERO, USDC))
            .unwrap()
            .into_iter()
            .find(|hop| {
                matches!(
                    hop,
                    Hop::UniswapV4(UniswapV4Hop {
                        fee: 500,
                        tick_spacing: 10,
                        ..
                    })
                )
            })
            .expect("v4 0.05% hookless ETH/USDC candidate");

        let amount_out = quoter
            .quote_input(Address::ZERO, &hop, U256::from(1_000_000_000_000_000u64))
            .await
            .unwrap();
        assert!(!amount_out.is_zero());

        let amount_in = quoter
            .quote_output(Address::ZERO, &hop, U256::from(1_000_000u64))
            .await
            .unwrap();
        assert!(!amount_in.is_zero());
    }

    #[tokio::test]
    #[serial]
    async fn live_arbitrum_aggregator_quotes_mixed_v4_to_v3_route() {
        let amount_in = U256::from(1_000_000_000_000_000u64);
        let aggregator = QuoteAggregator::new(
            "ARB".to_string(),
            Cache::Memory(MemCache::new()),
            arbitrum_provider(),
            Some(config(
                Some(vec![USDC]),
                Some(v3_config()),
                Some(v4_config()),
            )),
        )
        .await
        .unwrap();

        let quotes = aggregator
            .quote_input(Address::ZERO, USDT, amount_in)
            .await
            .unwrap();
        let (amount_out, data) = quotes
            .iter()
            .find(|(_, data)| {
                matches!(data.hops.as_slice(), [Hop::UniswapV4(_), Hop::UniswapV3(_)])
            })
            .expect("mixed v4 -> v3 quote");

        assert!(!amount_out.is_zero());
        assert_eq!(data.token_in, Address::ZERO);

        let calls = aggregator
            .encode(
                data.clone(),
                alloy::primitives::address!("0000000000000000000000000000000000000001"),
                amount_in,
                *amount_out * U256::from(95) / U256::from(100),
            )
            .unwrap();
        assert_eq!(calls.len(), 1);
        assert_eq!(calls[0].to, UNIVERSAL_ROUTER);
        assert_eq!(calls[0].value, amount_in);
    }
}

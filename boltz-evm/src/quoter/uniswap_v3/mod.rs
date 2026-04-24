use super::router::PathEncoder;
use crate::quoter::common::{
    POOL_CACHE_TTL_SECS, TokenPair, cached_relevant_pools, default_multicall,
};
use crate::quoter::route::{Dex, Hop, QuoteCall, RouteQuoter, UniswapV3Hop};
use crate::utils::check_contract_exists;
use alloy::primitives::aliases::U24;
use alloy::primitives::{Address, Bytes, U256};
use alloy::providers::network::AnyNetwork;
use alloy::providers::{CallItemBuilder, DynProvider, Provider};
use alloy::sol;
use alloy::sol_types::SolCall;
use anyhow::{Result, anyhow};
use boltz_cache::Cache;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tracing::info;

use self::IUniswapV3Factory::IUniswapV3FactoryInstance;

type AnyProvider = DynProvider<AnyNetwork>;

type RelevantPools = HashMap<TokenPair, Vec<u64>>;

// Uniswap V3 deployments share these global fee tiers.
const FEE_OPTIONS: [u64; 4] = [100, 500, 3_000, 10_000];

const CACHE_KEY_POOLS: &str = "uniswap_v3_pools";

sol!(
    #[sol(rpc)]
    "./src/quoter/uniswap_v3/abis/IQuoterV2.sol"
);

sol!(
    #[sol(rpc)]
    "./src/quoter/uniswap_v3/abis/IUniswapV3Factory.sol"
);

#[derive(Deserialize, Serialize, PartialEq, Clone, Debug)]
pub struct Config {
    pub factory: Address,
    pub quoter: Address,
    pub router: Address,
    #[serde(default = "default_multicall")]
    pub multicall: Address,
}

#[derive(Debug, Clone)]
pub struct UniswapV3 {
    provider: AnyProvider,
    cache: Cache,
    symbol: String,
    factory: IUniswapV3FactoryInstance<AnyProvider, AnyNetwork>,
    quoter_address: Address,
    router: Address,
    weth: Address,
    multicall: Address,
}

impl UniswapV3 {
    pub async fn new(
        symbol: String,
        cache: Cache,
        provider: AnyProvider,
        weth: Address,
        config: Config,
    ) -> Result<Self> {
        info!(
            "Using {} Uniswap V3 factory {}, quoter {}, router {} and multicall {}",
            symbol, config.factory, config.quoter, config.router, config.multicall,
        );

        tokio::try_join!(
            check_contract_exists(&provider, config.factory),
            check_contract_exists(&provider, config.quoter),
            check_contract_exists(&provider, config.router),
            check_contract_exists(&provider, config.multicall),
        )?;

        Ok(Self {
            provider: provider.clone(),
            cache,
            symbol,
            factory: IUniswapV3FactoryInstance::new(config.factory, provider.clone()),
            quoter_address: config.quoter,
            router: config.router,
            weth,
            multicall: config.multicall,
        })
    }

    async fn lookup_relevant_pools(&self, pairs: &[TokenPair]) -> Result<RelevantPools> {
        let cache_key = self.cache_key_pools();

        cached_relevant_pools(
            &self.cache,
            &cache_key,
            pairs,
            POOL_CACHE_TTL_SECS,
            |pairs| self.discover_relevant_pools(pairs),
        )
        .await
    }

    async fn discover_relevant_pools(&self, pairs: Vec<TokenPair>) -> Result<RelevantPools> {
        let mut multicall = self.provider.multicall().address(self.multicall).dynamic();
        let mut call_pools = Vec::with_capacity(pairs.len() * FEE_OPTIONS.len());

        for pair in &pairs {
            for fee in FEE_OPTIONS {
                multicall = multicall.add_call_dynamic(
                    CallItemBuilder::new(self.factory.getPool(pair.0, pair.1, U24::try_from(fee)?))
                        .allow_failure(true),
                );
                call_pools.push((*pair, fee));
            }
        }

        let mut discovered = HashMap::<TokenPair, Vec<u64>>::new();
        for ((pair, fee), result) in call_pools.into_iter().zip(multicall.aggregate3().await?) {
            if let Ok(pool) = result
                && pool != Address::ZERO
            {
                discovered.entry(pair).or_default().push(fee);
            }
        }

        Ok(discovered)
    }

    fn cache_key_pools(&self) -> String {
        format!("{CACHE_KEY_POOLS}:{}", self.symbol)
    }

    fn handle_eth(&self, token: Address) -> Address {
        // Uniswap V3 pools use WETH instead of the native token.
        if token == Address::ZERO {
            self.weth
        } else {
            token
        }
    }

    pub(crate) fn dex(&self) -> Dex {
        Dex::UniswapV3
    }

    pub(crate) fn router(&self) -> Address {
        self.router
    }

    pub(crate) fn multicall(&self) -> Address {
        self.multicall
    }

    pub async fn candidates(
        &self,
        pairs: &[(Address, Address)],
    ) -> Result<HashMap<(Address, Address), Vec<Hop>>> {
        let lookup_pairs = pairs
            .iter()
            .map(|(token_in, token_out)| {
                TokenPair(self.handle_eth(*token_in), self.handle_eth(*token_out))
            })
            .collect::<Vec<_>>();
        let pools = self.lookup_relevant_pools(&lookup_pairs).await?;

        Ok(pairs
            .iter()
            .filter_map(|(token_in, token_out)| {
                let lookup_token_in = self.handle_eth(*token_in);
                let lookup_token_out = self.handle_eth(*token_out);

                if lookup_token_in == lookup_token_out {
                    return None;
                }

                let hops = pools
                    .get(&TokenPair(lookup_token_in, lookup_token_out))
                    .into_iter()
                    .flatten()
                    .map(|fee| {
                        Hop::UniswapV3(UniswapV3Hop {
                            token_out: *token_out,
                            fee: *fee,
                        })
                    })
                    .collect::<Vec<_>>();

                if hops.is_empty() {
                    None
                } else {
                    Some(((*token_in, *token_out), hops))
                }
            })
            .collect())
    }

    pub(crate) fn quote_input_call(
        &self,
        token_in: Address,
        hop: &Hop,
        amount_in: U256,
    ) -> Result<QuoteCall> {
        let Hop::UniswapV3(hop) = hop else {
            return Err(anyhow!("unsupported hop for Uniswap V3"));
        };

        let path = PathEncoder::new()
            .add_token(self.handle_eth(token_in))
            .add_hop(hop.fee, self.handle_eth(hop.token_out))?
            .build();

        Ok(QuoteCall {
            target: self.quoter_address,
            data: IQuoterV2::quoteExactInputCall {
                path: Bytes::from(path),
                amountIn: amount_in,
            }
            .abi_encode()
            .into(),
        })
    }

    pub(crate) fn quote_output_call(
        &self,
        token_in: Address,
        hop: &Hop,
        amount_out: U256,
    ) -> Result<QuoteCall> {
        let Hop::UniswapV3(hop) = hop else {
            return Err(anyhow!("unsupported hop for Uniswap V3"));
        };

        let path = PathEncoder::new()
            .add_token(self.handle_eth(hop.token_out))
            .add_hop(hop.fee, self.handle_eth(token_in))?
            .build();

        Ok(QuoteCall {
            target: self.quoter_address,
            data: IQuoterV2::quoteExactOutputCall {
                path: Bytes::from(path),
                amountOut: amount_out,
            }
            .abi_encode()
            .into(),
        })
    }

    pub(crate) fn decode_quote_input(&self, return_data: &[u8]) -> Result<U256> {
        Ok(IQuoterV2::quoteExactInputCall::abi_decode_returns(return_data)?.amountOut)
    }

    pub(crate) fn decode_quote_output(&self, return_data: &[u8]) -> Result<U256> {
        Ok(IQuoterV2::quoteExactOutputCall::abi_decode_returns(return_data)?.amountIn)
    }
}

impl RouteQuoter for UniswapV3 {
    fn dex(&self) -> Dex {
        UniswapV3::dex(self)
    }

    fn router(&self) -> Address {
        UniswapV3::router(self)
    }

    fn multicall(&self) -> Address {
        UniswapV3::multicall(self)
    }

    async fn candidates(
        &self,
        pairs: &[(Address, Address)],
    ) -> Result<HashMap<(Address, Address), Vec<Hop>>> {
        UniswapV3::candidates(self, pairs).await
    }

    fn quote_input_call(&self, token_in: Address, hop: &Hop, amount_in: U256) -> Result<QuoteCall> {
        UniswapV3::quote_input_call(self, token_in, hop, amount_in)
    }

    fn quote_output_call(
        &self,
        token_in: Address,
        hop: &Hop,
        amount_out: U256,
    ) -> Result<QuoteCall> {
        UniswapV3::quote_output_call(self, token_in, hop, amount_out)
    }

    fn decode_quote_input(&self, return_data: &[u8]) -> Result<U256> {
        UniswapV3::decode_quote_input(self, return_data)
    }

    fn decode_quote_output(&self, return_data: &[u8]) -> Result<U256> {
        UniswapV3::decode_quote_output(self, return_data)
    }
}

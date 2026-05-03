use crate::quoter::common::{
    POOL_CACHE_TTL_SECS, TokenPair, cached_relevant_pools, check_i24, check_u24, default_multicall,
};
use crate::quoter::route::{Dex, Hop, QuoteCall, RouteQuoter, UniswapV4Hop};
use crate::utils::check_contract_exists;
use alloy::primitives::aliases::{I24, U24};
use alloy::primitives::{Address, B256, Bytes, U256, keccak256};
use alloy::providers::network::AnyNetwork;
use alloy::providers::{CallItemBuilder, DynProvider, Provider};
use alloy::sol;
use alloy::sol_types::{SolCall, SolValue};
use anyhow::{Result, anyhow};
use boltz_cache::Cache;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tracing::info;

use self::IStateView::IStateViewInstance;
#[cfg(test)]
use self::IV4Quoter::IV4QuoterInstance;

type AnyProvider = DynProvider<AnyNetwork>;

sol!(
    #[sol(rpc)]
    "./src/quoter/uniswap_v4/abis/IV4Quoter.sol"
);

sol!(
    #[sol(rpc)]
    "./src/quoter/uniswap_v4/abis/IStateView.sol"
);

type RelevantPools = HashMap<TokenPair, Vec<PoolConfig>>;

const CACHE_KEY_POOLS: &str = "uniswap_v4_pools";

#[derive(Deserialize, Serialize, PartialEq, Clone, Debug)]
pub struct Config {
    pub quoter: Address,
    pub router: Address,
    #[serde(rename = "poolManager")]
    pub pool_manager: Address,
    #[serde(rename = "stateView")]
    pub state_view: Address,
    #[serde(default = "default_multicall")]
    pub multicall: Address,
    #[serde(default = "default_pools")]
    pub pools: Vec<PoolConfig>,
}

#[derive(Deserialize, Serialize, PartialEq, Eq, Clone, Copy, Debug)]
pub struct PoolConfig {
    pub fee: u64,
    #[serde(rename = "tickSpacing")]
    pub tick_spacing: i32,
}

fn default_pools() -> Vec<PoolConfig> {
    vec![
        PoolConfig {
            fee: 100,
            tick_spacing: 1,
        },
        PoolConfig {
            fee: 500,
            tick_spacing: 10,
        },
        PoolConfig {
            fee: 3_000,
            tick_spacing: 60,
        },
        PoolConfig {
            fee: 10_000,
            tick_spacing: 200,
        },
    ]
}

#[derive(Debug, Clone)]
pub struct UniswapV4 {
    provider: AnyProvider,
    cache: Cache,
    symbol: String,
    #[cfg(test)]
    quoter: IV4QuoterInstance<AnyProvider, AnyNetwork>,
    quoter_address: Address,
    state_view: IStateViewInstance<AnyProvider, AnyNetwork>,
    router: Address,
    multicall: Address,
    pools: Vec<PoolConfig>,
}

impl UniswapV4 {
    pub async fn new(
        symbol: String,
        cache: Cache,
        provider: AnyProvider,
        config: Config,
    ) -> Result<Self> {
        info!(
            "Using {} Uniswap V4 quoter {}, router {}, pool manager {}, state view {}, multicall {} and {} pool configs",
            symbol,
            config.quoter,
            config.router,
            config.pool_manager,
            config.state_view,
            config.multicall,
            config.pools.len(),
        );

        validate_pools(&config.pools)?;

        tokio::try_join!(
            check_contract_exists(&provider, config.quoter),
            check_contract_exists(&provider, config.router),
            check_contract_exists(&provider, config.pool_manager),
            check_contract_exists(&provider, config.state_view),
            check_contract_exists(&provider, config.multicall),
        )?;

        Ok(Self {
            provider: provider.clone(),
            cache,
            symbol,
            #[cfg(test)]
            quoter: IV4Quoter::new(config.quoter, provider.clone()),
            quoter_address: config.quoter,
            state_view: IStateView::new(config.state_view, provider),
            router: config.router,
            multicall: config.multicall,
            pools: config.pools,
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
        let mut call_pools = Vec::with_capacity(pairs.len() * self.pools.len());

        for pair in &pairs {
            for pool in &self.pools {
                multicall = multicall.add_call_dynamic(
                    CallItemBuilder::new(self.state_view.getLiquidity(pool_id(*pair, *pool)?))
                        .allow_failure(true),
                );
                call_pools.push((*pair, *pool));
            }
        }

        let mut discovered = HashMap::<TokenPair, Vec<PoolConfig>>::new();
        for ((pair, pool), result) in call_pools.into_iter().zip(multicall.aggregate3().await?) {
            if let Ok(liquidity) = result
                && liquidity > 0
            {
                discovered.entry(pair).or_default().push(pool);
            }
        }

        Ok(discovered)
    }

    fn cache_key_pools(&self) -> String {
        format!("{CACHE_KEY_POOLS}:{}", self.symbol)
    }

    pub(crate) fn dex(&self) -> Dex {
        Dex::UniswapV4
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
            .map(|(token_in, token_out)| TokenPair(*token_in, *token_out))
            .collect::<Vec<_>>();
        let pools = self.lookup_relevant_pools(&lookup_pairs).await?;

        Ok(pairs
            .iter()
            .filter_map(|(token_in, token_out)| {
                if token_in == token_out {
                    return None;
                }

                let hops = pools
                    .get(&TokenPair(*token_in, *token_out))
                    .into_iter()
                    .flatten()
                    .map(|pool| {
                        Hop::UniswapV4(UniswapV4Hop {
                            token_out: *token_out,
                            fee: pool.fee,
                            tick_spacing: pool.tick_spacing,
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
        let Hop::UniswapV4(hop) = hop else {
            return Err(anyhow!("unsupported hop for Uniswap V4"));
        };

        Ok(QuoteCall {
            target: self.quoter_address,
            data: IV4Quoter::quoteExactInputSingleCall {
                params: single_params(token_in, hop, amount_in)?,
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
        let Hop::UniswapV4(hop) = hop else {
            return Err(anyhow!("unsupported hop for Uniswap V4"));
        };

        Ok(QuoteCall {
            target: self.quoter_address,
            data: IV4Quoter::quoteExactOutputSingleCall {
                params: single_params(token_in, hop, amount_out)?,
            }
            .abi_encode()
            .into(),
        })
    }

    pub(crate) fn decode_quote_input(&self, return_data: &[u8]) -> Result<U256> {
        Ok(IV4Quoter::quoteExactInputSingleCall::abi_decode_returns(return_data)?.amountOut)
    }

    pub(crate) fn decode_quote_output(&self, return_data: &[u8]) -> Result<U256> {
        Ok(IV4Quoter::quoteExactOutputSingleCall::abi_decode_returns(return_data)?.amountIn)
    }

    #[cfg(test)]
    pub async fn quote_input(&self, token_in: Address, hop: &Hop, amount_in: U256) -> Result<U256> {
        let Hop::UniswapV4(hop) = hop else {
            return Err(anyhow!("unsupported hop for Uniswap V4"));
        };

        Ok(self
            .quoter
            .quoteExactInputSingle(single_params(token_in, hop, amount_in)?)
            .call()
            .await?
            .amountOut)
    }

    #[cfg(test)]
    pub async fn quote_output(
        &self,
        token_in: Address,
        hop: &Hop,
        amount_out: U256,
    ) -> Result<U256> {
        let Hop::UniswapV4(hop) = hop else {
            return Err(anyhow!("unsupported hop for Uniswap V4"));
        };

        Ok(self
            .quoter
            .quoteExactOutputSingle(single_params(token_in, hop, amount_out)?)
            .call()
            .await?
            .amountIn)
    }
}

impl RouteQuoter for UniswapV4 {
    fn dex(&self) -> Dex {
        UniswapV4::dex(self)
    }

    fn router(&self) -> Address {
        UniswapV4::router(self)
    }

    fn multicall(&self) -> Address {
        UniswapV4::multicall(self)
    }

    async fn candidates(
        &self,
        pairs: &[(Address, Address)],
    ) -> Result<HashMap<(Address, Address), Vec<Hop>>> {
        UniswapV4::candidates(self, pairs).await
    }

    fn quote_input_call(&self, token_in: Address, hop: &Hop, amount_in: U256) -> Result<QuoteCall> {
        UniswapV4::quote_input_call(self, token_in, hop, amount_in)
    }

    fn quote_output_call(
        &self,
        token_in: Address,
        hop: &Hop,
        amount_out: U256,
    ) -> Result<QuoteCall> {
        UniswapV4::quote_output_call(self, token_in, hop, amount_out)
    }

    fn decode_quote_input(&self, return_data: &[u8]) -> Result<U256> {
        UniswapV4::decode_quote_input(self, return_data)
    }

    fn decode_quote_output(&self, return_data: &[u8]) -> Result<U256> {
        UniswapV4::decode_quote_output(self, return_data)
    }
}

fn single_params(
    token_in: Address,
    hop: &UniswapV4Hop,
    exact_amount: U256,
) -> Result<IV4Quoter::QuoteExactSingleParams> {
    let pool = PoolConfig {
        fee: hop.fee,
        tick_spacing: hop.tick_spacing,
    };
    validate_pool(pool)?;

    let pool_key = pool_key(TokenPair(token_in, hop.token_out), pool)?;

    Ok(IV4Quoter::QuoteExactSingleParams {
        zeroForOne: token_in == pool_key.currency0,
        poolKey: pool_key,
        exactAmount: u128::try_from(exact_amount)?,
        hookData: Bytes::new(),
    })
}

fn pool_id(pair: TokenPair, pool: PoolConfig) -> Result<B256> {
    Ok(keccak256(SolValue::abi_encode(&pool_key(pair, pool)?)))
}

fn pool_key(pair: TokenPair, pool: PoolConfig) -> Result<IV4Quoter::PoolKey> {
    validate_pool(pool)?;
    let (currency0, currency1) = pair.normalized();

    Ok(IV4Quoter::PoolKey {
        currency0,
        currency1,
        fee: U24::try_from(pool.fee)?,
        tickSpacing: I24::try_from(pool.tick_spacing)?,
        hooks: Address::ZERO,
    })
}

fn validate_pools(pools: &[PoolConfig]) -> Result<()> {
    for pool in pools {
        validate_pool(*pool)?;
    }

    Ok(())
}

fn validate_pool(pool: PoolConfig) -> Result<()> {
    check_u24(pool.fee, "fee")?;
    check_i24(pool.tick_spacing, "tickSpacing")
}

#[cfg(test)]
mod tests {
    use super::*;
    use alloy::primitives::address;

    #[test]
    fn default_pools_match_common_uniswap_fee_tiers() {
        assert_eq!(
            default_pools(),
            vec![
                PoolConfig {
                    fee: 100,
                    tick_spacing: 1,
                },
                PoolConfig {
                    fee: 500,
                    tick_spacing: 10,
                },
                PoolConfig {
                    fee: 3_000,
                    tick_spacing: 60,
                },
                PoolConfig {
                    fee: 10_000,
                    tick_spacing: 200,
                },
            ],
        );
    }

    #[test]
    fn single_params_sorts_pool_key_and_preserves_direction() {
        let token_a = address!("0000000000000000000000000000000000000001");
        let token_b = address!("0000000000000000000000000000000000000002");

        let params = single_params(
            token_b,
            &UniswapV4Hop {
                token_out: token_a,
                fee: 500,
                tick_spacing: 10,
            },
            U256::from(123),
        )
        .unwrap();

        assert_eq!(params.poolKey.currency0, token_a);
        assert_eq!(params.poolKey.currency1, token_b);
        assert!(!params.zeroForOne);
        assert_eq!(params.poolKey.hooks, Address::ZERO);
    }

    #[test]
    fn pool_id_hashes_abi_encoded_pool_key() {
        let token_a = address!("0000000000000000000000000000000000000001");
        let token_b = address!("0000000000000000000000000000000000000002");
        let pool = PoolConfig {
            fee: 500,
            tick_spacing: 10,
        };

        let expected = keccak256(manual_pool_key_abi_encode(
            token_a,
            token_b,
            pool.fee,
            pool.tick_spacing,
            Address::ZERO,
        ));

        assert_eq!(
            pool_id(TokenPair(token_b, token_a), pool).unwrap(),
            expected
        );
    }

    fn manual_pool_key_abi_encode(
        currency0: Address,
        currency1: Address,
        fee: u64,
        tick_spacing: i32,
        hooks: Address,
    ) -> Vec<u8> {
        let mut encoded = Vec::with_capacity(32 * 5);
        encode_address(&mut encoded, currency0);
        encode_address(&mut encoded, currency1);
        encode_uint24(&mut encoded, fee);
        encode_int24(&mut encoded, tick_spacing);
        encode_address(&mut encoded, hooks);
        encoded
    }

    fn encode_address(encoded: &mut Vec<u8>, value: Address) {
        encoded.extend_from_slice(&[0; 12]);
        encoded.extend_from_slice(value.as_slice());
    }

    fn encode_uint24(encoded: &mut Vec<u8>, value: u64) {
        let mut word = [0u8; 32];
        let bytes = (value as u32).to_be_bytes();
        word[29..].copy_from_slice(&bytes[1..]);
        encoded.extend_from_slice(&word);
    }

    fn encode_int24(encoded: &mut Vec<u8>, value: i32) {
        let mut word = if value < 0 { [0xff; 32] } else { [0; 32] };
        let bytes = value.to_be_bytes();
        word[29..].copy_from_slice(&bytes[1..]);
        encoded.extend_from_slice(&word);
    }
}

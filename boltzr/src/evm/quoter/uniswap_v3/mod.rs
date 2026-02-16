use crate::evm::quoter::uniswap_v3::IQuoterV2::IQuoterV2Instance;
use crate::evm::quoter::uniswap_v3::IUniswapV3Factory::IUniswapV3FactoryInstance;
use crate::evm::quoter::uniswap_v3::router::PathEncoder;
use crate::evm::quoter::{Call, Data as QuoterData, Quoter, QuoterType};
use crate::evm::utils::check_contract_exists;
use alloy::primitives::aliases::U24;
use alloy::primitives::{Address, U256};
use alloy::providers::Provider;
use alloy::providers::network::Network;
use alloy::sol;
use anyhow::Result;
use async_trait::async_trait;
use boltz_cache::Cache;
use router::Router;
use serde::{Deserialize, Deserializer, Serialize, Serializer};
use std::collections::HashMap;
use std::hash::{Hash, Hasher};
use std::str::FromStr;
use std::time::Duration;
use tracing::info;
use tracing::instrument;

mod router;

/// A normalized token pair where order doesn't matter.
/// TokenPair(A, B) and TokenPair(B, A) are considered equal and hash to the same value.
#[derive(Debug, Clone)]
struct TokenPair(Address, Address);

impl TokenPair {
    fn normalized(&self) -> (Address, Address) {
        if self.0 < self.1 {
            (self.0, self.1)
        } else {
            (self.1, self.0)
        }
    }
}

impl PartialEq for TokenPair {
    fn eq(&self, other: &Self) -> bool {
        self.normalized() == other.normalized()
    }
}

impl Eq for TokenPair {}

impl Hash for TokenPair {
    fn hash<H: Hasher>(&self, state: &mut H) {
        let (a, b) = self.normalized();
        a.hash(state);
        b.hash(state);
    }
}

impl Serialize for TokenPair {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let (a, b) = self.normalized();
        serializer.serialize_str(&format!("{}-{}", a, b))
    }
}

impl<'de> Deserialize<'de> for TokenPair {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        let s = String::deserialize(deserializer)?;
        let (a, b) = s
            .split_once('-')
            .ok_or_else(|| serde::de::Error::custom("invalid token pair format"))?;
        let a = Address::from_str(a).map_err(serde::de::Error::custom)?;
        let b = Address::from_str(b).map_err(serde::de::Error::custom)?;
        Ok(TokenPair(a, b))
    }
}

type RelevantPools = HashMap<TokenPair, Vec<u64>>;

const FEE_OPTIONS: [u64; 4] = [100, 500, 3_000, 10_000];

const CACHE_KEY_POOLS: &str = "uniswap_v3_pools";
const CACHE_TTL_SECS: u64 = Duration::from_mins(60).as_secs();

sol!(
    #[sol(rpc)]
    "./src/evm/quoter/uniswap_v3/abis/IQuoterV2.sol"
);

sol!(
    #[sol(rpc)]
    "./src/evm/quoter/uniswap_v3/abis/IUniswapV3Factory.sol"
);

#[derive(Deserialize, Serialize, PartialEq, Clone, Debug)]
pub struct Config {
    pub factory: Address,
    pub quoter: Address,
    pub router: Address,

    /// Tokens with lots of liquidity that we can route through
    #[serde(rename = "liquidTokens")]
    pub liquid_tokens: Option<Vec<Address>>,
}

#[derive(Deserialize, Serialize, Debug, Clone, PartialEq, Eq)]
pub struct Hop {
    pub fee: u64,
    pub token: Address,
}

#[derive(Deserialize, Serialize, Debug, Clone, PartialEq, Eq)]
pub struct Data {
    #[serde(rename = "tokenIn")]
    pub token_in: Address,
    pub hops: Vec<Hop>,
}

impl Data {
    pub fn reverse(&self) -> Self {
        if self.hops.is_empty() {
            return self.clone();
        }

        let mut tokens: Vec<Address> = std::iter::once(self.token_in)
            .chain(self.hops.iter().map(|h| h.token))
            .collect();
        tokens.reverse();

        let fees: Vec<u64> = self.hops.iter().rev().map(|h| h.fee).collect();

        Self {
            token_in: tokens[0],
            hops: fees
                .into_iter()
                .zip(tokens.into_iter().skip(1))
                .map(|(fee, token)| Hop { fee, token })
                .collect(),
        }
    }

    pub fn normalize(mut self, token_in: Address, token_out: Address) -> Self {
        self.token_in = token_in;

        if let Some(last_hop) = self.hops.last_mut() {
            last_hop.token = token_out;
        }

        self
    }
}

#[derive(Debug, Clone)]
pub struct UniswapV3<P, N> {
    cache: Cache,
    symbol: String,
    factory: IUniswapV3FactoryInstance<P, N>,
    quoter: IQuoterV2Instance<P, N>,
    router: Router<P, N>,
    liquid_tokens: Vec<Address>,
}

impl<P, N> UniswapV3<P, N>
where
    P: Provider<N> + Clone + 'static,
    N: Network,
{
    pub async fn new(
        symbol: String,
        cache: Cache,
        provider: P,
        weth: Address,
        config: Config,
    ) -> Result<Self> {
        info!(
            "Using {} factory {}, quoter {} and router {}",
            symbol,
            config.factory.to_string(),
            config.quoter.to_string(),
            config.router.to_string()
        );

        tokio::try_join!(
            check_contract_exists(&provider, weth),
            check_contract_exists(&provider, config.factory),
            check_contract_exists(&provider, config.quoter),
            check_contract_exists(&provider, config.router),
        )?;

        Ok(Self {
            cache,
            symbol,
            factory: IUniswapV3FactoryInstance::new(config.factory, provider.clone()),
            quoter: IQuoterV2::new(config.quoter, provider.clone()),
            router: Router::new(provider, weth, config.router),
            liquid_tokens: config.liquid_tokens.unwrap_or_default(),
        })
    }

    async fn quote_exact_input_single(
        &self,
        token_in: Address,
        hops: &[Hop],
        amount_in: U256,
    ) -> Result<U256> {
        Ok(self
            .quoter
            .quoteExactInput(
                PathEncoder::new()
                    .add_token(token_in)
                    .add_hops(hops)?
                    .build()
                    .into(),
                amount_in,
            )
            .call()
            .await
            .map(|result| result.amountOut)?)
    }

    async fn quote_exact_output_single(
        &self,
        token_in: Address,
        hops: &[Hop],
        amount_out: U256,
    ) -> Result<U256> {
        let data = Data {
            token_in,
            hops: hops.to_vec(),
        }
        .reverse();

        Ok(self
            .quoter
            .quoteExactOutput(
                // Needs to be in reverse order
                PathEncoder::new()
                    .add_token(data.token_in)
                    .add_hops(&data.hops)?
                    .build()
                    .into(),
                amount_out,
            )
            .call()
            .await
            .map(|result| result.amountIn)?)
    }

    async fn lookup_pools(&self, token_a: Address, token_b: Address) -> Result<Vec<u64>> {
        let (cache_key, cache_field) = self.cache_key_pools(token_a, token_b);
        if let Some(fees) = self.cache.get(&cache_key, &cache_field).await? {
            return Ok(fees);
        }

        let fees: Vec<u64> = futures::future::join_all(FEE_OPTIONS.iter().map(async |fee| {
            let pool = self
                .factory
                .getPool(token_a, token_b, U24::try_from(*fee)?)
                .call()
                .await?;
            Ok::<_, anyhow::Error>((pool, *fee))
        }))
        .await
        .into_iter()
        .flatten()
        .filter_map(|(address, fee)| {
            // The factory returns the zero address for pools that don't exist
            if address != Address::ZERO {
                Some(fee)
            } else {
                None
            }
        })
        .collect();

        self.cache
            .set(&cache_key, &cache_field, &fees, Some(CACHE_TTL_SECS))
            .await?;

        Ok(fees)
    }

    async fn lookup_relevant_pools(
        &self,
        token_in: Address,
        token_out: Address,
    ) -> Result<RelevantPools> {
        let mut lookups: Vec<(Address, Address)> = vec![(token_in, token_out)];

        for token in &self.liquid_tokens {
            if *token == token_in || *token == token_out {
                continue;
            }
            lookups.push((token_in, *token));
            lookups.push((*token, token_out));
        }

        let pools = futures::future::join_all(lookups.into_iter().map(|(a, b)| async move {
            Ok::<_, anyhow::Error>((TokenPair(a, b), self.lookup_pools(a, b).await?))
        }))
        .await
        .into_iter()
        .flatten()
        .filter(|(_, fees)| !fees.is_empty())
        .collect();

        Ok(pools)
    }

    fn generate_routes(
        &self,
        token_in: Address,
        token_out: Address,
        pools: &RelevantPools,
    ) -> Vec<Data> {
        let mut routes = Vec::new();

        // Direct routes: token_in -> token_out
        if let Some(fees) = pools.get(&TokenPair(token_in, token_out)) {
            for &fee in fees {
                routes.push(Data {
                    token_in,
                    hops: vec![Hop {
                        fee,
                        token: token_out,
                    }],
                });
            }
        }

        // Routes with one intermediate: token_in -> intermediate -> token_out
        for intermediate in &self.liquid_tokens {
            if *intermediate == token_in || *intermediate == token_out {
                continue;
            }

            let first_leg = pools.get(&TokenPair(token_in, *intermediate));
            let second_leg = pools.get(&TokenPair(*intermediate, token_out));

            if let (Some(first_fees), Some(second_fees)) = (first_leg, second_leg) {
                for &fee1 in first_fees {
                    for &fee2 in second_fees {
                        routes.push(Data {
                            token_in,
                            hops: vec![
                                Hop {
                                    fee: fee1,
                                    token: *intermediate,
                                },
                                Hop {
                                    fee: fee2,
                                    token: token_out,
                                },
                            ],
                        });
                    }
                }
            }
        }

        routes
    }

    async fn lookup_and_route(&self, token_in: Address, token_out: Address) -> Result<Vec<Data>> {
        let pools = self.lookup_relevant_pools(token_in, token_out).await?;
        Ok(self.generate_routes(token_in, token_out, &pools))
    }

    fn cache_key_pools(&self, token_a: Address, token_b: Address) -> (String, String) {
        let (token_a, token_b) = if token_a < token_b {
            (token_a, token_b)
        } else {
            (token_b, token_a)
        };

        (
            format!("{CACHE_KEY_POOLS}:{}", self.symbol),
            format!("{token_a}-{token_b}"),
        )
    }
}

#[async_trait]
impl<P, N> Quoter for UniswapV3<P, N>
where
    P: Provider<N> + Clone + 'static,
    N: Network,
{
    fn quoter_type(&self) -> QuoterType {
        QuoterType::UniswapV3
    }

    #[instrument(name = "UniswapV3::quote_input", skip(self))]
    async fn quote_input(
        &self,
        token_in: Address,
        token_out: Address,
        amount_in: U256,
    ) -> Result<(U256, QuoterData)> {
        let routes = self
            .lookup_and_route(
                self.router.handle_eth(token_in),
                self.router.handle_eth(token_out),
            )
            .await?;

        let (data, amount_out) = futures::future::join_all(routes.into_iter().map(|data| async {
            let quote = self
                .quote_exact_input_single(data.token_in, &data.hops, amount_in)
                .await?;

            Ok::<_, anyhow::Error>((data, quote))
        }))
        .await
        .into_iter()
        .flatten()
        .max_by_key(|(_, amount_out)| *amount_out)
        .ok_or_else(|| anyhow::anyhow!("no results"))?;

        Ok((
            amount_out,
            QuoterData::UniswapV3(data.normalize(token_in, token_out)),
        ))
    }

    #[instrument(name = "UniswapV3::quote_output", skip(self))]
    async fn quote_output(
        &self,
        token_in: Address,
        token_out: Address,
        amount_out: U256,
    ) -> Result<(U256, QuoterData)> {
        let routes = self
            .lookup_and_route(
                self.router.handle_eth(token_in),
                self.router.handle_eth(token_out),
            )
            .await?;

        let (data, amount_in) = futures::future::join_all(routes.into_iter().map(|data| async {
            let quote = self
                .quote_exact_output_single(data.token_in, &data.hops, amount_out)
                .await?;

            Ok::<_, anyhow::Error>((data, quote))
        }))
        .await
        .into_iter()
        .flatten()
        .min_by_key(|(_, amount_in)| *amount_in)
        .ok_or_else(|| anyhow::anyhow!("no results"))?;

        Ok((
            amount_in,
            QuoterData::UniswapV3(data.normalize(token_in, token_out)),
        ))
    }

    fn encode(
        &self,
        data: QuoterData,
        recipient: Address,
        amount_in: U256,
        amount_out_min: U256,
    ) -> Result<Vec<Call>> {
        #[allow(irrefutable_let_patterns)]
        let QuoterData::UniswapV3(data) = data else {
            return Err(anyhow::anyhow!("unsupported data"));
        };

        self.router
            .encode(data, recipient, amount_in, amount_out_min)
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use alloy::{network::AnyNetwork, providers::ProviderBuilder};
    use boltz_cache::MemCache;
    use std::str::FromStr;

    const FACTORY: &str = "0x1F98431c8aD98523631AE4a59f267346ea31F984";
    const QUOTER: &str = "0x61fFE014bA17989E743c5F6cB21bF9697530B21e";
    const ROUTER: &str = "0xa51afafe0263b40edaef0df8781ea9aa03e381a3";

    const WETH: &str = "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1";
    const USDT: &str = "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9";

    fn get_provider() -> impl Provider<AnyNetwork> + Clone + 'static {
        ProviderBuilder::new()
            .network::<AnyNetwork>()
            .connect_http("https://arbitrum-one-rpc.publicnode.com".parse().unwrap())
    }

    #[test]
    fn test_data_reverse_empty_hops() {
        let data = Data {
            token_in: WETH.parse().unwrap(),
            hops: vec![],
        };

        let reversed = data.reverse();
        assert_eq!(reversed, data);
    }

    #[test]
    fn test_data_reverse_single_hop() {
        let token_a: Address = WETH.parse().unwrap();
        let token_b: Address = USDT.parse().unwrap();

        let data = Data {
            token_in: token_a,
            hops: vec![Hop {
                fee: 500,
                token: token_b,
            }],
        };

        let reversed = data.reverse();

        assert_eq!(reversed.token_in, token_b);
        assert_eq!(reversed.hops.len(), 1);
        assert_eq!(reversed.hops[0].fee, 500);
        assert_eq!(reversed.hops[0].token, token_a);
    }

    #[test]
    fn test_data_reverse_multiple_hops() {
        let token_a: Address = "0x0000000000000000000000000000000000000001"
            .parse()
            .unwrap();
        let token_b: Address = "0x0000000000000000000000000000000000000002"
            .parse()
            .unwrap();
        let token_c: Address = "0x0000000000000000000000000000000000000003"
            .parse()
            .unwrap();

        // Path: A --100--> B --500--> C
        let data = Data {
            token_in: token_a,
            hops: vec![
                Hop {
                    fee: 100,
                    token: token_b,
                },
                Hop {
                    fee: 500,
                    token: token_c,
                },
            ],
        };

        let reversed = data.reverse();

        // Expected: C --500--> B --100--> A
        assert_eq!(reversed.token_in, token_c);
        assert_eq!(reversed.hops.len(), 2);
        assert_eq!(reversed.hops[0].fee, 500);
        assert_eq!(reversed.hops[0].token, token_b);
        assert_eq!(reversed.hops[1].fee, 100);
        assert_eq!(reversed.hops[1].token, token_a);
    }

    #[test]
    fn test_data_reverse_twice_is_identity() {
        let token_a: Address = WETH.parse().unwrap();
        let token_b: Address = USDT.parse().unwrap();
        let token_c: Address = "0x0000000000000000000000000000000000000003"
            .parse()
            .unwrap();

        let data = Data {
            token_in: token_a,
            hops: vec![
                Hop {
                    fee: 100,
                    token: token_b,
                },
                Hop {
                    fee: 3000,
                    token: token_c,
                },
            ],
        };

        let reversed_twice = data.reverse().reverse();
        assert_eq!(reversed_twice, data);
    }

    #[tokio::test]
    async fn test_quote_input() {
        let quoter = UniswapV3::new(
            "ARB".to_string(),
            Cache::Memory(MemCache::new()),
            get_provider(),
            WETH.parse().unwrap(),
            Config {
                factory: FACTORY.parse().unwrap(),
                quoter: QUOTER.parse().unwrap(),
                router: ROUTER.parse().unwrap(),
                liquid_tokens: None,
            },
        )
        .await
        .unwrap();

        let (quote, data) = quoter
            .quote_input(
                WETH.parse().unwrap(),
                USDT.parse().unwrap(),
                U256::from_str_radix("100000000000", 10).unwrap(),
            )
            .await
            .unwrap();

        assert!(!quote.is_zero());
        match data {
            QuoterData::UniswapV3(Data { token_in, hops }) => {
                assert_eq!(token_in, Address::from_str(WETH).unwrap());
                assert_eq!(hops.len(), 1);
                assert_eq!(hops[0].token, Address::from_str(USDT).unwrap());
                assert!(hops[0].fee > 0);
            }
        };
    }

    #[tokio::test]
    async fn test_quote_input_select_best() {
        let quoter = UniswapV3::new(
            "ARB".to_string(),
            Cache::Memory(MemCache::new()),
            get_provider(),
            WETH.parse().unwrap(),
            Config {
                factory: FACTORY.parse().unwrap(),
                quoter: QUOTER.parse().unwrap(),
                router: ROUTER.parse().unwrap(),
                liquid_tokens: None,
            },
        )
        .await
        .unwrap();

        let token_in: Address = WETH.parse().unwrap();
        let token_out: Address = USDT.parse().unwrap();
        let amount_in = U256::from_str_radix("100000000000", 10).unwrap();

        let (quote, data) = quoter
            .quote_input(token_in, token_out, amount_in)
            .await
            .unwrap();

        let mut fee_results = Vec::new();
        for fee in FEE_OPTIONS {
            let hops = vec![Hop {
                fee,
                token: token_out,
            }];
            if let Ok(res) = quoter
                .quote_exact_input_single(token_in, &hops, amount_in)
                .await
            {
                fee_results.push((fee, res));
            }
        }

        assert!(!fee_results.is_empty());

        let best_result = fee_results
            .iter()
            .max_by_key(|(_, amount)| *amount)
            .unwrap();

        assert_eq!(best_result.1, quote);
        assert_eq!(
            QuoterData::UniswapV3(Data {
                token_in,
                hops: vec![Hop {
                    fee: best_result.0,
                    token: token_out,
                }],
            }),
            data
        );
    }

    #[tokio::test]
    async fn test_quote_input_fail() {
        let quoter = UniswapV3::new(
            "ARB".to_string(),
            Cache::Memory(MemCache::new()),
            get_provider(),
            WETH.parse().unwrap(),
            Config {
                factory: FACTORY.parse().unwrap(),
                quoter: QUOTER.parse().unwrap(),
                router: ROUTER.parse().unwrap(),
                liquid_tokens: None,
            },
        )
        .await
        .unwrap();

        // Quotes with random addresses should fail
        let err = quoter
            .quote_input(
                "0x000009D2295e689B3497eCcE4A28244c09D26071"
                    .parse()
                    .unwrap(),
                "0x0Dd5C41069d0Cb5085Bf2a1f279b25654704371e"
                    .parse()
                    .unwrap(),
                U256::from_str_radix("123", 10).unwrap(),
            )
            .await
            .err()
            .unwrap();

        assert_eq!(err.to_string(), "no results");
    }

    #[tokio::test]
    async fn test_quote_output() {
        let quoter = UniswapV3::new(
            "ARB".to_string(),
            Cache::Memory(MemCache::new()),
            get_provider(),
            WETH.parse().unwrap(),
            Config {
                factory: FACTORY.parse().unwrap(),
                quoter: QUOTER.parse().unwrap(),
                router: ROUTER.parse().unwrap(),
                liquid_tokens: None,
            },
        )
        .await
        .unwrap();

        let (quote, data) = quoter
            .quote_output(
                WETH.parse().unwrap(),
                USDT.parse().unwrap(),
                U256::from_str_radix("100000000", 10).unwrap(),
            )
            .await
            .unwrap();

        assert!(!quote.is_zero());
        match data {
            QuoterData::UniswapV3(Data { token_in, hops }) => {
                assert_eq!(token_in, Address::from_str(WETH).unwrap());
                assert_eq!(hops.len(), 1);
                assert_eq!(hops[0].token, Address::from_str(USDT).unwrap());
                assert!(hops[0].fee > 0);
            }
        };
    }

    #[tokio::test]
    async fn test_quote_output_select_best() {
        let quoter = UniswapV3::new(
            "ARB".to_string(),
            Cache::Memory(MemCache::new()),
            get_provider(),
            WETH.parse().unwrap(),
            Config {
                factory: FACTORY.parse().unwrap(),
                quoter: QUOTER.parse().unwrap(),
                router: ROUTER.parse().unwrap(),
                liquid_tokens: None,
            },
        )
        .await
        .unwrap();

        let token_in: Address = WETH.parse().unwrap();
        let token_out: Address = USDT.parse().unwrap();
        let amount_out = U256::from_str_radix("100000000", 10).unwrap();

        let (quote, data) = quoter
            .quote_output(token_in, token_out, amount_out)
            .await
            .unwrap();

        let mut fee_results = Vec::new();
        for fee in FEE_OPTIONS {
            let hops = vec![Hop {
                fee,
                token: token_out,
            }];
            if let Ok(res) = quoter
                .quote_exact_output_single(token_in, &hops, amount_out)
                .await
            {
                fee_results.push((fee, res));
            }
        }

        assert!(!fee_results.is_empty());

        let best_result = fee_results
            .iter()
            .min_by_key(|(_, amount)| *amount)
            .unwrap();

        assert_eq!(best_result.1, quote);
        assert_eq!(
            QuoterData::UniswapV3(Data {
                token_in,
                hops: vec![Hop {
                    fee: best_result.0,
                    token: token_out,
                }],
            }),
            data
        );
    }

    #[tokio::test]
    async fn test_quote_output_fail() {
        let quoter = UniswapV3::new(
            "ARB".to_string(),
            Cache::Memory(MemCache::new()),
            get_provider(),
            WETH.parse().unwrap(),
            Config {
                factory: FACTORY.parse().unwrap(),
                quoter: QUOTER.parse().unwrap(),
                router: ROUTER.parse().unwrap(),
                liquid_tokens: None,
            },
        )
        .await
        .unwrap();

        // Quotes with random addresses should fail
        let err = quoter
            .quote_output(
                "0x000009D2295e689B3497eCcE4A28244c09D26071"
                    .parse()
                    .unwrap(),
                "0x0Dd5C41069d0Cb5085Bf2a1f279b25654704371e"
                    .parse()
                    .unwrap(),
                U256::from_str_radix("123", 10).unwrap(),
            )
            .await
            .err()
            .unwrap();

        assert_eq!(err.to_string(), "no results");
    }

    #[tokio::test]
    async fn test_quote_roundtrip_input_then_output() {
        let quoter = UniswapV3::new(
            "ARB".to_string(),
            Cache::Memory(MemCache::new()),
            get_provider(),
            WETH.parse().unwrap(),
            Config {
                factory: FACTORY.parse().unwrap(),
                quoter: QUOTER.parse().unwrap(),
                router: ROUTER.parse().unwrap(),
                liquid_tokens: None,
            },
        )
        .await
        .unwrap();

        let token_in: Address = WETH.parse().unwrap();
        let token_out: Address = USDT.parse().unwrap();
        let original_amount_in = U256::from_str_radix("100000000000", 10).unwrap();

        let (quoted_amount_out, _) = quoter
            .quote_input(token_in, token_out, original_amount_in)
            .await
            .unwrap();

        let (roundtripped_amount_in, _) = quoter
            .quote_output(token_in, token_out, quoted_amount_out)
            .await
            .unwrap();

        // Allow a 1% margin of error due to rounding/slippage
        let diff = if roundtripped_amount_in > original_amount_in {
            roundtripped_amount_in - original_amount_in
        } else {
            original_amount_in - roundtripped_amount_in
        };
        let one_percent = original_amount_in / U256::from(100u64);
        assert!(
            diff <= one_percent,
            "Difference {} exceeds 1% ({}) between roundtripped {} and original {}",
            diff,
            one_percent,
            roundtripped_amount_in,
            original_amount_in
        );
    }

    mod token_pair {
        use super::*;

        #[test]
        fn test_equality_is_symmetric() {
            let token_a: Address = "0x0000000000000000000000000000000000000001"
                .parse()
                .unwrap();
            let token_b: Address = "0x0000000000000000000000000000000000000002"
                .parse()
                .unwrap();

            let pair_ab = TokenPair(token_a, token_b);
            let pair_ba = TokenPair(token_b, token_a);

            assert_eq!(pair_ab, pair_ba);
            assert_eq!(pair_ba, pair_ab);
        }

        #[test]
        fn test_equality_same_order() {
            let token_a: Address = "0x0000000000000000000000000000000000000001"
                .parse()
                .unwrap();
            let token_b: Address = "0x0000000000000000000000000000000000000002"
                .parse()
                .unwrap();

            assert_eq!(TokenPair(token_a, token_b), TokenPair(token_a, token_b));
        }

        #[test]
        fn test_hashmap_lookup_both_directions() {
            let token_a: Address = "0x0000000000000000000000000000000000000001"
                .parse()
                .unwrap();
            let token_b: Address = "0x0000000000000000000000000000000000000002"
                .parse()
                .unwrap();

            let mut map: HashMap<TokenPair, u64> = HashMap::new();
            map.insert(TokenPair(token_a, token_b), 42);

            assert_eq!(map.get(&TokenPair(token_b, token_a)), Some(&42));
            assert_eq!(map.get(&TokenPair(token_a, token_b)), Some(&42));
        }

        #[test]
        fn test_normalized_order() {
            let token_a: Address = "0x0000000000000000000000000000000000000001"
                .parse()
                .unwrap();
            let token_b: Address = "0x0000000000000000000000000000000000000002"
                .parse()
                .unwrap();

            assert_eq!(TokenPair(token_a, token_b).normalized(), (token_a, token_b));
            assert_eq!(TokenPair(token_b, token_a).normalized(), (token_a, token_b));
        }

        #[test]
        fn test_serialize_normalized() {
            let token_a: Address = "0x0000000000000000000000000000000000000001"
                .parse()
                .unwrap();
            let token_b: Address = "0x0000000000000000000000000000000000000002"
                .parse()
                .unwrap();

            let serialized_ab = serde_json::to_string(&TokenPair(token_a, token_b)).unwrap();
            let serialized_ba = serde_json::to_string(&TokenPair(token_b, token_a)).unwrap();

            assert_eq!(serialized_ab, serialized_ba);
        }

        #[test]
        fn test_serialization_roundtrip() {
            let token_a: Address = "0x0000000000000000000000000000000000000001"
                .parse()
                .unwrap();
            let token_b: Address = "0x0000000000000000000000000000000000000002"
                .parse()
                .unwrap();

            let original = TokenPair(token_a, token_b);
            let serialized = serde_json::to_string(&original).unwrap();
            let deserialized: TokenPair = serde_json::from_str(&serialized).unwrap();

            assert_eq!(original, deserialized);
        }
    }
}

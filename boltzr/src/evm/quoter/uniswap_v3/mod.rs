use crate::evm::quoter::uniswap_v3::IQuoterV2::{IQuoterV2Instance, QuoteExactInputSingleParams};
use crate::evm::quoter::{Call, Data as QuoterData, Quoter, QuoterType};
use crate::evm::utils::check_contract_exists;
use alloy::primitives::{Address, U256, Uint};
use alloy::providers::Provider;
use alloy::providers::network::Network;
use alloy::sol;
use anyhow::Result;
use async_trait::async_trait;
use router::Router;
use serde::{Deserialize, Serialize};
use tracing::info;
use tracing::instrument;

mod router;

const FEE_OPTIONS: [u64; 4] = [100, 500, 3_000, 10_000];

sol!(
    #[sol(rpc)]
    "./src/evm/quoter/uniswap_v3/abis/IQuoterV2.sol"
);

#[derive(Deserialize, Serialize, PartialEq, Clone, Debug)]
pub struct Config {
    pub quoter: Address,
    pub router: Address,
}

#[derive(Deserialize, Serialize, Debug, Clone, PartialEq, Eq)]
pub struct Data {
    #[serde(rename = "tokenIn")]
    pub token_in: Address,
    #[serde(rename = "tokenOut")]
    pub token_out: Address,
    pub fee: u64,
}

#[derive(Debug, Clone)]
pub struct UniswapV3<P, N> {
    quoter: IQuoterV2Instance<P, N>,
    router: Router<P, N>,
}

impl<P, N> UniswapV3<P, N>
where
    P: Provider<N> + Clone + 'static,
    N: Network,
{
    pub async fn new(symbol: &str, provider: P, weth: Address, config: Config) -> Result<Self> {
        info!(
            "Using {} quoter {} and router {}",
            symbol,
            config.quoter.to_string(),
            config.router.to_string()
        );

        check_contract_exists(&provider, config.quoter).await?;
        check_contract_exists(&provider, config.router).await?;

        Ok(Self {
            quoter: IQuoterV2::new(config.quoter, provider.clone()),
            router: Router::new(provider, weth, config.router),
        })
    }

    async fn quote_exact_input_single(
        &self,
        token_in: Address,
        token_out: Address,
        amount_in: U256,
        fee: u64,
    ) -> Option<(Uint<24, 1>, U256)> {
        let fee = Uint::from(fee);
        let params = QuoteExactInputSingleParams {
            tokenIn: token_in,
            tokenOut: token_out,
            amountIn: amount_in,
            fee,
            sqrtPriceLimitX96: Uint::from(0),
        };

        self.quoter
            .quoteExactInputSingle(params)
            .call()
            .await
            .ok()
            .map(|result| (fee, result.amountOut))
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

    #[instrument(name = "UniswapV3::quote", skip(self))]
    async fn quote(
        &self,
        token_in: Address,
        token_out: Address,
        amount_in: U256,
    ) -> Result<(U256, QuoterData)> {
        let (fee, amount_out) = futures::future::join_all(FEE_OPTIONS.iter().map(|fee| {
            self.quote_exact_input_single(
                self.router.handle_eth(token_in),
                self.router.handle_eth(token_out),
                amount_in,
                *fee,
            )
        }))
        .await
        .into_iter()
        .flatten()
        .max_by_key(|(_, amount_out)| *amount_out)
        .ok_or_else(|| anyhow::anyhow!("no results"))?;

        Ok((
            amount_out,
            QuoterData::UniswapV3(Data {
                token_in,
                token_out,
                fee: fee.try_into()?,
            }),
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
    use std::str::FromStr;

    const QUOTER: &str = "0xb51727C996c68E60f598a923A5006853Cd2fEB31";
    const ROUTER: &str = "0x244f68E77357f86A8522323EbF80B5FC2f814d3E";

    const WRBTC: &str = "0x542fda317318ebf1d3deaf76e0b632741a7e677d";
    const USDT: &str = "0xaf368c91793cb22739386dfcbbb2f1a9e4bcbebf";

    fn get_provider() -> impl Provider<AnyNetwork> + Clone + 'static {
        ProviderBuilder::new()
            .network::<AnyNetwork>()
            .connect_http("https://public-node.rsk.co".parse().unwrap())
    }

    #[tokio::test]
    async fn test_quote() {
        let quoter = UniswapV3::new(
            "RBTC",
            get_provider(),
            WRBTC.parse().unwrap(),
            Config {
                quoter: QUOTER.parse().unwrap(),
                router: ROUTER.parse().unwrap(),
            },
        )
        .await
        .unwrap();

        let (quote, data) = quoter
            .quote(
                WRBTC.parse().unwrap(),
                USDT.parse().unwrap(),
                U256::from_str_radix("100000000000", 10).unwrap(),
            )
            .await
            .unwrap();

        assert!(!quote.is_zero());
        match data {
            QuoterData::UniswapV3(Data {
                token_in,
                token_out,
                fee,
            }) => {
                assert_eq!(token_in, Address::from_str(WRBTC).unwrap());
                assert_eq!(token_out, Address::from_str(USDT).unwrap());
                assert!(fee > 0);
            }
        };
    }

    #[tokio::test]
    async fn test_quote_select_best() {
        let quoter = UniswapV3::new(
            "RBTC",
            get_provider(),
            WRBTC.parse().unwrap(),
            Config {
                quoter: QUOTER.parse().unwrap(),
                router: ROUTER.parse().unwrap(),
            },
        )
        .await
        .unwrap();

        let token_in: Address = WRBTC.parse().unwrap();
        let token_out: Address = USDT.parse().unwrap();
        let amount_in = U256::from_str_radix("100000000000", 10).unwrap();

        let (quote, data) = quoter.quote(token_in, token_out, amount_in).await.unwrap();

        let mut fee_results = Vec::new();
        for fee in FEE_OPTIONS {
            if let Some(res) = quoter
                .quote_exact_input_single(token_in, token_out, amount_in, fee)
                .await
            {
                fee_results.push(res);
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
                token_out,
                fee: best_result.0.try_into().unwrap(),
            }),
            data
        );
    }

    #[tokio::test]
    async fn test_quote_fail() {
        let quoter = UniswapV3::new(
            "RBTC",
            get_provider(),
            WRBTC.parse().unwrap(),
            Config {
                quoter: QUOTER.parse().unwrap(),
                router: ROUTER.parse().unwrap(),
            },
        )
        .await
        .unwrap();

        // Quotes with random addresses should fail
        let err = quoter
            .quote(
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
}

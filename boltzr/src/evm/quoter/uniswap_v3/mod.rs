use crate::evm::quoter::uniswap_v3::IQuoterV2::{IQuoterV2Instance, QuoteExactInputSingleParams};
use crate::evm::quoter::uniswap_v3::IUniswapV3Factory::IUniswapV3FactoryInstance;
use crate::evm::quoter::{Data as QuoterData, Quoter};
use alloy::primitives::{Address, U256, Uint};
use alloy::providers::Provider;
use alloy::providers::network::Network;
use alloy::sol;
use anyhow::Result;
use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use tracing::info;
use tracing::instrument;

const FEE_OPTIONS: [u64; 4] = [100, 500, 3_000, 10_000];

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
}

#[derive(Serialize, Debug, Clone, PartialEq, Eq)]
pub struct Data {
    pub pool: Address,
}

#[derive(Debug, Clone)]
pub struct UniswapV3<P, N> {
    quoter: IQuoterV2Instance<P, N>,
    factory: IUniswapV3FactoryInstance<P, N>,
}

impl<P, N> UniswapV3<P, N>
where
    P: Provider<N> + Clone + 'static,
    N: Network,
{
    pub async fn new(symbol: &str, provider: P, config: Config) -> Result<Self> {
        info!(
            "Using {} factory {} and quoter {}",
            symbol,
            config.factory.to_string(),
            config.quoter.to_string()
        );

        Self::check_contract_exists(&provider, config.factory).await?;
        Self::check_contract_exists(&provider, config.quoter).await?;

        Ok(Self {
            quoter: IQuoterV2::new(config.quoter, provider.clone()),
            factory: IUniswapV3Factory::new(config.factory, provider),
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

    async fn get_pool_address(
        &self,
        token_in: Address,
        token_out: Address,
        fee: Uint<24, 1>,
    ) -> Result<Address> {
        Ok(self
            .factory
            .getPool(token_in, token_out, fee)
            .call()
            .await?)
    }

    async fn check_contract_exists(provider: &P, address: Address) -> Result<()> {
        let code = provider.get_code_at(address).await?;
        if code.is_empty() {
            return Err(anyhow::anyhow!(
                "no contract at address: {}",
                address.to_string()
            ));
        }

        Ok(())
    }
}

#[async_trait]
impl<P, N> Quoter for UniswapV3<P, N>
where
    P: Provider<N> + Clone + 'static,
    N: Network,
{
    #[instrument(name = "UniswapV3::quote", skip(self))]
    async fn quote(
        &self,
        token_in: Address,
        token_out: Address,
        amount_in: U256,
    ) -> Result<(U256, QuoterData)> {
        let (fee, amount_out) = futures::future::join_all(
            FEE_OPTIONS
                .iter()
                .map(|fee| self.quote_exact_input_single(token_in, token_out, amount_in, *fee)),
        )
        .await
        .into_iter()
        .flatten()
        .max_by_key(|(_, amount_out)| *amount_out)
        .ok_or_else(|| anyhow::anyhow!("no results"))?;

        Ok((
            amount_out,
            QuoterData::UniswapV3(Data {
                pool: self.get_pool_address(token_in, token_out, fee).await?,
            }),
        ))
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use alloy::{network::AnyNetwork, providers::ProviderBuilder};

    const FACTORY: &str = "0xAf37Ec98A00fD63689cF3060Bf3b6784e00CaD82";
    const QUOTER: &str = "0xb51727C996c68E60f598a923A5006853Cd2fEB31";

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
            Config {
                factory: FACTORY.parse().unwrap(),
                quoter: QUOTER.parse().unwrap(),
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
            QuoterData::UniswapV3(Data { pool }) => {
                assert!(!pool.is_zero());
            }
        };
    }

    #[tokio::test]
    async fn test_quote_select_best() {
        let quoter = UniswapV3::new(
            "RBTC",
            get_provider(),
            Config {
                factory: FACTORY.parse().unwrap(),
                quoter: QUOTER.parse().unwrap(),
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

        let max_amount = fee_results.iter().map(|(_, amount)| *amount).max().unwrap();
        assert_eq!(quote, max_amount);

        let best_pool = quoter
            .get_pool_address(
                token_in,
                token_out,
                fee_results
                    .iter()
                    .max_by_key(|(_, amount)| *amount)
                    .unwrap()
                    .0,
            )
            .await
            .unwrap();

        assert_eq!(QuoterData::UniswapV3(Data { pool: best_pool }), data);
    }

    #[tokio::test]
    async fn test_quote_fail() {
        let quoter = UniswapV3::new(
            "RBTC",
            get_provider(),
            Config {
                factory: FACTORY.parse().unwrap(),
                quoter: QUOTER.parse().unwrap(),
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

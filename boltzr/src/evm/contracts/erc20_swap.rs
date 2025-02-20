use crate::evm::contracts::erc20_swap::ERC20Swap::ERC20SwapInstance;
use crate::evm::contracts::SwapContract;
use alloy::primitives::{Address, U256};
use alloy::providers::Provider;
use alloy::sol;
use alloy::sol_types::Eip712Domain;
use tracing::{debug, info};

sol!(
    #[allow(clippy::too_many_arguments)]
    #[sol(rpc)]
    ERC20Swap,
    "../node_modules/boltz-core/dist/out/ERC20Swap.sol/ERC20Swap.json"
);

sol!(
    struct Refund {
        bytes32 preimageHash;
        uint256 amount;
        address tokenAddress;
        address claimAddress;
        uint256 timeout;
    }
);

pub const NAME: &str = "ERC20Swap";

pub struct ERC20SwapContract<P, N> {
    #[allow(dead_code)]
    contract: ERC20SwapInstance<(), P, N>,

    version: u8,
    eip712domain: Eip712Domain,
}

impl<P: Provider<N> + Clone + 'static, N: alloy::providers::network::Network>
    ERC20SwapContract<P, N>
{
    pub async fn new(address: Address, provider: P) -> anyhow::Result<Self> {
        debug!("Using {}: {}", NAME, address.to_string());
        let code = provider.get_code_at(address).await?;
        if code.is_empty() {
            return Err(anyhow::anyhow!(
                "no contract at address: {}",
                address.to_string()
            ));
        }

        let erc20_swap = ERC20Swap::new(address, provider.clone());
        let chain_id = provider.get_chain_id().await?;
        let version = erc20_swap.version().call().await?._0;
        info!(
            "Found {} ({}) version: {}",
            NAME,
            address.to_string(),
            version
        );

        Ok(ERC20SwapContract {
            version,
            contract: erc20_swap,
            eip712domain: Eip712Domain::new(
                Some(NAME.into()),
                Some(version.to_string().into()),
                Some(U256::from(chain_id)),
                Some(address),
                None,
            ),
        })
    }
}

impl<P: Provider<N> + Clone + 'static, N: alloy::providers::network::Network> SwapContract
    for ERC20SwapContract<P, N>
{
    fn address(&self) -> &Address {
        self.contract.address()
    }

    fn version(&self) -> u8 {
        self.version
    }

    fn eip712_domain(&self) -> &Eip712Domain {
        &self.eip712domain
    }
}

#[cfg(test)]
mod test {
    use crate::evm::contracts::erc20_swap::ERC20SwapContract;
    use crate::evm::contracts::SwapContract;
    use crate::evm::refund_signer::test::ERC20_SWAP_ADDRESS;
    use alloy::primitives::Address;

    #[tokio::test]
    async fn test_address() {
        let (_, _, _, provider) = crate::evm::refund_signer::test::setup().await;
        let contract = ERC20SwapContract::new(ERC20_SWAP_ADDRESS.parse().unwrap(), provider)
            .await
            .unwrap();

        assert_eq!(
            contract.address(),
            &ERC20_SWAP_ADDRESS.parse::<Address>().unwrap()
        );
    }

    #[tokio::test]
    async fn test_version() {
        let (_, _, _, provider) = crate::evm::refund_signer::test::setup().await;
        let contract = ERC20SwapContract::new(ERC20_SWAP_ADDRESS.parse().unwrap(), provider)
            .await
            .unwrap();

        assert_eq!(
            contract.version(),
            contract.contract.version().call().await.unwrap()._0
        );
    }

    #[tokio::test]
    async fn test_eip712_domain() {
        let (_, _, _, provider) = crate::evm::refund_signer::test::setup().await;
        let contract = ERC20SwapContract::new(ERC20_SWAP_ADDRESS.parse().unwrap(), provider)
            .await
            .unwrap();

        let hash = contract.eip712_domain().hash_struct();
        assert_eq!(
            hash,
            contract
                .contract
                .DOMAIN_SEPARATOR()
                .call()
                .await
                .unwrap()
                ._0
        );
    }
}

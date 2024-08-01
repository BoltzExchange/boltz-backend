use crate::evm::contracts::ether_swap::EtherSwap::EtherSwapInstance;
use alloy::primitives::{Address, U256};
use alloy::providers::Provider;
use alloy::sol;
use alloy::sol_types::Eip712Domain;
use std::error::Error;
use tracing::{debug, info};

sol!(
    #[allow(clippy::too_many_arguments)]
    #[sol(rpc)]
    EtherSwap,
    "../node_modules/boltz-core/dist/out/EtherSwap.sol/EtherSwap.json"
);

sol!(
    struct Refund {
        bytes32 preimageHash;
        uint256 amount;
        address claimAddress;
        uint256 timeout;
    }
);

pub const NAME: &str = "EtherSwap";

pub struct EtherSwapContract<T, P, N> {
    #[allow(dead_code)]
    contract: EtherSwapInstance<T, P, N>,

    eip712domain: Eip712Domain,
}

impl<
        T: alloy::transports::Transport + Sync + Send + Clone,
        P: Provider<T, N> + Clone + 'static,
        N: alloy::providers::network::Network,
    > EtherSwapContract<T, P, N>
{
    pub async fn new(address: Address, provider: P) -> Result<Self, Box<dyn Error>> {
        info!("Using {}: {}", NAME, address.to_string());

        let ether_swap = EtherSwap::new(address, provider.clone());
        let chain_id = provider.get_chain_id().await?;
        let version = ether_swap.version().call().await?._0;
        debug!("Found {} version: {}", NAME, version);

        Ok(EtherSwapContract {
            contract: ether_swap,
            eip712domain: Eip712Domain::new(
                Some(NAME.into()),
                Some(version.to_string().into()),
                Some(U256::from(chain_id)),
                Some(address),
                None,
            ),
        })
    }

    pub fn eip712_domain(&self) -> &Eip712Domain {
        &self.eip712domain
    }
}

#[cfg(test)]
mod test {
    use crate::evm::contracts::ether_swap::EtherSwapContract;
    use crate::evm::refund_signer::test::ETHER_SWAP_ADDRESS;

    #[tokio::test]
    async fn test_eip712_domain() {
        let (_, _, _, provider) = crate::evm::refund_signer::test::setup().await;
        let contract = EtherSwapContract::new(ETHER_SWAP_ADDRESS.parse().unwrap(), provider)
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

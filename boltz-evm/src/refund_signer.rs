use crate::contracts::erc20_swap::ERC20SwapContract;
use crate::contracts::ether_swap::EtherSwapContract;
use crate::contracts::{SwapContract, erc20_swap, ether_swap};
use crate::{MAX_CONTRACT_VERSION, MIN_CONTRACT_VERSION};
use alloy::primitives::{Address, FixedBytes, Signature, U256};
use alloy::providers::DynProvider;
use alloy::providers::network::AnyNetwork;
use alloy::signers::Signer;
use alloy::signers::local::PrivateKeySigner;
use anyhow::anyhow;
use tracing::info;

pub struct LocalRefundSigner {
    version: u8,

    ether_swap: EtherSwapContract<DynProvider<AnyNetwork>, AnyNetwork>,
    erc20_swap: ERC20SwapContract<DynProvider<AnyNetwork>, AnyNetwork>,
}

impl LocalRefundSigner {
    pub async fn new(
        provider: DynProvider<AnyNetwork>,
        config: &crate::ContractAddresses,
    ) -> anyhow::Result<Self> {
        let (ether_swap, erc20_swap) = match tokio::try_join!(
            EtherSwapContract::new(config.ether_swap.parse()?, provider.clone()),
            ERC20SwapContract::new(config.erc20_swap.parse()?, provider)
        ) {
            Ok(res) => res,
            Err(err) => return Err(anyhow!("{}", err)),
        };

        if ether_swap.version() != erc20_swap.version() {
            return Err(anyhow::anyhow!(
                "EtherSwap and ERC20Swap contracts have different versions"
            ));
        }

        if ether_swap.version() < MIN_CONTRACT_VERSION
            || ether_swap.version() > MAX_CONTRACT_VERSION
        {
            return Err(anyhow::anyhow!(
                "unsupported contract version {}",
                ether_swap.version()
            ));
        }

        Ok(LocalRefundSigner {
            version: ether_swap.version(),
            ether_swap,
            erc20_swap,
        })
    }

    pub fn addresses(&self) -> (&Address, &Address) {
        (self.ether_swap.address(), self.erc20_swap.address())
    }

    pub fn version(&self) -> u8 {
        self.version
    }

    pub async fn sign(
        &self,
        signer: &PrivateKeySigner,
        preimage_hash: FixedBytes<32>,
        amount: U256,
        token_address: Option<Address>,
        timeout: u64,
    ) -> anyhow::Result<Signature> {
        info!(
            "Signing cooperative {} refund",
            if token_address.is_none() {
                ether_swap::NAME
            } else {
                erc20_swap::NAME
            }
        );

        let hash = if let Some(token_address) = token_address {
            self.erc20_swap.refund_hash(
                self.erc20_swap.eip712_domain(),
                preimage_hash,
                amount,
                token_address,
                signer.address(),
                U256::from(timeout),
            )?
        } else {
            self.ether_swap.refund_hash(
                self.ether_swap.eip712_domain(),
                preimage_hash,
                amount,
                Address::ZERO,
                signer.address(),
                U256::from(timeout),
            )?
        };

        Ok(signer.sign_hash(&hash).await?)
    }
}

#[cfg(test)]
pub mod test {
    use crate::ContractAddresses;
    use crate::contracts::SwapContract;
    use crate::contracts::erc20_swap::ERC20Swap;
    use crate::contracts::ether_swap::EtherSwap;
    use crate::refund_signer::LocalRefundSigner;
    use crate::test_utils::{ERC20_SWAP_ADDRESS, ETHER_SWAP_ADDRESS, MNEMONIC, PROVIDER};
    use crate::{Address, English, FixedBytes, MnemonicBuilder, PrivateKeySigner, U256};
    use alloy::providers::network::{AnyNetwork, EthereumWallet, ReceiptResponse};
    use alloy::providers::{DynProvider, Provider, ProviderBuilder};
    use alloy::sol;
    use rand::Rng;
    use serial_test::serial;

    const TOKEN_ADDRESS: &str = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";

    sol!(
        #[allow(clippy::too_many_arguments)]
        #[sol(rpc)]
        ERC20,
        "../node_modules/boltz-core/dist/out/ERC20.sol/ERC20.json"
    );

    #[tokio::test]
    async fn test_addresses() {
        let (_, _, signer, _) = setup().await;

        assert_eq!(
            signer.addresses().0,
            &ETHER_SWAP_ADDRESS.parse::<Address>().unwrap()
        );
        assert_eq!(
            signer.addresses().1,
            &ERC20_SWAP_ADDRESS.parse::<Address>().unwrap()
        );
    }

    #[tokio::test]
    async fn test_version() {
        let (_, _, signer, _) = setup().await;

        assert_eq!(signer.version(), signer.ether_swap.version());
    }

    #[tokio::test]
    #[serial(evm)]
    async fn test_sign_ether_swap() {
        let (claim_keys, _, signer, provider) = setup().await;

        let contract = EtherSwap::new(ETHER_SWAP_ADDRESS.parse().unwrap(), provider.clone());

        let mut preimage_hash = FixedBytes::<32>::default();
        rand::thread_rng().fill(&mut preimage_hash[..]);

        let amount = U256::from(1);
        let timelock: u64 = 1;

        contract
            .lock_0(preimage_hash, claim_keys.address(), U256::from(timelock))
            .value(amount)
            .send()
            .await
            .unwrap()
            .watch()
            .await
            .unwrap();

        let refund_sig = signer
            .sign(&claim_keys, preimage_hash, amount, None, timelock)
            .await
            .unwrap();

        let refund_tx_hash = contract
            .refundCooperative_1(
                preimage_hash,
                amount,
                claim_keys.address(),
                U256::from(timelock),
                refund_sig.v() as u8 + 27,
                refund_sig.r().into(),
                refund_sig.s().into(),
            )
            .send()
            .await
            .unwrap()
            .watch()
            .await
            .unwrap();

        let receipt = provider
            .get_transaction_receipt(refund_tx_hash)
            .await
            .unwrap()
            .unwrap();
        assert!(receipt.status());
    }

    #[tokio::test]
    #[serial(evm)]
    async fn test_sign_erc20_swap() {
        let (claim_keys, refund_keys, signer, provider) = setup().await;

        let token_owner = ERC20::new(
            TOKEN_ADDRESS.parse().unwrap(),
            ProviderBuilder::new()
                .network::<AnyNetwork>()
                .wallet(EthereumWallet::from(claim_keys.clone()))
                .connect_http(PROVIDER.parse().unwrap()),
        );

        let token = ERC20::new(TOKEN_ADDRESS.parse().unwrap(), provider.clone());
        let contract = ERC20Swap::new(ERC20_SWAP_ADDRESS.parse().unwrap(), provider.clone());

        let mut preimage_hash = FixedBytes::<32>::default();
        rand::thread_rng().fill(&mut preimage_hash[..]);

        let amount = U256::from(1);
        let timelock: u64 = 1;

        token_owner
            .transfer(refund_keys.address(), amount)
            .send()
            .await
            .unwrap()
            .watch()
            .await
            .unwrap();

        token
            .approve(*contract.address(), amount)
            .send()
            .await
            .unwrap()
            .watch()
            .await
            .unwrap();

        contract
            .lock_0(
                preimage_hash,
                amount,
                *token.address(),
                claim_keys.address(),
                U256::from(timelock),
            )
            .send()
            .await
            .unwrap()
            .watch()
            .await
            .unwrap();

        let refund_sig = signer
            .sign(
                &claim_keys,
                preimage_hash,
                amount,
                Some(*token.address()),
                1,
            )
            .await
            .unwrap();

        let refund_tx_hash = contract
            .refundCooperative_1(
                preimage_hash,
                amount,
                *token.address(),
                claim_keys.address(),
                U256::from(timelock),
                refund_sig.v() as u8 + 27,
                refund_sig.r().into(),
                refund_sig.s().into(),
            )
            .send()
            .await
            .unwrap()
            .watch()
            .await
            .unwrap();

        let receipt = provider
            .get_transaction_receipt(refund_tx_hash)
            .await
            .unwrap()
            .unwrap();
        assert!(receipt.status());
    }

    pub async fn setup() -> (
        PrivateKeySigner,
        PrivateKeySigner,
        LocalRefundSigner,
        DynProvider<AnyNetwork>,
    ) {
        let mnemonic_builder = MnemonicBuilder::<English>::default().phrase(MNEMONIC);
        let claim_keys = mnemonic_builder.clone().index(0).unwrap().build().unwrap();
        let signer = LocalRefundSigner::new(
            DynProvider::new(
                ProviderBuilder::new()
                    .network::<AnyNetwork>()
                    .wallet(EthereumWallet::from(claim_keys.clone()))
                    .connect_http(PROVIDER.parse().unwrap()),
            ),
            &ContractAddresses {
                ether_swap: ETHER_SWAP_ADDRESS.to_string(),
                erc20_swap: ERC20_SWAP_ADDRESS.to_string(),
            },
        )
        .await
        .unwrap();

        let refund_keys = mnemonic_builder.index(1).unwrap().build().unwrap();
        let provider = DynProvider::new(
            ProviderBuilder::new()
                .network::<AnyNetwork>()
                .wallet(EthereumWallet::from(refund_keys.clone()))
                .connect_http(PROVIDER.parse().unwrap()),
        );

        (claim_keys, refund_keys, signer, provider)
    }
}

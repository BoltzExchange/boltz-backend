use alloy::primitives::{Address, FixedBytes, PrimitiveSignature, U256};
use alloy::providers::fillers::{
    BlobGasFiller, ChainIdFiller, FillProvider, GasFiller, JoinFill, NonceFiller, WalletFiller,
};
use alloy::providers::network::{AnyNetwork, EthereumWallet};
use alloy::providers::RootProvider;
use alloy::signers::local::PrivateKeySigner;
use alloy::signers::Signer;
use alloy::sol_types::SolStruct;
use anyhow::anyhow;
use tracing::info;

use crate::evm::contracts::erc20_swap::ERC20SwapContract;
use crate::evm::contracts::ether_swap::EtherSwapContract;
use crate::evm::contracts::{erc20_swap, ether_swap, SwapContract};

const MIN_VERSION: u8 = 3;
const MAX_VERSION: u8 = 4;

type AlloyTransport = alloy_transport_http::Http<reqwest::Client>;
type AlloyProvider = FillProvider<
    JoinFill<
        JoinFill<
            alloy::providers::Identity,
            JoinFill<GasFiller, JoinFill<BlobGasFiller, JoinFill<NonceFiller, ChainIdFiller>>>,
        >,
        WalletFiller<EthereumWallet>,
    >,
    RootProvider<alloy_transport_http::Http<alloy_transport_http::Client>, AnyNetwork>,
    alloy_transport_http::Http<alloy_transport_http::Client>,
    AnyNetwork,
>;

pub struct LocalRefundSigner {
    version: u8,

    ether_swap: EtherSwapContract<AlloyTransport, AlloyProvider, AnyNetwork>,
    erc20_swap: ERC20SwapContract<AlloyTransport, AlloyProvider, AnyNetwork>,
}

impl LocalRefundSigner {
    pub async fn new(
        provider: AlloyProvider,
        config: &crate::evm::ContractAddresses,
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

        if ether_swap.version() < MIN_VERSION || ether_swap.version() > MAX_VERSION {
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
    ) -> anyhow::Result<PrimitiveSignature> {
        info!(
            "Signing cooperative {} refund",
            if token_address.is_none() {
                ether_swap::NAME
            } else {
                erc20_swap::NAME
            }
        );

        let hash = if let Some(token_address) = token_address {
            erc20_swap::Refund {
                amount,
                preimageHash: preimage_hash,
                tokenAddress: token_address,
                claimAddress: signer.address(),
                timeout: U256::from(timeout),
            }
            .eip712_signing_hash(self.erc20_swap.eip712_domain())
        } else {
            ether_swap::Refund {
                amount,
                preimageHash: preimage_hash,
                claimAddress: signer.address(),
                timeout: U256::from(timeout),
            }
            .eip712_signing_hash(self.ether_swap.eip712_domain())
        };

        Ok(signer.sign_hash(&hash).await?)
    }
}

#[cfg(test)]
pub mod test {
    use crate::evm::contracts::erc20_swap::ERC20Swap;
    use crate::evm::contracts::ether_swap::EtherSwap;
    use crate::evm::contracts::SwapContract;
    use crate::evm::refund_signer::{AlloyProvider, LocalRefundSigner};
    use crate::evm::ContractAddresses;
    use alloy::primitives::{Address, FixedBytes, U256};
    use alloy::providers::network::{AnyNetwork, EthereumWallet, ReceiptResponse};
    use alloy::providers::{Provider, ProviderBuilder};
    use alloy::signers::local::coins_bip39::English;
    use alloy::signers::local::{MnemonicBuilder, PrivateKeySigner};
    use alloy::sol;
    use rand::Rng;
    use serial_test::serial;

    pub const MNEMONIC: &str = "test test test test test test test test test test test junk";
    pub const PROVIDER: &str = "http://127.0.0.1:8545";

    pub const ETHER_SWAP_ADDRESS: &str = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
    pub const ERC20_SWAP_ADDRESS: &str = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
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
            .lock(preimage_hash, claim_keys.address(), U256::from(timelock))
            .value(amount)
            .send()
            .await
            .unwrap()
            .watch()
            .await
            .unwrap();

        let refund_sig = signer
            .sign(&claim_keys, preimage_hash, amount, None, 1)
            .await
            .unwrap();

        let refund_tx_hash = contract
            .refundCooperative(
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
                .with_recommended_fillers()
                .wallet(EthereumWallet::from(claim_keys.clone()))
                .on_http(PROVIDER.parse().unwrap()),
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
            .lock(
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
            .refundCooperative(
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
        AlloyProvider,
    ) {
        let mnemonic_builder = MnemonicBuilder::<English>::default().phrase(MNEMONIC);
        let claim_keys = mnemonic_builder.clone().index(0).unwrap().build().unwrap();
        let signer = LocalRefundSigner::new(
            ProviderBuilder::new()
                .network::<AnyNetwork>()
                .with_recommended_fillers()
                .wallet(EthereumWallet::from(claim_keys.clone()))
                .on_http(PROVIDER.parse().unwrap()),
            &ContractAddresses {
                ether_swap: ETHER_SWAP_ADDRESS.to_string(),
                erc20_swap: ERC20_SWAP_ADDRESS.to_string(),
            },
        )
        .await
        .unwrap();

        let refund_keys = mnemonic_builder.index(1).unwrap().build().unwrap();
        let provider = ProviderBuilder::new()
            .network::<AnyNetwork>()
            .with_recommended_fillers()
            .wallet(EthereumWallet::from(refund_keys.clone()))
            .on_http(PROVIDER.parse().unwrap());

        (claim_keys, refund_keys, signer, provider)
    }
}

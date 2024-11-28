use alloy::primitives::{Address, FixedBytes, U256};
use alloy::providers::fillers::{
    BlobGasFiller, ChainIdFiller, FillProvider, GasFiller, JoinFill, NonceFiller, WalletFiller,
};
use alloy::providers::network::{AnyNetwork, EthereumWallet};
use alloy::providers::{Provider, ProviderBuilder, RootProvider};
use alloy::signers::local::coins_bip39::English;
use alloy::signers::local::{MnemonicBuilder, PrivateKeySigner};
use alloy::signers::{Signature, Signer};
use alloy::sol_types::SolStruct;
use std::error::Error;
use std::fs;
use tracing::{debug, info, instrument};

use crate::evm::contracts::erc20_swap::ERC20SwapContract;
use crate::evm::contracts::ether_swap::EtherSwapContract;
use crate::evm::contracts::{erc20_swap, ether_swap};

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

#[tonic::async_trait]
pub trait RefundSigner {
    async fn sign(
        &self,
        preimage_hash: FixedBytes<32>,
        amount: U256,
        token_address: Option<Address>,
        timeout: u64,
    ) -> Result<Signature, Box<dyn Error>>;
}

pub struct LocalRefundSigner {
    signer: PrivateKeySigner,

    ether_swap: EtherSwapContract<AlloyTransport, AlloyProvider, AnyNetwork>,
    erc20_swap: ERC20SwapContract<AlloyTransport, AlloyProvider, AnyNetwork>,
}

impl LocalRefundSigner {
    pub async fn new_mnemonic_file(
        mnemonic_path: String,
        config: &crate::evm::Config,
    ) -> Result<Self, Box<dyn Error>> {
        let mnemonic = fs::read_to_string(mnemonic_path)?;
        debug!("Read mnemonic");

        let signer = MnemonicBuilder::<English>::default()
            .phrase(mnemonic.strip_suffix("\n").unwrap_or(mnemonic.as_str()))
            .index(0)?
            .build()?;

        Self::new(signer, config).await
    }

    #[instrument(name = "RefundSigner::new", skip_all)]
    pub async fn new(
        signer: PrivateKeySigner,
        config: &crate::evm::Config,
    ) -> Result<Self, Box<dyn Error>> {
        info!("Using address: {}", signer.address());

        let provider = ProviderBuilder::new()
            .network::<AnyNetwork>()
            .with_recommended_fillers()
            .wallet(EthereumWallet::from(signer.clone()))
            .on_http(config.provider_endpoint.parse()?);

        let chain_id = provider.get_chain_id().await?;
        info!("Connected to EVM chain with id: {}", chain_id);

        let (ether_swap, erc20_swap) = tokio::try_join!(
            EtherSwapContract::new(config.ether_swap_address.parse()?, provider.clone()),
            ERC20SwapContract::new(config.erc20_swap_address.parse()?, provider)
        )?;

        Ok(LocalRefundSigner {
            signer,
            ether_swap,
            erc20_swap,
        })
    }
}

#[tonic::async_trait]
impl RefundSigner for LocalRefundSigner {
    async fn sign(
        &self,
        preimage_hash: FixedBytes<32>,
        amount: U256,
        token_address: Option<Address>,
        timeout: u64,
    ) -> Result<Signature, Box<dyn Error>> {
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
                claimAddress: self.signer.address(),
                timeout: U256::from(timeout),
            }
            .eip712_signing_hash(self.erc20_swap.eip712_domain())
        } else {
            ether_swap::Refund {
                amount,
                preimageHash: preimage_hash,
                claimAddress: self.signer.address(),
                timeout: U256::from(timeout),
            }
            .eip712_signing_hash(self.ether_swap.eip712_domain())
        };

        let sig = self.signer.sign_hash(&hash).await?;
        Ok(Signature::from_bytes_and_parity(&sig.as_bytes(), sig.v())?)
    }
}

#[cfg(test)]
pub mod test {
    use crate::evm::contracts::erc20_swap::ERC20Swap;
    use crate::evm::contracts::ether_swap::EtherSwap;
    use crate::evm::refund_signer::{AlloyProvider, LocalRefundSigner, RefundSigner};
    use crate::evm::Config;
    use alloy::primitives::{Address, FixedBytes, U256};
    use alloy::providers::network::{AnyNetwork, EthereumWallet, ReceiptResponse};
    use alloy::providers::{Provider, ProviderBuilder};
    use alloy::signers::local::coins_bip39::English;
    use alloy::signers::local::{MnemonicBuilder, PrivateKeySigner};
    use alloy::sol;
    use rand::Rng;
    use serial_test::serial;
    use std::fs;
    use std::path::Path;

    const MNEMONIC: &str = "test test test test test test test test test test test junk";
    const PROVIDER: &str = "http://127.0.0.1:8545";

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
    async fn test_new_mnemonic_file() {
        let config = Config {
            provider_endpoint: PROVIDER.to_string(),
            ether_swap_address: ETHER_SWAP_ADDRESS.to_string(),
            erc20_swap_address: ERC20_SWAP_ADDRESS.to_string(),
        };
        let expected_address = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
            .parse::<Address>()
            .unwrap();

        let mnemonic_file = Path::new(env!("CARGO_MANIFEST_DIR")).join("mnemonic");
        fs::write(mnemonic_file.clone(), MNEMONIC).unwrap();

        let signer = LocalRefundSigner::new_mnemonic_file(
            mnemonic_file.to_str().unwrap().to_string(),
            &config,
        )
        .await
        .unwrap();
        assert_eq!(signer.signer.address(), expected_address);

        // With a trailing newline
        fs::write(mnemonic_file.clone(), format!("{}\n", MNEMONIC)).unwrap();

        let signer = LocalRefundSigner::new_mnemonic_file(
            mnemonic_file.to_str().unwrap().to_string(),
            &config,
        )
        .await
        .unwrap();
        assert_eq!(signer.signer.address(), expected_address);

        fs::remove_file(mnemonic_file.clone()).unwrap();
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

        let refund_sig = signer.sign(preimage_hash, amount, None, 1).await.unwrap();

        let refund_tx_hash = contract
            .refundCooperative(
                preimage_hash,
                amount,
                claim_keys.address(),
                U256::from(timelock),
                refund_sig.v().y_parity_byte_non_eip155().unwrap(),
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
        assert_eq!(receipt.status(), true);
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
            .sign(preimage_hash, amount, Some(*token.address()), 1)
            .await
            .unwrap();

        let refund_tx_hash = contract
            .refundCooperative(
                preimage_hash,
                amount,
                *token.address(),
                claim_keys.address(),
                U256::from(timelock),
                refund_sig.v().y_parity_byte_non_eip155().unwrap(),
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
        assert_eq!(receipt.status(), true);
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
            claim_keys.clone(),
            &Config {
                provider_endpoint: PROVIDER.to_string(),
                ether_swap_address: ETHER_SWAP_ADDRESS.to_string(),
                erc20_swap_address: ERC20_SWAP_ADDRESS.to_string(),
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

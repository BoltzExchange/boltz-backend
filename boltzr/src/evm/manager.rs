use crate::evm::refund_signer::LocalRefundSigner;
use crate::evm::RefundSigner;
use alloy::network::{AnyNetwork, EthereumWallet};
use alloy::primitives::{Address, FixedBytes, PrimitiveSignature, U256};
use alloy::providers::{Provider, ProviderBuilder};
use alloy::signers::local::coins_bip39::English;
use alloy::signers::local::{MnemonicBuilder, PrivateKeySigner};
use anyhow::anyhow;
use async_trait::async_trait;
use std::collections::HashMap;
use std::fs;
use tracing::{debug, info, instrument, warn};

pub struct Manager {
    signer: PrivateKeySigner,

    address_versions: HashMap<Address, u8>,
    refund_signers: HashMap<u8, LocalRefundSigner>,
}

impl Manager {
    pub async fn from_mnemonic_file(
        mnemonic_path: String,
        config: &crate::evm::Config,
    ) -> anyhow::Result<Self> {
        let mnemonic = fs::read_to_string(mnemonic_path)?;
        debug!("Read mnemonic");

        let signer = MnemonicBuilder::<English>::default()
            .phrase(mnemonic.strip_suffix("\n").unwrap_or(mnemonic.as_str()))
            .index(0)?
            .build()?;

        Self::new(signer, config).await
    }

    #[instrument(name = "Manager::new", skip_all)]
    pub async fn new(
        signer: PrivateKeySigner,
        config: &crate::evm::Config,
    ) -> anyhow::Result<Self> {
        info!("Using address: {}", signer.address());

        let provider = ProviderBuilder::new()
            .network::<AnyNetwork>()
            .with_recommended_fillers()
            .wallet(EthereumWallet::from(signer.clone()))
            .on_http(config.provider_endpoint.parse()?);

        let chain_id = provider.get_chain_id().await?;
        info!("Connected to EVM chain with id: {}", chain_id);

        if config.contracts.is_empty() {
            warn!("No contracts are configured");
        }

        let mut refund_signers = HashMap::new();
        for contracts in &config.contracts {
            let refund_signer = LocalRefundSigner::new(provider.clone(), contracts).await?;
            refund_signers.insert(refund_signer.version(), refund_signer);
        }

        let mut address_versions = HashMap::new();
        refund_signers.iter().for_each(|(version, signer)| {
            let addresses = signer.addresses();
            address_versions.insert(*addresses.0, *version);
            address_versions.insert(*addresses.1, *version);
        });

        Ok(Self {
            signer,
            refund_signers,
            address_versions,
        })
    }
}

#[async_trait]
impl RefundSigner for Manager {
    fn version_for_address(&self, contract_address: &Address) -> anyhow::Result<u8> {
        match self.address_versions.get(contract_address) {
            Some(version) => Ok(*version),
            None => Err(anyhow!(
                "no signer for contract address {}",
                contract_address
            )),
        }
    }

    async fn sign_cooperative_refund(
        &self,
        contract_version: u8,
        preimage_hash: FixedBytes<32>,
        amount: U256,
        token_address: Option<Address>,
        timeout: u64,
    ) -> anyhow::Result<PrimitiveSignature> {
        match self.refund_signers.get(&contract_version) {
            Some(signer) => {
                signer
                    .sign(&self.signer, preimage_hash, amount, token_address, timeout)
                    .await
            }
            None => Err(anyhow!(
                "no refund signers for contracts version {}",
                contract_version
            )),
        }
    }
}

#[cfg(test)]
mod test {
    use crate::evm::manager::Manager;
    use crate::evm::refund_signer::test::{
        ERC20_SWAP_ADDRESS, ETHER_SWAP_ADDRESS, MNEMONIC, PROVIDER,
    };
    use crate::evm::{Config, ContractAddresses, RefundSigner};
    use alloy::primitives::{Address, FixedBytes};
    use alloy::signers::local::coins_bip39::English;
    use alloy::signers::local::MnemonicBuilder;
    use serial_test::serial;
    use std::fs;
    use std::path::Path;

    const EXPECTED_ADDRESS: &str = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

    #[tokio::test]
    #[serial(mnemonic)]
    async fn test_from_mnemonic_file() {
        let mnemonic_file = Path::new(env!("CARGO_MANIFEST_DIR")).join("mnemonic");
        fs::write(mnemonic_file.clone(), MNEMONIC).unwrap();

        let signer = Manager::from_mnemonic_file(
            mnemonic_file.to_str().unwrap().to_string(),
            &Config {
                provider_endpoint: PROVIDER.to_string(),
                contracts: vec![ContractAddresses {
                    ether_swap: ETHER_SWAP_ADDRESS.to_string(),
                    erc20_swap: ERC20_SWAP_ADDRESS.to_string(),
                }],
            },
        )
        .await
        .unwrap();
        assert_eq!(
            signer.signer.address(),
            EXPECTED_ADDRESS.parse::<Address>().unwrap()
        );

        fs::remove_file(mnemonic_file.clone()).unwrap();
    }

    #[tokio::test]
    #[serial(mnemonic)]
    async fn test_from_mnemonic_file_trailing_whitespace() {
        let mnemonic_file = Path::new(env!("CARGO_MANIFEST_DIR")).join("mnemonic");
        fs::write(mnemonic_file.clone(), format!("{}\n", MNEMONIC)).unwrap();

        let signer = Manager::from_mnemonic_file(
            mnemonic_file.to_str().unwrap().to_string(),
            &Config {
                provider_endpoint: PROVIDER.to_string(),
                contracts: vec![ContractAddresses {
                    ether_swap: ETHER_SWAP_ADDRESS.to_string(),
                    erc20_swap: ERC20_SWAP_ADDRESS.to_string(),
                }],
            },
        )
        .await
        .unwrap();
        assert_eq!(
            signer.signer.address(),
            EXPECTED_ADDRESS.parse::<Address>().unwrap()
        );

        fs::remove_file(mnemonic_file.clone()).unwrap();
    }

    #[tokio::test]
    async fn test_version_for_address() {
        let manager = new_manager().await;

        let contract_version = 4;
        assert_eq!(
            manager
                .version_for_address(&ETHER_SWAP_ADDRESS.parse().unwrap())
                .unwrap(),
            contract_version
        );
        assert_eq!(
            manager
                .version_for_address(&ERC20_SWAP_ADDRESS.parse().unwrap())
                .unwrap(),
            contract_version
        );

        assert!(manager.version_for_address(&Address::default()).is_err());
    }

    #[tokio::test]
    async fn test_sign_cooperative_refund() {
        let manager = new_manager().await;

        assert!(manager
            .sign_cooperative_refund(
                4,
                FixedBytes::<32>::default(),
                crate::evm::utils::parse_wei("1").unwrap(),
                None,
                1,
            )
            .await
            .is_ok());

        assert!(manager
            .sign_cooperative_refund(
                0,
                FixedBytes::<32>::default(),
                crate::evm::utils::parse_wei("1").unwrap(),
                None,
                1,
            )
            .await
            .is_err());
    }

    async fn new_manager() -> Manager {
        Manager::new(
            MnemonicBuilder::<English>::default()
                .phrase(MNEMONIC)
                .index(0)
                .unwrap()
                .build()
                .unwrap(),
            &Config {
                provider_endpoint: PROVIDER.to_string(),
                contracts: vec![ContractAddresses {
                    ether_swap: ETHER_SWAP_ADDRESS.to_string(),
                    erc20_swap: ERC20_SWAP_ADDRESS.to_string(),
                }],
            },
        )
        .await
        .unwrap()
    }
}

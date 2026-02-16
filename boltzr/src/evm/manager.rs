use crate::evm::RefundSigner;
use crate::evm::log_layer::LoggingLayer;
use crate::evm::quoter::QuoteAggregator;
use crate::evm::refund_signer::LocalRefundSigner;
use alloy::network::{AnyNetwork, EthereumWallet};
use alloy::primitives::{Address, FixedBytes, Signature, U256};
use alloy::providers::{DynProvider, Provider, ProviderBuilder};
use alloy::pubsub::PubSubConnect;
use alloy::rpc::client::RpcClient;
use alloy::signers::local::coins_bip39::English;
use alloy::signers::local::{MnemonicBuilder, PrivateKeySigner};
use alloy::transports::{
    BoxTransport,
    http::{Http, reqwest::Url},
    layers::FallbackLayer,
    ws::WsConnect,
};
use anyhow::anyhow;
use async_trait::async_trait;
use boltz_cache::Cache;
use std::collections::HashMap;
use tower::ServiceBuilder;
use tracing::{debug, info, instrument, warn};

pub struct Manager {
    pub quote_aggregator: QuoteAggregator,

    /// Map of token symbol to contract address
    pub tokens: HashMap<String, Address>,

    signer: PrivateKeySigner,

    address_versions: HashMap<Address, u8>,
    refund_signers: HashMap<u8, LocalRefundSigner>,
}

impl Manager {
    pub async fn read_mnemonic_file(mnemonic_path: String) -> anyhow::Result<PrivateKeySigner> {
        let mnemonic = tokio::fs::read_to_string(mnemonic_path).await?;
        Ok(MnemonicBuilder::<English>::default()
            .phrase(mnemonic.trim())
            .index(0)?
            .build()?)
    }

    #[instrument(name = "Manager::new", skip(cache, signer, config))]
    pub async fn new(
        symbol: String,
        cache: Cache,
        signer: PrivateKeySigner,
        config: &crate::evm::Config,
    ) -> anyhow::Result<Self> {
        info!("Using address: {}", signer.address());

        let provider = Self::new_provider(symbol.clone(), config, signer.clone()).await?;

        let chain_id = provider.get_chain_id().await?;
        info!("Connected to EVM chain {} with id: {}", symbol, chain_id);

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

        let tokens = config
            .tokens
            .as_ref()
            .map(|tokens| tokens.iter())
            .into_iter()
            .flatten()
            .map(|token| {
                let address = token
                    .contract_address
                    .as_ref()
                    .map(|addr| {
                        addr.parse::<Address>().map_err(|e| {
                            anyhow!("invalid token address for {}: {}", token.symbol, e)
                        })
                    })
                    .transpose()?
                    .unwrap_or(Address::ZERO);
                Ok((token.symbol.clone(), address))
            })
            .collect::<anyhow::Result<HashMap<_, _>>>()?;

        Ok(Self {
            quote_aggregator: QuoteAggregator::new(symbol, cache, provider, config.quoters.clone())
                .await?,
            tokens,
            signer,
            address_versions,
            refund_signers,
        })
    }

    async fn new_provider(
        symbol: String,
        config: &crate::evm::Config,
        signer: PrivateKeySigner,
    ) -> anyhow::Result<DynProvider<AnyNetwork>> {
        let mut configs = config.providers.clone().unwrap_or_default();

        if let Some(endpoint) = config.provider_endpoint.clone() {
            configs.push(crate::evm::ProviderConfig {
                name: endpoint.clone(),
                endpoint,
            });
        }

        if configs.is_empty() {
            return Err(anyhow!("no providers configured"));
        }

        let mut transports: Vec<BoxTransport> = Vec::new();
        for config in configs {
            if config.endpoint.starts_with("ws://") || config.endpoint.starts_with("wss://") {
                debug!(
                    "Connecting to WebSocket provider {}: {}",
                    config.name, config.endpoint
                );
                let ws = WsConnect::new(config.endpoint)
                    .with_retry_interval(std::time::Duration::from_secs(1))
                    .with_max_retries(60);
                let transport = ws.into_service().await?;
                transports.push(BoxTransport::new(transport));
            } else {
                debug!(
                    "Connecting to HTTP provider {}: {}",
                    config.name, config.endpoint
                );
                let http = Http::new(Url::parse(&config.endpoint)?);
                transports.push(BoxTransport::new(http));
            }
        }

        let fallback_layer = FallbackLayer::default();
        let transport = ServiceBuilder::new()
            .layer(LoggingLayer { symbol })
            .layer(fallback_layer)
            .service(transports);
        let client = RpcClient::builder().transport(transport, false);

        Ok(DynProvider::new(
            ProviderBuilder::new()
                .network::<AnyNetwork>()
                .wallet(EthereumWallet::from(signer))
                .connect_client(client),
        ))
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
    ) -> anyhow::Result<Signature> {
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
pub mod test {
    use super::*;
    use crate::evm::manager::Manager;
    use crate::evm::refund_signer::test::{
        ERC20_SWAP_ADDRESS, ETHER_SWAP_ADDRESS, MNEMONIC, PROVIDER,
    };
    use crate::evm::{Config, ContractAddresses, RefundSigner, TokenConfig};
    use alloy::primitives::{Address, FixedBytes};
    use alloy::signers::local::MnemonicBuilder;
    use alloy::signers::local::coins_bip39::English;
    use boltz_cache::MemCache;
    use serial_test::serial;
    use std::fs;
    use std::path::Path;

    const EXPECTED_ADDRESS: &str = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

    #[tokio::test]
    #[serial(mnemonic)]
    async fn test_from_mnemonic_file() {
        let mnemonic_file = Path::new(env!("CARGO_MANIFEST_DIR")).join("mnemonic");
        fs::write(mnemonic_file.clone(), MNEMONIC).unwrap();

        let signer = Manager::read_mnemonic_file(mnemonic_file.to_str().unwrap().to_string())
            .await
            .unwrap();
        assert_eq!(
            signer.address(),
            EXPECTED_ADDRESS.parse::<Address>().unwrap()
        );

        fs::remove_file(mnemonic_file.clone()).unwrap();
    }

    #[tokio::test]
    #[serial(mnemonic)]
    async fn test_from_mnemonic_file_trailing_whitespace() {
        let mnemonic_file = Path::new(env!("CARGO_MANIFEST_DIR")).join("mnemonic");
        fs::write(mnemonic_file.clone(), format!("{MNEMONIC}\n")).unwrap();

        let signer = Manager::read_mnemonic_file(mnemonic_file.to_str().unwrap().to_string())
            .await
            .unwrap();
        assert_eq!(
            signer.address(),
            EXPECTED_ADDRESS.parse::<Address>().unwrap()
        );

        fs::remove_file(mnemonic_file.clone()).unwrap();
    }

    #[tokio::test]
    async fn test_version_for_address() {
        let manager = new_manager().await;

        let contract_version = 5;
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

        assert!(
            manager
                .sign_cooperative_refund(
                    5,
                    FixedBytes::<32>::default(),
                    crate::evm::utils::parse_wei("1").unwrap(),
                    None,
                    1,
                )
                .await
                .is_ok()
        );

        assert!(
            manager
                .sign_cooperative_refund(
                    0,
                    FixedBytes::<32>::default(),
                    crate::evm::utils::parse_wei("1").unwrap(),
                    None,
                    1,
                )
                .await
                .is_err()
        );
    }

    pub async fn new_manager() -> Manager {
        Manager::new(
            "RBTC".to_string(),
            Cache::Memory(MemCache::new()),
            MnemonicBuilder::<English>::default()
                .phrase(MNEMONIC)
                .index(0)
                .unwrap()
                .build()
                .unwrap(),
            &Config {
                provider_endpoint: Some(PROVIDER.to_string()),
                providers: None,
                contracts: vec![ContractAddresses {
                    ether_swap: ETHER_SWAP_ADDRESS.to_string(),
                    erc20_swap: ERC20_SWAP_ADDRESS.to_string(),
                }],
                tokens: None,
                quoters: None,
            },
        )
        .await
        .unwrap()
    }

    #[tokio::test]
    async fn test_tokens_parsing() {
        let token_address = "0x6c84a8f1c29108F47a79964b5Fe888D4f4D0de40";

        let manager = Manager::new(
            "RBTC".to_string(),
            Cache::Memory(MemCache::new()),
            MnemonicBuilder::<English>::default()
                .phrase(MNEMONIC)
                .index(0)
                .unwrap()
                .build()
                .unwrap(),
            &Config {
                provider_endpoint: Some(PROVIDER.to_string()),
                providers: None,
                contracts: vec![ContractAddresses {
                    ether_swap: ETHER_SWAP_ADDRESS.to_string(),
                    erc20_swap: ERC20_SWAP_ADDRESS.to_string(),
                }],
                tokens: Some(vec![TokenConfig {
                    symbol: "TBTC".to_string(),
                    decimals: 18,
                    contract_address: Some(token_address.to_string()),
                }]),
                quoters: None,
            },
        )
        .await
        .unwrap();

        assert_eq!(manager.tokens.len(), 1);
        assert_eq!(
            manager.tokens.get("TBTC").unwrap(),
            &token_address.parse::<Address>().unwrap()
        );
    }

    #[tokio::test]
    async fn test_tokens_parsing_no_address() {
        let manager = Manager::new(
            "RBTC".to_string(),
            Cache::Memory(MemCache::new()),
            MnemonicBuilder::<English>::default()
                .phrase(MNEMONIC)
                .index(0)
                .unwrap()
                .build()
                .unwrap(),
            &Config {
                provider_endpoint: Some(PROVIDER.to_string()),
                providers: None,
                contracts: vec![ContractAddresses {
                    ether_swap: ETHER_SWAP_ADDRESS.to_string(),
                    erc20_swap: ERC20_SWAP_ADDRESS.to_string(),
                }],
                tokens: Some(vec![TokenConfig {
                    symbol: "ETH".to_string(),
                    decimals: 18,
                    contract_address: None,
                }]),
                quoters: None,
            },
        )
        .await
        .unwrap();

        assert_eq!(manager.tokens.len(), 1);
        assert_eq!(manager.tokens.get("ETH").unwrap(), &Address::ZERO);
    }

    #[tokio::test]
    async fn test_tokens_parsing_invalid_address() {
        let result = Manager::new(
            "RBTC".to_string(),
            Cache::Memory(MemCache::new()),
            MnemonicBuilder::<English>::default()
                .phrase(MNEMONIC)
                .index(0)
                .unwrap()
                .build()
                .unwrap(),
            &Config {
                provider_endpoint: Some(PROVIDER.to_string()),
                providers: None,
                contracts: vec![ContractAddresses {
                    ether_swap: ETHER_SWAP_ADDRESS.to_string(),
                    erc20_swap: ERC20_SWAP_ADDRESS.to_string(),
                }],
                tokens: Some(vec![TokenConfig {
                    symbol: "TBTC".to_string(),
                    decimals: 18,
                    contract_address: Some("invalid".to_string()),
                }]),
                quoters: None,
            },
        )
        .await;

        assert!(result.is_err());
        assert!(result.err().unwrap().to_string().contains("TBTC"));
    }
}

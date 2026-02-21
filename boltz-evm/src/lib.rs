use alloy::dyn_abi::Eip712Domain;
pub use alloy::primitives::{Address, FixedBytes, Signature, U256};
pub use alloy::signers::local::coins_bip39::English;
pub use alloy::signers::local::{MnemonicBuilder, PrivateKeySigner};
use anyhow::{Result, bail};
use serde::{Deserialize, Serialize};

pub mod commitment;
pub mod contracts;
pub mod log_layer;
pub mod manager;
pub mod quoter;
pub mod refund;
pub mod refund_signer;
pub mod serde_utils;
pub mod utils;

pub use manager::Manager;
pub use quoter::{Call, Data as QuoterData, QuoteAggregator, QuoterType};

pub const MIN_CONTRACT_VERSION: u8 = 3;
pub const MAX_CONTRACT_VERSION: u8 = 5;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum SwapType {
    Ether,
    ERC20,
}

impl SwapType {
    pub(crate) fn domain_name(self) -> &'static str {
        match self {
            SwapType::Ether => "EtherSwap",
            SwapType::ERC20 => "ERC20Swap",
        }
    }
}

/// Common parameters that describe a swap lockup.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct SwapValues {
    pub swap_type: SwapType,
    pub preimage_hash: FixedBytes<32>,
    pub amount: U256,
    pub token_address: Option<Address>,
    pub claim_address: Address,
    pub timelock: U256,
}

pub(crate) fn ensure_supported_version(version: u8) -> Result<()> {
    if !(MIN_CONTRACT_VERSION..=MAX_CONTRACT_VERSION).contains(&version) {
        bail!("unsupported contract version {}", version);
    }

    Ok(())
}

pub fn eip712_domain(
    swap_type: SwapType,
    contract_version: u8,
    chain_id: u64,
    contract_address: Address,
) -> Result<Eip712Domain> {
    ensure_supported_version(contract_version)?;

    Ok(Eip712Domain::new(
        Some(swap_type.domain_name().into()),
        Some(contract_version.to_string().into()),
        Some(U256::from(chain_id)),
        Some(contract_address),
        None,
    ))
}

fn default_decimals() -> u8 {
    18
}

#[derive(Deserialize, Serialize, PartialEq, Clone, Debug)]
pub struct ProviderConfig {
    pub name: String,
    pub endpoint: String,
}

#[derive(Deserialize, Serialize, PartialEq, Clone, Debug)]
pub struct ContractAddresses {
    #[serde(rename = "etherSwap")]
    pub ether_swap: String,

    #[serde(rename = "erc20Swap")]
    pub erc20_swap: String,
}

#[derive(Deserialize, Serialize, PartialEq, Clone, Debug)]
pub struct TokenConfig {
    pub symbol: String,

    #[serde(default = "default_decimals")]
    pub decimals: u8,

    #[serde(rename = "contractAddress")]
    pub contract_address: Option<String>,
}

#[derive(Deserialize, Serialize, PartialEq, Clone, Debug)]
pub struct Config {
    /// Legacy single RPC endpoint. Both this and [`providers`] are optional,
    /// but at least one must be set. When both are present, this endpoint is
    /// appended to the [`providers`] list and all entries are combined into a
    /// single fallback provider pool (see [`Manager::new_provider`]).
    #[serde(rename = "providerEndpoint")]
    pub provider_endpoint: Option<String>,
    /// Multi-provider configuration for failover / load balancing. Both this
    /// and [`provider_endpoint`] are optional, but at least one must be set.
    /// When both are present, they are merged into a single fallback provider
    /// pool with `provider_endpoint` appended after these entries.
    #[serde(rename = "providers")]
    pub providers: Option<Vec<ProviderConfig>>,

    #[serde(rename = "contracts")]
    pub contracts: Vec<ContractAddresses>,

    #[serde(rename = "tokens")]
    pub tokens: Option<Vec<TokenConfig>>,

    #[serde(rename = "quoters")]
    pub quoters: Option<quoter::Config>,
}

pub trait RefundSigner {
    fn version_for_address(&self, contract_address: &Address) -> anyhow::Result<u8>;

    fn sign_cooperative_refund(
        &self,
        contract_version: u8,
        preimage_hash: FixedBytes<32>,
        amount: U256,
        token_address: Option<Address>,
        timeout: u64,
    ) -> impl std::future::Future<Output = anyhow::Result<Signature>> + Send;
}

#[cfg(any(test, feature = "test-utils"))]
#[doc(hidden)]
pub mod test_utils;

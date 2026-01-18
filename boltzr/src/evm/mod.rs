use alloy::primitives::{Address, FixedBytes, Signature, U256};
use serde::{Deserialize, Serialize};

mod contracts;
mod log_layer;
pub mod manager;
pub mod quoter;
mod refund_signer;
pub mod utils;

#[cfg(test)]
pub use refund_signer::test::{ERC20_SWAP_ADDRESS, ETHER_SWAP_ADDRESS, MNEMONIC, PROVIDER};

fn default_decimals() -> u8 {
    18
}

#[derive(Deserialize, Serialize, PartialEq, Clone, Debug)]
pub struct ProviderConfig {
    pub(crate) name: String,
    pub(crate) endpoint: String,
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
    #[serde(rename = "providerEndpoint")]
    pub(crate) provider_endpoint: Option<String>,
    #[serde(rename = "providers")]
    pub(crate) providers: Option<Vec<ProviderConfig>>,

    #[serde(rename = "contracts")]
    pub(crate) contracts: Vec<ContractAddresses>,

    #[serde(rename = "tokens")]
    pub(crate) tokens: Option<Vec<TokenConfig>>,

    #[serde(rename = "quoters")]
    pub(crate) quoters: Option<quoter::Config>,
}

#[tonic::async_trait]
pub trait RefundSigner {
    fn version_for_address(&self, contract_address: &Address) -> anyhow::Result<u8>;

    async fn sign_cooperative_refund(
        &self,
        contract_version: u8,
        preimage_hash: FixedBytes<32>,
        amount: U256,
        token_address: Option<Address>,
        timeout: u64,
    ) -> anyhow::Result<Signature>;
}

use alloy::primitives::{Address, FixedBytes, PrimitiveSignature, U256};
use serde::{Deserialize, Serialize};

mod contracts;
pub mod manager;
mod refund_signer;
pub mod utils;

#[derive(Deserialize, Serialize, PartialEq, Clone, Debug)]
pub struct ContractAddresses {
    #[serde(rename = "etherSwap")]
    pub ether_swap: String,

    #[serde(rename = "erc20Swap")]
    pub erc20_swap: String,
}

#[derive(Deserialize, Serialize, PartialEq, Clone, Debug)]
pub struct Config {
    #[serde(rename = "providerEndpoint")]
    pub(crate) provider_endpoint: String,

    #[serde(rename = "contracts")]
    pub(crate) contracts: Vec<ContractAddresses>,
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
    ) -> anyhow::Result<PrimitiveSignature>;
}

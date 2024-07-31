use serde::{Deserialize, Serialize};

mod contracts;
pub mod refund_signer;
pub mod utils;

#[derive(Deserialize, Serialize, PartialEq, Clone, Debug)]
pub struct Config {
    #[serde(rename = "providerEndpoint")]
    pub(crate) provider_endpoint: String,

    #[serde(rename = "etherSwapAddress")]
    pub ether_swap_address: String,

    #[serde(rename = "erc20SwapAddress")]
    pub erc20_swap_address: String,
}

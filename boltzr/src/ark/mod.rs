use serde::{Deserialize, Serialize};

mod client;

pub use client::ArkClient;

#[cfg(test)]
pub use client::tests::get_client;

pub const SYMBOL: &str = "ARK";
pub const CHAIN_SYMBOL: &str = "BTC";

#[derive(Deserialize, Serialize, PartialEq, Clone, Debug)]
pub struct Config {
    pub host: String,
    pub port: u16,
}

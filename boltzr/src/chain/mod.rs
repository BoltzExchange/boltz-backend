use crate::chain::utils::{Outpoint, Transaction};
use anyhow::Result;
use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use std::collections::HashSet;

pub mod chain_client;
pub mod elements_client;
mod rpc_client;
pub mod types;
pub mod utils;

#[derive(Deserialize, Serialize, PartialEq, Debug, Clone)]
pub struct Config {
    host: String,
    port: u16,

    cookie: Option<String>,

    user: Option<String>,
    password: Option<String>,
}

#[derive(Deserialize, Serialize, PartialEq, Debug, Clone)]
pub struct LiquidConfig {
    #[serde(flatten)]
    base: Config,

    lowball: Option<Config>,
}

#[async_trait]
pub trait Client {
    fn symbol(&self) -> String;

    async fn connect(&self) -> Result<()>;

    async fn scan_mempool(
        &self,
        relevant_inputs: &HashSet<Outpoint>,
        relevant_outputs: &HashSet<Vec<u8>>,
    ) -> Result<Vec<Transaction>>;

    async fn network_info(&self) -> Result<types::NetworkInfo>;
}
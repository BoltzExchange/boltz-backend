use crate::chain::utils::{Outpoint, Transaction};
use anyhow::Result;
use async_trait::async_trait;
use elements::ZeroConfToolConfig;
use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use tokio::sync::{broadcast, oneshot};

pub mod chain_client;
pub mod elements;
pub mod elements_client;
pub mod mrh_watcher;
mod rpc_client;
pub mod types;
pub mod utils;
pub mod zmq_client;

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

    #[serde(rename = "zeroConfTool")]
    pub zero_conf_tool: Option<ZeroConfToolConfig>,
}

#[async_trait]
pub trait BaseClient {
    fn kind(&self) -> String;
    fn symbol(&self) -> String;

    async fn connect(&mut self) -> Result<()>;
}

#[async_trait]
pub trait Client: BaseClient {
    async fn scan_mempool(
        &self,
        relevant_inputs: &HashSet<Outpoint>,
        relevant_outputs: &HashSet<Vec<u8>>,
    ) -> Result<Vec<Transaction>>;

    async fn network_info(&self) -> Result<types::NetworkInfo>;
    async fn raw_transaction_verbose(&self, tx_id: &str) -> Result<types::RawTransactionVerbose>;
    fn zero_conf_safe(&self, transaction: &Transaction) -> oneshot::Receiver<bool>;

    fn tx_receiver(&self) -> broadcast::Receiver<(Transaction, bool)>;
}

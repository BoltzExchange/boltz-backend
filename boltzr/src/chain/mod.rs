use crate::chain::types::Type;
use crate::chain::utils::{Outpoint, Transaction};
use anyhow::Result;
use async_trait::async_trait;
use elements::ZeroConfToolConfig;
use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use tokio::sync::{broadcast, oneshot};

pub mod bumper;
pub mod chain_client;
pub mod elements;
pub mod elements_client;
mod mempool_client;
pub mod mrh_watcher;
mod rpc_client;
pub mod types;
pub mod utils;
pub mod zmq_client;

#[derive(Deserialize, Serialize, PartialEq, Debug, Clone, Default)]
pub struct Config {
    host: String,
    port: u16,

    cookie: Option<String>,

    user: Option<String>,
    password: Option<String>,

    #[serde(rename = "mempoolSpace")]
    mempool_space: Option<String>,

    wallet: Option<String>,
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
    fn chain_type(&self) -> Type;

    async fn scan_mempool(
        &self,
        relevant_inputs: &HashSet<Outpoint>,
        relevant_outputs: &HashSet<Vec<u8>>,
    ) -> Result<Vec<Transaction>>;

    async fn network_info(&self) -> Result<types::NetworkInfo>;

    /// Fee estimation in sat/vbyte
    async fn estimate_fee(&self) -> Result<f64>;

    async fn raw_transaction(&self, tx_id: &str) -> Result<String>;
    async fn raw_transaction_verbose(&self, tx_id: &str) -> Result<types::RawTransactionVerbose>;

    async fn send_raw_transaction(&self, tx: String) -> Result<String>;

    async fn get_new_address(&self, label: String, address_type: Option<String>) -> Result<String>;

    fn zero_conf_safe(&self, transaction: &Transaction) -> oneshot::Receiver<bool>;

    fn tx_receiver(&self) -> broadcast::Receiver<(Transaction, bool)>;
}

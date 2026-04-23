use crate::chain::types::Type;
use crate::chain::utils::{Block, Outpoint, Transaction};
use crate::db::helpers::chain_tip::ChainTipHelper;
use anyhow::Result;
use async_trait::async_trait;
use boltz_core::Network;
use elements::ZeroConfToolConfig;
use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use std::sync::Arc;
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

#[derive(PartialEq, Debug, Clone)]
pub enum Transactions {
    Single(Transaction),
    Multiple(Arc<Vec<Transaction>>),
}

impl Transactions {
    pub fn iter(&self) -> Box<dyn Iterator<Item = &Transaction> + '_ + Send + Sync> {
        match self {
            Transactions::Single(tx) => Box::new(std::iter::once(tx)),
            Transactions::Multiple(transactions) => Box::new(transactions.iter()),
        }
    }
}

#[derive(Deserialize, Serialize, PartialEq, Debug, Clone, Default)]
pub struct Mempool {
    /// Extra mempool.space URLs; merged with the top-level mempoolSpace
    pub urls: Option<Vec<String>>,

    /// Reject mempool.space fees above max(multiplier * bitcoind_fee, bitcoind_fee + delta)
    #[serde(rename = "maxFeeMultiplier")]
    pub max_fee_multiplier: Option<f64>,

    /// Absolute sat/vbyte delta added to bitcoind's estimate; used alongside the multiplier
    #[serde(rename = "maxFeeDelta")]
    pub max_fee_delta: Option<f64>,

    /// Reject cached mempool.space fees older than this many seconds
    #[serde(rename = "maxAgeSecs")]
    pub max_age_secs: Option<u64>,

    /// Reject mempool.space fees when its reported block tip trails the local node by more than this many blocks
    #[serde(rename = "maxBlockLag")]
    pub max_block_lag: Option<u64>,
}

#[derive(Deserialize, Serialize, PartialEq, Debug, Clone, Default)]
pub struct Config {
    host: String,
    port: u16,

    cookie: Option<String>,

    user: Option<String>,
    password: Option<String>,

    #[serde(rename = "mempoolSpace")]
    mempool_space: Option<String>,

    mempool: Option<Mempool>,

    wallet: Option<String>,

    /// Minimum fee rate in sat/vbyte used as floor for fee estimation
    #[serde(rename = "feeFloor")]
    pub fee_floor: Option<f64>,
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
    fn network(&self) -> Network;

    /// Returns the end height of the rescan
    async fn rescan(
        &self,
        chain_tip_repo: Arc<dyn ChainTipHelper + Send + Sync>,
        start_height: u64,
        relevant_inputs: &HashSet<Outpoint>,
        relevant_outputs: &HashSet<Vec<u8>>,
    ) -> Result<u64>;

    async fn scan_mempool(
        &self,
        relevant_inputs: &HashSet<Outpoint>,
        relevant_outputs: &HashSet<Vec<u8>>,
    ) -> Result<()>;

    async fn network_info(&self) -> Result<types::NetworkInfo>;
    async fn blockchain_info(&self) -> Result<types::BlockchainInfo>;

    /// Fee estimation in sat/vbyte
    async fn estimate_fee(&self) -> Result<f64>;

    async fn raw_transaction(&self, tx_id: &str) -> Result<String>;
    async fn raw_transaction_verbose(&self, tx_id: &str) -> Result<types::RawTransactionVerbose>;

    async fn send_raw_transaction(&self, tx: &str) -> Result<String>;

    async fn list_unspent(&self, wallet: Option<&str>) -> Result<Vec<types::UnspentOutput>>;
    async fn get_new_address(
        &self,
        wallet: Option<&str>,
        label: &str,
        address_type: Option<&str>,
    ) -> Result<String>;
    async fn dump_blinding_key(&self, wallet: Option<&str>, address: &str) -> Result<String>;
    async fn sign_raw_transaction_with_wallet(
        &self,
        wallet: Option<&str>,
        tx: &str,
    ) -> Result<types::SignRawTransactionResponse>;

    #[cfg(test)]
    async fn request_wallet(
        &self,
        wallet: Option<&str>,
        method: &str,
        params: Option<&[types::RpcParam<'_>]>,
    ) -> Result<serde_json::Value>;

    fn zero_conf_safe(&self, transaction: &Transaction) -> oneshot::Receiver<bool>;

    fn tx_receiver(&self) -> broadcast::Receiver<(Transactions, bool)>;
    fn block_receiver(&self) -> broadcast::Receiver<(u64, Block)>;
}

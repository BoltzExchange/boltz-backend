use crate::cache::Cache;
use crate::chain::mempool_client::MempoolSpace;
use crate::chain::rpc_client::RpcClient;
use crate::chain::types::{
    BlockInfo, BlockchainInfo, NetworkInfo, RawMempool, RawTransactionVerbose, RpcParam,
    SignRawTransactionResponse, SmartFeeEstimate, Type, UnspentOutput, ZmqNotification,
};
use crate::chain::utils::{Block, Outpoint, Transaction};
use crate::chain::zmq_client::{ZMQ_BLOCK_CHANNEL_SIZE, ZMQ_TX_CHANNEL_SIZE, ZmqClient};
use crate::chain::{BaseClient, Client, Config, Transactions};
use crate::db::helpers::chain_tip::ChainTipHelper;
use crate::wallet::Network;
use anyhow::anyhow;
use async_trait::async_trait;
use std::collections::HashSet;
use std::sync::Arc;
use tokio::sync::broadcast::{Receiver, Sender, channel, error::RecvError};
use tokio::sync::oneshot;
use tokio_util::sync::CancellationToken;
use tracing::{debug, error, info, trace, warn};

const MAX_WORKERS: usize = 16;
const BATCH_REQUEST_SIZE: usize = 64;
const CHANNEL_BUFFER_SIZE: usize = 1_024;

const BTC_KVB_SAT_VBYTE_FACTOR: u64 = 100_000;

const CACHE_TTL_SECS: u64 = 60 * 60 * 24;

const CACHE_KEY_RAW_TX: &str = "raw_tx";

const DEFAULT_ADDRESS_TYPE: &str = "bech32m";

#[derive(Debug, Clone)]
pub struct ChainClient {
    pub client: RpcClient,
    network: Network,
    cache: Cache,
    client_type: Type,
    fee_floor: f64,
    zmq_client: ZmqClient,
    mempool_space: Option<MempoolSpace>,
    tx_sender: Sender<(Transactions, bool)>,
    block_sender: Sender<(u64, Block)>,
}

impl PartialEq for ChainClient {
    fn eq(&self, other: &Self) -> bool {
        self.client == other.client
            && self.client_type == other.client_type
            && self.network == other.network
    }
}

impl ChainClient {
    const DEFAULT_FEE_FLOOR_BTC: f64 = 0.2;
    const DEFAULT_FEE_FLOOR_ELEMENTS: f64 = 0.1;

    pub fn new(
        cancellation_token: CancellationToken,
        cache: Cache,
        client_type: Type,
        network: Network,
        symbol: String,
        config: Config,
    ) -> anyhow::Result<Self> {
        let default_floor = match client_type {
            Type::Bitcoin => Self::DEFAULT_FEE_FLOOR_BTC,
            Type::Elements => Self::DEFAULT_FEE_FLOOR_ELEMENTS,
        };
        let fee_floor = config.fee_floor.unwrap_or(default_floor);

        let client = Self {
            cache,
            network,
            fee_floor,
            client_type,
            client: RpcClient::new(symbol.clone(), config.clone())?,
            mempool_space: config
                .mempool_space
                .clone()
                .map(|url| MempoolSpace::new(cancellation_token.clone(), symbol.clone(), url)),
            zmq_client: ZmqClient::new(client_type, network, config),
            tx_sender: channel(ZMQ_TX_CHANNEL_SIZE).0,
            block_sender: channel(ZMQ_BLOCK_CHANNEL_SIZE).0,
        };

        {
            let mut block_receiver = client.zmq_client.block_sender.subscribe();
            let mut tx_receiver = client.zmq_client.tx_sender.subscribe();

            let tx_sender = client.tx_sender.clone();

            let symbol = symbol.clone();
            let client = client.clone();
            let cancellation_token = cancellation_token.clone();

            tokio::spawn(async move {
                loop {
                    tokio::select! {
                        tx = tx_receiver.recv() => {
                            match tx {
                                Ok(tx) => {
                                    if tx_sender.receiver_count() == 0 {
                                        continue;
                                    }

                                    let tx_verbose = match client.raw_transaction_verbose(&tx.txid_hex()).await {
                                        Ok(tx_verbose) => tx_verbose,
                                        Err(e) => {
                                            trace!("Failed to get {} transaction: {}", symbol, e);
                                            continue;
                                        }
                                    };

                                    // Confirmed transactions are handled by the block stream
                                    if tx_verbose.is_confirmed() {
                                        continue;
                                    }

                                    if let Err(e) = tx_sender.send((Transactions::Single(tx), false)) {
                                        error!("Failed to forward {} transaction: {}", symbol, e);
                                    }
                                }
                                Err(RecvError::Closed) => break,
                                Err(RecvError::Lagged(skipped)) => {
                                    warn!("{} transaction stream lagged behind by {} messages", symbol, skipped);
                                }
                            }
                        },
                        block = block_receiver.recv() => {
                            match block {
                                Ok(block) => {
                                    if tx_sender.receiver_count() == 0 {
                                        continue;
                                    }

                                    if let Err(e) = tx_sender.send((Transactions::Multiple(block.transactions), true)) {
                                        error!("Failed to forward {} block transaction: {}", symbol, e);
                                    }
                                }
                                Err(RecvError::Closed) => break,
                                Err(RecvError::Lagged(skipped)) => {
                                    warn!("{} block transaction stream lagged behind by {} messages", symbol, skipped);
                                }
                            }
                        },
                        _ = cancellation_token.cancelled() => break,
                    }
                }
            });
        }

        {
            let mut block_receiver = client.zmq_client.block_sender.subscribe();
            let block_sender = client.block_sender.clone();

            let client = client.clone();

            tokio::spawn(async move {
                loop {
                    tokio::select! {
                        block = block_receiver.recv() => {
                            match block {
                                Ok(block) => {
                                    if block_sender.receiver_count() == 0 {
                                        continue;
                                    }

                                    let block_hash = alloy::hex::encode(block.block_hash());
                                    let block_info = match client.get_block_info(&block_hash).await {
                                        Ok(block_info) => block_info,
                                        Err(e) => {
                                            error!("Failed to get {} block {}: {}", symbol, block_hash, e);
                                            continue;
                                        }
                                    };

                                    if let Err(e) = block_sender.send((block_info.height, block)) {
                                        error!("Failed to forward {} block: {}", symbol, e);
                                    }
                                }
                                Err(RecvError::Closed) => break,
                                Err(RecvError::Lagged(skipped)) => {
                                    warn!("{} block stream lagged behind by {} messages", symbol, skipped);
                                }
                            }
                        },
                        _ = cancellation_token.cancelled() => break,
                    }
                }
            });
        }

        Ok(client)
    }

    async fn get_block_info(&self, block_hash: &str) -> anyhow::Result<BlockInfo> {
        self.client
            .request::<BlockInfo>(
                "getblock",
                Some(&[RpcParam::Str(block_hash), RpcParam::Int(1)]),
            )
            .await
    }

    fn round_to_3_decimal_places(x: f64) -> f64 {
        let factor = 1000.0; // 10^3 for 3 decimal places
        (x * factor).round() / factor
    }

    async fn estimate_fee_raw(&self, floor: f64) -> anyhow::Result<f64> {
        if let Some(mempool_space) = &self.mempool_space {
            match mempool_space.get_fees() {
                Some(fee) => return Ok(fee),
                None => debug!("No fees from {} mempool.space", self.symbol()),
            }
        }

        match self
            .client
            .request::<SmartFeeEstimate>("estimatesmartfee", Some(&[RpcParam::Int(1)]))
            .await
            .map(|fee| fee.feerate)
        {
            Ok(fee) => Ok(Self::round_to_3_decimal_places(
                fee * BTC_KVB_SAT_VBYTE_FACTOR as f64,
            )),
            // On regtest estimatesmartfee can fail
            Err(_) => Ok(floor),
        }
    }

    fn cache_key_raw_tx<'a>(&self, tx_id: &'a str) -> (String, &'a str) {
        (format!("{CACHE_KEY_RAW_TX}:{}", self.symbol()), tx_id)
    }

    fn is_relevant_tx(
        relevant_inputs: &HashSet<Outpoint>,
        relevant_outputs: &HashSet<Vec<u8>>,
        tx: &Transaction,
    ) -> bool {
        tx.input_outpoints()
            .iter()
            .any(|input| relevant_inputs.contains(input))
            || tx
                .output_script_pubkeys()
                .iter()
                .any(|output| relevant_outputs.contains(output))
    }
}

#[async_trait]
impl BaseClient for ChainClient {
    fn kind(&self) -> String {
        "Chain client".to_string()
    }

    fn symbol(&self) -> String {
        self.client.symbol.clone()
    }

    async fn connect(&mut self) -> anyhow::Result<()> {
        let info = self.network_info().await?;
        let notifications = self
            .client
            .request::<Vec<ZmqNotification>>("getzmqnotifications", None)
            .await?;
        self.zmq_client.connect(&notifications).await?;

        if let Some(mempool_space) = &self.mempool_space {
            mempool_space.connect().await?;
        }

        info!(
            "Connected to {} chain client: {}",
            self.client.symbol, info.subversion
        );

        Ok(())
    }
}

#[async_trait]
impl Client for ChainClient {
    fn chain_type(&self) -> Type {
        self.client_type
    }

    fn network(&self) -> Network {
        self.network
    }

    async fn rescan(
        &self,
        chain_tip_repo: Arc<dyn ChainTipHelper + Send + Sync>,
        start_height: u64,
        relevant_inputs: &HashSet<Outpoint>,
        relevant_outputs: &HashSet<Vec<u8>>,
    ) -> anyhow::Result<u64> {
        info!(
            "Rescanning {} chain from height {}",
            self.client.symbol, start_height
        );

        let end_height = match self.blockchain_info().await {
            Ok(info) => info.blocks,
            Err(err) => {
                return Err(anyhow!("failed to get blockchain info: {}", err));
            }
        };

        if start_height > end_height {
            return Err(anyhow!("start height is greater than end height"));
        }

        let self_cp = self.clone();
        let (tx_blockhash, mut rx_blockhash) = tokio::sync::mpsc::channel(CHANNEL_BUFFER_SIZE);
        tokio::spawn(async move {
            for height in (start_height..=end_height).step_by(BATCH_REQUEST_SIZE) {
                let heights = (height
                    ..=std::cmp::min(height + BATCH_REQUEST_SIZE as u64 - 1, end_height))
                    .collect::<Vec<_>>();

                let block_hashes = match self_cp
                    .client
                    .request_batch::<String>(
                        "getblockhash",
                        &heights
                            .iter()
                            .map(|height| vec![RpcParam::Int(*height as i64)])
                            .collect::<Vec<_>>(),
                    )
                    .await
                {
                    Ok(block_hashes) => block_hashes,
                    Err(err) => {
                        error!("Failed to get block hashes: {}", err);
                        break;
                    }
                };

                let result = heights
                    .into_iter()
                    .zip(block_hashes)
                    .filter_map(|(height, block_hash_result)| match block_hash_result {
                        Ok(hash) => Some((height, hash)),
                        Err(err) => {
                            error!("Failed to get block hash for height {}: {}", height, err);
                            None
                        }
                    })
                    .collect::<Vec<_>>();

                if let Err(err) = tx_blockhash.send(result).await {
                    error!("Failed to send block hashes to channel: {}", err);
                    break;
                }
            }
        });

        let self_cp = self.clone();
        let (tx_block, mut rx_block) = tokio::sync::mpsc::channel(CHANNEL_BUFFER_SIZE);
        tokio::spawn(async move {
            loop {
                let blockhashes = match rx_blockhash.recv().await {
                    Some(blockhashes) => blockhashes,
                    None => break,
                };

                let blocks = match self_cp
                    .client
                    .request_batch::<String>(
                        "getblock",
                        &blockhashes
                            .iter()
                            .map(|(_, hash)| vec![RpcParam::Str(hash), RpcParam::Int(0)])
                            .collect::<Vec<_>>(),
                    )
                    .await
                {
                    Ok(blocks) => blocks,
                    Err(err) => {
                        error!("Failed to get blocks: {}", err);
                        break;
                    }
                };

                for ((height, _), block) in blockhashes.into_iter().zip(blocks) {
                    match block {
                        Ok(block) => {
                            if let Err(err) = tx_block.send((height, block)).await {
                                error!("Failed to send block to channel: {}", err);
                                break;
                            }
                        }
                        Err(err) => {
                            error!("Failed to get block: {}", err);
                        }
                    }
                }
            }
        });

        let mut relevant_tx_count: u64 = 0;

        loop {
            let (height, block) = match rx_block.recv().await {
                Some(block) => block,
                None => break,
            };

            let block = match Block::parse_hex(&self_cp.client_type, &block) {
                Ok(block) => block,
                Err(err) => {
                    error!("Failed to parse block {}: {}", height, err);
                    continue;
                }
            };

            trace!(
                "Rescanning {} block {} chain with {} transactions",
                self.client.symbol,
                height,
                block.transactions.len()
            );

            for tx in block.transactions.iter() {
                if Self::is_relevant_tx(relevant_inputs, relevant_outputs, tx) {
                    relevant_tx_count += 1;
                    if let Err(err) = self
                        .tx_sender
                        .send((Transactions::Single(tx.clone()), true))
                    {
                        error!("Failed to send relevant transaction to channel: {}", err);
                        break;
                    }
                }
            }
        }

        chain_tip_repo.set_height(&self.symbol(), end_height as i32)?;
        info!(
            "Rescanned {} chain from height {} to {} and found {} relevant transactions",
            self.client.symbol, start_height, end_height, relevant_tx_count
        );

        Ok(end_height)
    }

    async fn scan_mempool(
        &self,
        relevant_inputs: &HashSet<Outpoint>,
        relevant_outputs: &HashSet<Vec<u8>>,
    ) -> anyhow::Result<()> {
        info!("Scanning mempool of {} chain", self.client.symbol);

        let mempool = self
            .client
            .request::<RawMempool>("getrawmempool", None)
            .await?;
        let mempool_size = mempool.len();

        if mempool_size == 0 {
            debug!("Mempool of {} chain is empty", self.client.symbol);
            return Ok(());
        }

        let (tx, mut rx) = tokio::sync::mpsc::channel(CHANNEL_BUFFER_SIZE);

        let fetcher_threads =
            std::cmp::min(crate::utils::available_parallelism() / 2, MAX_WORKERS).max(1);
        debug!(
            "Scanning {} mempool transactions of {} chain with {} workers",
            mempool_size, self.client.symbol, fetcher_threads
        );
        for chunk in mempool.chunks(std::cmp::max(mempool_size / fetcher_threads, 1)) {
            let tx_cp = tx.clone();
            let self_cp = self.clone();
            let chunk = chunk.to_vec();

            tokio::spawn(async move {
                let tx_chunks = chunk.chunks(BATCH_REQUEST_SIZE);
                for tx_ids in tx_chunks {
                    let txs_hex = match self_cp
                        .client
                        .request_batch::<String>(
                            "getrawtransaction",
                            &tx_ids
                                .iter()
                                .map(|tx_id| vec![RpcParam::Str(tx_id)])
                                .collect::<Vec<_>>(),
                        )
                        .await
                    {
                        Ok(txs) => txs,

                        // When the entire request fails, something is terribly wrong
                        Err(err) => {
                            error!(
                                "Could not fetch {} mempool transactions: {}",
                                self_cp.symbol(),
                                err
                            );
                            break;
                        }
                    };

                    for tx_hex in txs_hex {
                        match tx_hex {
                            Ok(tx_hex) => {
                                if let Err(err) = tx_cp.send(tx_hex).await {
                                    error!("Could not send to mempool channel: {}", err);
                                    break;
                                }
                            }

                            // When a single transaction request fails, it's fine.
                            // Can happen if the transaction was evicted from the mempool
                            Err(err) => {
                                trace!(
                                    "Could not fetch single {} mempool transaction: {}",
                                    self_cp.symbol(),
                                    err
                                );
                            }
                        };
                    }
                }
            });
        }
        drop(tx);

        let mut relevant_tx_count: u64 = 0;

        let mut i = 0;
        loop {
            let tx_hex = match rx.recv().await {
                Some(tx_hex) => tx_hex,
                None => break,
            };
            let tx = Transaction::parse_hex(&self.client_type, &tx_hex)?;
            if Self::is_relevant_tx(relevant_inputs, relevant_outputs, &tx) {
                relevant_tx_count += 1;
                if let Err(err) = self.tx_sender.send((Transactions::Single(tx), false)) {
                    error!(
                        "Failed to send relevant mempool transaction to channel: {}",
                        err
                    );
                    break;
                }
            }

            i += 1;
            if i % 1_000 == 0 {
                trace!(
                    "Scanned {}/{} transactions of {} chain mempool",
                    i, mempool_size, self.client.symbol
                );
            }
        }

        debug!(
            "Scanned {} mempool transactions of {} chain",
            mempool_size, self.client.symbol
        );

        if relevant_tx_count > 0 {
            info!(
                "Found {} relevant transactions in mempool of {} chain",
                relevant_tx_count, self.client.symbol
            );
        }

        Ok(())
    }

    async fn network_info(&self) -> anyhow::Result<NetworkInfo> {
        self.client.request("getnetworkinfo", None).await
    }

    async fn blockchain_info(&self) -> anyhow::Result<BlockchainInfo> {
        self.client.request("getblockchaininfo", None).await
    }

    async fn estimate_fee(&self) -> anyhow::Result<f64> {
        Ok(f64::max(
            self.estimate_fee_raw(self.fee_floor).await?,
            self.fee_floor,
        ))
    }

    async fn raw_transaction(&self, tx_id: &str) -> anyhow::Result<String> {
        let (key, field) = self.cache_key_raw_tx(tx_id);
        if let Some(tx) = self.cache.get(&key, field).await? {
            return Ok(tx);
        }

        let res = self
            .client
            .request::<String>("getrawtransaction", Some(&[RpcParam::Str(tx_id)]))
            .await;

        if let Ok(tx) = res {
            self.cache
                .set(&key, field, &tx, Some(CACHE_TTL_SECS))
                .await?;
            Ok(tx)
        } else {
            res
        }
    }

    async fn raw_transaction_verbose(&self, tx_id: &str) -> anyhow::Result<RawTransactionVerbose> {
        self.client
            .request::<RawTransactionVerbose>(
                "getrawtransaction",
                Some(&[RpcParam::Str(tx_id), RpcParam::Int(1)]),
            )
            .await
    }

    async fn send_raw_transaction(&self, tx: &str) -> anyhow::Result<String> {
        self.client
            .request::<String>("sendrawtransaction", Some(&[RpcParam::Str(tx)]))
            .await
    }

    async fn list_unspent(&self, wallet: Option<&str>) -> anyhow::Result<Vec<UnspentOutput>> {
        self.client
            .request_wallet::<Vec<UnspentOutput>>(wallet, "listunspent", None)
            .await
    }

    async fn get_new_address(
        &self,
        wallet: Option<&str>,
        label: &str,
        address_type: Option<&str>,
    ) -> anyhow::Result<String> {
        self.client
            .request_wallet::<String>(
                wallet,
                "getnewaddress",
                Some(&[
                    RpcParam::Str(label),
                    RpcParam::Str(address_type.unwrap_or(DEFAULT_ADDRESS_TYPE)),
                ]),
            )
            .await
    }

    async fn dump_blinding_key(
        &self,
        wallet: Option<&str>,
        address: &str,
    ) -> anyhow::Result<String> {
        if self.client_type != Type::Elements {
            return Err(anyhow::anyhow!(
                "dump blinding key is not supported for {} chain",
                self.client.symbol
            ));
        }

        self.client
            .request_wallet::<String>(wallet, "dumpblindingkey", Some(&[RpcParam::Str(address)]))
            .await
    }

    async fn sign_raw_transaction_with_wallet(
        &self,
        wallet: Option<&str>,
        tx: &str,
    ) -> anyhow::Result<SignRawTransactionResponse> {
        self.client
            .request_wallet::<SignRawTransactionResponse>(
                wallet,
                "signrawtransactionwithwallet",
                Some(&[RpcParam::Str(tx)]),
            )
            .await
    }

    #[cfg(test)]
    async fn request_wallet(
        &self,
        wallet: Option<&str>,
        method: &str,
        params: Option<&[RpcParam<'_>]>,
    ) -> anyhow::Result<serde_json::Value> {
        self.client.request_wallet(wallet, method, params).await
    }

    fn zero_conf_safe(&self, _transaction: &Transaction) -> oneshot::Receiver<bool> {
        let (tx, rx) = oneshot::channel();
        tx.send(false).unwrap();
        rx
    }

    fn tx_receiver(&self) -> Receiver<(Transactions, bool)> {
        self.tx_sender.subscribe()
    }

    fn block_receiver(&self) -> Receiver<(u64, Block)> {
        self.block_sender.subscribe()
    }
}

#[cfg(test)]
pub mod test {
    use super::*;
    use crate::cache;
    use crate::chain::chain_client::ChainClient;
    use crate::chain::types::{RawMempool, RpcParam, Type};
    use crate::chain::utils::Transaction;
    use crate::chain::{BaseClient, Client, Config};
    use mockall::mock;
    use rstest::rstest;
    use serde::Deserialize;
    use serial_test::serial;
    use std::collections::HashSet;

    const PORT: u16 = 18_443;

    mock! {
        ChainTipHelper {}

        impl crate::db::helpers::chain_tip::ChainTipHelper for ChainTipHelper {
            fn get_all(&self) -> crate::db::helpers::QueryResponse<Vec<crate::db::models::ChainTip>>;
            fn set_height(&self, symbol: &str, height: i32) -> crate::db::helpers::QueryResponse<usize>;
        }
    }

    #[derive(Deserialize, Debug)]
    struct AddressInfo {
        labels: Vec<String>,
    }

    pub async fn get_client() -> ChainClient {
        ChainClient::new(
            CancellationToken::new(),
            cache::Cache::Memory(cache::MemCache::new()),
            Type::Bitcoin,
            Network::Regtest,
            "BTC".to_string(),
            Config {
                host: "127.0.0.1".to_string(),
                port: PORT,
                user: Some("backend".to_string()),
                password: Some("DPGn0yNNWN5YvBBeRX2kEcJBwv8zwrw9Mw9nkIl05o4".to_string()),
                wallet: Some("regtest".to_string()),
                ..Default::default()
            },
        )
        .unwrap()
    }

    pub async fn generate_block(client: &ChainClient) {
        client
            .client
            .request_wallet::<serde_json::Value>(
                None,
                "generatetoaddress",
                Some(&[
                    RpcParam::Int(1),
                    RpcParam::Str(
                        &client
                            .client
                            .request_wallet::<String>(None, "getnewaddress", None)
                            .await
                            .unwrap(),
                    ),
                ]),
            )
            .await
            .unwrap();
    }

    pub async fn send_transaction(client: &ChainClient) -> Transaction {
        let tx_id = client
            .client
            .request_wallet::<String>(
                None,
                "sendtoaddress",
                Some(&[
                    RpcParam::Str(
                        &client
                            .client
                            .request_wallet::<String>(None, "getnewaddress", None)
                            .await
                            .unwrap(),
                    ),
                    RpcParam::Float(0.21),
                ]),
            )
            .await
            .unwrap();

        Transaction::parse_hex(
            &Type::Bitcoin,
            &client
                .client
                .request::<String>("getrawtransaction", Some(&[RpcParam::Str(&tx_id)]))
                .await
                .unwrap(),
        )
        .unwrap()
    }

    async fn get_address_info(client: &ChainClient, address: &str) -> AddressInfo {
        client
            .client
            .request_wallet::<AddressInfo>(None, "getaddressinfo", Some(&[RpcParam::Str(address)]))
            .await
            .unwrap()
    }

    async fn get_block_count(client: &ChainClient) -> u64 {
        client
            .client
            .request::<u64>("getblockcount", None)
            .await
            .unwrap()
    }

    #[tokio::test]
    async fn test_chain_type() {
        let client = get_client().await;
        assert_eq!(client.chain_type(), Type::Bitcoin);
    }

    #[tokio::test]
    async fn test_connect() {
        let mut client = get_client().await;

        client.connect().await.unwrap();

        assert_ne!(
            client.network_info().await.unwrap().subversion,
            "".to_string()
        );
    }

    #[tokio::test]
    #[serial(BTC)]
    async fn scan_mempool_empty() {
        let client = get_client().await;

        generate_block(&client).await;

        let mempool = client
            .client
            .request::<RawMempool>("getrawmempool", None)
            .await
            .unwrap();
        assert!(mempool.is_empty());

        let mut tx_receiver = client.tx_receiver();

        client
            .scan_mempool(&HashSet::new(), &HashSet::new())
            .await
            .unwrap();

        assert!(tx_receiver.try_recv().is_err());
    }

    #[tokio::test]
    #[serial(BTC)]
    async fn scan_mempool_relevant_input() {
        let client = get_client().await;
        let tx = send_transaction(&client).await;

        let mut inputs = HashSet::new();
        inputs.insert(tx.input_outpoints()[0].clone());

        let mut tx_receiver = client.tx_receiver();

        client.scan_mempool(&inputs, &HashSet::new()).await.unwrap();

        let (received_tx, _) = tx_receiver.try_recv().unwrap();
        let Transactions::Single(received_tx) = received_tx else {
            panic!("expected single transaction");
        };
        assert_eq!(received_tx.txid_hex(), tx.txid_hex());

        generate_block(&client).await;
    }

    #[tokio::test]
    #[serial(BTC)]
    async fn scan_mempool_relevant_output() {
        let client = get_client().await;
        let tx = send_transaction(&client).await;

        let mut outputs = HashSet::new();
        outputs.insert(tx.output_script_pubkeys()[0].clone());

        let mut tx_receiver = client.tx_receiver();

        client
            .scan_mempool(&HashSet::new(), &outputs)
            .await
            .unwrap();

        let (received_tx, _) = tx_receiver.try_recv().unwrap();
        let Transactions::Single(received_tx) = received_tx else {
            panic!("expected single transaction");
        };
        assert_eq!(received_tx.txid_hex(), tx.txid_hex());

        generate_block(&client).await;
    }

    #[tokio::test]
    async fn test_get_fees_smart_fee() {
        let client = get_client().await;
        let fees = client.estimate_fee().await.unwrap();
        assert!(fees >= ChainClient::DEFAULT_FEE_FLOOR_BTC);
    }

    #[tokio::test]
    #[serial(BTC)]
    async fn raw_transaction() {
        let client = get_client().await;
        let tx = send_transaction(&client).await;

        let tx_id = tx.txid_hex();

        let raw_tx = client.raw_transaction(&tx_id).await.unwrap();
        assert_eq!(raw_tx, alloy::hex::encode(tx.serialize()));

        let (key, field) = client.cache_key_raw_tx(&tx_id);
        let cached_tx = client.cache.get(&key, field).await.unwrap();
        assert_eq!(cached_tx, Some(raw_tx));
    }

    #[tokio::test]
    #[serial(BTC)]
    async fn raw_transaction_verbose_unconfirmed() {
        let client = get_client().await;

        let tx = send_transaction(&client).await;
        let verbose = client
            .raw_transaction_verbose(&tx.txid_hex())
            .await
            .unwrap();

        assert!(!verbose.is_confirmed());
    }

    #[tokio::test]
    #[serial(BTC)]
    async fn raw_transaction_verbose_confirmed() {
        let client = get_client().await;

        let tx = send_transaction(&client).await;
        generate_block(&client).await;

        let verbose = client
            .raw_transaction_verbose(&tx.txid_hex())
            .await
            .unwrap();

        assert!(verbose.is_confirmed());
    }

    #[tokio::test]
    #[serial(BTC)]
    async fn test_send_raw_transaction() {
        let client = get_client().await;
        let tx = send_transaction(&client).await;

        let tx_id = client
            .send_raw_transaction(&alloy::hex::encode(tx.serialize()))
            .await
            .unwrap();

        assert_eq!(tx_id, tx.txid_hex());
        generate_block(&client).await;
    }

    #[tokio::test]
    #[serial(BTC)]
    async fn test_get_new_address_label() {
        let client = get_client().await;

        let label = "some tx";
        let address = client.get_new_address(None, label, None).await.unwrap();

        let info = get_address_info(&client, &address).await;
        assert_eq!(info.labels, vec![label.to_string()]);
    }

    #[rstest]
    #[case(None, "bcrt1p")]
    #[case(Some("bech32m".to_string()), "bcrt1p")]
    #[case(Some("bech32".to_string()), "bcrt1q")]
    #[case(Some("p2sh-segwit".to_string()), "2")]
    #[tokio::test]
    #[serial(BTC)]
    async fn test_get_new_address_type(
        #[case] address_type: Option<String>,
        #[case] expected_prefix: &str,
    ) {
        let client = get_client().await;

        let address = client
            .get_new_address(None, "", address_type.as_deref())
            .await
            .unwrap();
        assert!(address.starts_with(expected_prefix));
    }

    #[tokio::test]
    #[serial(BTC)]
    async fn test_tx_receiver() {
        let mut client = get_client().await;
        client.connect().await.unwrap();
        let mut tx_receiver = client.tx_receiver();

        let tx = send_transaction(&client).await;
        let tx_id = tx.txid_hex();

        loop {
            let (received_tx, confirmed) = tx_receiver.recv().await.unwrap();
            let Transactions::Single(received_tx) = received_tx else {
                continue;
            };
            if received_tx.txid_hex() == tx_id {
                assert!(!confirmed, "expected unconfirmed transaction");
                break;
            }
        }

        generate_block(&client).await;

        loop {
            let (received_tx, confirmed) = tx_receiver.recv().await.unwrap();
            assert!(confirmed, "block transaction should be confirmed");

            let tx_id_received = match &received_tx {
                Transactions::Single(tx) => tx.txid_hex(),
                Transactions::Multiple(txs) => {
                    if let Some(tx) = txs.iter().find(|t| t.txid_hex() == tx_id) {
                        tx.txid_hex()
                    } else {
                        continue;
                    }
                }
            };

            if tx_id_received == tx_id {
                assert!(confirmed, "expected confirmed transaction");
                break;
            }
        }
    }

    #[tokio::test]
    #[serial(BTC)]
    async fn test_zero_conf_safe() {
        let client = get_client().await;

        let tx = send_transaction(&client).await;
        let zero_conf_safe = client.zero_conf_safe(&tx);

        let received = zero_conf_safe.await.unwrap();
        assert!(!received);

        generate_block(&client).await;
    }

    #[tokio::test]
    #[serial(BTC)]
    async fn rescan_empty() {
        let client = get_client().await;
        let mut chain_tip_helper = MockChainTipHelper::new();

        for _ in 0..3 {
            generate_block(&client).await;
        }

        let end_height = get_block_count(&client).await;
        let start_height = end_height - 2;

        let symbol = client.symbol();
        chain_tip_helper
            .expect_set_height()
            .withf(move |symbol_set: &str, height: &i32| {
                symbol == symbol_set && *height == end_height as i32
            })
            .times(1)
            .returning(|_, _| Ok(1));

        let result = client
            .rescan(
                Arc::new(chain_tip_helper),
                start_height,
                &HashSet::new(),
                &HashSet::new(),
            )
            .await
            .unwrap();

        assert_eq!(result, end_height);
    }

    #[tokio::test]
    #[serial(BTC)]
    async fn rescan_relevant_input() {
        let client = get_client().await;
        let mut chain_tip_helper = MockChainTipHelper::new();

        let tx = send_transaction(&client).await;
        generate_block(&client).await;

        let end_height = get_block_count(&client).await;
        let start_height = end_height;

        let mut inputs = HashSet::new();
        inputs.insert(tx.input_outpoints()[0].clone());

        let mut tx_receiver = client.tx_receiver();

        let symbol = client.symbol();
        chain_tip_helper
            .expect_set_height()
            .withf(move |symbol_set: &str, height: &i32| {
                symbol == symbol_set && *height == end_height as i32
            })
            .times(1)
            .returning(|_, _| Ok(1));

        let result = client
            .rescan(
                Arc::new(chain_tip_helper),
                start_height,
                &inputs,
                &HashSet::new(),
            )
            .await
            .unwrap();

        assert_eq!(result, end_height);

        let (received_tx, confirmed) = tx_receiver.try_recv().unwrap();
        let Transactions::Single(received_tx) = received_tx else {
            panic!("expected single transaction");
        };
        assert_eq!(received_tx.txid_hex(), tx.txid_hex());
        assert!(confirmed);
    }

    #[tokio::test]
    #[serial(BTC)]
    async fn rescan_relevant_output() {
        let client = get_client().await;
        let mut chain_tip_helper = MockChainTipHelper::new();

        let tx = send_transaction(&client).await;
        generate_block(&client).await;

        let end_height = get_block_count(&client).await;
        let start_height = end_height;

        let mut outputs = HashSet::new();
        outputs.insert(tx.output_script_pubkeys()[0].clone());

        let mut tx_receiver = client.tx_receiver();

        let symbol = client.symbol();
        chain_tip_helper
            .expect_set_height()
            .withf(move |symbol_set: &str, height: &i32| {
                symbol == symbol_set && *height == end_height as i32
            })
            .times(1)
            .returning(|_, _| Ok(1));

        let result = client
            .rescan(
                Arc::new(chain_tip_helper),
                start_height,
                &HashSet::new(),
                &outputs,
            )
            .await
            .unwrap();

        assert_eq!(result, end_height);

        let (received_tx, confirmed) = tx_receiver.try_recv().unwrap();
        let Transactions::Single(received_tx) = received_tx else {
            panic!("expected single transaction");
        };
        assert_eq!(received_tx.txid_hex(), tx.txid_hex());
        assert!(confirmed);
    }

    #[tokio::test]
    #[serial(BTC)]
    async fn rescan_start_height_greater_than_end() {
        let client = get_client().await;
        let chain_tip_helper = MockChainTipHelper::new();

        let end_height = get_block_count(&client).await;
        let start_height = end_height + 10;

        let result = client
            .rescan(
                Arc::new(chain_tip_helper),
                start_height,
                &HashSet::new(),
                &HashSet::new(),
            )
            .await;

        assert!(result.is_err());
        assert_eq!(
            result.unwrap_err().to_string(),
            "start height is greater than end height"
        );
    }

    #[tokio::test]
    #[serial(BTC)]
    async fn rescan_multiple_blocks() {
        let client = get_client().await;
        let mut chain_tip_helper = MockChainTipHelper::new();

        let start_height = get_block_count(&client).await + 1;

        let tx1 = send_transaction(&client).await;
        generate_block(&client).await;

        let tx2 = send_transaction(&client).await;
        generate_block(&client).await;

        let end_height = get_block_count(&client).await;

        let mut outputs = HashSet::new();
        outputs.insert(tx1.output_script_pubkeys()[0].clone());
        outputs.insert(tx2.output_script_pubkeys()[0].clone());

        let mut tx_receiver = client.tx_receiver();

        let symbol = client.symbol();
        chain_tip_helper
            .expect_set_height()
            .withf(move |symbol_set: &str, height: &i32| {
                symbol == symbol_set && *height == end_height as i32
            })
            .times(1)
            .returning(|_, _| Ok(1));

        let result = client
            .rescan(
                Arc::new(chain_tip_helper),
                start_height,
                &HashSet::new(),
                &outputs,
            )
            .await
            .unwrap();

        assert_eq!(result, end_height);

        let (received_tx1, confirmed1) = tx_receiver.try_recv().unwrap();
        let Transactions::Single(received_tx1) = received_tx1 else {
            panic!("expected single transaction");
        };
        assert_eq!(received_tx1.txid_hex(), tx1.txid_hex());
        assert!(confirmed1);

        let (received_tx2, confirmed2) = tx_receiver.try_recv().unwrap();
        let Transactions::Single(received_tx2) = received_tx2 else {
            panic!("expected single transaction");
        };
        assert_eq!(received_tx2.txid_hex(), tx2.txid_hex());
        assert!(confirmed2);
    }
}

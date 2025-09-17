use crate::cache::Cache;
use crate::chain::mempool_client::MempoolSpace;
use crate::chain::rpc_client::RpcClient;
use crate::chain::types::{
    NetworkInfo, RawMempool, RawTransactionVerbose, RpcParam, SmartFeeEstimate, Type,
    ZmqNotification,
};
use crate::chain::utils::{Outpoint, Transaction};
use crate::chain::zmq_client::{ZMQ_TX_CHANNEL_SIZE, ZmqClient};
use crate::chain::{BaseClient, Client, Config};
use crate::wallet::Network;
use async_trait::async_trait;
use std::collections::HashSet;
use tokio::sync::broadcast::{Receiver, Sender, channel, error::RecvError};
use tokio::sync::oneshot;
use tokio_util::sync::CancellationToken;
use tracing::{debug, error, info, trace, warn};

const MAX_WORKERS: usize = 16;
const MEMPOOL_FETCH_CHUNK_SIZE: usize = 64;
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
    zmq_client: ZmqClient,
    mempool_space: Option<MempoolSpace>,
    tx_sender: Sender<(Transaction, bool)>,
}

impl PartialEq for ChainClient {
    fn eq(&self, other: &Self) -> bool {
        self.client == other.client
            && self.client_type == other.client_type
            && self.network == other.network
    }
}

impl ChainClient {
    pub fn new(
        cancellation_token: CancellationToken,
        cache: Cache,
        client_type: Type,
        network: Network,
        symbol: String,
        config: Config,
    ) -> anyhow::Result<Self> {
        let client = Self {
            cache,
            network,
            client_type,
            client: RpcClient::new(symbol.clone(), config.clone())?,
            mempool_space: config
                .mempool_space
                .clone()
                .map(|url| MempoolSpace::new(cancellation_token.clone(), symbol.clone(), url)),
            zmq_client: ZmqClient::new(client_type, network, config),
            tx_sender: channel(ZMQ_TX_CHANNEL_SIZE).0,
        };

        {
            let mut tx_receiver = client.zmq_client.tx_sender.subscribe();
            let tx_sender = client.tx_sender.clone();
            let client = client.clone();

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

                                    if let Err(e) = tx_sender.send((tx, tx_verbose.is_confirmed())) {
                                        error!("Failed to forward {} transaction: {}", symbol, e);
                                    }
                                }
                                Err(RecvError::Closed) => break,
                                Err(RecvError::Lagged(skipped)) => {
                                    warn!("{} transaction stream lagged behind by {} messages", symbol, skipped);
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
            Ok(fee) => Ok(fee * BTC_KVB_SAT_VBYTE_FACTOR as f64),
            // On regtest estimatesmartfee can fail
            Err(_) => Ok(floor),
        }
    }

    fn cache_key_raw_tx<'a>(&self, tx_id: &'a str) -> (String, &'a str) {
        (format!("{CACHE_KEY_RAW_TX}:{}", self.symbol()), tx_id)
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

    async fn scan_mempool(
        &self,
        relevant_inputs: &HashSet<Outpoint>,
        relevant_outputs: &HashSet<Vec<u8>>,
    ) -> anyhow::Result<Vec<Transaction>> {
        info!("Scanning mempool of {} chain", self.client.symbol);

        let mempool = self
            .client
            .request::<RawMempool>("getrawmempool", None)
            .await?;
        let mempool_size = mempool.len();

        if mempool_size == 0 {
            debug!("Mempool of {} chain is empty", self.client.symbol);
            return Ok(Vec::default());
        }

        let (tx, mut rx) = tokio::sync::mpsc::channel(1_024);

        let fetcher_threads = std::cmp::min(num_cpus::get() / 2, MAX_WORKERS);
        debug!(
            "Scanning {} mempool transactions of {} chain with {} workers",
            mempool_size, self.client.symbol, fetcher_threads
        );
        for chunk in mempool.chunks(std::cmp::max(mempool_size / fetcher_threads, 1)) {
            let tx_cp = tx.clone();
            let self_cp = self.clone();
            let chunk = chunk.to_vec();

            tokio::spawn(async move {
                let tx_chunks = chunk.chunks(MEMPOOL_FETCH_CHUNK_SIZE);
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

        let mut relevant_txs = Vec::new();

        let mut i = 0;
        loop {
            let tx_hex = match rx.recv().await {
                Some(tx_hex) => tx_hex,
                None => break,
            };
            let tx = Transaction::parse_hex(&self.client_type, &tx_hex)?;
            if Self::is_relevant_tx(relevant_inputs, relevant_outputs, &tx) {
                relevant_txs.push(tx);
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

        if !relevant_txs.is_empty() {
            info!(
                "Found {} relevant transactions in mempool of {} chain",
                relevant_txs.len(),
                self.client.symbol
            );
        }

        Ok(relevant_txs)
    }

    async fn network_info(&self) -> anyhow::Result<NetworkInfo> {
        self.client.request("getnetworkinfo", None).await
    }

    async fn estimate_fee(&self) -> anyhow::Result<f64> {
        let floor = match self.client_type {
            crate::chain::types::Type::Bitcoin => 2.0,
            crate::chain::types::Type::Elements => 0.1,
        };
        Ok(f64::max(self.estimate_fee_raw(floor).await?, floor))
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

    async fn get_new_address(
        &self,
        label: &str,
        address_type: Option<&str>,
    ) -> anyhow::Result<String> {
        self.client
            .request_wallet::<String>(
                "getnewaddress",
                Some(&[
                    RpcParam::Str(label),
                    RpcParam::Str(address_type.unwrap_or(DEFAULT_ADDRESS_TYPE)),
                ]),
            )
            .await
    }

    fn zero_conf_safe(&self, _transaction: &Transaction) -> oneshot::Receiver<bool> {
        let (tx, rx) = oneshot::channel();
        tx.send(false).unwrap();
        rx
    }

    fn tx_receiver(&self) -> Receiver<(Transaction, bool)> {
        self.tx_sender.subscribe()
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
    use rstest::rstest;
    use serde::Deserialize;
    use serial_test::serial;
    use std::collections::HashSet;

    const PORT: u16 = 18_443;

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
                "generatetoaddress",
                Some(&[
                    RpcParam::Int(1),
                    RpcParam::Str(
                        &client
                            .client
                            .request_wallet::<String>("getnewaddress", None)
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
                "sendtoaddress",
                Some(&[
                    RpcParam::Str(
                        &client
                            .client
                            .request_wallet::<String>("getnewaddress", None)
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
            .request_wallet::<AddressInfo>("getaddressinfo", Some(&[RpcParam::Str(address)]))
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

        let transactions = client
            .scan_mempool(&HashSet::new(), &HashSet::new())
            .await
            .unwrap();
        assert_eq!(transactions.len(), 0);
    }

    #[tokio::test]
    #[serial(BTC)]
    async fn scan_mempool_relevant_input() {
        let client = get_client().await;
        let tx = send_transaction(&client).await;

        let mut inputs = HashSet::new();
        inputs.insert(tx.input_outpoints()[0].clone());

        let transactions = client.scan_mempool(&inputs, &HashSet::new()).await.unwrap();
        assert_eq!(transactions.len(), 1);
        assert_eq!(transactions[0], tx);

        generate_block(&client).await;
    }

    #[tokio::test]
    #[serial(BTC)]
    async fn scan_mempool_relevant_output() {
        let client = get_client().await;
        let tx = send_transaction(&client).await;

        let mut outputs = HashSet::new();
        outputs.insert(tx.output_script_pubkeys()[0].clone());

        let transactions = client
            .scan_mempool(&HashSet::new(), &outputs)
            .await
            .unwrap();
        assert_eq!(transactions.len(), 1);
        assert_eq!(transactions[0], tx);

        generate_block(&client).await;
    }

    #[tokio::test]
    async fn test_get_fees_smart_fee() {
        let client = get_client().await;
        let fees = client.estimate_fee().await.unwrap();
        assert_eq!(fees, 2.0);
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
        let address = client.get_new_address(label, None).await.unwrap();

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
            .get_new_address("", address_type.as_deref())
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

        let received_tx = tx_receiver.recv().await.unwrap();
        assert_eq!(received_tx, (tx.clone(), false));

        generate_block(&client).await;

        // Coinbase
        let received_tx = tx_receiver.recv().await.unwrap();
        assert!(received_tx.1);

        let received_tx = tx_receiver.recv().await.unwrap();
        assert_eq!(received_tx, (tx.clone(), true));
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
}

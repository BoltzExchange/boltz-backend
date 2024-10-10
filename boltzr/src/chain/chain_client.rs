use crate::chain::rpc_client::RpcClient;
use crate::chain::types::{NetworkInfo, RawMempool, RpcParam};
use crate::chain::utils::{parse_transaction, Transaction};
use crate::chain::{Client, Config};
use async_trait::async_trait;
use std::collections::HashSet;
use tracing::{debug, error, info, trace};

const MAX_WORKERS: usize = 16;
const MEMPOOL_FETCH_CHUNK_SIZE: usize = 64;

#[derive(Debug, Clone)]
pub struct ChainClient {
    client: RpcClient,
    client_type: crate::chain::types::Type,
}

impl ChainClient {
    pub fn new(
        client_type: crate::chain::types::Type,
        symbol: String,
        config: Config,
    ) -> anyhow::Result<Self> {
        Ok(Self {
            client_type,
            client: RpcClient::new(symbol, config)?,
        })
    }

    fn is_relevant_tx(
        relevant_inputs: &HashSet<Vec<u8>>,
        relevant_outputs: &HashSet<Vec<u8>>,
        tx: &Transaction,
    ) -> bool {
        tx.input_outpoint_ids()
            .iter()
            .any(|input| relevant_inputs.contains(input))
            || tx
                .output_script_pubkeys()
                .iter()
                .any(|output| relevant_outputs.contains(output))
    }
}

#[async_trait]
impl Client for ChainClient {
    fn symbol(&self) -> String {
        self.client.symbol.clone()
    }

    async fn connect(&self) -> anyhow::Result<()> {
        let info = self.network_info().await?;
        info!(
            "Connected to {} chain client: {}",
            self.client.symbol, info.subversion
        );

        Ok(())
    }

    async fn scan_mempool(
        &self,
        relevant_inputs: HashSet<Vec<u8>>,
        relevant_outputs: HashSet<Vec<u8>>,
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

        let fetcher_threads = std::cmp::min(MAX_WORKERS, num_cpus::get() / 2);
        debug!(
            "Scanning {} mempool transactions of {} chain with {} workers",
            mempool_size, self.client.symbol, fetcher_threads
        );
        for chunk in mempool.chunks(mempool_size / fetcher_threads) {
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
                            tx_ids
                                .iter()
                                .map(|tx_id| vec![RpcParam::Str(tx_id.clone())])
                                .collect(),
                        )
                        .await
                    {
                        Ok(tx) => tx,
                        Err(_) => continue,
                    };

                    for tx_hex in txs_hex {
                        if let Err(err) = tx_cp.send(tx_hex).await {
                            error!("Could not send to mempool channel: {}", err);
                            break;
                        }
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
            let tx = parse_transaction(&self.client_type, tx_hex)?;
            if Self::is_relevant_tx(&relevant_inputs, &relevant_outputs, &tx) {
                relevant_txs.push(tx);
            }

            i += 1;
            if i % 1_000 == 0 {
                trace!(
                    "Scanned {}/{} transactions of {} chain mempool",
                    i,
                    mempool_size,
                    self.client.symbol
                );
            }
        }

        info!(
            "Scanned {} mempool transactions of {} chain",
            mempool_size, self.client.symbol
        );
        debug!(
            "Found {} relevant transactions in mempool of {} chain",
            relevant_txs.len(),
            self.client.symbol
        );

        Ok(relevant_txs)
    }

    async fn network_info(&self) -> anyhow::Result<NetworkInfo> {
        self.client.request("getnetworkinfo", None).await
    }
}

use crate::{
    chain::{
        Client, Transactions,
        utils::{Block, Transaction},
    },
    currencies::Currencies,
    db::helpers::chain_tip::ChainTipHelper,
    swap::tx_check::TxChecker,
};
use anyhow::{Context, Result};
use futures::future::try_join_all;
use futures::stream::{self, StreamExt};
use std::sync::Arc;
use tokio::sync::broadcast::{self, error::RecvError};
use tokio_util::sync::CancellationToken;
use tracing::{debug, error};

const CHANNEL_CAPACITY: usize = 1024;

#[derive(Debug, Clone)]
pub enum TxStatus {
    Confirmed,
    ZeroConfSafe,
    NotSafe,
}

#[derive(Debug, Clone)]
pub struct RelevantTx {
    pub symbol: String,
    pub tx: Transaction,
    pub status: TxStatus,
    pub swaps: Vec<String>,
}

#[derive(Clone)]
pub struct UtxoNursery {
    cancellation_token: CancellationToken,
    currencies: Currencies,
    tx_checker: TxChecker,
    chain_tip_helper: Arc<dyn ChainTipHelper + Send + Sync>,
    relevant_txs: broadcast::Sender<RelevantTx>,
}

impl UtxoNursery {
    pub fn new(
        cancellation_token: CancellationToken,
        currencies: Currencies,
        tx_checker: TxChecker,
        chain_tip_helper: Arc<dyn ChainTipHelper + Send + Sync>,
    ) -> Self {
        Self {
            cancellation_token,
            currencies,
            tx_checker,
            chain_tip_helper,
            relevant_txs: broadcast::channel(CHANNEL_CAPACITY).0,
        }
    }

    pub async fn start(self) {
        let mut handles = Vec::new();

        for (_, currency) in self.currencies.iter() {
            if let Some(chain_client) = currency.chain.as_ref() {
                let nursery = self.clone();
                let chain_client = chain_client.clone();

                let handle = tokio::spawn(async move {
                    debug!(
                        "UTXO nursery listening to chain client {}",
                        chain_client.symbol()
                    );
                    nursery.listen(chain_client).await;
                });
                handles.push(handle);
            }
        }

        if let Err(e) = try_join_all(handles).await {
            error!("UTXO nursery failed: {}", e);
        }
    }

    pub fn relevant_tx_receiver(&self) -> broadcast::Receiver<RelevantTx> {
        self.relevant_txs.subscribe()
    }

    pub async fn check_transaction(&self, symbol: &str, tx_id: &str) -> Result<()> {
        let currency = self
            .currencies
            .get(symbol)
            .context(format!("currency {} not found", symbol))?;

        let chain_client = currency
            .chain
            .as_ref()
            .context(format!("no chain client for {}", symbol))?;

        let raw_tx = chain_client.raw_transaction_verbose(tx_id).await?;
        let tx = Transaction::parse_hex(&chain_client.chain_type(), &raw_tx.hex)?;

        debug!(
            confirmed = raw_tx.is_confirmed(),
            "Checking {symbol} transaction: {tx_id}",
        );

        self.check_tx(
            symbol,
            chain_client,
            Transactions::Single(tx),
            raw_tx.is_confirmed(),
        )
        .await
    }

    async fn listen(self, chain_client: Arc<dyn Client + Send + Sync>) {
        let symbol = chain_client.symbol();

        let mut block_receiver = chain_client.block_receiver();
        let mut tx_receiver = chain_client.tx_receiver();

        loop {
            tokio::select! {
                tx = tx_receiver.recv() => {
                    match tx {
                        Ok((tx, confirmed)) => {
                            if let Err(e) = self.check_tx(&symbol, &chain_client, tx, confirmed).await {
                                error!("UTXO nursery failed to process {} transaction: {}", symbol, e);
                            }
                        }
                        Err(RecvError::Closed) => break,
                        Err(RecvError::Lagged(skipped)) => {
                            tracing::warn!("UTXO nursery {} transaction stream lagged behind by {} messages", symbol, skipped);
                        }
                    }
                },
                block = block_receiver.recv() => {
                    match block {
                        Ok((height, block)) => {
                            if let Err(e) = self.check_block(&symbol, height, block).await {
                                error!("UTXO nursery failed to process {} block: {}", symbol, e);
                            }
                        }
                        Err(RecvError::Closed) => break,
                        Err(RecvError::Lagged(skipped)) => {
                            tracing::warn!("UTXO nursery {} block stream lagged behind by {} messages", symbol, skipped);
                        }
                    }
                },
                _ = self.cancellation_token.cancelled() => {
                    break;
                }
            }
        }
    }

    async fn check_tx(
        &self,
        symbol: &str,
        chain_client: &Arc<dyn Client + Send + Sync>,
        txs: Transactions,
        confirmed: bool,
    ) -> Result<()> {
        let mut relevant_swaps = self.tx_checker.check(symbol, txs, confirmed)?;
        if self.relevant_txs.receiver_count() == 0 {
            return Ok(());
        }

        // Collect into Vec to maintain deterministic order
        let tx_vec: Vec<_> = relevant_swaps.keys().cloned().collect();

        let zero_conf_safe = stream::iter(tx_vec.iter().cloned())
            .map(|tx| async move {
                if confirmed {
                    TxStatus::Confirmed
                } else {
                    match chain_client.zero_conf_safe(&tx).await {
                        Ok(safe) => {
                            if safe {
                                TxStatus::ZeroConfSafe
                            } else {
                                TxStatus::NotSafe
                            }
                        }
                        Err(e) => {
                            error!(
                                "0-conf safety check for {} transaction failed: {}",
                                symbol, e
                            );
                            TxStatus::NotSafe
                        }
                    }
                }
            })
            .buffered(16)
            .collect::<Vec<_>>()
            .await;

        for (tx, status) in tx_vec.into_iter().zip(zero_conf_safe.into_iter()) {
            let swap_ids = relevant_swaps.remove(&tx).context("swap ids not found")?;

            if let Err(e) = self.relevant_txs.send(RelevantTx {
                symbol: symbol.to_string(),
                status,
                tx,
                swaps: swap_ids,
            }) {
                error!(
                    "UTXO nursery failed to send relevant {} transaction: {}",
                    symbol, e
                );
            }
        }

        Ok(())
    }

    async fn check_block(&self, symbol: &str, height: u64, block: Block) -> Result<()> {
        debug!(
            "Adding {} block {}: {}",
            symbol,
            height,
            hex::encode(block.block_hash())
        );
        self.chain_tip_helper.set_height(symbol, height as i32)?;

        Ok(())
    }
}

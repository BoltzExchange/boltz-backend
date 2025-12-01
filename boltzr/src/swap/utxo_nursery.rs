use crate::{
    chain::{
        Client,
        utils::{Block, Transaction},
    },
    currencies::Currencies,
    db::helpers::chain_tip::ChainTipHelper,
    swap::tx_check::TxChecker,
};
use anyhow::Result;
use futures::future::try_join_all;
use std::sync::Arc;
use tokio::sync::broadcast::{self, error::RecvError};
use tokio_util::sync::CancellationToken;
use tracing::{debug, error};

const CHANNEL_CAPACITY: usize = 512;

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
        tx: Transaction,
        confirmed: bool,
    ) -> Result<()> {
        let zero_conf_safe = tokio::spawn(chain_client.zero_conf_safe(&tx));

        let relevant_swaps = self.tx_checker.check(symbol, &tx, confirmed)?;
        if let Some(swaps) = relevant_swaps {
            if self.relevant_txs.receiver_count() == 0 {
                return Ok(());
            }

            self.relevant_txs.send(RelevantTx {
                symbol: symbol.to_string(),
                status: if confirmed {
                    TxStatus::Confirmed
                } else if zero_conf_safe.await?? {
                    TxStatus::ZeroConfSafe
                } else {
                    TxStatus::NotSafe
                },
                tx,
                swaps,
            })?;
        }

        Ok(())
    }

    async fn check_block(&self, symbol: &str, height: u64, block: Block) -> Result<()> {
        debug!(
            "Adding {} block {}: {}",
            symbol,
            height,
            alloy::hex::encode(block.block_hash())
        );
        self.chain_tip_helper.set_height(symbol, height as i32)?;

        Ok(())
    }
}

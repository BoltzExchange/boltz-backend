use crate::{
    chain::{
        Client,
        utils::{Block, Transaction},
    },
    currencies::{Currencies, Currency},
    db::{Pool, helpers::script_pubkey::ScriptPubKeyHelper, models::SomeSwap},
};
use anyhow::Result;
use futures::future::try_join_all;
use std::sync::Arc;
use tokio::sync::broadcast::error::RecvError;
use tokio_util::sync::CancellationToken;
use tracing::{debug, error};

#[derive(Clone)]
pub struct UtxoNursery {
    cancellation_token: CancellationToken,
    currencies: Currencies,
    script_pubkey_helper: Arc<dyn ScriptPubKeyHelper + Send + Sync>,
}

// TODO: emit block height to nodejs

impl UtxoNursery {
    pub fn new(
        cancellation_token: CancellationToken,
        script_pubkey_helper: Arc<dyn ScriptPubKeyHelper + Send + Sync>,
        currencies: Currencies,
    ) -> Self {
        Self {
            cancellation_token,
            currencies,
            script_pubkey_helper,
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

    async fn listen(self, chain_client: Arc<dyn Client + Send + Sync>) {
        let symbol = chain_client.symbol();

        let mut block_receiver = chain_client.block_receiver();
        let mut tx_receiver = chain_client.tx_receiver();

        loop {
            tokio::select! {
                tx = tx_receiver.recv() => {
                    match tx {
                        Ok((tx, confirmed)) => {
                            if let Err(e) = self.check_tx(&symbol, tx, confirmed).await {
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

    async fn check_block(&self, symbol: &str, height: u64, block: Block) -> Result<()> {
        println!("checking block {}", height);
        Ok(())
    }

    async fn check_tx(&self, symbol: &str, tx: Transaction, confirmed: bool) -> Result<()> {
        println!("checking tx");
        // TODO: also check for inputs being spent
        let script_pubkeys = self
            .script_pubkey_helper
            .get_by_scripts(symbol, &tx.output_script_pubkeys())?;

        println!("script_pubkeys: {:?}", script_pubkeys);

        Ok(())
    }
}

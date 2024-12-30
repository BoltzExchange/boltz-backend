use crate::api::ws::types::SwapStatus;
use crate::chain::utils::Transaction;
use crate::currencies::{Currencies, Currency};
use crate::db::helpers::chain_swap::{ChainSwapHelper, ChainSwapHelperDatabase};
use crate::db::helpers::reverse_swap::{ReverseSwapHelper, ReverseSwapHelperDatabase};
use crate::db::helpers::swap::{SwapHelper, SwapHelperDatabase};
use crate::db::Pool;
use crate::swap::expiry_checker::InvoiceExpiryChecker;
use crate::swap::filters::get_input_output_filters;
use anyhow::{anyhow, Result};
use async_trait::async_trait;
use std::collections::HashMap;
use std::sync::Arc;
use tokio_util::sync::CancellationToken;
use tracing::{debug, info};

#[async_trait]
pub trait SwapManager {
    fn get_currency(&self, symbol: &str) -> Option<Currency>;

    fn listen_to_updates(&self) -> tokio::sync::broadcast::Receiver<SwapStatus>;

    async fn scan_mempool(
        &self,
        symbols: Option<Vec<String>>,
    ) -> Result<HashMap<String, Vec<Transaction>>>;
}

#[derive(Clone)]
pub struct Manager {
    update_tx: tokio::sync::broadcast::Sender<SwapStatus>,

    currencies: Arc<Currencies>,
    cancellation_token: CancellationToken,

    swap_repo: Arc<dyn SwapHelper + Sync + Send>,
    chain_swap_repo: Arc<dyn ChainSwapHelper + Sync + Send>,
    reverse_swap_repo: Arc<dyn ReverseSwapHelper + Sync + Send>,
}

impl Manager {
    pub fn new(cancellation_token: CancellationToken, currencies: Currencies, pool: Pool) -> Self {
        let (update_tx, _) = tokio::sync::broadcast::channel::<SwapStatus>(128);

        Manager {
            update_tx,
            cancellation_token,
            currencies: Arc::new(currencies),
            swap_repo: Arc::new(SwapHelperDatabase::new(pool.clone())),
            chain_swap_repo: Arc::new(ChainSwapHelperDatabase::new(pool.clone())),
            reverse_swap_repo: Arc::new(ReverseSwapHelperDatabase::new(pool)),
        }
    }

    pub async fn start(&self) {
        let expiry_checker = InvoiceExpiryChecker::new(
            self.cancellation_token.clone(),
            self.update_tx.clone(),
            self.currencies.clone(),
            self.swap_repo.clone(),
        );

        tokio::spawn(async move {
            expiry_checker.start().await;
        })
        .await
        .unwrap();
    }
}

#[async_trait]
impl SwapManager for Manager {
    fn get_currency(&self, symbol: &str) -> Option<Currency> {
        self.currencies.get(symbol).cloned()
    }

    fn listen_to_updates(&self) -> tokio::sync::broadcast::Receiver<SwapStatus> {
        self.update_tx.subscribe()
    }

    async fn scan_mempool(
        &self,
        symbols: Option<Vec<String>>,
    ) -> Result<HashMap<String, Vec<Transaction>>> {
        let chain_clients = match symbols {
            Some(symbols) => {
                let mut clients = Vec::new();
                for symbol in symbols {
                    match self.currencies.get(&symbol) {
                        Some(cur) => match cur.chain.clone() {
                            Some(client) => {
                                clients.push(client);
                            }
                            None => return Err(anyhow!("no chain client for currency {}", symbol)),
                        },
                        None => return Err(anyhow!("no currency for {}", symbol)),
                    }
                }

                clients
            }
            None => self
                .currencies
                .values()
                .filter_map(|cur| cur.chain.clone())
                .collect(),
        };

        info!(
            "Rescanning mempool of chains: {:?}",
            chain_clients
                .iter()
                .map(|client| client.symbol())
                .collect::<Vec<String>>()
        );

        let filters = get_input_output_filters(
            &self.currencies,
            &self.swap_repo,
            &self.reverse_swap_repo,
            &self.chain_swap_repo,
        )?;
        let results = futures::future::join_all(chain_clients.iter().map(|client| async {
            let (inputs, outputs) = match filters.get(&client.symbol()) {
                Some(filters) => filters,
                // No need to actually scan when there is nothing to scan for
                None => {
                    debug!(
                        "Not rescanning mempool of {} because the filters are empty",
                        client.symbol()
                    );
                    return (client.symbol(), Ok(Vec::default()));
                }
            };

            (client.symbol(), client.scan_mempool(inputs, outputs).await)
        }))
        .await;

        let mut transactions = HashMap::new();
        for (symbol, result) in results {
            match result {
                Ok(txs) => {
                    transactions.insert(symbol, txs);
                }
                Err(err) => return Err(anyhow!("mempool rescan of {} failed: {}", symbol, err)),
            }
        }

        Ok(transactions)
    }
}

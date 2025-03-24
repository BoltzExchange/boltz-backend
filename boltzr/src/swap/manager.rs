use super::PairConfig;
use super::timeout_delta::TimeoutDeltaProvider;
use crate::api::ws::types::SwapStatus;
use crate::chain::utils::Transaction;
use crate::currencies::{Currencies, Currency};
use crate::db::Pool;
use crate::db::helpers::chain_swap::{ChainSwapHelper, ChainSwapHelperDatabase};
use crate::db::helpers::referral::ReferralHelperDatabase;
use crate::db::helpers::reverse_swap::{ReverseSwapHelper, ReverseSwapHelperDatabase};
use crate::db::helpers::swap::{SwapHelper, SwapHelperDatabase};
use crate::db::models::SwapType;
use crate::swap::expiration::{CustomExpirationChecker, InvoiceExpirationChecker, Scheduler};
use crate::swap::filters::get_input_output_filters;
use crate::utils::pair::{OrderSide, concat_pair};
use anyhow::{Result, anyhow};
use async_trait::async_trait;
use futures_util::future::try_join_all;
use std::collections::HashMap;
use std::sync::Arc;
use tokio_util::sync::CancellationToken;
use tracing::{debug, info};

#[async_trait]
pub trait SwapManager {
    fn get_currency(&self, symbol: &str) -> Option<Currency>;
    fn get_timeouts(
        &self,
        receiving: &str,
        sending: &str,
        swap_type: SwapType,
    ) -> Result<(u64, u64)>;

    fn listen_to_updates(&self) -> tokio::sync::broadcast::Receiver<SwapStatus>;

    async fn scan_mempool(
        &self,
        symbols: Option<Vec<String>>,
    ) -> Result<HashMap<String, Vec<Transaction>>>;
}

#[derive(Clone)]
pub struct Manager {
    update_tx: tokio::sync::broadcast::Sender<SwapStatus>,

    currencies: Currencies,
    cancellation_token: CancellationToken,

    pool: Pool,
    swap_repo: Arc<dyn SwapHelper + Sync + Send>,
    chain_swap_repo: Arc<dyn ChainSwapHelper + Sync + Send>,
    reverse_swap_repo: Arc<dyn ReverseSwapHelper + Sync + Send>,
    timeout_delta_provider: Arc<TimeoutDeltaProvider>,
}

impl Manager {
    pub fn new(
        cancellation_token: CancellationToken,
        currencies: Currencies,
        pool: Pool,
        pairs: &[PairConfig],
    ) -> Result<Self> {
        let (update_tx, _) = tokio::sync::broadcast::channel::<SwapStatus>(128);

        Ok(Manager {
            update_tx,
            currencies,
            cancellation_token,
            pool: pool.clone(),
            swap_repo: Arc::new(SwapHelperDatabase::new(pool.clone())),
            chain_swap_repo: Arc::new(ChainSwapHelperDatabase::new(pool.clone())),
            reverse_swap_repo: Arc::new(ReverseSwapHelperDatabase::new(pool)),
            timeout_delta_provider: Arc::new(TimeoutDeltaProvider::new(pairs)?),
        })
    }

    pub async fn start(&self) {
        let invoice_expiration = Scheduler::new(
            self.cancellation_token.clone(),
            InvoiceExpirationChecker::new(
                self.update_tx.clone(),
                self.currencies.clone(),
                self.swap_repo.clone(),
            ),
        );
        let custom_expiration = Scheduler::new(
            self.cancellation_token.clone(),
            CustomExpirationChecker::new(
                self.update_tx.clone(),
                self.swap_repo.clone(),
                Arc::new(ReferralHelperDatabase::new(self.pool.clone())),
            ),
        );

        try_join_all([
            tokio::spawn(async move {
                invoice_expiration.start().await;
            }),
            tokio::spawn(async move {
                custom_expiration.start().await;
            }),
        ])
        .await
        .unwrap();
    }
}

#[async_trait]
impl SwapManager for Manager {
    fn get_currency(&self, symbol: &str) -> Option<Currency> {
        self.currencies.get(symbol).cloned()
    }

    fn get_timeouts(
        &self,
        receiving: &str,
        sending: &str,
        swap_type: SwapType,
    ) -> Result<(u64, u64)> {
        let (pair, order_side) = match swap_type {
            SwapType::Reverse => (concat_pair(receiving, sending), OrderSide::Buy),
            _ => return Err(anyhow!("not implemented")),
        };

        self.timeout_delta_provider
            .get_timeouts(&pair, order_side, swap_type)
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

#[cfg(test)]
pub mod test {
    use super::*;
    use crate::api::ws::types::SwapStatus;
    use crate::chain::utils::Transaction;
    use crate::db::helpers::web_hook::test::get_pool;
    use crate::swap::timeout_delta::PairTimeoutBlockDelta;
    use anyhow::Result;
    use async_trait::async_trait;
    use mockall::mock;

    mock! {
        pub Manager {}

        impl Clone for Manager {
            fn clone(&self) -> Self;
        }

        #[async_trait]
        impl SwapManager for Manager {
            fn get_currency(&self, symbol: &str) -> Option<Currency>;
            fn get_timeouts(
                &self,
                receiving: &str,
                sending: &str,
                swap_type: SwapType,
            ) -> Result<(u64, u64)>;
            fn listen_to_updates(&self) -> tokio::sync::broadcast::Receiver<SwapStatus>;
            async fn scan_mempool(
                &self,
                symbols: Option<Vec<String>>,
            ) -> Result<HashMap<String, Vec<Transaction>>>;
        }
    }

    #[test]
    fn test_get_timeouts() {
        // Setup test data
        let pairs = vec![PairConfig {
            base: "L-BTC".to_string(),
            quote: "BTC".to_string(),
            timeout_delta: PairTimeoutBlockDelta {
                chain: 120,
                reverse: 120,
                swap_minimal: 30,
                swap_maximal: 240,
                swap_taproot: 180,
            },
        }];

        let timeout_provider = TimeoutDeltaProvider::new(&pairs).unwrap();
        let manager = Manager {
            update_tx: tokio::sync::broadcast::channel(100).0,
            cancellation_token: CancellationToken::new(),
            pool: get_pool(),
            currencies: Arc::new(HashMap::new()),
            swap_repo: Arc::new(SwapHelperDatabase::new(get_pool())),
            chain_swap_repo: Arc::new(ChainSwapHelperDatabase::new(get_pool())),
            reverse_swap_repo: Arc::new(ReverseSwapHelperDatabase::new(get_pool())),
            timeout_delta_provider: Arc::new(timeout_provider),
        };

        let result = manager.get_timeouts("L-BTC", "BTC", SwapType::Reverse);
        assert!(result.is_ok());
        let (onchain, lightning) = result.unwrap();
        assert_eq!(onchain, 120);
        assert_eq!(lightning, 15);

        let result = manager.get_timeouts("BTC", "L-BTC", SwapType::Submarine);
        assert!(result.is_err());
        assert_eq!(result.unwrap_err().to_string(), "not implemented");
    }
}

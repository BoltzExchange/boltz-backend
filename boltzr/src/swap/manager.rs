use super::PairConfig;
use super::timeout_delta::TimeoutDeltaProvider;
use crate::api::ws::types::SwapStatus;
use crate::chain::mrh_watcher::MrhWatcher;
use crate::chain::utils::Transaction;
use crate::currencies::{Currencies, Currency};
use crate::db::Pool;
use crate::db::helpers::chain_swap::{ChainSwapHelper, ChainSwapHelperDatabase};
use crate::db::helpers::referral::ReferralHelperDatabase;
use crate::db::helpers::reverse_swap::{ReverseSwapHelper, ReverseSwapHelperDatabase};
use crate::db::helpers::script_pubkey::ScriptPubKeyHelperDatabase;
use crate::db::helpers::swap::{SwapHelper, SwapHelperDatabase};
use crate::db::models::SwapType;
use crate::swap::expiration::{CustomExpirationChecker, InvoiceExpirationChecker, Scheduler};
use crate::swap::filters::get_input_output_filters;
use crate::swap::utxo_nursery::UtxoNursery;
use crate::utils::pair::{OrderSide, concat_pair};
use anyhow::{Result, anyhow};
use async_trait::async_trait;
use futures_util::future::try_join_all;
use std::collections::{HashMap, HashSet};
use std::sync::Arc;
use tokio_util::sync::CancellationToken;
use tracing::{debug, info};

pub struct RescanChainOptions {
    pub symbol: String,
    pub start_height: u64,
    pub include_mempool: bool,
}

pub struct RescanChainResult {
    pub symbol: String,
    pub start_height: u64,
    pub end_height: u64,
}

#[async_trait]
pub trait SwapManager {
    fn get_network(&self) -> crate::wallet::Network;
    fn get_currency(&self, symbol: &str) -> Option<Currency>;
    fn get_timeouts(
        &self,
        receiving: &str,
        sending: &str,
        swap_type: SwapType,
    ) -> Result<(u64, u64)>;

    fn listen_to_updates(&self) -> tokio::sync::broadcast::Receiver<SwapStatus>;

    async fn rescan_chains(
        &self,
        options: Option<Vec<RescanChainOptions>>,
    ) -> Result<Vec<RescanChainResult>>;
}

#[derive(Clone)]
pub struct Manager {
    network: crate::wallet::Network,

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
        network: crate::wallet::Network,
        pairs: &[PairConfig],
    ) -> Result<Self> {
        let (update_tx, _) = tokio::sync::broadcast::channel::<SwapStatus>(128);

        Ok(Manager {
            network,
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
        let watcher = MrhWatcher::new(
            self.cancellation_token.clone(),
            self.reverse_swap_repo.clone(),
            self.update_tx.clone(),
        );
        let nursery = UtxoNursery::new(
            self.cancellation_token.clone(),
            Arc::new(ScriptPubKeyHelperDatabase::new(self.pool.clone())),
            self.currencies.clone(),
        );

        let currencies = self.currencies.clone();

        try_join_all([
            tokio::spawn(async move {
                invoice_expiration.start().await;
            }),
            tokio::spawn(async move {
                custom_expiration.start().await;
            }),
            tokio::spawn(async move {
                watcher.start(&currencies).await;
            }),
            tokio::spawn(async move {
                nursery.start().await;
            }),
        ])
        .await
        .unwrap();
    }
}

#[async_trait]
impl SwapManager for Manager {
    fn get_network(&self) -> crate::wallet::Network {
        self.network
    }

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

    async fn rescan_chains(
        &self,
        options: Option<Vec<RescanChainOptions>>,
    ) -> Result<Vec<RescanChainResult>> {
        let clients = match options {
            Some(options) => {
                let mut clients = Vec::new();
                for option in options {
                    match self.currencies.get(&option.symbol) {
                        Some(cur) => match cur.chain.clone() {
                            Some(client) => {
                                clients.push((option, client));
                            }
                            None => {
                                return Err(anyhow!(
                                    "no chain client for currency {}",
                                    option.symbol
                                ));
                            }
                        },
                        None => return Err(anyhow!("no currency for {}", option.symbol)),
                    }
                }

                clients
            }
            // TODO: rescan all chains including mempool starting from the last known height
            None => return Ok(Vec::new()),
        };

        info!(
            "Rescanning chains: {}",
            clients
                .iter()
                .map(|(option, _)| {
                    let mut symbol = option.symbol.clone();
                    if option.include_mempool {
                        symbol.push_str(" (with mempool)");
                    }
                    symbol
                })
                .collect::<Vec<String>>()
                .join(", ")
        );

        let filters = get_input_output_filters(
            &self.currencies,
            &self.swap_repo,
            &self.reverse_swap_repo,
            &self.chain_swap_repo,
        )?;
        let scan_results =
            futures::future::join_all(clients.iter().map(|(option, client)| async {
                let (inputs, outputs) = match filters.get(&client.symbol()) {
                    Some(filters) => filters,
                    None => {
                        debug!("Filters for {} are empty", client.symbol());
                        &(HashSet::new(), HashSet::new())
                    }
                };

                (
                    client.symbol(),
                    match client.rescan(option.start_height, inputs, outputs).await {
                        Ok(end_height) => {
                            if option.include_mempool {
                                if let Err(err) = client.scan_mempool(inputs, outputs).await {
                                    return (
                                        client.symbol(),
                                        Err(anyhow!("failed to scan mempool: {}", err)),
                                    );
                                }
                            }

                            Ok(RescanChainResult {
                                symbol: client.symbol(),
                                start_height: option.start_height,
                                end_height,
                            })
                        }
                        Err(err) => Err(err),
                    },
                )
            }))
            .await;

        let mut res = Vec::new();
        for (symbol, result) in scan_results {
            match result {
                Ok(result) => {
                    res.push(result);
                }
                Err(err) => return Err(anyhow!("rescan of {} failed: {}", symbol, err)),
            }
        }

        Ok(res)
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
            fn get_network(&self) -> crate::wallet::Network;
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
            network: crate::wallet::Network::Regtest,
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

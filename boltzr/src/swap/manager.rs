use super::PairConfig;
use super::timeout_delta::TimeoutDeltaProvider;
use crate::api::ws::types::{FundingAddressUpdate, SwapStatus};
use crate::cache::Cache;
use crate::chain::mrh_watcher::MrhWatcher;
use crate::chain::types::Type;
use crate::currencies::{Currencies, Currency};
use crate::db::Pool;
use crate::db::helpers::chain_swap::{ChainSwapHelper, ChainSwapHelperDatabase};
use crate::db::helpers::chain_tip::{ChainTipHelper, ChainTipHelperDatabase};
use crate::db::helpers::funding_address::FundingAddressHelperDatabase;
use crate::db::helpers::referral::ReferralHelperDatabase;
use crate::db::helpers::reverse_swap::{ReverseSwapHelper, ReverseSwapHelperDatabase};
use crate::db::helpers::script_pubkey::ScriptPubKeyHelperDatabase;
use crate::db::helpers::swap::{SwapHelper, SwapHelperDatabase};
use crate::db::models::{SomeSwap, SwapType};
use crate::swap::AssetRescueConfig;
use crate::swap::FundingAddressNursery;
use crate::swap::asset_rescue::AssetRescue;
use crate::swap::expiration::{CustomExpirationChecker, InvoiceExpirationChecker, Scheduler};
use crate::swap::filters::get_input_output_filters;
use crate::swap::tx_check::TxChecker;
use crate::swap::utxo_nursery::{RelevantTx, UtxoNursery};
use crate::utils::pair::{OrderSide, concat_pair};
use anyhow::{Result, anyhow};
use async_trait::async_trait;
use boltz_core::wrapper::InputDetail;
use boltz_core::wrapper::Transaction;
use diesel::ExpressionMethods;
use futures_util::future::try_join_all;
use futures_util::{StreamExt, TryStreamExt};
use std::collections::HashSet;
use std::sync::Arc;
use tokio::sync::broadcast;
use tokio_util::sync::CancellationToken;
use tracing::{debug, info, instrument};

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
    fn get_currencies(&self) -> &Currencies;
    fn get_timeouts(
        &self,
        receiving: &str,
        sending: &str,
        swap_type: SwapType,
    ) -> Result<(u64, u64)>;

    fn get_asset_rescue(&self) -> Arc<AssetRescue>;

    async fn claim_batch(&self, swap_ids: Vec<String>) -> Result<(Transaction, u64)>;

    fn listen_to_updates(&self) -> broadcast::Receiver<SwapStatus>;

    async fn rescan_chains(
        &self,
        options: Option<Vec<RescanChainOptions>>,
    ) -> Result<Vec<RescanChainResult>>;

    async fn check_transaction(&self, symbol: &str, tx_id: &str) -> Result<()>;

    fn relevant_tx_receiver(&self) -> broadcast::Receiver<RelevantTx>;
}

#[derive(Clone)]
pub struct Manager {
    network: crate::wallet::Network,

    update_tx: broadcast::Sender<SwapStatus>,
    funding_address_update_tx: broadcast::Sender<FundingAddressUpdate>,

    currencies: Currencies,
    cancellation_token: CancellationToken,

    pool: Pool,
    swap_repo: Arc<dyn SwapHelper + Sync + Send>,
    chain_swap_repo: Arc<dyn ChainSwapHelper + Sync + Send>,
    reverse_swap_repo: Arc<dyn ReverseSwapHelper + Sync + Send>,
    timeout_delta_provider: Arc<TimeoutDeltaProvider>,

    utxo_nursery: UtxoNursery,
    asset_rescue: Arc<AssetRescue>,
}

impl Manager {
    pub fn new(
        cancellation_token: CancellationToken,
        asset_rescue_config: Option<AssetRescueConfig>,
        currencies: Currencies,
        cache: Cache,
        pool: Pool,
        network: crate::wallet::Network,
        pairs: &[PairConfig],
    ) -> Result<Self> {
        let (update_tx, _) = broadcast::channel::<SwapStatus>(128);
        let (funding_address_update_tx, _) = broadcast::channel::<FundingAddressUpdate>(128);

        let swap_repo = Arc::new(SwapHelperDatabase::new(pool.clone()));
        let chain_swap_repo = Arc::new(ChainSwapHelperDatabase::new(pool.clone()));

        Ok(Manager {
            network,
            update_tx,
            funding_address_update_tx,
            currencies: currencies.clone(),
            cancellation_token: cancellation_token.clone(),
            pool: pool.clone(),
            swap_repo: swap_repo.clone(),
            chain_swap_repo: chain_swap_repo.clone(),
            reverse_swap_repo: Arc::new(ReverseSwapHelperDatabase::new(pool.clone())),
            timeout_delta_provider: Arc::new(TimeoutDeltaProvider::new(pairs)?),
            utxo_nursery: UtxoNursery::new(
                cancellation_token,
                currencies.clone(),
                TxChecker::new(
                    Arc::new(ScriptPubKeyHelperDatabase::new(pool.clone())),
                    Arc::new(ChainSwapHelperDatabase::new(pool.clone())),
                    Arc::new(ReverseSwapHelperDatabase::new(pool.clone())),
                ),
                Arc::new(ChainTipHelperDatabase::new(pool)),
            ),
            asset_rescue: Arc::new(AssetRescue::new(
                asset_rescue_config,
                cache,
                currencies,
                swap_repo,
                chain_swap_repo,
            )),
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
        let nursery = self.utxo_nursery.clone();
        let relevant_tx_receiver = nursery.relevant_tx_receiver();
        let funding_address_nursery = FundingAddressNursery::new(
            Arc::new(FundingAddressHelperDatabase::new(self.pool.clone())),
            self.funding_address_update_tx.clone(),
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
            tokio::spawn(async move {
                funding_address_nursery.start(relevant_tx_receiver).await;
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

    fn get_currencies(&self) -> &Currencies {
        &self.currencies
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

    fn get_asset_rescue(&self) -> Arc<AssetRescue> {
        self.asset_rescue.clone()
    }

    fn listen_to_updates(&self) -> tokio::sync::broadcast::Receiver<SwapStatus> {
        self.update_tx.subscribe()
    }

    #[instrument(name = "SwapManager::claim_batch", skip_all)]
    async fn claim_batch(&self, swap_ids: Vec<String>) -> Result<(Transaction, u64)> {
        info!("Batch claiming swaps: {}", swap_ids.join(", "));

        let submarines = self.swap_repo.get_all(Box::new(
            crate::db::schema::swaps::dsl::id.eq_any(swap_ids.clone()),
        ))?;
        let chain_swaps = self.chain_swap_repo.get_all(Box::new(
            crate::db::schema::chainSwaps::dsl::id.eq_any(swap_ids.clone()),
        ))?;

        let mut swaps: Vec<Box<dyn SomeSwap + Send>> =
            Vec::with_capacity(submarines.len() + chain_swaps.len());
        swaps.extend(
            submarines
                .into_iter()
                .map(|s| Box::new(s) as Box<dyn SomeSwap + Send>),
        );
        swaps.extend(
            chain_swaps
                .into_iter()
                .map(|s| Box::new(s) as Box<dyn SomeSwap + Send>),
        );

        {
            let found_ids: HashSet<String> = swaps.iter().map(|s| s.id()).collect();
            let missing_ids: Vec<_> = swap_ids
                .iter()
                .filter(|id| !found_ids.contains(*id))
                .cloned()
                .collect();

            if !missing_ids.is_empty() {
                return Err(anyhow!("swaps were not found: {}", missing_ids.join(", ")));
            }
        }

        let claim_symbol = swaps
            .first()
            .ok_or_else(|| anyhow!("no swaps provided"))?
            .claim_symbol()?;

        if swaps
            .iter()
            .any(|swap| swap.claim_symbol().map_or(true, |s| s != claim_symbol))
        {
            return Err(anyhow!("all swaps must have the same claim symbol"));
        }

        let currency = self
            .get_currency(&claim_symbol)
            .ok_or_else(|| anyhow!("currency not found"))?;
        let client = currency
            .chain
            .ok_or_else(|| anyhow!("chain client not found"))?;
        let wallet = currency.wallet.ok_or_else(|| anyhow!("wallet not found"))?;

        let inputs: Vec<InputDetail> = futures::stream::iter(swaps)
            .map(|swap| {
                let wallet = wallet.clone();
                let client = client.clone();
                async move { swap.claim_details(&wallet, &client).await }
            })
            .boxed()
            // Elements inputs need to fetch chain data to prepare the input and
            // we don't want to overwhelm the node
            .buffered(16)
            .try_collect::<Vec<_>>()
            .await?;

        let fee = client.estimate_fee().await?;
        let address = boltz_core::Address::try_from(
            wallet
                .get_address(
                    None,
                    &wallet.label_batch_claim(
                        &swap_ids.iter().map(|id| id.as_str()).collect::<Vec<_>>(),
                    ),
                )
                .await?
                .as_str(),
        )?;

        match client.chain_type() {
            Type::Bitcoin => {
                let inputs = inputs
                    .into_iter()
                    .map(|input| input.try_into())
                    .collect::<Result<Vec<boltz_core::bitcoin::InputDetail>>>()?;
                let inputs = inputs.iter().collect::<Vec<_>>();

                let params =
                    boltz_core::wrapper::Params::Bitcoin(boltz_core::wrapper::BitcoinParams {
                        inputs: &inputs,
                        destination: &boltz_core::Destination::Single(&address.try_into()?),
                        fee: fee.into(),
                    });

                boltz_core::wrapper::construct_tx(&params)
            }
            Type::Elements => {
                let inputs = inputs
                    .into_iter()
                    .map(|input| input.try_into())
                    .collect::<Result<Vec<boltz_core::elements::InputDetail>>>()?;
                let inputs = inputs.iter().collect::<Vec<_>>();

                let params =
                    boltz_core::wrapper::Params::Elements(boltz_core::wrapper::ElementsParams {
                        genesis_hash: client.network().liquid_genesis_hash()?,
                        inputs: &inputs,
                        destination: &boltz_core::Destination::Single(&address.try_into()?),
                        fee: fee.into(),
                    });

                boltz_core::wrapper::construct_tx(&params)
            }
        }
    }

    async fn rescan_chains(
        &self,
        options: Option<Vec<RescanChainOptions>>,
    ) -> Result<Vec<RescanChainResult>> {
        let chain_tip_repo = Arc::new(ChainTipHelperDatabase::new(self.pool.clone()));

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
            None => {
                let chain_tips = chain_tip_repo.get_all()?;

                futures::stream::iter(self.currencies.iter())
                    .filter_map(async |(symbol, currency)| {
                        let client = match currency.chain.clone() {
                            Some(client) => client,
                            None => return None,
                        };

                        let start_height = match chain_tips
                            .iter()
                            .find(|chaintip| chaintip.symbol == *symbol)
                            .map(|chaintip| chaintip.height)
                        {
                            Some(height) => height as u64,
                            // Get the latest block height if no chain tip is found in the database
                            // Else we would rescan from genesis on first startup
                            None => match client.blockchain_info().await {
                                Ok(info) => info.blocks,
                                Err(err) => {
                                    tracing::error!(
                                        "Failed to get blockchain info for {}: {}",
                                        symbol,
                                        err
                                    );
                                    0
                                }
                            },
                        };

                        Some((
                            RescanChainOptions {
                                symbol: symbol.clone(),
                                start_height,
                                include_mempool: true,
                            },
                            client,
                        ))
                    })
                    .collect()
                    .await
            }
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
                    match client
                        .rescan(chain_tip_repo.clone(), option.start_height, inputs, outputs)
                        .await
                    {
                        Ok(end_height) => {
                            if option.include_mempool
                                && let Err(err) = client.scan_mempool(inputs, outputs).await
                            {
                                return (
                                    client.symbol(),
                                    Err(anyhow!("failed to scan mempool: {}", err)),
                                );
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

    async fn check_transaction(&self, symbol: &str, tx_id: &str) -> Result<()> {
        self.utxo_nursery.check_transaction(symbol, tx_id).await
    }

    fn relevant_tx_receiver(&self) -> broadcast::Receiver<RelevantTx> {
        self.utxo_nursery.relevant_tx_receiver()
    }
}

#[cfg(test)]
pub mod test {
    use super::*;
    use crate::api::ws::types::SwapStatus;
    use crate::cache::MemCache;
    use crate::db::helpers::web_hook::test::get_pool;
    use crate::swap::{AssetRescue, timeout_delta::PairTimeoutBlockDelta};
    use anyhow::Result;
    use async_trait::async_trait;
    use mockall::mock;
    use std::collections::HashMap;

    mock! {
        pub Manager {}

        impl Clone for Manager {
            fn clone(&self) -> Self;
        }

        #[async_trait]
        impl SwapManager for Manager {
            fn get_network(&self) -> crate::wallet::Network;
            fn get_currency(&self, symbol: &str) -> Option<Currency>;
            fn get_currencies(&self) -> &Currencies;
            fn get_timeouts(
                &self,
                receiving: &str,
                sending: &str,
                swap_type: SwapType,
            ) -> Result<(u64, u64)>;
            async fn claim_batch(&self, swap_ids: Vec<String>) -> anyhow::Result<(boltz_core::wrapper::Transaction, u64)>;
            fn get_asset_rescue(&self) -> Arc<AssetRescue>;
            fn listen_to_updates(&self) -> tokio::sync::broadcast::Receiver<SwapStatus>;
            async fn rescan_chains(
                &self,
                options: Option<Vec<RescanChainOptions>>,
            ) -> Result<Vec<RescanChainResult>>;
            async fn check_transaction(&self, symbol: &str, tx_id: &str) -> Result<()>;
            fn relevant_tx_receiver(&self) -> tokio::sync::broadcast::Receiver<RelevantTx>;
        }
    }

    #[tokio::test]
    async fn test_get_timeouts() {
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
        let pool = get_pool();
        let currencies = Arc::new(HashMap::new());
        let cancellation_token = CancellationToken::new();
        let manager = Manager {
            network: crate::wallet::Network::Regtest,
            update_tx: tokio::sync::broadcast::channel(100).0,
            funding_address_update_tx: tokio::sync::broadcast::channel(100).0,
            cancellation_token: cancellation_token.clone(),
            pool: pool.clone(),
            currencies: currencies.clone(),
            swap_repo: Arc::new(SwapHelperDatabase::new(pool.clone())),
            chain_swap_repo: Arc::new(ChainSwapHelperDatabase::new(pool.clone())),
            reverse_swap_repo: Arc::new(ReverseSwapHelperDatabase::new(pool.clone())),
            timeout_delta_provider: Arc::new(timeout_provider),
            utxo_nursery: UtxoNursery::new(
                cancellation_token.clone(),
                currencies.clone(),
                TxChecker::new(
                    Arc::new(ScriptPubKeyHelperDatabase::new(pool.clone())),
                    Arc::new(ChainSwapHelperDatabase::new(pool.clone())),
                    Arc::new(ReverseSwapHelperDatabase::new(pool.clone())),
                ),
                Arc::new(ChainTipHelperDatabase::new(pool.clone())),
            ),
            asset_rescue: Arc::new(AssetRescue::new(
                None,
                Cache::Memory(MemCache::new()),
                currencies.clone(),
                Arc::new(SwapHelperDatabase::new(pool.clone())),
                Arc::new(ChainSwapHelperDatabase::new(pool.clone())),
            )),
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

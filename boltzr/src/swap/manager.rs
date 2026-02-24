use super::PairConfig;
use super::timeout_delta::TimeoutDeltaProvider;
use crate::api::ws::types::{FundingAddressUpdate, SwapStatus, UpdateSender};
use crate::chain::mrh_watcher::MrhWatcher;
use crate::chain::types::Type;
use crate::currencies::{Currencies, Currency};
use crate::db::Pool;
use crate::db::helpers::chain_swap::{ChainSwapHelper, ChainSwapHelperDatabase};
use crate::db::helpers::chain_tip::{ChainTipHelper, ChainTipHelperDatabase};
use crate::db::helpers::funding_address::FundingAddressHelperDatabase;
use crate::db::helpers::referral::ReferralHelperDatabase;
use crate::db::helpers::reverse_swap::{ReverseSwapHelper, ReverseSwapHelperDatabase};
use crate::db::helpers::script_pubkey::{ScriptPubKeyHelper, ScriptPubKeyHelperDatabase};
use crate::db::helpers::swap::{SwapHelper, SwapHelperDatabase};
use crate::db::models::{SomeSwap, SwapType};
use crate::grpc::service::boltzr::ClaimBatchResponse;
use crate::service::funding_address_claimer::FundingAddressClaimer;
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
use boltz_cache::Cache;
use boltz_core::wrapper::InputDetail;
use diesel::ExpressionMethods;
use elements::hex::ToHex;
use futures_util::future::try_join_all;
use futures_util::{StreamExt, TryStreamExt};
use std::collections::{HashMap, HashSet};
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

    async fn claim_batch(&self, swap_ids: Vec<String>) -> Result<ClaimBatchResponse>;

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
    funding_address_update_tx: UpdateSender<FundingAddressUpdate>,
    swap_status_update_tx: UpdateSender<SwapStatus>,

    currencies: Currencies,
    cancellation_token: CancellationToken,

    pool: Pool,
    swap_repo: Arc<dyn SwapHelper + Sync + Send>,
    chain_swap_repo: Arc<dyn ChainSwapHelper + Sync + Send>,
    reverse_swap_repo: Arc<dyn ReverseSwapHelper + Sync + Send>,
    script_pubkey_repo: Arc<dyn ScriptPubKeyHelper + Sync + Send>,
    timeout_delta_provider: Arc<TimeoutDeltaProvider>,

    utxo_nursery: UtxoNursery,
    asset_rescue: Arc<AssetRescue>,
    funding_address_claimer: Arc<FundingAddressClaimer>,
}

impl Manager {
    #[allow(clippy::too_many_arguments)]
    pub fn new(
        cancellation_token: CancellationToken,
        asset_rescue_config: Option<AssetRescueConfig>,
        currencies: Currencies,
        cache: Cache,
        pool: Pool,
        network: crate::wallet::Network,
        pairs: &[PairConfig],
        funding_address_update_tx: UpdateSender<FundingAddressUpdate>,
        swap_status_update_tx: UpdateSender<SwapStatus>,
    ) -> Result<Self> {
        let (update_tx, _) = broadcast::channel::<SwapStatus>(128);

        let swap_repo = Arc::new(SwapHelperDatabase::new(pool.clone()));
        let chain_swap_repo = Arc::new(ChainSwapHelperDatabase::new(pool.clone()));

        Ok(Manager {
            network,
            update_tx,
            funding_address_update_tx,
            swap_status_update_tx,
            currencies: currencies.clone(),
            cancellation_token: cancellation_token.clone(),
            pool: pool.clone(),
            swap_repo: swap_repo.clone(),
            chain_swap_repo: chain_swap_repo.clone(),
            reverse_swap_repo: Arc::new(ReverseSwapHelperDatabase::new(pool.clone())),
            script_pubkey_repo: Arc::new(ScriptPubKeyHelperDatabase::new(pool.clone())),
            timeout_delta_provider: Arc::new(TimeoutDeltaProvider::new(&currencies, pairs)?),
            utxo_nursery: UtxoNursery::new(
                cancellation_token,
                currencies.clone(),
                TxChecker::new(
                    Arc::new(ScriptPubKeyHelperDatabase::new(pool.clone())),
                    Arc::new(ChainSwapHelperDatabase::new(pool.clone())),
                    Arc::new(ReverseSwapHelperDatabase::new(pool.clone())),
                ),
                Arc::new(ChainTipHelperDatabase::new(pool.clone())),
            ),
            asset_rescue: Arc::new(AssetRescue::new(
                asset_rescue_config,
                cache,
                currencies.clone(),
                swap_repo,
                chain_swap_repo,
            )),
            funding_address_claimer: Arc::new(FundingAddressClaimer::new(
                Arc::new(FundingAddressHelperDatabase::new(pool)),
                currencies,
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
        let swap_status_rx = self.swap_status_update_tx.subscribe();
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
                funding_address_nursery
                    .start(relevant_tx_receiver, swap_status_rx)
                    .await;
            }),
        ])
        .await
        .unwrap();
    }

    async fn claim_regular_swaps(
        &self,
        claim_symbol: &str,
        regular_swaps: Vec<Box<dyn SomeSwap + Send>>,
        txids: &mut Vec<String>,
        fees_per_swap: &mut HashMap<String, u64>,
    ) -> Result<()> {
        let currency = self
            .get_currency(claim_symbol)
            .ok_or_else(|| anyhow!("currency not found"))?;
        let client = currency
            .chain
            .ok_or_else(|| anyhow!("chain client not found"))?;
        let wallet = currency.wallet.ok_or_else(|| anyhow!("wallet not found"))?;

        let regular_swap_ids: Vec<String> = regular_swaps.iter().map(|s| s.id()).collect();
        let inputs: Vec<InputDetail> = futures::stream::iter(regular_swaps)
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

        if inputs.is_empty() {
            return Ok(());
        }

        let fee = client.estimate_fee().await?;
        let address = boltz_core::Address::try_from(
            wallet
                .get_address(
                    None,
                    &wallet.label_batch_claim(
                        &regular_swap_ids
                            .iter()
                            .map(|id| id.as_str())
                            .collect::<Vec<_>>(),
                    ),
                )
                .await?
                .as_str(),
        )?;

        let (tx, fee) = match client.chain_type() {
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
        }?;

        let tx_hex = tx.serialize().to_hex();
        let txid = client.send_raw_transaction(&tx_hex).await?;

        // Distribute the batch claim fee evenly across regular (non-funding-address) swaps
        let fee_per_swap = (fee as f64 / regular_swap_ids.len() as f64).ceil() as u64;
        for id in &regular_swap_ids {
            fees_per_swap.insert(id.clone(), fee_per_swap);
        }

        txids.push(txid);

        Ok(())
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
    async fn claim_batch(&self, swap_ids: Vec<String>) -> Result<ClaimBatchResponse> {
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
                .clone()
                .into_iter()
                .map(|s| Box::new(s) as Box<dyn SomeSwap + Send>),
        );
        swaps.extend(
            chain_swaps
                .clone()
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
        let claimable = self
            .funding_address_claimer
            .prepare_claimable_swaps(submarines, chain_swaps)
            .await?;

        let funding_claimable_ids: HashSet<String> =
            claimable.iter().map(|c| c.id.clone()).collect();

        let mut fees_per_swap: HashMap<String, u64> = HashMap::new();
        let mut txids = Vec::new();

        self.funding_address_claimer
            .claim_batch(&claimable, &mut fees_per_swap, &mut txids)
            .await?;

        let regular_swaps: Vec<_> = swaps
            .into_iter()
            .filter(|swap| !funding_claimable_ids.contains(&swap.id()))
            .collect();

        self.claim_regular_swaps(&claim_symbol, regular_swaps, &mut txids, &mut fees_per_swap)
            .await?;

        Ok(ClaimBatchResponse {
            transaction_ids: txids,
            fees_per_swap,
        })
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
            &self.script_pubkey_repo,
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
    use crate::db::helpers::web_hook::test::get_pool;
    use crate::swap::{AssetRescue, timeout_delta::PairTimeoutBlockDelta};
    use anyhow::Result;
    use async_trait::async_trait;
    use boltz_cache::MemCache;
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
            async fn claim_batch(&self, swap_ids: Vec<String>) -> anyhow::Result<ClaimBatchResponse>;
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

        let timeout_provider =
            TimeoutDeltaProvider::new(&Arc::new(HashMap::new()), &pairs).unwrap();
        let pool = get_pool();
        let currencies = Arc::new(HashMap::new());
        let cancellation_token = CancellationToken::new();
        let manager = Manager {
            network: crate::wallet::Network::Regtest,
            update_tx: tokio::sync::broadcast::channel(100).0,
            funding_address_update_tx: tokio::sync::broadcast::channel(100).0,
            swap_status_update_tx: tokio::sync::broadcast::channel(100).0,
            cancellation_token: cancellation_token.clone(),
            pool: pool.clone(),
            currencies: currencies.clone(),
            swap_repo: Arc::new(SwapHelperDatabase::new(pool.clone())),
            chain_swap_repo: Arc::new(ChainSwapHelperDatabase::new(pool.clone())),
            reverse_swap_repo: Arc::new(ReverseSwapHelperDatabase::new(pool.clone())),
            script_pubkey_repo: Arc::new(ScriptPubKeyHelperDatabase::new(pool.clone())),
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
            funding_address_claimer: Arc::new(FundingAddressClaimer::new(
                Arc::new(FundingAddressHelperDatabase::new(pool.clone())),
                currencies.clone(),
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

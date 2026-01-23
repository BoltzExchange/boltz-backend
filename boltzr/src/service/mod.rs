use crate::cache::Cache;
use crate::currencies::Currencies;
use crate::db::helpers::chain_swap::ChainSwapHelper;
use crate::db::helpers::funding_address::FundingAddressHelper;
use crate::db::helpers::keys::KeysHelper;
use crate::db::helpers::reverse_swap::ReverseSwapHelper;
use crate::db::helpers::swap::SwapHelper;
use crate::service::country_codes::CountryCodes;
use crate::service::funding_address::{FundingAddressConfig, FundingAddressService};
use crate::service::lightning_info::{ClnLightningInfo, LightningInfo};
use crate::service::pair_stats::PairStatsFetcher;
use crate::service::prometheus::{CachedPrometheusClient, RawPrometheusClient};
use crate::service::rescue::SwapRescue;
use anyhow::Result;
use std::sync::Arc;
use tracing::warn;

mod country_codes;
pub mod funding_address;
pub mod funding_address_claimer;
mod funding_address_signer;
#[cfg(test)]
mod funding_address_test_utils;
mod lightning_info;
mod pair_stats;
mod prometheus;
mod pubkey_iterator;
mod rescue;

pub use country_codes::MarkingsConfig;
pub use funding_address::*;
pub use funding_address_signer::*;
pub use pair_stats::HistoricalConfig;
pub use pubkey_iterator::{
    KeyVecIterator, MAX_GAP_LIMIT, Pagination, PubkeyIterator, SingleKeyIterator, XpubIterator,
};

pub struct Service {
    pub swap_rescue: SwapRescue,
    pub funding_address: FundingAddressService,
    pub country_codes: CountryCodes,
    pub lightning_info: Box<dyn LightningInfo + Send + Sync>,
    pub pair_stats: Option<PairStatsFetcher>,
}

impl Service {
    #[allow(clippy::too_many_arguments)]
    pub fn new(
        swap_helper: Arc<dyn SwapHelper + Sync + Send>,
        chain_swap_helper: Arc<dyn ChainSwapHelper + Sync + Send>,
        reverse_swap_helper: Arc<dyn ReverseSwapHelper + Sync + Send>,
        currencies: Currencies,
        funding_address_helper: Arc<dyn FundingAddressHelper + Sync + Send>,
        keys_helper: Arc<dyn KeysHelper + Sync + Send>,
        markings_config: Option<MarkingsConfig>,
        historical_config: Option<HistoricalConfig>,
        funding_address_config: Option<FundingAddressConfig>,
        cache: Cache,
    ) -> Self {
        Self {
            swap_rescue: SwapRescue::new(
                cache.clone(),
                swap_helper.clone(),
                chain_swap_helper.clone(),
                reverse_swap_helper,
                currencies.clone(),
            ),
            funding_address: FundingAddressService::new(
                funding_address_config,
                funding_address_helper,
                keys_helper,
                swap_helper.clone(),
                chain_swap_helper.clone(),
                currencies.clone(),
                cache.clone(),
            ),
            country_codes: CountryCodes::new(markings_config),
            lightning_info: Box::new(ClnLightningInfo::new(cache.clone(), currencies)),
            pair_stats: if let Some(config) = historical_config {
                Some(PairStatsFetcher::new(
                    Arc::new(CachedPrometheusClient::new(
                        RawPrometheusClient::new(&config.prometheus_endpoint),
                        cache,
                        // The cached result being a little stale is fine
                        // for historical pair stats
                        false,
                    )),
                    config.instance,
                ))
            } else {
                warn!("Historical data config is missing");
                None
            },
        }
    }

    pub async fn start(&self) -> Result<()> {
        self.country_codes.update().await?;
        Ok(())
    }
}

#[cfg(test)]
pub mod test {
    use super::*;
    use crate::cache::{Cache, MemCache};
    use crate::currencies::{Currencies, Currency};
    use crate::db::helpers::chain_swap::test::MockChainSwapHelper;
    use crate::db::helpers::funding_address::FundingAddressHelperDatabase;
    use crate::db::helpers::keys::KeysHelperDatabase;
    use crate::db::helpers::reverse_swap::test::MockReverseSwapHelper;
    use crate::db::helpers::swap::test::MockSwapHelper;
    use crate::db::helpers::web_hook::test::get_pool;
    use crate::service::prometheus::test::MockPrometheus;
    use crate::wallet::{Bitcoin, Elements, Network, Wallet};
    use std::collections::HashMap;

    pub use pair_stats::PairStats;
    pub use rescue::RescuableSwap;

    pub async fn get_test_currencies() -> Currencies {
        let btc_client = Arc::new(crate::chain::chain_client::test::get_client().await);
        let lbtc_client = Arc::new(crate::chain::elements_client::test::get_client().0);
        let lbtc_wallet = Some(Arc::new(
            Elements::new(
                Network::Regtest,
                &crate::wallet::test::get_seed(),
                "m/0/1".to_string(),
                lbtc_client.clone(),
            )
            .unwrap(),
        ) as Arc<dyn Wallet + Send + Sync>);

        let btc_wallet = Some(Arc::new(
            Bitcoin::new(
                Network::Regtest,
                &crate::wallet::test::get_seed(),
                "m/0/0".to_string(),
                btc_client.clone(),
            )
            .unwrap(),
        ) as Arc<dyn Wallet + Send + Sync>);

        Arc::new(HashMap::from([
            (
                "BTC".to_string(),
                Currency {
                    network: Network::Regtest,
                    wallet: btc_wallet,
                    chain: Some(btc_client),
                    cln: None,
                    lnd: None,
                    evm_manager: None,
                },
            ),
            (
                "L-BTC".to_string(),
                Currency {
                    network: Network::Regtest,
                    wallet: lbtc_wallet,
                    chain: Some(lbtc_client),
                    cln: None,
                    lnd: None,
                    evm_manager: None,
                },
            ),
        ]))
    }

    impl Service {
        pub fn new_mocked(with_pair_stats: bool, currencies: Option<Currencies>) -> Self {
            let mut swap_helper = MockSwapHelper::new();
            swap_helper
                .expect_get_all_nullable()
                .returning(|_| Ok(vec![]));

            let mut chain_swap_helper = MockChainSwapHelper::new();
            chain_swap_helper
                .expect_get_by_data_nullable()
                .returning(|_| Ok(vec![]));

            let mut reverse_swap_helper = MockReverseSwapHelper::new();
            reverse_swap_helper
                .expect_get_all_nullable()
                .returning(|_| Ok(vec![]));

            // Create a separate swap helper for funding address service
            let mut funding_swap_helper = MockSwapHelper::new();
            funding_swap_helper
                .expect_get_by_id()
                .returning(|_| Ok(Default::default()));

            let pool = get_pool();
            let currencies = currencies.unwrap_or_default();
            Self {
                swap_rescue: SwapRescue::new(
                    Cache::Memory(MemCache::new()),
                    Arc::new(swap_helper),
                    Arc::new(chain_swap_helper),
                    Arc::new(reverse_swap_helper),
                    currencies.clone(),
                ),
                funding_address: FundingAddressService::new(
                    None,
                    Arc::new(FundingAddressHelperDatabase::new(pool.clone())),
                    Arc::new(KeysHelperDatabase::new(pool.clone())),
                    Arc::new(funding_swap_helper),
                    Arc::new(MockChainSwapHelper::new()),
                    currencies.clone(),
                    Cache::Memory(MemCache::new()),
                ),
                lightning_info: Box::new(ClnLightningInfo::new(
                    Cache::Memory(MemCache::new()),
                    currencies,
                )),
                country_codes: CountryCodes::new(None),
                pair_stats: if with_pair_stats {
                    Some(PairStatsFetcher::new(
                        Arc::new(MockPrometheus {}),
                        "".to_string(),
                    ))
                } else {
                    None
                },
            }
        }

        pub fn new_mocked_prometheus(with_pair_stats: bool) -> Self {
            Self::new_mocked(with_pair_stats, None)
        }
    }
}

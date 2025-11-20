use crate::cache::Cache;
use crate::currencies::Currencies;
use crate::db::helpers::chain_swap::ChainSwapHelper;
use crate::db::helpers::reverse_swap::ReverseSwapHelper;
use crate::db::helpers::swap::SwapHelper;
use crate::service::country_codes::CountryCodes;
use crate::service::lightning_info::{ClnLightningInfo, LightningInfo};
use crate::service::pair_stats::PairStatsFetcher;
use crate::service::prometheus::{CachedPrometheusClient, RawPrometheusClient};
use crate::service::rescue::SwapRescue;
use anyhow::Result;
use std::sync::Arc;
use tracing::warn;

mod country_codes;
mod lightning_info;
mod pair_stats;
mod prometheus;
mod pubkey_iterator;
mod rescue;

pub use country_codes::MarkingsConfig;
pub use pair_stats::HistoricalConfig;
pub use pubkey_iterator::{KeyVecIterator, PubkeyIterator, SingleKeyIterator, XpubIterator};
pub use rescue::MAX_BATCH_SIZE;

pub struct Service {
    pub swap_rescue: SwapRescue,
    pub country_codes: CountryCodes,
    pub lightning_info: Box<dyn LightningInfo + Send + Sync>,
    pub pair_stats: Option<PairStatsFetcher>,
}

impl Service {
    pub fn new(
        swap_helper: Arc<dyn SwapHelper + Sync + Send>,
        chain_swap_helper: Arc<dyn ChainSwapHelper + Sync + Send>,
        reverse_swap_helper: Arc<dyn ReverseSwapHelper + Sync + Send>,
        currencies: Currencies,
        markings_config: Option<MarkingsConfig>,
        historical_config: Option<HistoricalConfig>,
        cache: Cache,
    ) -> Self {
        Self {
            swap_rescue: SwapRescue::new(
                swap_helper,
                chain_swap_helper,
                reverse_swap_helper,
                currencies.clone(),
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
    use crate::db::helpers::QueryResponse;
    use crate::db::helpers::chain_swap::{ChainSwapCondition, ChainSwapDataNullableCondition};
    use crate::db::helpers::reverse_swap::{
        ReverseSwapCondition, ReverseSwapHelper, ReverseSwapNullableCondition,
    };
    use crate::db::helpers::swap::{SwapCondition, SwapHelper, SwapNullableCondition};
    use crate::db::models::{ChainSwapInfo, ReverseRoutingHint, ReverseSwap, Swap};
    use crate::service::prometheus::test::MockPrometheus;
    use crate::swap::SwapUpdate;
    use mockall::mock;
    use std::collections::HashMap;

    pub use pair_stats::PairStats;
    pub use rescue::RescuableSwap;

    mock! {
        SwapHelper {}

        impl Clone for SwapHelper {
            fn clone(&self) -> Self;
        }

        impl SwapHelper for SwapHelper {
            fn get_all(&self, condition: SwapCondition) -> QueryResponse<Vec<Swap>>;
            fn get_all_nullable(&self, condition: SwapNullableCondition) -> QueryResponse<Vec<Swap>>;
            fn update_status(
                &self,
                id: &str,
                status: SwapUpdate,
                failure_reason: Option<String>,
            ) -> QueryResponse<usize>;
        }
    }

    mock! {
        ChainSwapHelper {}

        impl Clone for ChainSwapHelper {
            fn clone(&self) -> Self;
        }

        impl ChainSwapHelper for ChainSwapHelper {
            fn get_by_id(&self, id: &str) -> QueryResponse<ChainSwapInfo>;
            fn get_all(
                &self,
                condition: ChainSwapCondition,
            ) -> QueryResponse<Vec<ChainSwapInfo>>;
            fn get_by_data_nullable(
                &self,
                condition: ChainSwapDataNullableCondition,
            ) -> QueryResponse<Vec<ChainSwapInfo>>;
        }
    }

    mock! {
        ReverseSwapHelper {}

        impl Clone for ReverseSwapHelper {
            fn clone(&self) -> Self;
        }

        impl ReverseSwapHelper for ReverseSwapHelper {
            fn get_by_id(&self, id: &str) -> QueryResponse<ReverseSwap>;
            fn get_all(&self, condition: ReverseSwapCondition) -> QueryResponse<Vec<ReverseSwap>>;
            fn get_all_nullable(&self, condition: ReverseSwapNullableCondition) -> QueryResponse<Vec<ReverseSwap>>;
            fn get_routing_hint(&self, id: &str) -> QueryResponse<Option<ReverseRoutingHint>>;
            fn get_routing_hints(&self, ids: Vec<Vec<u8>>) -> QueryResponse<Vec<ReverseRoutingHint>>;
        }
    }

    impl Service {
        pub fn new_mocked_prometheus(with_pair_stats: bool) -> Self {
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

            Self {
                swap_rescue: SwapRescue::new(
                    Arc::new(swap_helper),
                    Arc::new(chain_swap_helper),
                    Arc::new(reverse_swap_helper),
                    Arc::new(HashMap::new()),
                ),
                lightning_info: Box::new(ClnLightningInfo::new(
                    Cache::Memory(MemCache::new()),
                    Arc::new(HashMap::new()),
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
    }
}

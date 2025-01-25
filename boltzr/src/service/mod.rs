use crate::cache::Cache;
use crate::service::country_codes::CountryCodes;
use crate::service::pair_stats::PairStatsFetcher;
use crate::service::prometheus::{CachedPrometheusClient, RawPrometheusClient};
use anyhow::Result;
use std::fmt::Debug;
use std::sync::Arc;
use tracing::warn;

mod country_codes;
mod lightning_info;
mod pair_stats;
mod prometheus;

use crate::currencies::Currencies;
use crate::service::lightning_info::{ClnLightningInfo, LightningInfo};
pub use country_codes::MarkingsConfig;
pub use lightning_info::ChannelFetchError;
pub use pair_stats::HistoricalConfig;

pub struct Service {
    pub country_codes: CountryCodes,
    pub lightning_info: Box<dyn LightningInfo + Send + Sync>,
    pub pair_stats: Option<PairStatsFetcher>,
}

impl Service {
    pub fn new<C: Cache + Clone + Debug + Sync + Send + 'static>(
        currencies: Currencies,
        markings_config: Option<MarkingsConfig>,
        historical_config: Option<HistoricalConfig>,
        cache: Option<C>,
    ) -> Self {
        Self {
            country_codes: CountryCodes::new(markings_config),
            lightning_info: Box::new(ClnLightningInfo::new(cache.clone(), currencies)),
            pair_stats: if let Some(config) = historical_config {
                Some(PairStatsFetcher::new(
                    if let Some(cache) = cache {
                        Arc::new(CachedPrometheusClient::new(
                            RawPrometheusClient::new(&config.prometheus_endpoint),
                            cache,
                            // The cached result being a little stale is fine
                            // for historical pair stats
                            false,
                        ))
                    } else {
                        Arc::new(RawPrometheusClient::new(&config.prometheus_endpoint))
                    },
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
    use crate::cache::Redis;
    use crate::service::prometheus::test::MockPrometheus;
    use std::collections::HashMap;

    pub use pair_stats::PairStats;

    impl Service {
        pub fn new_mocked_prometheus(with_pair_stats: bool) -> Self {
            Self {
                lightning_info: Box::new(ClnLightningInfo::<Redis>::new(
                    None,
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

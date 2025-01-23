use crate::cache::Cache;
use crate::service::country_codes::CountryCodes;
use crate::service::pair_stats::PairStatsFetcher;
use crate::service::prometheus::{CachedPrometheusClient, RawPrometheusClient};
use anyhow::Result;
use std::fmt::Debug;
use std::sync::Arc;
use tracing::warn;

mod country_codes;
mod pair_stats;
mod prometheus;

pub use country_codes::MarkingsConfig;
pub use pair_stats::HistoricalConfig;

pub struct Service {
    pub pair_stats: Option<PairStatsFetcher>,
    pub country_codes: CountryCodes,
}

impl Service {
    pub fn new<C: Cache + Clone + Debug + Sync + Send + 'static>(
        markings_config: Option<MarkingsConfig>,
        historical_config: Option<HistoricalConfig>,
        cache: Option<C>,
    ) -> Self {
        Self {
            country_codes: CountryCodes::new(markings_config),
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
    use crate::service::prometheus::test::MockPrometheus;

    pub use pair_stats::PairStats;

    impl Service {
        pub fn new_mocked_prometheus(with_pair_stats: bool) -> Self {
            Self {
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

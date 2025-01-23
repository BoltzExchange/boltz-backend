use crate::db::models::SwapType;
use crate::service::prometheus::{
    max_routing_fee_query, pair_fees_query, PrometheusClient, PROMETHEUS_QUERY_STEP,
};
use anyhow::Result;
use futures_util::try_join;
use serde::{Deserialize, Serialize};
use std::fmt::Debug;
use std::sync::Arc;
use std::time::{SystemTime, UNIX_EPOCH};

#[derive(Deserialize, Serialize, Debug, Clone)]
pub struct HistoricalConfig {
    #[serde(rename = "prometheusEndpoint")]
    pub prometheus_endpoint: String,

    pub instance: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct PairStats {
    pub fee: Vec<(u64, f64)>,

    #[serde(rename = "maximalRoutingFee", skip_serializing_if = "Option::is_none")]
    pub maximal_routing_fee: Option<Vec<(u64, f64)>>,
}

#[derive(Clone)]
pub struct PairStatsFetcher {
    prometheus_client: Arc<dyn PrometheusClient + Send + Sync>,

    instance: String,
}

impl PairStatsFetcher {
    pub fn new(p: Arc<dyn PrometheusClient + Send + Sync>, instance: String) -> Self {
        Self {
            instance,
            prometheus_client: p,
        }
    }

    pub async fn get_pair_stats(
        &self,
        pair: &str,
        kind: SwapType,
        referral: &str,
    ) -> Result<Option<PairStats>> {
        let (start, end) = Self::get_start_end()?;
        let (fee, maximal_routing_fee) = try_join!(
            self.fetch_fees(pair, kind, referral, start, end),
            self.fetch_max_routing_fee(pair, kind, referral, start, end)
        )?;

        Ok(fee.map(|fee| PairStats {
            fee,
            maximal_routing_fee,
        }))
    }

    async fn fetch_fees(
        &self,
        pair: &str,
        kind: SwapType,
        referral: &str,
        start: u64,
        end: u64,
    ) -> Result<Option<Vec<(u64, f64)>>> {
        let fees = self
            .prometheus_client
            .query(
                &pair_fees_query(&self.instance, pair, kind, referral),
                PROMETHEUS_QUERY_STEP,
                start,
                end,
            )
            .await?;
        if fees.len() != 1 {
            // No info available for the pair
            return Ok(None);
        }

        Ok(Some(Self::format_values(&fees[0].values)))
    }

    async fn fetch_max_routing_fee(
        &self,
        pair: &str,
        kind: SwapType,
        referral: &str,
        start: u64,
        end: u64,
    ) -> Result<Option<Vec<(u64, f64)>>> {
        if kind != SwapType::Submarine {
            return Ok(None);
        }

        let max_routing_fees = self
            .prometheus_client
            .query(
                &max_routing_fee_query(&self.instance, pair, referral),
                PROMETHEUS_QUERY_STEP,
                start,
                end,
            )
            .await?;
        if max_routing_fees.len() != 1 {
            // No info available for the pair
            return Ok(None);
        }

        Ok(Some(Self::format_values(&max_routing_fees[0].values)))
    }

    fn format_values(values: &[(u64, String)]) -> Vec<(u64, f64)> {
        values
            .iter()
            .map(|(time, value)| (*time, value.parse().unwrap_or(0.0)))
            .collect()
    }

    fn get_start_end() -> Result<(u64, u64)> {
        let end = SystemTime::now().duration_since(UNIX_EPOCH)?.as_secs();
        Ok((end - 60 * 60 * 24 * 7, end))
    }
}

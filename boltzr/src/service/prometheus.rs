use crate::cache::Cache;
use crate::db::models::SwapType;
use anyhow::{Result, anyhow};
use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use std::fmt::Debug;
use std::hash::{DefaultHasher, Hash, Hasher};

pub const PROMETHEUS_QUERY_STEP: &str = "10m";
const PROMETHEUS_QUERY_TTL: u64 = 120;

#[derive(Deserialize, Debug)]
struct PrometheusError {
    error: String,
}

#[derive(Deserialize, Serialize, PartialEq, Debug)]
pub struct RangeResult {
    pub values: Vec<(u64, String)>,
}

#[derive(Deserialize, Debug)]
struct QueryRangeData {
    result: Vec<RangeResult>,
}

#[derive(Deserialize, Debug)]
struct QueryRangeSuccess {
    data: QueryRangeData,
}

#[derive(Deserialize, Debug)]
#[serde(tag = "status")]
enum QueryRangeResponse {
    #[serde(rename = "success")]
    Success(QueryRangeSuccess),
    #[serde(rename = "error")]
    Error(PrometheusError),
}

#[async_trait]
pub trait PrometheusClient {
    async fn query(
        &self,
        query: &str,
        step: &str,
        start: u64,
        end: u64,
    ) -> Result<Vec<RangeResult>>;
}

#[derive(Debug, Clone)]
pub struct RawPrometheusClient {
    endpoint: String,
}

impl RawPrometheusClient {
    pub fn new(endpoint: &str) -> Self {
        Self {
            endpoint: endpoint.strip_suffix("/").unwrap_or(endpoint).to_string(),
        }
    }
}

#[async_trait]
impl PrometheusClient for RawPrometheusClient {
    async fn query(
        &self,
        query: &str,
        step: &str,
        start: u64,
        end: u64,
    ) -> Result<Vec<RangeResult>> {
        let url = reqwest::Url::parse_with_params(
            &format!("{}/api/v1/query_range", self.endpoint),
            &[
                ("query", query),
                ("step", step),
                ("start", &start.to_string()),
                ("end", &end.to_string()),
            ],
        )?;
        let res = reqwest::get(url)
            .await?
            .json::<QueryRangeResponse>()
            .await?;
        match res {
            QueryRangeResponse::Success(res) => Ok(res.data.result),
            QueryRangeResponse::Error(err) => Err(anyhow!(err.error)),
        }
    }
}

#[derive(Debug, Clone)]
pub struct CachedPrometheusClient<P>
where
    P: PrometheusClient + Clone + Debug + Sync,
{
    cache: Cache,
    client: P,
    include_start_end_in_key: bool,
}

impl<P> CachedPrometheusClient<P>
where
    P: PrometheusClient + Clone + Debug + Sync,
{
    pub fn new(client: P, cache: Cache, include_start_end_in_key: bool) -> Self {
        Self {
            cache,
            client,
            include_start_end_in_key,
        }
    }

    fn get_cache_key(&self, query: &str, step: &str, start: u64, end: u64) -> String {
        // Some caches might not like the unescaped query string, so we hash it
        let mut hasher = DefaultHasher::new();
        query.hash(&mut hasher);
        let key = format!("prometheus:query:{}:{}", hasher.finish(), step);

        if self.include_start_end_in_key {
            format!("{key}:{start}:{end}")
        } else {
            key
        }
    }
}

#[async_trait]
impl<P> PrometheusClient for CachedPrometheusClient<P>
where
    P: PrometheusClient + Clone + Debug + Sync,
{
    async fn query(
        &self,
        query: &str,
        step: &str,
        start: u64,
        end: u64,
    ) -> Result<Vec<RangeResult>> {
        let cache_key = self.get_cache_key(query, step, start, end);
        if let Some(cached) = self.cache.get(&cache_key).await? {
            return Ok(cached);
        }

        let res = self.client.query(query, step, start, end).await?;
        self.cache
            .set(&cache_key, &res, Some(PROMETHEUS_QUERY_TTL))
            .await?;

        Ok(res)
    }
}

pub fn pair_fees_query(instance: &str, pair: &str, kind: SwapType, referral: &str) -> String {
    format!(
        "boltz_pair_fees{{instance=\"{}\", pair=\"{}\", type=\"{}\", referral=\"{}\"}}",
        instance,
        pair,
        format_kind(kind),
        referral,
    )
}

pub fn max_routing_fee_query(instance: &str, pair: &str, referral: &str) -> String {
    format!(
        "boltz_pair_max_routing_fee{{instance=\"{instance}\", pair=\"{pair}\", referral=\"{referral}\"}}"
    )
}

fn format_kind(kind: SwapType) -> String {
    match kind {
        SwapType::Submarine => "swap",
        SwapType::Reverse => "reverse",
        SwapType::Chain => "chain",
    }
    .to_string()
}

#[cfg(test)]
pub mod test {
    use super::*;
    use crate::cache::{Cache, MemCache};
    use rstest::rstest;

    #[derive(Clone, Debug)]
    pub struct MockPrometheus {}

    #[async_trait]
    impl PrometheusClient for MockPrometheus {
        async fn query(
            &self,
            _query: &str,
            _step: &str,
            _start: u64,
            _end: u64,
        ) -> Result<Vec<RangeResult>> {
            Ok(vec![RangeResult {
                values: vec![(1, "data".to_owned())],
            }])
        }
    }

    #[tokio::test]
    async fn test_cache_query_set() {
        let prom = MockPrometheus {};
        let cache = MemCache::new();

        let client = CachedPrometheusClient::new(prom.clone(), Cache::Memory(cache.clone()), false);

        let query = "query";
        let step = "10m";

        assert!(cache.map.is_empty());

        let res = client.query(query, step, 1, 2).await.unwrap();
        assert_eq!(res, prom.query(query, step, 1, 2).await.unwrap());

        assert_eq!(cache.map.len(), 1);
        assert_eq!(
            cache
                .get::<Vec<RangeResult>>(&client.get_cache_key(query, step, 1, 2))
                .unwrap()
                .unwrap(),
            res
        );

        let cached_res = client.query(query, step, 1, 2).await.unwrap();
        assert_eq!(cached_res, res);
    }

    #[rstest]
    #[case("cpu", "10m", 1, 2)]
    #[case("ram", "1m", 21, 42)]
    #[case("network", "1h", 100, 250)]
    fn test_get_cache_key(
        #[case] query: &str,
        #[case] step: &str,
        #[case] start: u64,
        #[case] end: u64,
    ) {
        let client =
            CachedPrometheusClient::new(MockPrometheus {}, Cache::Memory(MemCache::new()), false);
        let mut hasher = DefaultHasher::new();
        query.hash(&mut hasher);
        assert_eq!(
            client.get_cache_key(query, step, start, end),
            format!("prometheus:query:{}:{}", hasher.finish(), step)
        );
    }

    #[rstest]
    #[case("cpu", "10m", 1, 2)]
    #[case("ram", "1m", 21, 42)]
    #[case("network", "1h", 100, 250)]
    fn test_get_cache_key_include_start_end_in_key(
        #[case] query: &str,
        #[case] step: &str,
        #[case] start: u64,
        #[case] end: u64,
    ) {
        let client =
            CachedPrometheusClient::new(MockPrometheus {}, Cache::Memory(MemCache::new()), true);
        let mut hasher = DefaultHasher::new();
        query.hash(&mut hasher);
        assert_eq!(
            client.get_cache_key(query, step, start, end),
            format!(
                "prometheus:query:{}:{}:{}:{}",
                hasher.finish(),
                step,
                start,
                end
            )
        );
    }

    #[rstest]
    #[case(SwapType::Submarine, "swap")]
    #[case(SwapType::Reverse, "reverse")]
    #[case(SwapType::Chain, "chain")]
    fn test_format_kind(#[case] kind: SwapType, #[case] expected: &str) {
        assert_eq!(format_kind(kind), expected);
    }
}

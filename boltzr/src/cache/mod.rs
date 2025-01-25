use anyhow::Result;
use async_trait::async_trait;
use serde::de::DeserializeOwned;
use serde::{Deserialize, Serialize};

mod redis;

pub use redis::*;

fn expiry_seconds_default() -> u64 {
    120
}

#[derive(Deserialize, Serialize, Debug, Clone)]
pub struct CacheConfig {
    #[serde(rename = "redisEndpoint")]
    pub redis_endpoint: String,

    #[serde(rename = "defaultExpiry", default = "expiry_seconds_default")]
    pub default_expiry: u64,
}

#[async_trait]
pub trait Cache {
    async fn get<V: DeserializeOwned>(&self, key: &str) -> Result<Option<V>>;
    async fn set<V: Serialize + Sync>(&self, key: &str, value: &V) -> Result<()>;
    async fn set_ttl<V: Serialize + Sync>(&self, key: &str, value: &V, ttl: u64) -> Result<()>;
}

#[cfg(test)]
pub mod test {
    use async_trait::async_trait;
    use dashmap::DashMap;
    use serde::de::DeserializeOwned;
    use serde::Serialize;
    use std::sync::Arc;

    #[derive(Clone, Debug)]
    pub struct MemCache {
        pub map: Arc<DashMap<String, String>>,
    }

    impl MemCache {
        pub fn new() -> Self {
            Self {
                map: Arc::new(DashMap::new()),
            }
        }
    }

    #[async_trait]
    impl super::Cache for MemCache {
        async fn get<V: DeserializeOwned>(&self, key: &str) -> anyhow::Result<Option<V>> {
            let res = self.map.get(key);
            Ok(match res {
                Some(res) => Some(serde_json::from_str(res.value())?),
                None => None,
            })
        }

        async fn set<V: Serialize + Sync>(&self, key: &str, value: &V) -> anyhow::Result<()> {
            self.map
                .insert(key.to_owned(), serde_json::to_string(value)?.to_string());
            Ok(())
        }

        async fn set_ttl<V: Serialize + Sync>(
            &self,
            key: &str,
            value: &V,
            _ttl: u64,
        ) -> anyhow::Result<()> {
            self.set(key, value).await
        }
    }
}

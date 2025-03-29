use anyhow::Result;
use serde::de::DeserializeOwned;
use serde::{Deserialize, Serialize};

mod memcache;
mod redis;

pub use memcache::*;
pub use redis::*;

#[derive(Deserialize, Serialize, Debug, Clone)]
pub struct CacheConfig {
    #[serde(rename = "redisEndpoint")]
    pub redis_endpoint: String,
}

#[derive(Debug, Clone)]
pub enum Cache {
    Redis(Redis),
    Memory(MemCache),
}

impl Cache {
    pub async fn get<V: DeserializeOwned>(&self, key: &str) -> Result<Option<V>> {
        match self {
            Cache::Redis(redis) => redis.get(key).await,
            Cache::Memory(memory) => memory.get(key),
        }
    }

    pub async fn set<V: Serialize + Sync>(
        &self,
        key: &str,
        value: &V,
        ttl: Option<u64>,
    ) -> Result<()> {
        match self {
            Cache::Redis(redis) => redis.set(key, value, ttl).await,
            Cache::Memory(memory) => memory.set(key, value, ttl),
        }
    }
}

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
    pub async fn get<V: DeserializeOwned>(&self, key: &str, field: &str) -> Result<Option<V>> {
        match self {
            Cache::Redis(redis) => redis.get(key, field).await,
            Cache::Memory(memory) => memory.get(key, field),
        }
    }

    pub async fn get_multiple<V: DeserializeOwned>(
        &self,
        key: &str,
        fields: &[&str],
    ) -> Result<Vec<Option<V>>> {
        match self {
            Cache::Redis(redis) => redis.get_multiple(key, fields).await,
            Cache::Memory(memory) => memory.get_multiple(key, fields),
        }
    }

    pub async fn set<V: Serialize + Sync>(
        &self,
        key: &str,
        field: &str,
        value: &V,
        ttl: Option<u64>,
    ) -> Result<()> {
        match self {
            Cache::Redis(redis) => redis.set(key, field, value, ttl).await,
            Cache::Memory(memory) => memory.set(key, field, value, ttl),
        }
    }

    pub async fn take<V: DeserializeOwned>(&self, key: &str, field: &str) -> Result<Option<V>> {
        match self {
            Cache::Redis(redis) => redis.take(key, field).await,
            Cache::Memory(memory) => memory.take(key, field),
        }
    }

    pub async fn delete(&self, key: &str, field: &str) -> Result<()> {
        match self {
            Cache::Redis(redis) => redis.delete(key, field).await,
            Cache::Memory(memory) => memory.delete(key, field),
        }
    }
}

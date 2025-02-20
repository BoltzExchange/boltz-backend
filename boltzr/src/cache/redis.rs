use crate::cache::{Cache, CacheConfig};
use anyhow::Result;
use async_trait::async_trait;
use redis::Client;
use redis::aio::MultiplexedConnection;
use serde::Serialize;
use serde::de::DeserializeOwned;
use tracing::info;

#[derive(Debug, Clone)]
pub struct Redis {
    default_expiry: u64,
    connection: MultiplexedConnection,
}

impl Redis {
    pub async fn new(config: &CacheConfig) -> Result<Self> {
        let client = Client::open(&*config.redis_endpoint)?;

        let cache = Self {
            default_expiry: config.default_expiry,
            connection: client.get_multiplexed_tokio_connection().await?,
        };
        info!("Connected to Redis cache");
        Ok(cache)
    }
}

#[async_trait]
impl Cache for Redis {
    async fn get<V: DeserializeOwned>(&self, key: &str) -> Result<Option<V>> {
        let res: Option<String> = redis::cmd("GET")
            .arg(key)
            .query_async(&mut self.connection.clone())
            .await?;

        Ok(match res {
            Some(res) => Some(serde_json::from_str(&res)?),
            None => None,
        })
    }

    async fn set<V: Serialize + Sync>(&self, key: &str, value: &V) -> Result<()> {
        self.set_ttl(key, value, self.default_expiry).await
    }

    async fn set_ttl<V: Serialize + Sync>(&self, key: &str, value: &V, ttl: u64) -> Result<()> {
        redis::cmd("SET")
            .arg(key)
            .arg(serde_json::to_string(value)?)
            .arg("EX")
            .arg(ttl)
            .exec_async(&mut self.connection.clone())
            .await?;
        Ok(())
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use serde::Deserialize;

    pub const REDIS_ENDPOINT: &str = "redis://127.0.0.1:6379";

    #[derive(Serialize, Deserialize, PartialEq, Debug)]
    struct Data {
        data: String,
    }

    #[tokio::test]
    async fn test_get_set() {
        let cache = Redis::new(&CacheConfig {
            redis_endpoint: REDIS_ENDPOINT.to_string(),
            default_expiry: 120,
        })
        .await
        .unwrap();

        let key = "test:data";
        let data = Data {
            data: "is super hard to compute".to_string(),
        };

        cache.set(key, &data).await.unwrap();
        assert_eq!(cache.get::<Data>(key).await.unwrap().unwrap(), data);
    }

    #[tokio::test]
    async fn test_get_empty() {
        let cache = Redis::new(&CacheConfig {
            redis_endpoint: REDIS_ENDPOINT.to_string(),
            default_expiry: 120,
        })
        .await
        .unwrap();

        assert!(cache.get::<Data>("empty").await.unwrap().is_none());
    }

    #[tokio::test]
    async fn test_set_default_ttl() {
        let default_expiry = 120;
        let cache = Redis::new(&CacheConfig {
            default_expiry,
            redis_endpoint: REDIS_ENDPOINT.to_string(),
        })
        .await
        .unwrap();

        let key = "test:ttl_default";

        cache
            .set(
                key,
                &Data {
                    data: "ttl".to_string(),
                },
            )
            .await
            .unwrap();

        let ttl: u64 = redis::cmd("TTL")
            .arg(key)
            .query_async(&mut cache.connection.clone())
            .await
            .unwrap();

        assert!(ttl >= default_expiry - 1 && ttl <= default_expiry);
    }

    #[tokio::test]
    async fn test_set_ttl() {
        let cache = Redis::new(&CacheConfig {
            default_expiry: 120,
            redis_endpoint: REDIS_ENDPOINT.to_string(),
        })
        .await
        .unwrap();

        let key = "test:ttl";

        let ttl_set = 21;
        cache
            .set_ttl(
                key,
                &Data {
                    data: "ttl".to_string(),
                },
                ttl_set,
            )
            .await
            .unwrap();

        let ttl: u64 = redis::cmd("TTL")
            .arg(key)
            .query_async(&mut cache.connection.clone())
            .await
            .unwrap();

        assert!(ttl >= ttl_set - 1 && ttl <= ttl_set);
    }
}

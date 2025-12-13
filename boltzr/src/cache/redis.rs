use crate::cache::CacheConfig;
use anyhow::Result;
use redis::Client;
use redis::aio::MultiplexedConnection;
use serde::Serialize;
use serde::de::DeserializeOwned;
use tracing::info;

#[derive(Debug, Clone)]
pub struct Redis {
    connection: MultiplexedConnection,
}

impl Redis {
    pub async fn new(config: &CacheConfig) -> Result<Self> {
        let client = Client::open(&*config.redis_endpoint)?;

        let cache = Self {
            connection: client.get_multiplexed_async_connection().await?,
        };
        info!("Connected to Redis cache");
        Ok(cache)
    }
}

impl Redis {
    pub async fn get<V: DeserializeOwned>(&self, key: &str, field: &str) -> Result<Option<V>> {
        let res: Option<String> = redis::cmd("HGET")
            .arg(key)
            .arg(field)
            .query_async(&mut self.connection.clone())
            .await?;

        Ok(match res {
            Some(res) => Some(serde_json::from_str(&res)?),
            None => None,
        })
    }

    pub async fn set<V: Serialize + Sync>(
        &self,
        key: &str,
        field: &str,
        value: &V,
        ttl: Option<u64>,
    ) -> Result<()> {
        let json_value = serde_json::to_string(value)?;
        let mut pipe = redis::pipe();
        pipe.atomic();

        pipe.cmd("HSET")
            .arg(key)
            .arg(field)
            .arg(&json_value)
            .ignore();

        if let Some(ttl) = ttl {
            pipe.cmd("HEXPIRE")
                .arg(key)
                .arg(ttl)
                .arg("FIELDS")
                .arg(1)
                .arg(field)
                .ignore();
        }

        pipe.exec_async(&mut self.connection.clone()).await?;
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
        })
        .await
        .unwrap();

        let key = "test";
        let field = "data";
        let data = Data {
            data: "is super hard to compute".to_string(),
        };

        cache.set(key, field, &data, None).await.unwrap();
        assert_eq!(cache.get::<Data>(key, field).await.unwrap().unwrap(), data);
    }

    #[tokio::test]
    async fn test_get_empty() {
        let cache = Redis::new(&CacheConfig {
            redis_endpoint: REDIS_ENDPOINT.to_string(),
        })
        .await
        .unwrap();

        assert!(cache.get::<Data>("empty", "field").await.unwrap().is_none());
    }

    #[tokio::test]
    async fn test_set() {
        let cache = Redis::new(&CacheConfig {
            redis_endpoint: REDIS_ENDPOINT.to_string(),
        })
        .await
        .unwrap();

        let key = "test";
        let field = "no_ttl";

        cache
            .set(
                key,
                field,
                &Data {
                    data: "ttl".to_string(),
                },
                None,
            )
            .await
            .unwrap();

        let ttl: u64 = redis::cmd("FIELDTTL")
            .arg(key)
            .arg(field)
            .query_async(&mut cache.connection.clone())
            .await
            .unwrap();

        assert!(ttl >= 18446744073709551610);
    }

    #[tokio::test]
    async fn test_set_ttl() {
        let cache = Redis::new(&CacheConfig {
            redis_endpoint: REDIS_ENDPOINT.to_string(),
        })
        .await
        .unwrap();

        let key = "test";
        let field = "ttl";

        let ttl_set = 21;
        cache
            .set(
                key,
                field,
                &Data {
                    data: "ttl".to_string(),
                },
                Some(ttl_set),
            )
            .await
            .unwrap();

        let ttl: u64 = redis::cmd("FIELDTTL")
            .arg(key)
            .arg(field)
            .query_async(&mut cache.connection.clone())
            .await
            .unwrap();

        assert!(ttl >= ttl_set - 1 && ttl <= ttl_set);
    }
}

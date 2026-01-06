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

    pub async fn get_multiple<V: DeserializeOwned>(
        &self,
        key: &str,
        fields: &[&str],
    ) -> Result<Vec<Option<V>>> {
        if fields.is_empty() {
            return Ok(Vec::new());
        }

        let res: Vec<Option<String>> = redis::cmd("HMGET")
            .arg(key)
            .arg(fields)
            .query_async(&mut self.connection.clone())
            .await?;

        res.into_iter()
            .map(|opt_str| match opt_str {
                Some(s) => Ok(Some(serde_json::from_str(&s)?)),
                None => Ok(None),
            })
            .collect()
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

    pub async fn take<V: DeserializeOwned>(&self, key: &str, field: &str) -> Result<Option<V>> {
        let res: Vec<Option<String>> = redis::cmd("HGETDEL")
            .arg(key)
            .arg("FIELDS")
            .arg(1)
            .arg(field)
            .query_async(&mut self.connection.clone())
            .await?;

        Ok(match res.into_iter().next().flatten() {
            Some(res) => Some(serde_json::from_str(&res)?),
            None => None,
        })
    }

    pub async fn delete(&self, key: &str, field: &str) -> Result<()> {
        Ok(redis::cmd("HDEL")
            .arg(key)
            .arg(field)
            .exec_async(&mut self.connection.clone())
            .await?)
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
    async fn test_get_multiple_all_exist() {
        let cache = Redis::new(&CacheConfig {
            redis_endpoint: REDIS_ENDPOINT.to_string(),
        })
        .await
        .unwrap();

        let key = "test_multiple";
        let data1 = Data {
            data: "first".to_string(),
        };
        let data2 = Data {
            data: "second".to_string(),
        };
        let data3 = Data {
            data: "third".to_string(),
        };

        cache.set(key, "field1", &data1, None).await.unwrap();
        cache.set(key, "field2", &data2, None).await.unwrap();
        cache.set(key, "field3", &data3, None).await.unwrap();

        let results: Vec<Option<Data>> = cache
            .get_multiple(key, &["field1", "field2", "field3"])
            .await
            .unwrap();

        assert_eq!(results.len(), 3);
        assert_eq!(results[0], Some(data1));
        assert_eq!(results[1], Some(data2));
        assert_eq!(results[2], Some(data3));
    }

    #[tokio::test]
    async fn test_get_multiple_mixed() {
        let cache = Redis::new(&CacheConfig {
            redis_endpoint: REDIS_ENDPOINT.to_string(),
        })
        .await
        .unwrap();

        let key = "test_multiple_mixed";
        let data1 = Data {
            data: "exists".to_string(),
        };

        cache.set(key, "exists", &data1, None).await.unwrap();

        let results: Vec<Option<Data>> = cache
            .get_multiple(key, &["exists", "missing1", "missing2"])
            .await
            .unwrap();

        assert_eq!(results.len(), 3);
        assert_eq!(results[0], Some(data1));
        assert_eq!(results[1], None);
        assert_eq!(results[2], None);
    }

    #[tokio::test]
    async fn test_get_multiple_none_exist() {
        let cache = Redis::new(&CacheConfig {
            redis_endpoint: REDIS_ENDPOINT.to_string(),
        })
        .await
        .unwrap();

        let results: Vec<Option<Data>> = cache
            .get_multiple("nonexistent_key", &["field1", "field2"])
            .await
            .unwrap();

        assert_eq!(results.len(), 2);
        assert_eq!(results[0], None);
        assert_eq!(results[1], None);
    }

    #[tokio::test]
    async fn test_get_multiple_empty_fields() {
        let cache = Redis::new(&CacheConfig {
            redis_endpoint: REDIS_ENDPOINT.to_string(),
        })
        .await
        .unwrap();

        let results: Vec<Option<Data>> = cache.get_multiple("some_key", &[]).await.unwrap();

        assert_eq!(results.len(), 0);
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

        let ttl: Vec<i64> = redis::cmd("HEXPIRETIME")
            .arg(key)
            .arg("FIELDS")
            .arg(1)
            .arg(field)
            .query_async(&mut cache.connection.clone())
            .await
            .unwrap();

        assert_eq!(ttl[0], -1);
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

        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs() as i64;
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

        let ttl: Vec<i64> = redis::cmd("HEXPIRETIME")
            .arg(key)
            .arg("FIELDS")
            .arg(1)
            .arg(field)
            .query_async(&mut cache.connection.clone())
            .await
            .unwrap();
        let ttl_delta = (ttl[0] - now) as u64;

        assert!(ttl_delta >= ttl_set - 1);
        assert!(ttl_delta <= ttl_set + 1);
    }

    #[tokio::test]
    async fn test_take_existing_field() {
        let cache = Redis::new(&CacheConfig {
            redis_endpoint: REDIS_ENDPOINT.to_string(),
        })
        .await
        .unwrap();

        let key = "test_take";
        let field = "data";
        let data = Data {
            data: "take me away".to_string(),
        };

        cache.set(key, field, &data, None).await.unwrap();

        let taken = cache.take::<Data>(key, field).await.unwrap();
        assert_eq!(taken, Some(data));

        assert!(cache.get::<Data>(key, field).await.unwrap().is_none());
    }

    #[tokio::test]
    async fn test_take_non_existent_field() {
        let cache = Redis::new(&CacheConfig {
            redis_endpoint: REDIS_ENDPOINT.to_string(),
        })
        .await
        .unwrap();

        let key = "non_existent_take";
        let field = "field";

        let result = cache.take::<Data>(key, field).await.unwrap();
        assert!(result.is_none());
    }

    #[tokio::test]
    async fn test_take_deletes_field() {
        let cache = Redis::new(&CacheConfig {
            redis_endpoint: REDIS_ENDPOINT.to_string(),
        })
        .await
        .unwrap();

        let key = "test_take_delete";
        let field = "data";
        let data = Data {
            data: "should be deleted".to_string(),
        };

        cache.set(key, field, &data, None).await.unwrap();
        assert!(cache.get::<Data>(key, field).await.unwrap().is_some());

        cache.take::<Data>(key, field).await.unwrap();

        let second_take = cache.take::<Data>(key, field).await.unwrap();
        assert!(second_take.is_none());
    }

    #[tokio::test]
    async fn test_delete_existing_key() {
        let cache = Redis::new(&CacheConfig {
            redis_endpoint: REDIS_ENDPOINT.to_string(),
        })
        .await
        .unwrap();

        let key = "test_delete";
        let field = "data";
        let data = Data {
            data: "to be deleted".to_string(),
        };

        cache.set(key, field, &data, None).await.unwrap();
        assert_eq!(cache.get::<Data>(key, field).await.unwrap().unwrap(), data);

        cache.delete(key, field).await.unwrap();
        assert!(cache.get::<Data>(key, field).await.unwrap().is_none());
    }

    #[tokio::test]
    async fn test_delete_non_existent_key() {
        let cache = Redis::new(&CacheConfig {
            redis_endpoint: REDIS_ENDPOINT.to_string(),
        })
        .await
        .unwrap();

        let key = "non_existent_delete";
        let field = "field";

        let result = cache.delete(key, field).await;
        assert!(result.is_ok());
    }
}

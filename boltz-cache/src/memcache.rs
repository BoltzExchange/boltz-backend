use boltz_utils::{DropGuard, defer};
use dashmap::DashMap;
use serde::de::DeserializeOwned;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use std::time::{Duration, SystemTime, UNIX_EPOCH};
use tokio::task::JoinHandle;
use tokio::time;

const CLEANUP_INTERVAL: Duration = Duration::from_secs(60);

#[derive(Debug, Clone)]
pub struct MemCache {
    pub map: Arc<DashMap<String, String>>,
    _cleanup_guard: Arc<DropGuard<Box<dyn FnOnce() + Send + Sync>>>,
}

#[derive(Serialize, Deserialize, Debug)]
struct CacheValue<V> {
    value: V,
    expires_at: Option<u64>,
}

impl Default for MemCache {
    fn default() -> Self {
        Self::new()
    }
}

impl MemCache {
    pub fn new() -> Self {
        let map = Arc::new(DashMap::new());
        let handle = Self::start_cleanup_task(map.clone());
        Self {
            map,
            _cleanup_guard: Arc::new(defer(Box::new(move || handle.abort()))),
        }
    }

    fn start_cleanup_task(map: Arc<DashMap<String, String>>) -> JoinHandle<()> {
        tokio::spawn(async move {
            let mut interval = time::interval(CLEANUP_INTERVAL);

            loop {
                interval.tick().await;
                Self::cleanup_expired(&map);
            }
        })
    }

    fn cleanup_expired(map: &Arc<DashMap<String, String>>) {
        let current_time = match SystemTime::now().duration_since(UNIX_EPOCH) {
            Ok(duration) => duration.as_secs(),
            Err(_) => return,
        };

        map.retain(|_, value| {
            if let Ok(parsed) = serde_json::from_str::<CacheValue<serde_json::Value>>(value) {
                match parsed.expires_at {
                    Some(expires_at) => current_time < expires_at,
                    None => true,
                }
            } else {
                // If we cannot parse it, remove it (shouldn't happen)
                false
            }
        });
    }

    fn is_expired(expires_at: Option<u64>) -> bool {
        match expires_at {
            None => false,
            Some(expires_at) => SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .map(|d| d.as_secs() >= expires_at)
                .unwrap_or(true),
        }
    }
}

impl MemCache {
    pub fn get<V: DeserializeOwned>(&self, key: &str, field: &str) -> anyhow::Result<Option<V>> {
        let key = Self::get_key(key, field);

        let entry = self.map.get(&key);
        match entry {
            Some(res) => {
                let cache_value: CacheValue<V> = serde_json::from_str(res.value())?;
                if Self::is_expired(cache_value.expires_at) {
                    drop(res);
                    self.map.remove(&key);
                    Ok(None)
                } else {
                    Ok(Some(cache_value.value))
                }
            }
            None => Ok(None),
        }
    }

    pub fn get_multiple<V: DeserializeOwned>(
        &self,
        key: &str,
        fields: &[&str],
    ) -> anyhow::Result<Vec<Option<V>>> {
        fields.iter().map(|field| self.get(key, field)).collect()
    }

    pub fn set<V: Serialize + Sync>(
        &self,
        key: &str,
        field: &str,
        value: &V,
        ttl: Option<u64>,
    ) -> anyhow::Result<()> {
        let key = Self::get_key(key, field);

        let expires_at = match ttl {
            Some(ttl) => {
                let expiry_time = SystemTime::now()
                    .checked_add(Duration::from_secs(ttl))
                    .ok_or_else(|| anyhow::anyhow!("could not calculate expiration time"))?;
                let seconds = expiry_time.duration_since(UNIX_EPOCH)?.as_secs();
                Some(seconds)
            }
            None => None,
        };

        let cache_value = CacheValue { value, expires_at };
        self.map.insert(key, serde_json::to_string(&cache_value)?);
        Ok(())
    }

    pub fn take<V: DeserializeOwned>(&self, key: &str, field: &str) -> anyhow::Result<Option<V>> {
        let entry = self.map.remove(&Self::get_key(key, field));
        Ok(match entry {
            Some((_, value)) => {
                let cache_value: CacheValue<V> = serde_json::from_str(&value)?;
                if Self::is_expired(cache_value.expires_at) {
                    None
                } else {
                    Some(cache_value.value)
                }
            }
            None => None,
        })
    }

    pub fn delete(&self, key: &str, field: &str) -> anyhow::Result<()> {
        self.map.remove(&Self::get_key(key, field));
        Ok(())
    }

    fn get_key(key: &str, field: &str) -> String {
        format!("{key}:{field}")
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde::{Deserialize, Serialize};
    use std::time::Duration;

    #[derive(Serialize, Deserialize, PartialEq, Debug, Clone)]
    struct TestData {
        id: u32,
        name: String,
    }

    #[tokio::test]
    async fn test_set_get_string() {
        let cache = MemCache::new();
        let key = "my_key";
        let field = "field";
        let value = "my_value".to_string();

        cache.set(key, field, &value, None).unwrap();

        let retrieved: Option<String> = cache.get(key, field).unwrap();
        assert_eq!(retrieved, Some(value));
    }

    #[tokio::test]
    async fn test_set_get_struct() {
        let cache = MemCache::new();
        let key = "struct_key";
        let field = "field";
        let value = TestData {
            id: 1,
            name: "test_data".to_string(),
        };

        cache.set(key, field, &value, None).unwrap();

        let retrieved: Option<TestData> = cache.get(key, field).unwrap();
        assert_eq!(retrieved, Some(value));
    }

    #[tokio::test]
    async fn test_get_non_existent() {
        let cache = MemCache::new();
        let key = "non_existent_key";
        let field = "field";

        let retrieved: Option<String> = cache.get(key, field).unwrap();
        assert_eq!(retrieved, None);
    }

    #[tokio::test]
    async fn test_get_multiple_all_exist() {
        let cache = MemCache::new();
        let key = "multi_key";
        let fields = vec!["field1", "field2", "field3"];
        let values = [
            TestData {
                id: 1,
                name: "first".to_string(),
            },
            TestData {
                id: 2,
                name: "second".to_string(),
            },
            TestData {
                id: 3,
                name: "third".to_string(),
            },
        ];

        for (field, value) in fields.iter().zip(values.iter()) {
            cache.set(key, field, value, None).unwrap();
        }

        let retrieved: Vec<Option<TestData>> = cache.get_multiple(key, &fields).unwrap();
        assert_eq!(retrieved.len(), 3);
        assert_eq!(retrieved[0], Some(values[0].clone()));
        assert_eq!(retrieved[1], Some(values[1].clone()));
        assert_eq!(retrieved[2], Some(values[2].clone()));
    }

    #[tokio::test]
    async fn test_get_multiple_some_exist() {
        let cache = MemCache::new();
        let key = "multi_key_partial";
        let fields = vec!["exists1", "missing", "exists2"];

        let value1 = "first_value".to_string();
        let value2 = "second_value".to_string();

        cache.set(key, "exists1", &value1, None).unwrap();
        cache.set(key, "exists2", &value2, None).unwrap();

        let retrieved: Vec<Option<String>> = cache.get_multiple(key, &fields).unwrap();
        assert_eq!(retrieved.len(), 3);
        assert_eq!(retrieved[0], Some(value1));
        assert_eq!(retrieved[1], None);
        assert_eq!(retrieved[2], Some(value2));
    }

    #[tokio::test]
    async fn test_get_multiple_none_exist() {
        let cache = MemCache::new();
        let key = "multi_key_empty";
        let fields = vec!["missing1", "missing2", "missing3"];

        let retrieved: Vec<Option<String>> = cache.get_multiple(key, &fields).unwrap();
        assert_eq!(retrieved.len(), 3);
        assert!(retrieved[0].is_none());
        assert!(retrieved[1].is_none());
        assert!(retrieved[2].is_none());
    }

    #[tokio::test]
    async fn test_get_multiple_empty_fields() {
        let cache = MemCache::new();
        let key = "multi_key_no_fields";
        let fields: Vec<&str> = vec![];

        let retrieved: Vec<Option<String>> = cache.get_multiple(key, &fields).unwrap();
        assert_eq!(retrieved.len(), 0);
    }

    #[tokio::test]
    async fn test_get_multiple_with_expired() {
        let cache = MemCache::new();
        let key = "multi_key_ttl";
        let fields = vec!["valid", "expired", "valid2"];

        cache
            .set(key, "valid", &"valid_value".to_string(), None)
            .unwrap();
        cache
            .set(key, "expired", &"expired_value".to_string(), Some(1))
            .unwrap();
        cache
            .set(key, "valid2", &"valid_value2".to_string(), None)
            .unwrap();

        tokio::time::sleep(Duration::from_millis(1100)).await;

        let retrieved: Vec<Option<String>> = cache.get_multiple(key, &fields).unwrap();
        assert_eq!(retrieved.len(), 3);
        assert_eq!(retrieved[0], Some("valid_value".to_string()));
        assert_eq!(retrieved[1], None);
        assert_eq!(retrieved[2], Some("valid_value2".to_string()));
    }

    #[tokio::test]
    async fn test_get_multiple_single_field() {
        let cache = MemCache::new();
        let key = "multi_key_single";
        let fields = vec!["only_field"];
        let value = "only_value".to_string();

        cache.set(key, "only_field", &value, None).unwrap();

        let retrieved: Vec<Option<String>> = cache.get_multiple(key, &fields).unwrap();
        assert_eq!(retrieved.len(), 1);
        assert_eq!(retrieved[0], Some(value));
    }

    #[tokio::test]
    async fn test_overwrite_key() {
        let cache = MemCache::new();
        let key = "overwrite_key";
        let field = "field";
        let value1 = "first_value".to_string();
        let value2 = "second_value".to_string();

        cache.set(key, field, &value1, None).unwrap();
        let retrieved1: Option<String> = cache.get(key, field).unwrap();
        assert_eq!(retrieved1, Some(value1));

        cache.set(key, field, &value2, None).unwrap();
        let retrieved2: Option<String> = cache.get(key, field).unwrap();
        assert_eq!(retrieved2, Some(value2));
    }

    #[tokio::test]
    async fn test_set_ttl_get_before_expiry() {
        let cache = MemCache::new();
        let key = "ttl_key_1";
        let field = "field";
        let value = "ttl_value_1".to_string();
        let ttl = 2;

        cache.set(key, field, &value, Some(ttl)).unwrap();
        let retrieved: Option<String> = cache.get(key, field).unwrap();
        assert_eq!(retrieved, Some(value));
    }

    #[tokio::test]
    async fn test_set_ttl_get_after_expiry() {
        let cache = MemCache::new();
        let key = "ttl_key_2";
        let field = "field";
        let value = "ttl_value_2".to_string();
        let ttl = 1;

        cache.set(key, field, &value, Some(ttl)).unwrap();
        tokio::time::sleep(Duration::from_millis(1100)).await;
        let retrieved: Option<String> = cache.get(key, field).unwrap();
        assert_eq!(retrieved, None);
    }

    #[tokio::test]
    async fn test_set_no_ttl_persists() {
        let cache = MemCache::new();
        let key = "no_ttl_key";
        let field = "field";
        let value = "no_ttl_value".to_string();

        cache.set(key, field, &value, None).unwrap();
        tokio::time::sleep(Duration::from_millis(50)).await;
        let retrieved: Option<String> = cache.get(key, field).unwrap();
        assert_eq!(retrieved, Some(value));
    }

    #[tokio::test]
    async fn test_overwrite_with_ttl() {
        let cache = MemCache::new();
        let key = "overwrite_ttl_key";
        let field = "field";
        let value1 = "ttl_value_long".to_string();
        let value2 = "ttl_value_short".to_string();
        let ttl_long = 10;
        let ttl_short = 1;

        cache.set(key, field, &value1, Some(ttl_long)).unwrap();
        let retrieved: Option<String> = cache.get(key, field).unwrap();
        assert_eq!(retrieved, Some(value1));

        cache.set(key, field, &value2, Some(ttl_short)).unwrap();
        let retrieved: Option<String> = cache.get(key, field).unwrap();
        assert_eq!(retrieved, Some(value2));

        tokio::time::sleep(Duration::from_millis(1100)).await;
        let retrieved: Option<String> = cache.get(key, field).unwrap();
        assert_eq!(retrieved, None);
    }

    #[tokio::test]
    async fn test_overwrite_ttl_with_set() {
        let cache = MemCache::new();
        let key = "overwrite_set_key";
        let field = "field";
        let value_ttl = "ttl_value".to_string();
        let value_set = "set_value".to_string();
        let ttl = 1;

        cache.set(key, field, &value_ttl, Some(ttl)).unwrap();
        cache.set(key, field, &value_set, None).unwrap();

        tokio::time::sleep(Duration::from_millis(1100)).await;

        let retrieved: Option<String> = cache.get(key, field).unwrap();
        assert_eq!(retrieved, Some(value_set));
    }

    #[tokio::test]
    async fn test_take_existing_field() {
        let cache = MemCache::new();
        let key = "test_take";
        let field = "data";
        let data = TestData {
            id: 42,
            name: "take me away".to_string(),
        };

        cache.set(key, field, &data, None).unwrap();

        let taken = cache.take::<TestData>(key, field).unwrap();
        assert_eq!(taken, Some(data));

        assert!(cache.get::<TestData>(key, field).unwrap().is_none());
    }

    #[tokio::test]
    async fn test_take_non_existent_field() {
        let cache = MemCache::new();
        let key = "non_existent_take";
        let field = "field";

        let result = cache.take::<TestData>(key, field).unwrap();
        assert!(result.is_none());
    }

    #[tokio::test]
    async fn test_take_deletes_field() {
        let cache = MemCache::new();
        let key = "test_take_delete";
        let field = "data";
        let data = TestData {
            id: 123,
            name: "should be deleted".to_string(),
        };

        cache.set(key, field, &data, None).unwrap();
        assert!(cache.get::<TestData>(key, field).unwrap().is_some());

        cache.take::<TestData>(key, field).unwrap();

        let second_take = cache.take::<TestData>(key, field).unwrap();
        assert!(second_take.is_none());
    }

    #[tokio::test]
    async fn test_take_expired_value() {
        let cache = MemCache::new();
        let key = "take_ttl_key";
        let field = "field";
        let value = "expired_value".to_string();
        let ttl = 1;

        cache.set(key, field, &value, Some(ttl)).unwrap();
        tokio::time::sleep(Duration::from_millis(1100)).await;
        let taken: Option<String> = cache.take(key, field).unwrap();
        assert_eq!(taken, None);
    }

    #[tokio::test]
    async fn test_delete_existing_key() {
        let cache = MemCache::new();
        let key = "delete_key";
        let field = "field";
        let value = "delete_value".to_string();

        cache.set(key, field, &value, None).unwrap();
        let retrieved: Option<String> = cache.get(key, field).unwrap();
        assert_eq!(retrieved, Some(value));

        cache.delete(key, field).unwrap();
        let retrieved_after_delete: Option<String> = cache.get(key, field).unwrap();
        assert_eq!(retrieved_after_delete, None);
    }

    #[tokio::test]
    async fn test_delete_non_existent_key() {
        let cache = MemCache::new();
        let key = "non_existent_delete_key";
        let field = "field";

        let result = cache.delete(key, field);
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_background_cleanup() {
        let cache = MemCache::new();
        let key1 = "cleanup_key_1";
        let key2 = "cleanup_key_2";
        let key3 = "cleanup_key_3";
        let field = "field";

        cache
            .set(key1, field, &"expires_soon".to_string(), Some(1))
            .unwrap();

        cache
            .set(key2, field, &"expires_later".to_string(), Some(120))
            .unwrap();

        cache
            .set(key3, field, &"never_expires".to_string(), None)
            .unwrap();

        assert!(cache.get::<String>(key1, field).unwrap().is_some());
        assert!(cache.get::<String>(key2, field).unwrap().is_some());
        assert!(cache.get::<String>(key3, field).unwrap().is_some());
        assert_eq!(cache.map.len(), 3);

        tokio::time::sleep(Duration::from_millis(1100)).await;
        MemCache::cleanup_expired(&cache.map);

        assert_eq!(cache.map.len(), 2);
        assert!(cache.get::<String>(key1, field).unwrap().is_none());

        assert!(cache.get::<String>(key2, field).unwrap().is_some());
        assert!(cache.get::<String>(key3, field).unwrap().is_some());
    }
}

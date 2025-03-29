use dashmap::DashMap;
use serde::de::DeserializeOwned;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use std::time::{Duration, SystemTime, UNIX_EPOCH};

#[derive(Clone, Debug)]
pub struct MemCache {
    pub map: Arc<DashMap<String, String>>,
}

#[derive(Serialize, Deserialize, Debug)]
struct CacheValue<V> {
    value: V,
    expires_at: Option<u64>,
}

impl MemCache {
    pub fn new() -> Self {
        Self {
            map: Arc::new(DashMap::new()),
        }
    }
}

impl MemCache {
    pub fn get<V: DeserializeOwned>(&self, key: &str) -> anyhow::Result<Option<V>> {
        let entry = self.map.get(key);
        match entry {
            Some(res) => {
                let cache_value: CacheValue<V> = serde_json::from_str(res.value())?;
                match cache_value.expires_at {
                    None => Ok(Some(cache_value.value)),
                    Some(expires_at) => {
                        let current_time = SystemTime::now().duration_since(UNIX_EPOCH)?.as_secs();
                        if current_time < expires_at {
                            Ok(Some(cache_value.value))
                        } else {
                            drop(res);
                            self.map.remove(key);
                            Ok(None)
                        }
                    }
                }
            }
            None => Ok(None),
        }
    }

    pub fn set<V: Serialize + Sync>(
        &self,
        key: &str,
        value: &V,
        ttl: Option<u64>,
    ) -> anyhow::Result<()> {
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
        self.map
            .insert(key.to_owned(), serde_json::to_string(&cache_value)?);
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde::{Deserialize, Serialize};
    use std::thread::sleep;
    use std::time::Duration;

    #[derive(Serialize, Deserialize, PartialEq, Debug, Clone)]
    struct TestData {
        id: u32,
        name: String,
    }

    #[test]
    fn test_set_get_string() {
        let cache = MemCache::new();
        let key = "my_key";
        let value = "my_value".to_string();

        cache.set(key, &value, None).unwrap();

        let retrieved: Option<String> = cache.get(key).unwrap();
        assert_eq!(retrieved, Some(value));
    }

    #[test]
    fn test_set_get_struct() {
        let cache = MemCache::new();
        let key = "struct_key";
        let value = TestData {
            id: 1,
            name: "test_data".to_string(),
        };

        cache.set(key, &value, None).unwrap();

        let retrieved: Option<TestData> = cache.get(key).unwrap();
        assert_eq!(retrieved, Some(value));
    }

    #[test]
    fn test_get_non_existent() {
        let cache = MemCache::new();
        let key = "non_existent_key";

        let retrieved: Option<String> = cache.get(key).unwrap();
        assert_eq!(retrieved, None);
    }

    #[test]
    fn test_overwrite_key() {
        let cache = MemCache::new();
        let key = "overwrite_key";
        let value1 = "first_value".to_string();
        let value2 = "second_value".to_string();

        cache.set(key, &value1, None).unwrap();
        let retrieved1: Option<String> = cache.get(key).unwrap();
        assert_eq!(retrieved1, Some(value1));

        cache.set(key, &value2, None).unwrap();
        let retrieved2: Option<String> = cache.get(key).unwrap();
        assert_eq!(retrieved2, Some(value2));
    }

    #[test]
    fn test_set_ttl_get_before_expiry() {
        let cache = MemCache::new();
        let key = "ttl_key_1";
        let value = "ttl_value_1".to_string();
        let ttl = 2;

        cache.set(key, &value, Some(ttl)).unwrap();
        let retrieved: Option<String> = cache.get(key).unwrap();
        assert_eq!(retrieved, Some(value));
    }

    #[test]
    fn test_set_ttl_get_after_expiry() {
        let cache = MemCache::new();
        let key = "ttl_key_2";
        let value = "ttl_value_2".to_string();
        let ttl = 1;

        cache.set(key, &value, Some(ttl)).unwrap();
        sleep(Duration::from_millis(1100));
        let retrieved: Option<String> = cache.get(key).unwrap();
        assert_eq!(retrieved, None);
    }

    #[test]
    fn test_set_no_ttl_persists() {
        let cache = MemCache::new();
        let key = "no_ttl_key";
        let value = "no_ttl_value".to_string();

        cache.set(key, &value, None).unwrap();
        sleep(Duration::from_millis(50));
        let retrieved: Option<String> = cache.get(key).unwrap();
        assert_eq!(retrieved, Some(value));
    }

    #[test]
    fn test_overwrite_with_ttl() {
        let cache = MemCache::new();
        let key = "overwrite_ttl_key";
        let value1 = "ttl_value_long".to_string();
        let value2 = "ttl_value_short".to_string();
        let ttl_long = 10;
        let ttl_short = 1;

        cache.set(key, &value1, Some(ttl_long)).unwrap();
        let retrieved: Option<String> = cache.get(key).unwrap();
        assert_eq!(retrieved, Some(value1));

        cache.set(key, &value2, Some(ttl_short)).unwrap();
        let retrieved: Option<String> = cache.get(key).unwrap();
        assert_eq!(retrieved, Some(value2));

        sleep(Duration::from_millis(1100));
        let retrieved: Option<String> = cache.get(key).unwrap();
        assert_eq!(retrieved, None);
    }

    #[test]
    fn test_overwrite_ttl_with_set() {
        let cache = MemCache::new();
        let key = "overwrite_set_key";
        let value_ttl = "ttl_value".to_string();
        let value_set = "set_value".to_string();
        let ttl = 1;

        cache.set(key, &value_ttl, Some(ttl)).unwrap();
        cache.set(key, &value_set, None).unwrap();

        sleep(Duration::from_millis(1100));

        let retrieved: Option<String> = cache.get(key).unwrap();
        assert_eq!(retrieved, Some(value_set));
    }
}

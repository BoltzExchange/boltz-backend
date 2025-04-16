use dashmap::DashMap;
use std::hash::Hash;
use std::time::{Duration, Instant};

#[derive(Clone, Debug)]
pub struct TimeoutMap<K, V>
where
    K: Hash + Eq + Send + Sync + 'static,
    V: Send + Sync + 'static,
{
    map: DashMap<K, (V, Instant)>,
    ttl: Duration,
}

impl<K, V> TimeoutMap<K, V>
where
    K: Hash + Eq + Send + Sync + 'static,
    V: Send + Sync + 'static,
{
    pub fn new(ttl: Duration) -> Self {
        Self {
            map: DashMap::new(),
            ttl,
        }
    }

    pub fn insert(&self, key: K, value: V) {
        self.cleanup();
        self.map.insert(key, (value, Instant::now() + self.ttl));
    }

    pub fn remove(&self, key: &K) -> Option<V> {
        self.cleanup();
        self.map.remove(key).map(|(_, (value, _))| value)
    }

    pub fn cleanup(&self) {
        let now = Instant::now();
        self.map.retain(|_, (_, instant)| *instant > now);
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use std::thread::sleep;

    impl<K, V> TimeoutMap<K, V>
    where
        K: Hash + Eq + Send + Sync + 'static,
        V: Send + Sync + 'static,
    {
        pub fn contains_key(&self, key: &K) -> bool {
            self.cleanup();
            self.map.contains_key(key)
        }
    }

    const KEY1: &str = "key1";
    const VALUE1: &str = "value1";
    const VALUE2: &str = "value2";
    const NONEXISTENT: &str = "nonexistent";

    #[test]
    fn test_insert_and_remove() {
        let map = TimeoutMap::new(Duration::from_secs(1));
        map.insert(KEY1, VALUE1);
        assert!(map.contains_key(&KEY1));

        assert_eq!(map.remove(&KEY1), Some(VALUE1));
        assert!(!map.contains_key(&KEY1));
    }

    #[test]
    fn test_timeout_cleanup() {
        let ttl = Duration::from_millis(50);
        let map = TimeoutMap::new(ttl);

        map.insert(KEY1, VALUE1);
        assert!(map.contains_key(&KEY1));

        sleep(ttl * 2);
        map.cleanup();

        assert!(!map.contains_key(&KEY1));
        assert_eq!(map.remove(&KEY1), None);
    }

    #[test]
    fn test_no_cleanup_before_timeout() {
        let ttl = Duration::from_millis(100);
        let map = TimeoutMap::new(ttl);

        map.insert(KEY1, VALUE1);
        assert!(map.contains_key(&KEY1));

        sleep(ttl / 2);
        map.cleanup();

        assert!(map.contains_key(&KEY1));
        assert_eq!(map.remove(&KEY1), Some(VALUE1));
        assert!(!map.contains_key(&KEY1));
    }

    #[test]
    fn test_insert_updates_timer() {
        let ttl = Duration::from_millis(100);
        let map = TimeoutMap::new(ttl);

        map.insert(KEY1, VALUE1);
        sleep(ttl / 2);
        assert!(map.contains_key(&KEY1));

        map.insert(KEY1, VALUE2);
        sleep(ttl / 2);
        assert!(map.contains_key(&KEY1));
        sleep(ttl / 2);
        map.cleanup();

        assert!(!map.contains_key(&KEY1));
    }

    #[test]
    fn test_remove_nonexistent() {
        let map: TimeoutMap<String, String> = TimeoutMap::new(Duration::from_secs(1));
        assert_eq!(map.remove(&NONEXISTENT.to_string()), None);
    }
}

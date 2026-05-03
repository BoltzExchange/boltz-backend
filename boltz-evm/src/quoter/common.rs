use alloy::primitives::{Address, address};
use anyhow::{Result, anyhow};
use boltz_cache::Cache;
use serde::Serialize;
use serde::de::DeserializeOwned;
use std::collections::{HashMap, HashSet};
use std::future::Future;
use std::hash::{Hash, Hasher};
use std::time::Duration;

pub(in crate::quoter) const DEFAULT_MULTICALL: Address =
    address!("0xcA11bde05977b3631167028862bE2a173976CA11");
pub(in crate::quoter) const POOL_CACHE_TTL_SECS: u64 = Duration::from_mins(60).as_secs();

const MAX_U24: u64 = 0xFF_FFFF;
const MIN_I24: i32 = -0x80_0000;
const MAX_I24: i32 = 0x7F_FFFF;

pub(in crate::quoter) const fn default_multicall() -> Address {
    DEFAULT_MULTICALL
}

pub(in crate::quoter) fn check_u24(value: u64, name: &str) -> Result<()> {
    if value > MAX_U24 {
        return Err(anyhow!("{name} must be a 24-bit value"));
    }

    Ok(())
}

pub(in crate::quoter) fn check_i24(value: i32, name: &str) -> Result<()> {
    if !(MIN_I24..=MAX_I24).contains(&value) {
        return Err(anyhow!("{name} must be a signed 24-bit value"));
    }

    Ok(())
}

/// A normalized token pair where order does not affect equality or hashing.
#[derive(Debug, Clone, Copy)]
pub(in crate::quoter) struct TokenPair(
    pub(in crate::quoter) Address,
    pub(in crate::quoter) Address,
);

impl TokenPair {
    pub(in crate::quoter) fn normalized(&self) -> (Address, Address) {
        if self.0 < self.1 {
            (self.0, self.1)
        } else {
            (self.1, self.0)
        }
    }

    pub(in crate::quoter) fn cache_field(&self) -> String {
        let (token_a, token_b) = self.normalized();

        format!("{token_a}-{token_b}")
    }
}

impl PartialEq for TokenPair {
    fn eq(&self, other: &Self) -> bool {
        self.normalized() == other.normalized()
    }
}

impl Eq for TokenPair {}

impl Hash for TokenPair {
    fn hash<H: Hasher>(&self, state: &mut H) {
        let (a, b) = self.normalized();
        a.hash(state);
        b.hash(state);
    }
}

pub(in crate::quoter) async fn cached_relevant_pools<T, F, Fut>(
    cache: &Cache,
    cache_key: &str,
    pairs: &[TokenPair],
    ttl_secs: u64,
    discover: F,
) -> Result<HashMap<TokenPair, Vec<T>>>
where
    T: DeserializeOwned + Serialize + Sync,
    F: FnOnce(Vec<TokenPair>) -> Fut,
    Fut: Future<Output = Result<HashMap<TokenPair, Vec<T>>>>,
{
    let pairs = unique_pairs(pairs);

    if pairs.is_empty() {
        return Ok(HashMap::new());
    }

    let cache_fields = pairs.iter().map(TokenPair::cache_field).collect::<Vec<_>>();
    let cache_field_refs = cache_fields.iter().map(String::as_str).collect::<Vec<_>>();
    let cached_pools = cache
        .get_multiple::<Vec<T>>(cache_key, &cache_field_refs)
        .await?;

    let mut pools = HashMap::new();
    let mut uncached_pairs = Vec::new();

    for (pair, pools_for_pair) in pairs.iter().copied().zip(cached_pools) {
        match pools_for_pair {
            Some(pools_for_pair) => {
                if !pools_for_pair.is_empty() {
                    pools.insert(pair, pools_for_pair);
                }
            }
            None => uncached_pairs.push(pair),
        }
    }

    if uncached_pairs.is_empty() {
        return Ok(pools);
    }

    let mut discovered = discover(uncached_pairs.clone()).await?;

    for pair in uncached_pairs {
        let pools_for_pair = discovered.remove(&pair).unwrap_or_default();
        let cache_field = pair.cache_field();
        cache
            .set(cache_key, &cache_field, &pools_for_pair, Some(ttl_secs))
            .await?;

        if !pools_for_pair.is_empty() {
            pools.insert(pair, pools_for_pair);
        }
    }

    Ok(pools)
}

fn unique_pairs(pairs: &[TokenPair]) -> Vec<TokenPair> {
    let mut seen_pairs = HashSet::new();

    pairs
        .iter()
        .copied()
        .filter(|pair| pair.0 != pair.1 && seen_pairs.insert(*pair))
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;
    use alloy::primitives::address;
    use boltz_cache::MemCache;

    #[test]
    fn equality_is_symmetric() {
        let token_a = address!("0000000000000000000000000000000000000001");
        let token_b = address!("0000000000000000000000000000000000000002");

        assert_eq!(TokenPair(token_a, token_b), TokenPair(token_b, token_a));
    }

    #[test]
    fn hashmap_lookup_works_both_directions() {
        let token_a = address!("0000000000000000000000000000000000000001");
        let token_b = address!("0000000000000000000000000000000000000002");
        let mut map = HashMap::new();

        map.insert(TokenPair(token_a, token_b), 42);

        assert_eq!(map.get(&TokenPair(token_b, token_a)), Some(&42));
    }

    #[test]
    fn normalized_order_is_stable() {
        let token_a = address!("0000000000000000000000000000000000000001");
        let token_b = address!("0000000000000000000000000000000000000002");

        assert_eq!(TokenPair(token_a, token_b).normalized(), (token_a, token_b));
        assert_eq!(TokenPair(token_b, token_a).normalized(), (token_a, token_b));
    }

    #[test]
    fn cache_field_uses_normalized_token_order() {
        let token_a = address!("0000000000000000000000000000000000000001");
        let token_b = address!("0000000000000000000000000000000000000002");

        assert_eq!(
            TokenPair(token_a, token_b).cache_field(),
            TokenPair(token_b, token_a).cache_field(),
        );
    }

    #[test]
    fn check_u24_accepts_values_in_range() {
        assert!(check_u24(0, "fee").is_ok());
        assert!(check_u24(MAX_U24, "fee").is_ok());
    }

    #[test]
    fn check_u24_rejects_values_above_range() {
        let err = check_u24(MAX_U24 + 1, "fee").unwrap_err();

        assert_eq!(err.to_string(), "fee must be a 24-bit value");
    }

    #[test]
    fn check_i24_accepts_values_in_range() {
        assert!(check_i24(MIN_I24, "tickSpacing").is_ok());
        assert!(check_i24(0, "tickSpacing").is_ok());
        assert!(check_i24(MAX_I24, "tickSpacing").is_ok());
    }

    #[test]
    fn check_i24_rejects_values_outside_range() {
        let too_low = check_i24(MIN_I24 - 1, "tickSpacing").unwrap_err();
        let too_high = check_i24(MAX_I24 + 1, "tickSpacing").unwrap_err();

        assert_eq!(
            too_low.to_string(),
            "tickSpacing must be a signed 24-bit value",
        );
        assert_eq!(
            too_high.to_string(),
            "tickSpacing must be a signed 24-bit value",
        );
    }

    #[tokio::test]
    async fn cached_relevant_pools_uses_cache_and_discovers_misses() {
        let cache = Cache::Memory(MemCache::new());
        let cache_key = "pools:test";
        let token_a = address!("0000000000000000000000000000000000000001");
        let token_b = address!("0000000000000000000000000000000000000002");
        let token_c = address!("0000000000000000000000000000000000000003");

        cache
            .set(
                cache_key,
                &TokenPair(token_a, token_b).cache_field(),
                &vec![500u64],
                None,
            )
            .await
            .unwrap();

        let pools = cached_relevant_pools(
            &cache,
            cache_key,
            &[
                TokenPair(token_a, token_b),
                TokenPair(token_b, token_a),
                TokenPair(token_a, token_c),
                TokenPair(token_a, token_a),
            ],
            60,
            |missing_pairs| async move {
                assert_eq!(missing_pairs, vec![TokenPair(token_a, token_c)]);

                Ok(HashMap::from([(
                    TokenPair(token_a, token_c),
                    vec![3_000u64],
                )]))
            },
        )
        .await
        .unwrap();

        assert_eq!(pools.get(&TokenPair(token_b, token_a)), Some(&vec![500u64]),);
        assert_eq!(
            pools.get(&TokenPair(token_c, token_a)),
            Some(&vec![3_000u64]),
        );
        assert_eq!(
            cache
                .get::<Vec<u64>>(cache_key, &TokenPair(token_c, token_a).cache_field())
                .await
                .unwrap(),
            Some(vec![3_000u64]),
        );
    }
}

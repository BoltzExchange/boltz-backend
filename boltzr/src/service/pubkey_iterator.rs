use alloy::hex;
use anyhow::Result;
use bitcoin::{
    PublicKey,
    bip32::{ChildNumber, DerivationPath, Xpub},
    secp256k1::{Secp256k1, VerifyOnly},
};
use std::{
    collections::HashMap,
    hash::{DefaultHasher, Hash, Hasher},
    str::FromStr,
};

pub const MAX_GAP_LIMIT: u32 = 150;

const DEFAULT_GAP_LIMIT: u32 = 50;
const DEFAULT_DERIVATION_PATH: &str = "m/44/0/0/0";

pub trait PubkeyIterator {
    fn identifier(&self) -> String;
    fn gap_limit(&self) -> u32;
    fn max_keys(&self) -> u32;
    fn derive_keys(
        &self,
        keys: &mut HashMap<String, u32>,
        start: u32,
        end: u32,
    ) -> Result<Vec<String>>;
}

pub struct XpubIterator {
    secp: Secp256k1<VerifyOnly>,
    xpub: Xpub,
    derivation_path: DerivationPath,
    gap_limit: u32,
}

pub struct KeyVecIterator {
    keys: Vec<PublicKey>,
}

pub struct SingleKeyIterator {
    key: PublicKey,
}

impl XpubIterator {
    pub fn new(
        xpub: Xpub,
        derivation_path: Option<String>,
        gap_limit: Option<u32>,
    ) -> Result<Self> {
        Ok(Self {
            secp: Secp256k1::verification_only(),
            xpub,
            derivation_path: DerivationPath::from_str(
                &derivation_path.unwrap_or(DEFAULT_DERIVATION_PATH.to_string()),
            )?,
            gap_limit: gap_limit.unwrap_or(DEFAULT_GAP_LIMIT),
        })
    }
}

impl PubkeyIterator for XpubIterator {
    fn identifier(&self) -> String {
        self.xpub.identifier().to_string()
    }

    fn gap_limit(&self) -> u32 {
        self.gap_limit
    }

    fn max_keys(&self) -> u32 {
        u32::MAX
    }

    fn derive_keys(
        &self,
        keys: &mut HashMap<String, u32>,
        start: u32,
        end: u32,
    ) -> Result<Vec<String>> {
        let mut result = Vec::new();

        // Add extra keys to the map to avoid keys not being found because of the gap limit
        // for swaps with multiple keys
        for i in start..(end + (end - start)) {
            let key = self
                .xpub
                .derive_pub(
                    &self.secp,
                    &self.derivation_path.child(ChildNumber::from_normal_idx(i)?),
                )
                .map(|derived| derived.public_key)?;

            let key = hex::encode(key.serialize());

            keys.insert(key.clone(), i);

            if i < end {
                result.push(key);
            }
        }

        Ok(result)
    }
}

impl KeyVecIterator {
    pub fn new(keys: Vec<PublicKey>) -> Self {
        Self { keys }
    }
}

impl PubkeyIterator for KeyVecIterator {
    fn identifier(&self) -> String {
        let mut hasher = DefaultHasher::new();
        self.keys.hash(&mut hasher);
        hasher.finish().to_string()
    }

    fn max_keys(&self) -> u32 {
        self.keys.len() as u32
    }

    fn gap_limit(&self) -> u32 {
        DEFAULT_GAP_LIMIT
    }

    fn derive_keys(
        &self,
        keys: &mut HashMap<String, u32>,
        start: u32,
        end: u32,
    ) -> Result<Vec<String>> {
        let mut result = Vec::new();

        // Add some buffer to avoid keys not being found because of the gap limit
        let actual_end = std::cmp::min((end + (end - start)) as usize, self.keys.len());
        for (i, key) in self.keys[start as usize..actual_end].iter().enumerate() {
            let key = hex::encode(key.inner.serialize());

            let index = start + i as u32;
            keys.insert(key.clone(), index);

            // Only add to result if within the requested range
            if index < end {
                result.push(key);
            }
        }

        Ok(result)
    }
}

impl SingleKeyIterator {
    pub fn new(key: PublicKey) -> Self {
        Self { key }
    }
}

impl PubkeyIterator for SingleKeyIterator {
    fn identifier(&self) -> String {
        self.key.pubkey_hash().to_string()
    }

    fn max_keys(&self) -> u32 {
        1
    }

    fn gap_limit(&self) -> u32 {
        DEFAULT_GAP_LIMIT
    }

    fn derive_keys(
        &self,
        keys: &mut HashMap<String, u32>,
        _start: u32,
        _end: u32,
    ) -> Result<Vec<String>> {
        let key = hex::encode(self.key.inner.serialize());

        keys.insert(key.clone(), 0);
        Ok(vec![key])
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    const TEST_XPUB: &str = "xpub6AHA9hZDN11k2ijHMeS5QqHx2KP9aMBRhTDqANMnwVtdyw2TDYRmF8PjpvwUFcL1Et8Hj59S3gTSMcUQ5gAqTz3Wd8EsMTmF3DChhqPQBnU";
    const TEST_PUBKEY: &str = "03e5b4f43d66647713102a5e65be6ee689a16b44cfae716c724e319c9023e63452";

    mod xpub_iterator {
        use super::*;

        #[test]
        fn test_new_with_default_derivation_path() {
            let xpub = Xpub::from_str(TEST_XPUB).unwrap();
            let iterator = XpubIterator::new(xpub, None, None).unwrap();

            assert_eq!(
                iterator.derivation_path,
                DerivationPath::from_str(DEFAULT_DERIVATION_PATH).unwrap()
            );
            assert_eq!(iterator.xpub.to_string(), TEST_XPUB);
        }

        #[test]
        fn test_new_with_custom_derivation_path() {
            let xpub = Xpub::from_str(TEST_XPUB).unwrap();
            let custom_path = "m/84/1/0/0";
            let iterator = XpubIterator::new(xpub, Some(custom_path.to_string()), None).unwrap();

            assert_eq!(
                iterator.derivation_path,
                DerivationPath::from_str(custom_path).unwrap()
            );
        }

        #[test]
        fn test_identifier() {
            let xpub = Xpub::from_str(TEST_XPUB).unwrap();
            let iterator = XpubIterator::new(xpub, None, None).unwrap();

            assert_eq!(iterator.identifier(), xpub.identifier().to_string());
        }

        #[test]
        fn test_max_keys() {
            let xpub = Xpub::from_str(TEST_XPUB).unwrap();
            let iterator = XpubIterator::new(xpub, None, None).unwrap();

            assert_eq!(iterator.max_keys(), u32::MAX);
        }

        #[test]
        fn test_gap_limit_default() {
            let xpub = Xpub::from_str(TEST_XPUB).unwrap();
            let iterator = XpubIterator::new(xpub, None, None).unwrap();

            assert_eq!(iterator.gap_limit(), DEFAULT_GAP_LIMIT);
        }

        #[test]
        fn test_gap_limit_custom() {
            let xpub = Xpub::from_str(TEST_XPUB).unwrap();
            let custom_limit = 75;
            let iterator = XpubIterator::new(xpub, None, Some(custom_limit)).unwrap();

            assert_eq!(iterator.gap_limit(), custom_limit);
        }

        #[test]
        fn test_gap_limit_zero() {
            let xpub = Xpub::from_str(TEST_XPUB).unwrap();
            let iterator = XpubIterator::new(xpub, None, Some(0)).unwrap();

            assert_eq!(iterator.gap_limit(), 0);
        }

        #[test]
        fn test_gap_limit_with_custom_derivation_path() {
            let xpub = Xpub::from_str(TEST_XPUB).unwrap();
            let custom_path = "m/84/1/0/0";
            let custom_limit = 100;
            let iterator =
                XpubIterator::new(xpub, Some(custom_path.to_string()), Some(custom_limit)).unwrap();

            assert_eq!(iterator.gap_limit(), custom_limit);
            assert_eq!(
                iterator.derivation_path,
                DerivationPath::from_str(custom_path).unwrap()
            );
        }

        #[test]
        fn test_derive_keys_basic() {
            let xpub = Xpub::from_str(TEST_XPUB).unwrap();
            let iterator = XpubIterator::new(xpub, None, None).unwrap();
            let mut keys = HashMap::new();

            let result = iterator.derive_keys(&mut keys, 0, 5).unwrap();

            assert_eq!(result.len(), 5);
            assert_eq!(keys.len(), 10);

            assert_eq!(
                result[0],
                "02384749e3d149578a07e7e3516c44467d78974cbfbb31e7fb025705d668a9447d"
            );
            assert_eq!(
                result[1],
                "030c29fed50206574604cb409c0d5ece551a09234714b4584f1e5af86ae2464b82"
            );
            assert_eq!(
                result[2],
                "0249e3eeb7881636a1447dc926ef8edd006d3e2966434ed738cae58ee4123aeda3"
            );

            for (i, key) in result.iter().enumerate() {
                assert_eq!(keys.get(key), Some(&(i as u32)));
            }

            for i in 5..10 {
                assert!(keys.values().any(|&v| v == i));
            }
        }

        #[test]
        fn test_derive_keys_single_key() {
            let xpub = Xpub::from_str(TEST_XPUB).unwrap();
            let iterator = XpubIterator::new(xpub, None, None).unwrap();
            let mut keys = HashMap::new();

            let result = iterator.derive_keys(&mut keys, 0, 1).unwrap();

            assert_eq!(result.len(), 1);
            assert_eq!(keys.len(), 2);
        }

        #[test]
        fn test_derive_keys_same_start_and_end() {
            let xpub = Xpub::from_str(TEST_XPUB).unwrap();
            let iterator = XpubIterator::new(xpub, None, None).unwrap();
            let mut keys = HashMap::new();

            let result = iterator.derive_keys(&mut keys, 5, 5).unwrap();

            assert_eq!(result.len(), 0);
            assert_eq!(keys.len(), 0);
        }

        #[test]
        fn test_derive_keys_sequential_batches() {
            let xpub = Xpub::from_str(TEST_XPUB).unwrap();
            let iterator = XpubIterator::new(xpub, None, None).unwrap();
            let mut keys1 = HashMap::new();
            let mut keys2 = HashMap::new();

            let result1 = iterator.derive_keys(&mut keys1, 0, 3).unwrap();
            let result2 = iterator.derive_keys(&mut keys2, 3, 6).unwrap();

            // Check for overlap
            for key in &result1 {
                assert!(!result2.contains(key));
            }

            assert_eq!(result1.len(), 3);
            assert_eq!(result2.len(), 3);
        }

        #[test]
        fn test_derive_keys_custom_derivation_path() {
            let xpub = Xpub::from_str(TEST_XPUB).unwrap();
            let iterator1 = XpubIterator::new(xpub, None, None).unwrap();
            let iterator2 = XpubIterator::new(xpub, Some("m/84/0/0/0".to_string()), None).unwrap();

            let mut keys1 = HashMap::new();
            let mut keys2 = HashMap::new();

            let result1 = iterator1.derive_keys(&mut keys1, 0, 3).unwrap();
            let result2 = iterator2.derive_keys(&mut keys2, 0, 3).unwrap();

            assert_ne!(result1, result2);
        }

        #[test]
        fn test_derive_keys_deterministic() {
            let xpub = Xpub::from_str(TEST_XPUB).unwrap();
            let iterator = XpubIterator::new(xpub, None, None).unwrap();

            let mut keys1 = HashMap::new();
            let mut keys2 = HashMap::new();

            let result1 = iterator.derive_keys(&mut keys1, 0, 5).unwrap();
            let result2 = iterator.derive_keys(&mut keys2, 0, 5).unwrap();

            assert_eq!(result1, result2);
        }

        #[test]
        fn test_derive_keys_large_index() {
            let xpub = Xpub::from_str(TEST_XPUB).unwrap();
            let iterator = XpubIterator::new(xpub, None, None).unwrap();
            let mut keys = HashMap::new();

            let start = 1000;
            let end = 1005;
            let result = iterator.derive_keys(&mut keys, start, end).unwrap();

            assert_eq!(result.len(), 5);
            assert_eq!(keys.get(&result[0]), Some(&start));
        }

        #[test]
        fn test_derive_keys_gap_limit_calculation() {
            let xpub = Xpub::from_str(TEST_XPUB).unwrap();
            let iterator = XpubIterator::new(xpub, None, None).unwrap();
            let mut keys = HashMap::new();

            let result = iterator.derive_keys(&mut keys, 0, 10).unwrap();

            assert_eq!(result.len(), 10);
            assert_eq!(keys.len(), 20);

            // Last key in map should be at index 19
            assert!(keys.values().any(|&v| v == 19));
        }

        #[test]
        fn test_derive_keys_all_keys_are_hex() {
            let xpub = Xpub::from_str(TEST_XPUB).unwrap();
            let iterator = XpubIterator::new(xpub, None, None).unwrap();
            let mut keys = HashMap::new();

            let result = iterator.derive_keys(&mut keys, 0, 3).unwrap();

            for key in result {
                assert!(hex::decode(&key).is_ok());
                assert_eq!(key.len(), 66);
            }
        }

        #[test]
        fn test_invalid_derivation_path_error() {
            let xpub = Xpub::from_str(TEST_XPUB).unwrap();
            assert!(XpubIterator::new(xpub, Some("invalid/path".to_string()), None).is_err());
        }

        #[rstest::rstest]
        #[case("m//0", "Double slash")]
        #[case("m/-1/0/0/0", "Negative index")]
        #[case("m/44/0/0/0/extra", "Too many components")]
        #[case("m/notanumber/0/0/0", "Non-numeric index")]
        #[case("x/44/0/0/0", "Wrong prefix")]
        #[case("m/2147483648/0/0/0", "Index too large (2^31)")]
        fn test_invalid_derivation_paths(#[case] path: &str, #[case] description: &str) {
            let xpub = Xpub::from_str(TEST_XPUB).unwrap();
            assert!(
                XpubIterator::new(xpub, Some(path.to_string()), None).is_err(),
                "{}",
                description
            );
        }
    }

    mod key_vec_iterator {
        use super::*;

        const TEST_PUBKEYS: [&str; 5] = [
            TEST_PUBKEY,
            "02e6ce4f5cef0de71a0c770cc8617b92b651a18efa16dfffe07b77a6ade0bf6a03",
            "0228f13c45e10d92defefd0076f5ce827813674d83f6577c9924899f611a03fd41",
            "034a84f58797b2dc027ec3ad15dc5f670f775bd80dd56f9c57569a8f68f8628a04",
            "0317549d6206db40f2ad09d36ef6ba7793d35c77d0f629758a3e13dc31411e2b58",
        ];

        fn test_keys() -> Vec<PublicKey> {
            TEST_PUBKEYS
                .iter()
                .map(|k| PublicKey::from_str(k).unwrap())
                .collect()
        }

        #[test]
        fn test_new() {
            let keys = test_keys();
            let iterator = KeyVecIterator::new(keys.clone());

            assert_eq!(iterator.keys.len(), 5);
            for (i, key) in keys.iter().enumerate() {
                assert_eq!(
                    hex::encode(iterator.keys[i].inner.serialize()),
                    hex::encode(key.inner.serialize())
                );
            }
        }

        #[test]
        fn test_new_empty() {
            let iterator = KeyVecIterator::new(vec![]);
            assert_eq!(iterator.keys.len(), 0);
        }

        #[test]
        fn test_new_single_key() {
            let keys = vec![PublicKey::from_str(TEST_PUBKEY).unwrap()];
            let iterator = KeyVecIterator::new(keys);
            assert_eq!(iterator.keys.len(), 1);
        }

        #[test]
        fn test_identifier_deterministic() {
            let keys = test_keys();
            let iterator1 = KeyVecIterator::new(keys.clone());
            let iterator2 = KeyVecIterator::new(keys);

            assert_eq!(iterator1.identifier(), iterator2.identifier());
        }

        #[test]
        fn test_identifier_different_for_different_keys() {
            let keys1 = test_keys();
            let keys2 = vec![PublicKey::from_str(TEST_PUBKEY).unwrap()];

            let iterator1 = KeyVecIterator::new(keys1);
            let iterator2 = KeyVecIterator::new(keys2);

            assert_ne!(iterator1.identifier(), iterator2.identifier());
        }

        #[test]
        fn test_identifier_order_matters() {
            let keys1 = test_keys();
            let mut keys2 = keys1.clone();
            keys2.reverse();

            let iterator1 = KeyVecIterator::new(keys1);
            let iterator2 = KeyVecIterator::new(keys2);

            assert_ne!(iterator1.identifier(), iterator2.identifier());
        }

        #[test]
        fn test_max_keys() {
            let keys = test_keys();
            let iterator = KeyVecIterator::new(keys.clone());

            assert_eq!(iterator.max_keys(), keys.len() as u32);
        }

        #[test]
        fn test_gap_limit() {
            let keys = test_keys();
            let iterator = KeyVecIterator::new(keys);

            assert_eq!(iterator.gap_limit(), DEFAULT_GAP_LIMIT);
        }

        #[test]
        fn test_max_keys_empty() {
            let iterator = KeyVecIterator::new(vec![]);
            assert_eq!(iterator.max_keys(), 0);
        }

        #[test]
        fn test_max_keys_single() {
            let keys = vec![PublicKey::from_str(TEST_PUBKEY).unwrap()];
            let iterator = KeyVecIterator::new(keys);
            assert_eq!(iterator.max_keys(), 1);
        }

        #[test]
        fn test_derive_keys_basic() {
            let keys = test_keys();
            let iterator = KeyVecIterator::new(keys);
            let mut key_map = HashMap::new();

            let result = iterator.derive_keys(&mut key_map, 0, 3).unwrap();

            assert_eq!(result.len(), 3);
            // With buffer: end + (end - start) = 3 + 3 = 6, but we only have 5 keys
            assert_eq!(key_map.len(), 5);

            assert_eq!(result[0], TEST_PUBKEYS[0].to_lowercase());
            assert_eq!(result[1], TEST_PUBKEYS[1].to_lowercase());
            assert_eq!(result[2], TEST_PUBKEYS[2].to_lowercase());

            for (i, key) in result.iter().enumerate() {
                assert_eq!(key_map.get(key), Some(&(i as u32)));
            }
        }

        #[test]
        fn test_derive_keys_all_keys() {
            let keys = test_keys();
            let iterator = KeyVecIterator::new(keys);
            let mut key_map = HashMap::new();

            let result = iterator.derive_keys(&mut key_map, 0, 5).unwrap();

            assert_eq!(result.len(), 5);
            assert_eq!(key_map.len(), 5);

            for (i, expected) in TEST_PUBKEYS.iter().enumerate() {
                assert_eq!(result[i], expected.to_lowercase());
                assert_eq!(key_map.get(&result[i]), Some(&(i as u32)));
            }
        }

        #[test]
        fn test_derive_keys_overflow() {
            let keys = test_keys();
            let iterator = KeyVecIterator::new(keys);
            let mut key_map = HashMap::new();

            let result = iterator.derive_keys(&mut key_map, 0, 100).unwrap();
            assert_eq!(result.len(), 5);
        }

        #[test]
        fn test_derive_keys_single_key() {
            let keys = test_keys();
            let iterator = KeyVecIterator::new(keys);
            let mut key_map = HashMap::new();

            let result = iterator.derive_keys(&mut key_map, 0, 1).unwrap();

            assert_eq!(result.len(), 1);
            // With buffer: 1 + (1 - 0) = 2
            assert_eq!(key_map.len(), 2);
            assert_eq!(result[0], TEST_PUBKEYS[0].to_lowercase());
        }

        #[test]
        fn test_derive_keys_middle_range() {
            let keys = test_keys();
            let iterator = KeyVecIterator::new(keys);
            let mut key_map = HashMap::new();

            let result = iterator.derive_keys(&mut key_map, 1, 4).unwrap();

            assert_eq!(result.len(), 3);
            // With buffer: 4 + (4 - 1) = 7, but we only have 5 keys total
            // So from index 1, we can only get keys[1..5] = 4 keys
            assert_eq!(key_map.len(), 4);

            assert_eq!(result[0], TEST_PUBKEYS[1].to_lowercase());
            assert_eq!(result[1], TEST_PUBKEYS[2].to_lowercase());
            assert_eq!(result[2], TEST_PUBKEYS[3].to_lowercase());
        }

        #[test]
        fn test_derive_keys_with_offset() {
            let keys = test_keys();
            let iterator = KeyVecIterator::new(keys);
            let mut key_map = HashMap::new();

            let result = iterator.derive_keys(&mut key_map, 2, 4).unwrap();

            assert_eq!(result.len(), 2);
            assert_eq!(result[0], TEST_PUBKEYS[2].to_lowercase());
            assert_eq!(result[1], TEST_PUBKEYS[3].to_lowercase());

            assert_eq!(key_map.get(&result[0]), Some(&2));
            assert_eq!(key_map.get(&result[1]), Some(&3));
        }

        #[test]
        fn test_derive_keys_buffer_logic() {
            let keys = test_keys();
            let iterator = KeyVecIterator::new(keys);
            let mut key_map = HashMap::new();

            // Request 2 keys (0-2), buffer should add 2 more (2-4)
            let result = iterator.derive_keys(&mut key_map, 0, 2).unwrap();

            assert_eq!(result.len(), 2);
            // Buffer: 2 + (2 - 0) = 4 keys in map
            assert_eq!(key_map.len(), 4);

            // Verify buffer keys are in the map
            for (i, expected_key) in TEST_PUBKEYS.into_iter().enumerate().take(4) {
                assert!(key_map.contains_key(expected_key));
                assert_eq!(key_map.get(expected_key), Some(&(i as u32)));
            }
        }

        #[test]
        fn test_derive_keys_sequential_batches() {
            let keys = test_keys();
            let iterator = KeyVecIterator::new(keys);
            let mut keys1 = HashMap::new();
            let mut keys2 = HashMap::new();

            let result1 = iterator.derive_keys(&mut keys1, 0, 2).unwrap();
            let result2 = iterator.derive_keys(&mut keys2, 2, 4).unwrap();

            assert_eq!(result1.len(), 2);
            assert_eq!(result2.len(), 2);

            // Check no overlap in results
            for key in &result1 {
                assert!(!result2.contains(key));
            }

            assert_eq!(result1[0], TEST_PUBKEYS[0].to_lowercase());
            assert_eq!(result1[1], TEST_PUBKEYS[1].to_lowercase());
            assert_eq!(result2[0], TEST_PUBKEYS[2].to_lowercase());
            assert_eq!(result2[1], TEST_PUBKEYS[3].to_lowercase());
        }

        #[test]
        fn test_derive_keys_same_start_and_end() {
            let keys = test_keys();
            let iterator = KeyVecIterator::new(keys);
            let mut key_map = HashMap::new();

            let result = iterator.derive_keys(&mut key_map, 2, 2).unwrap();

            assert_eq!(result.len(), 0);
            assert_eq!(key_map.len(), 0);
        }

        #[test]
        fn test_derive_keys_all_keys_are_hex() {
            let keys = test_keys();
            let iterator = KeyVecIterator::new(keys);
            let mut key_map = HashMap::new();

            let result = iterator.derive_keys(&mut key_map, 0, 3).unwrap();

            for key in result {
                assert!(hex::decode(&key).is_ok());
                assert_eq!(key.len(), 66);
            }
        }

        #[test]
        fn test_derive_keys_deterministic() {
            let keys = test_keys();
            let iterator = KeyVecIterator::new(keys);

            let mut keys1 = HashMap::new();
            let mut keys2 = HashMap::new();

            let result1 = iterator.derive_keys(&mut keys1, 0, 3).unwrap();
            let result2 = iterator.derive_keys(&mut keys2, 0, 3).unwrap();

            assert_eq!(result1, result2);
            assert_eq!(keys1, keys2);
        }

        #[test]
        fn test_derive_keys_last_key() {
            let keys = test_keys();
            let iterator = KeyVecIterator::new(keys);
            let mut key_map = HashMap::new();

            let result = iterator.derive_keys(&mut key_map, 4, 5).unwrap();

            assert_eq!(result.len(), 1);
            assert_eq!(result[0], TEST_PUBKEYS[4].to_lowercase());
            assert_eq!(key_map.get(&result[0]), Some(&4));
        }
    }

    mod single_key_iterator {
        use super::*;

        #[test]
        fn test_new() {
            let pubkey = PublicKey::from_str(TEST_PUBKEY).unwrap();
            let iterator = SingleKeyIterator::new(pubkey);

            assert_eq!(
                hex::encode(iterator.key.inner.serialize()),
                TEST_PUBKEY.to_lowercase()
            );
        }

        #[test]
        fn test_identifier() {
            let pubkey = PublicKey::from_str(TEST_PUBKEY).unwrap();
            let iterator = SingleKeyIterator::new(pubkey);

            let identifier = iterator.identifier();
            assert!(!identifier.is_empty());
            assert_eq!(identifier, pubkey.pubkey_hash().to_string());
        }

        #[test]
        fn test_max_keys() {
            let pubkey = PublicKey::from_str(TEST_PUBKEY).unwrap();
            let iterator = SingleKeyIterator::new(pubkey);

            assert_eq!(iterator.max_keys(), 1);
        }

        #[test]
        fn test_gap_limit() {
            let pubkey = PublicKey::from_str(TEST_PUBKEY).unwrap();
            let iterator = SingleKeyIterator::new(pubkey);

            assert_eq!(iterator.gap_limit(), DEFAULT_GAP_LIMIT);
        }

        #[test]
        fn test_derive_keys_basic() {
            let pubkey = PublicKey::from_str(TEST_PUBKEY).unwrap();
            let iterator = SingleKeyIterator::new(pubkey);
            let mut keys = HashMap::new();

            let result = iterator.derive_keys(&mut keys, 0, 100).unwrap();

            assert_eq!(result.len(), 1);
            assert_eq!(keys.len(), 1);
            assert_eq!(keys.get(&result[0]), Some(&0));

            assert_eq!(result[0], TEST_PUBKEY.to_lowercase());
        }

        #[test]
        fn test_derive_keys_ignores_range() {
            let pubkey = PublicKey::from_str(TEST_PUBKEY).unwrap();
            let iterator = SingleKeyIterator::new(pubkey);

            let mut keys1 = HashMap::new();
            let mut keys2 = HashMap::new();
            let mut keys3 = HashMap::new();

            let result1 = iterator.derive_keys(&mut keys1, 0, 1).unwrap();
            let result2 = iterator.derive_keys(&mut keys2, 50, 100).unwrap();
            let result3 = iterator.derive_keys(&mut keys3, 1000, 5000).unwrap();

            assert_eq!(result1, result2);
            assert_eq!(result2, result3);
            assert_eq!(result1[0], TEST_PUBKEY.to_lowercase());
        }

        #[test]
        fn test_derive_keys_always_index_zero() {
            let pubkey = PublicKey::from_str(TEST_PUBKEY).unwrap();
            let iterator = SingleKeyIterator::new(pubkey);
            let mut keys = HashMap::new();

            iterator.derive_keys(&mut keys, 999, 1000).unwrap();

            assert_eq!(keys.len(), 1);
            let (_, &index) = keys.iter().next().unwrap();
            assert_eq!(index, 0);
        }

        #[test]
        fn test_derive_keys_is_valid_hex() {
            let pubkey = PublicKey::from_str(TEST_PUBKEY).unwrap();
            let iterator = SingleKeyIterator::new(pubkey);
            let mut keys = HashMap::new();

            let result = iterator.derive_keys(&mut keys, 0, 1).unwrap();

            assert!(hex::decode(&result[0]).is_ok());
            assert_eq!(result[0].len(), 66);
        }
    }
}

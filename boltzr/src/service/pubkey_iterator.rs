use alloy::hex;
use anyhow::Result;
use bitcoin::{
    PublicKey,
    bip32::{ChildNumber, DerivationPath, Xpub},
    secp256k1::{Secp256k1, VerifyOnly},
};
use std::{collections::HashMap, str::FromStr};

const DEFAULT_DERIVATION_PATH: &str = "m/44/0/0/0";

pub trait PubkeyIterator {
    fn identifier(&self) -> String;
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
}

pub struct SingleKeyIterator {
    key: PublicKey,
}

impl XpubIterator {
    pub fn new(xpub: Xpub, derivation_path: Option<String>) -> Result<Self> {
        Ok(Self {
            secp: Secp256k1::verification_only(),
            xpub,
            derivation_path: DerivationPath::from_str(
                &derivation_path.unwrap_or(DEFAULT_DERIVATION_PATH.to_string()),
            )?,
        })
    }
}

impl PubkeyIterator for XpubIterator {
    fn identifier(&self) -> String {
        self.xpub.identifier().to_string()
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
            let iterator = XpubIterator::new(xpub, None).unwrap();

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
            let iterator = XpubIterator::new(xpub, Some(custom_path.to_string())).unwrap();

            assert_eq!(
                iterator.derivation_path,
                DerivationPath::from_str(custom_path).unwrap()
            );
        }

        #[test]
        fn test_identifier() {
            let xpub = Xpub::from_str(TEST_XPUB).unwrap();
            let iterator = XpubIterator::new(xpub, None).unwrap();

            assert_eq!(iterator.identifier(), xpub.identifier().to_string());
        }

        #[test]
        fn test_max_keys() {
            let xpub = Xpub::from_str(TEST_XPUB).unwrap();
            let iterator = XpubIterator::new(xpub, None).unwrap();

            assert_eq!(iterator.max_keys(), u32::MAX);
        }

        #[test]
        fn test_derive_keys_basic() {
            let xpub = Xpub::from_str(TEST_XPUB).unwrap();
            let iterator = XpubIterator::new(xpub, None).unwrap();
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
            let iterator = XpubIterator::new(xpub, None).unwrap();
            let mut keys = HashMap::new();

            let result = iterator.derive_keys(&mut keys, 0, 1).unwrap();

            assert_eq!(result.len(), 1);
            assert_eq!(keys.len(), 2);
        }

        #[test]
        fn test_derive_keys_same_start_and_end() {
            let xpub = Xpub::from_str(TEST_XPUB).unwrap();
            let iterator = XpubIterator::new(xpub, None).unwrap();
            let mut keys = HashMap::new();

            let result = iterator.derive_keys(&mut keys, 5, 5).unwrap();

            assert_eq!(result.len(), 0);
            assert_eq!(keys.len(), 0);
        }

        #[test]
        fn test_derive_keys_sequential_batches() {
            let xpub = Xpub::from_str(TEST_XPUB).unwrap();
            let iterator = XpubIterator::new(xpub, None).unwrap();
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
            let iterator1 = XpubIterator::new(xpub, None).unwrap();
            let iterator2 = XpubIterator::new(xpub, Some("m/84/0/0/0".to_string())).unwrap();

            let mut keys1 = HashMap::new();
            let mut keys2 = HashMap::new();

            let result1 = iterator1.derive_keys(&mut keys1, 0, 3).unwrap();
            let result2 = iterator2.derive_keys(&mut keys2, 0, 3).unwrap();

            assert_ne!(result1, result2);
        }

        #[test]
        fn test_derive_keys_deterministic() {
            let xpub = Xpub::from_str(TEST_XPUB).unwrap();
            let iterator = XpubIterator::new(xpub, None).unwrap();

            let mut keys1 = HashMap::new();
            let mut keys2 = HashMap::new();

            let result1 = iterator.derive_keys(&mut keys1, 0, 5).unwrap();
            let result2 = iterator.derive_keys(&mut keys2, 0, 5).unwrap();

            assert_eq!(result1, result2);
        }

        #[test]
        fn test_derive_keys_large_index() {
            let xpub = Xpub::from_str(TEST_XPUB).unwrap();
            let iterator = XpubIterator::new(xpub, None).unwrap();
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
            let iterator = XpubIterator::new(xpub, None).unwrap();
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
            let iterator = XpubIterator::new(xpub, None).unwrap();
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
            assert!(XpubIterator::new(xpub, Some("invalid/path".to_string())).is_err());
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
                XpubIterator::new(xpub, Some(path.to_string())).is_err(),
                "{}",
                description
            );
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

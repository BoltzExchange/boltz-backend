use crate::service::MAX_GAP_LIMIT;
use bitcoin::{PublicKey, bip32::Xpub};
use elements::Address as ElementsAddress;
use serde::de::Visitor;
use serde::{Deserialize, Deserializer, Serializer};
use std::fmt;
use std::str::FromStr;

pub mod hex {
    use super::*;
    use alloy::hex;

    pub fn serialize<S>(data: &[u8], serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_str(&hex::encode(data))
    }
}

pub struct XpubDeserialize(pub Xpub);

impl<'de> Deserialize<'de> for XpubDeserialize {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        struct XpubDeserializeVisitor;

        impl Visitor<'_> for XpubDeserializeVisitor {
            type Value = XpubDeserialize;

            fn expecting(&self, formatter: &mut fmt::Formatter) -> fmt::Result {
                formatter.write_str("a valid xpub")
            }

            fn visit_str<E>(self, value: &str) -> Result<Self::Value, E>
            where
                E: serde::de::Error,
            {
                match Xpub::from_str(value) {
                    Ok(xpub) => Ok(XpubDeserialize(xpub)),
                    Err(err) => Err(E::custom(format!("invalid xpub: {err}"))),
                }
            }
        }

        deserializer.deserialize_string(XpubDeserializeVisitor)
    }
}

pub struct ElementsAddressDeserialize(pub ElementsAddress);

impl<'de> Deserialize<'de> for ElementsAddressDeserialize {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        struct ElementsAddressDeserializeVisitor;

        impl Visitor<'_> for ElementsAddressDeserializeVisitor {
            type Value = ElementsAddressDeserialize;

            fn expecting(&self, formatter: &mut fmt::Formatter) -> fmt::Result {
                formatter.write_str("a valid elements address")
            }

            fn visit_str<E>(self, value: &str) -> Result<Self::Value, E>
            where
                E: serde::de::Error,
            {
                match ElementsAddress::from_str(value) {
                    Ok(address) => Ok(ElementsAddressDeserialize(address)),
                    Err(err) => Err(E::custom(format!("invalid elements address: {err}"))),
                }
            }
        }

        deserializer.deserialize_string(ElementsAddressDeserializeVisitor)
    }
}

pub struct PublicKeyDeserialize(pub PublicKey);

impl<'de> Deserialize<'de> for PublicKeyDeserialize {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        struct PublicKeyDeserializeVisitor;

        impl Visitor<'_> for PublicKeyDeserializeVisitor {
            type Value = PublicKeyDeserialize;

            fn expecting(&self, formatter: &mut fmt::Formatter) -> fmt::Result {
                formatter.write_str("a valid bitcoin public key in hex format")
            }

            fn visit_str<E>(self, value: &str) -> Result<Self::Value, E>
            where
                E: serde::de::Error,
            {
                let bytes = alloy::hex::decode(value)
                    .map_err(|err| E::custom(format!("invalid hex: {err}")))?;
                match PublicKey::from_slice(&bytes) {
                    Ok(pubkey) => Ok(PublicKeyDeserialize(pubkey)),
                    Err(err) => Err(E::custom(format!("invalid public key: {err}"))),
                }
            }
        }

        deserializer.deserialize_string(PublicKeyDeserializeVisitor)
    }
}

pub struct PublicKeyVecDeserialize(pub Vec<PublicKey>);

impl<'de> Deserialize<'de> for PublicKeyVecDeserialize {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        struct PublicKeyVecVisitor;

        impl<'de> Visitor<'de> for PublicKeyVecVisitor {
            type Value = PublicKeyVecDeserialize;

            fn expecting(&self, formatter: &mut fmt::Formatter) -> fmt::Result {
                formatter.write_str("an array of hex-encoded public keys")
            }

            fn visit_seq<A>(self, mut seq: A) -> Result<Self::Value, A::Error>
            where
                A: serde::de::SeqAccess<'de>,
            {
                let mut vec = Vec::new();
                while let Some(value) = seq.next_element::<String>()? {
                    if vec.len() >= MAX_GAP_LIMIT as usize {
                        return Err(serde::de::Error::custom(format!(
                            "public key array exceeds maximum length of {MAX_GAP_LIMIT}",
                        )));
                    }

                    let bytes = alloy::hex::decode(&value)
                        .map_err(|err| serde::de::Error::custom(format!("invalid hex: {err}")))?;
                    let pubkey = PublicKey::from_slice(&bytes).map_err(|err| {
                        serde::de::Error::custom(format!("invalid public key: {err}"))
                    })?;

                    vec.push(pubkey);
                }
                Ok(PublicKeyVecDeserialize(vec))
            }
        }

        deserializer.deserialize_seq(PublicKeyVecVisitor)
    }
}

pub mod u256 {
    use super::*;
    use alloy::primitives::U256;

    pub fn serialize<S>(data: &U256, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_str(&data.to_string())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde::Serialize;
    use std::str::FromStr;

    mod hex {
        use super::*;

        #[derive(Serialize)]
        struct Wrapper<'a> {
            #[serde(serialize_with = "super::super::hex::serialize")]
            data: &'a [u8],
        }

        #[test]
        fn test_serialize_non_empty() {
            let wrapper = Wrapper {
                data: &[0xAB, 0xCD],
            };
            assert_eq!(
                serde_json::to_string(&wrapper).unwrap(),
                "{\"data\":\"abcd\"}"
            );
        }

        #[test]
        fn test_serialize_empty() {
            let wrapper = Wrapper { data: &[] };
            assert_eq!(serde_json::to_string(&wrapper).unwrap(), "{\"data\":\"\"}");
        }
    }

    mod u256 {
        use super::*;
        use alloy::primitives::U256;

        #[derive(Serialize)]
        struct U256Wrapper {
            #[serde(serialize_with = "super::super::u256::serialize")]
            value: U256,
        }

        #[test]
        fn test_serialize_zero() {
            let wrapper = U256Wrapper { value: U256::ZERO };
            assert_eq!(
                serde_json::to_string(&wrapper).unwrap(),
                "{\"value\":\"0\"}"
            );
        }

        #[test]
        fn test_serialize_small_number() {
            let wrapper = U256Wrapper {
                value: U256::from(42),
            };
            assert_eq!(
                serde_json::to_string(&wrapper).unwrap(),
                "{\"value\":\"42\"}"
            );
        }

        #[test]
        fn test_serialize_large_number() {
            let wrapper = U256Wrapper {
                value: U256::from_str("1000000000000000000").unwrap(),
            };
            assert_eq!(
                serde_json::to_string(&wrapper).unwrap(),
                "{\"value\":\"1000000000000000000\"}"
            );
        }

        #[test]
        fn test_serialize_max_value() {
            let wrapper = U256Wrapper { value: U256::MAX };
            assert_eq!(
                serde_json::to_string(&wrapper).unwrap(),
                "{\"value\":\"115792089237316195423570985008687907853269984665640564039457584007913129639935\"}"
            );
        }
    }

    mod public_key {
        use bitcoin::secp256k1::Secp256k1;
        use serde::Deserialize;

        #[derive(Deserialize)]
        struct PublicKeyWrapper {
            #[serde(rename = "publicKey")]
            public_key: super::super::PublicKeyDeserialize,
        }

        #[test]
        fn test_deserialize_valid_public_key() {
            let secp = Secp256k1::new();
            let secret_key = bitcoin::PrivateKey::generate(bitcoin::Network::Regtest);
            let public_key = secret_key.public_key(&secp);
            let hex = alloy::hex::encode(public_key.inner.serialize());

            let json = format!(r#"{{"publicKey":"{}"}}"#, hex);
            let wrapper: PublicKeyWrapper = serde_json::from_str(&json).unwrap();
            assert_eq!(wrapper.public_key.0, public_key);
        }

        #[test]
        fn test_deserialize_valid_public_key_parsed() {
            let pubkey = "02440ad87b11738cb0c76f5fc48372d27ed9132112b2fc76eac83fbd544918d0b9";
            let public_key =
                bitcoin::PublicKey::from_slice(&alloy::hex::decode(pubkey).unwrap()).unwrap();
            let wrapper: PublicKeyWrapper =
                serde_json::from_str(&format!(r#"{{"publicKey":"{}"}}"#, pubkey)).unwrap();
            assert_eq!(wrapper.public_key.0, public_key);
        }

        #[test]
        fn test_deserialize_invalid_hex() {
            let json = r#"{"publicKey":"not-hex"}"#;
            let result: Result<PublicKeyWrapper, _> = serde_json::from_str(json);
            assert!(result.is_err());
        }

        #[test]
        fn test_deserialize_invalid_public_key() {
            let json = r#"{"publicKey":"0123456789abcdef"}"#;
            let result: Result<PublicKeyWrapper, _> = serde_json::from_str(json);
            assert!(result.is_err());
        }
    }

    mod public_key_vec {
        use super::*;
        use serde::Deserialize;

        #[derive(Deserialize)]
        struct PublicKeyVecWrapper {
            #[serde(rename = "publicKeys")]
            public_keys: PublicKeyVecDeserialize,
        }

        #[test]
        fn test_deserialize_empty_vec() {
            let json = r#"{"publicKeys":[]}"#;
            let wrapper: PublicKeyVecWrapper = serde_json::from_str(json).unwrap();
            assert_eq!(wrapper.public_keys.0.len(), 0);
        }

        #[test]
        fn test_deserialize_single_public_key() {
            let pubkey = "03e27c9e4fcb8d0c16cf60f9358833b86d39f2a7dab981c7812724dba786b1efee";
            let json = format!(r#"{{"publicKeys":["{}"]}}"#, pubkey);
            let wrapper: PublicKeyVecWrapper = serde_json::from_str(&json).unwrap();
            assert_eq!(wrapper.public_keys.0.len(), 1);
            let expected =
                bitcoin::PublicKey::from_slice(&alloy::hex::decode(pubkey).unwrap()).unwrap();
            assert_eq!(wrapper.public_keys.0[0], expected);
        }

        #[test]
        fn test_deserialize_multiple_public_keys() {
            let pubkey1 = "03e27c9e4fcb8d0c16cf60f9358833b86d39f2a7dab981c7812724dba786b1efee";
            let pubkey2 = "026d8e73088e7a896e64f27b49d89beea8cd56a17547cda805a606eac658d50253";
            let json = format!(r#"{{"publicKeys":["{}","{}"]}}"#, pubkey1, pubkey2);
            let wrapper: PublicKeyVecWrapper = serde_json::from_str(&json).unwrap();
            assert_eq!(wrapper.public_keys.0.len(), 2);
            let expected1 =
                bitcoin::PublicKey::from_slice(&alloy::hex::decode(pubkey1).unwrap()).unwrap();
            let expected2 =
                bitcoin::PublicKey::from_slice(&alloy::hex::decode(pubkey2).unwrap()).unwrap();
            assert_eq!(wrapper.public_keys.0[0], expected1);
            assert_eq!(wrapper.public_keys.0[1], expected2);
        }

        #[test]
        fn test_deserialize_invalid_hex_in_vec() {
            let json = r#"{"publicKeys":["not-hex"]}"#;
            let result: Result<PublicKeyVecWrapper, _> = serde_json::from_str(json);
            assert!(result.is_err());
        }

        #[test]
        fn test_deserialize_invalid_public_key_in_vec() {
            let json = r#"{"publicKeys":["0123456789abcdef"]}"#;
            let result: Result<PublicKeyVecWrapper, _> = serde_json::from_str(json);
            assert!(result.is_err());
        }

        #[test]
        fn test_deserialize_mixed_valid_invalid() {
            let pubkey1 = "03e27c9e4fcb8d0c16cf60f9358833b86d39f2a7dab981c7812724dba786b1efee";
            let json = format!(r#"{{"publicKeys":["{}","invalid"]}}"#, pubkey1);
            let result: Result<PublicKeyVecWrapper, _> = serde_json::from_str(&json);
            assert!(result.is_err());
        }

        #[test]
        fn test_deserialize_max_limit() {
            let pubkey = "03e27c9e4fcb8d0c16cf60f9358833b86d39f2a7dab981c7812724dba786b1efee";
            let keys: Vec<String> = vec![format!("\"{}\"", pubkey); MAX_GAP_LIMIT as usize];
            let json = format!(r#"{{"publicKeys":[{}]}}"#, keys.join(","));
            let wrapper: PublicKeyVecWrapper = serde_json::from_str(&json).unwrap();
            assert_eq!(wrapper.public_keys.0.len(), MAX_GAP_LIMIT as usize);
        }

        #[test]
        fn test_deserialize_exceeds_max_limit() {
            let pubkey = "03e27c9e4fcb8d0c16cf60f9358833b86d39f2a7dab981c7812724dba786b1efee";
            let keys: Vec<String> = vec![format!("\"{}\"", pubkey); (MAX_GAP_LIMIT + 1) as usize];
            let json = format!(r#"{{"publicKeys":[{}]}}"#, keys.join(","));
            let result: Result<PublicKeyVecWrapper, _> = serde_json::from_str(&json);
            assert!(result.is_err());
            assert!(
                result
                    .err()
                    .unwrap()
                    .to_string()
                    .contains("exceeds maximum length of 150")
            );
        }
    }

    mod elements_address {
        use rstest::rstest;
        use serde::Deserialize;

        #[derive(Deserialize)]
        struct ElementsAddressWrapper {
            address: super::super::ElementsAddressDeserialize,
        }

        #[rstest]
        #[case(
            "el1qqgnspul65efe6rp7kr2yauqcxdxjduzuqu79q80uuvh4hh2lka0wtrq4m4tv56j0g6h3ywhss3gk93qa3c2l5tmuz0uku59ay"
        )]
        #[case("ert1q3s2a64k2df85dtcj8tcgg5tzcswcu906437qr9")]
        #[case("Azpr1s54jX2BJccAztZEKTRm18KZhk2fR217ydifjRw84A9UPnT1VvFAiLTHsNdD8RawaB9u7whh1hMv")]
        #[case("XTjsmjwhhzbtkYoCSaDTQydq8DuhyC6E87")]
        fn test_deserialize_valid_address(#[case] address_str: &str) {
            let json = format!(r#"{{"address":"{}"}}"#, address_str);
            let wrapper: ElementsAddressWrapper = serde_json::from_str(&json).unwrap();
            assert_eq!(wrapper.address.0.to_string(), address_str);
        }

        #[test]
        fn test_deserialize_invalid_address() {
            let json = r#"{"address":"not-a-valid-address"}"#;
            let result: Result<ElementsAddressWrapper, _> = serde_json::from_str(json);
            assert!(result.is_err());
            assert!(
                result
                    .err()
                    .unwrap()
                    .to_string()
                    .contains("invalid elements address")
            );
        }
    }
}

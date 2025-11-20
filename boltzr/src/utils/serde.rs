use bitcoin::{PublicKey, bip32::Xpub};
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
}

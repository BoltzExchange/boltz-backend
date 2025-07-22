use bitcoin::bip32::Xpub;
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
}

use alloy::primitives::U256;
use serde::Serializer;

pub mod hex {
    use super::*;

    pub fn serialize<S>(data: &[u8], serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_str(&::hex::encode(data))
    }
}

pub mod u256 {
    use super::*;

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

    #[derive(Serialize)]
    struct HexWrapper<'a> {
        #[serde(serialize_with = "hex::serialize")]
        data: &'a [u8],
    }

    #[test]
    fn test_hex_serialize_non_empty() {
        let wrapper = HexWrapper {
            data: &[0xAB, 0xCD],
        };
        assert_eq!(
            serde_json::to_string(&wrapper).unwrap(),
            "{\"data\":\"abcd\"}"
        );
    }

    #[test]
    fn test_hex_serialize_empty() {
        let wrapper = HexWrapper { data: &[] };
        assert_eq!(serde_json::to_string(&wrapper).unwrap(), "{\"data\":\"\"}");
    }

    #[derive(Serialize)]
    struct U256Wrapper {
        #[serde(serialize_with = "u256::serialize")]
        value: U256,
    }

    #[test]
    fn test_u256_serialize_zero() {
        let wrapper = U256Wrapper { value: U256::ZERO };
        assert_eq!(
            serde_json::to_string(&wrapper).unwrap(),
            "{\"value\":\"0\"}"
        );
    }

    #[test]
    fn test_u256_serialize_small_number() {
        let wrapper = U256Wrapper {
            value: U256::from(42),
        };
        assert_eq!(
            serde_json::to_string(&wrapper).unwrap(),
            "{\"value\":\"42\"}"
        );
    }
}

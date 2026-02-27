pub mod hex {
    use alloy::hex;
    use serde::Serializer;

    pub fn serialize<S>(data: &[u8], serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_str(&hex::encode(data))
    }
}

pub mod u256 {
    use alloy::primitives::U256;
    use serde::Serializer;

    pub fn serialize_base10<S>(data: &U256, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_str(&data.to_string())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use alloy::primitives::U256;
    use serde::Serialize;

    #[derive(Serialize)]
    struct Wrapper<'a> {
        #[serde(serialize_with = "hex::serialize")]
        data: &'a [u8],
    }

    #[derive(Serialize)]
    struct U256Base10Wrapper {
        #[serde(serialize_with = "u256::serialize_base10")]
        amount: U256,
    }

    #[test]
    fn test_serialize_non_empty() {
        let wrapper = Wrapper {
            data: &[0xAB, 0xCD],
        };
        let json = serde_json::to_string(&wrapper).unwrap();
        assert_eq!(json, "{\"data\":\"abcd\"}");
    }

    #[test]
    fn test_serialize_empty() {
        let wrapper = Wrapper { data: &[] };
        let json = serde_json::to_string(&wrapper).unwrap();
        assert_eq!(json, "{\"data\":\"\"}");
    }

    #[test]
    fn test_serialize_base10() {
        let wrapper = U256Base10Wrapper {
            amount: U256::from(123456789u128),
        };
        let json = serde_json::to_string(&wrapper).unwrap();
        assert_eq!(json, "{\"amount\":\"123456789\"}");
    }
}

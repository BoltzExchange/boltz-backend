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

    pub fn serialize_sats<S>(data: &U256, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_str(&data.div_ceil(U256::from(10u128.pow(10))).to_string())
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
    struct U256Wrapper {
        #[serde(serialize_with = "u256::serialize_sats")]
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
    fn test_serialize_sats_zero() {
        let wrapper = U256Wrapper {
            amount: U256::from(0),
        };
        let json = serde_json::to_string(&wrapper).unwrap();
        assert_eq!(json, "{\"amount\":\"0\"}");
    }

    #[test]
    fn test_serialize_sats_exact_division() {
        let wrapper = U256Wrapper {
            amount: U256::from(10u128.pow(10)),
        };
        let json = serde_json::to_string(&wrapper).unwrap();
        assert_eq!(json, "{\"amount\":\"1\"}");
    }

    #[test]
    fn test_serialize_sats_ceiling_division() {
        let wrapper = U256Wrapper {
            amount: U256::from(10u128.pow(10) + 1),
        };
        let json = serde_json::to_string(&wrapper).unwrap();
        assert_eq!(json, "{\"amount\":\"2\"}");
    }

    #[test]
    fn test_serialize_sats_large_value() {
        let btc_21m_wei = U256::from(21_000_000u128) * U256::from(10u128.pow(18));
        let wrapper = U256Wrapper {
            amount: btc_21m_wei,
        };
        let json = serde_json::to_string(&wrapper).unwrap();
        assert_eq!(json, "{\"amount\":\"2100000000000000\"}");
    }

    #[test]
    fn test_serialize_sats_small_value() {
        let wrapper = U256Wrapper {
            amount: U256::from(123456789u128),
        };
        let json = serde_json::to_string(&wrapper).unwrap();
        assert_eq!(json, "{\"amount\":\"1\"}");
    }

    #[test]
    fn test_serialize_sats_multiple_of_divisor() {
        let wrapper = U256Wrapper {
            amount: U256::from(5u128) * U256::from(10u128.pow(10)),
        };
        let json = serde_json::to_string(&wrapper).unwrap();
        assert_eq!(json, "{\"amount\":\"5\"}");
    }
}

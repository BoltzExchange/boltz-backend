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

#[cfg(test)]
mod tests {
    use super::hex;
    use serde::Serialize;

    #[derive(Serialize)]
    struct Wrapper<'a> {
        #[serde(serialize_with = "hex::serialize")]
        data: &'a [u8],
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
}

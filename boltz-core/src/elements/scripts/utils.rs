pub mod serializer {
    use elements::{Script, hex::FromHex};
    use serde::{Deserialize, Deserializer, Serializer};

    pub fn serialize<S>(data: &Script, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_str(&hex::encode(data.as_bytes()))
    }

    pub fn deserialize<'de, D>(deserializer: D) -> Result<Script, D::Error>
    where
        D: Deserializer<'de>,
    {
        let s = String::deserialize(deserializer)?;
        Ok(Script::from_hex(&s).unwrap())
    }
}

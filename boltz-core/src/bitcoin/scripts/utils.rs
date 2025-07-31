pub mod serializer {
    use bitcoin::ScriptBuf;
    use serde::{Deserialize, Deserializer, Serializer};

    pub fn serialize<S>(data: &ScriptBuf, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_str(&hex::encode(data.as_bytes()))
    }

    pub fn deserialize<'de, D>(deserializer: D) -> Result<ScriptBuf, D::Error>
    where
        D: Deserializer<'de>,
    {
        let s = String::deserialize(deserializer)?;
        ScriptBuf::from_hex(&s).map_err(serde::de::Error::custom)
    }
}

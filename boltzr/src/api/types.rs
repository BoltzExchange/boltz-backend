use serde::{Deserialize, Deserializer};

pub fn assert_not_zero<'de, D>(deserializer: D) -> Result<u64, D::Error>
where
    D: Deserializer<'de>,
{
    let amount = u64::deserialize(deserializer)?;
    if amount == 0 {
        return Err(serde::de::Error::invalid_value(
            serde::de::Unexpected::Unsigned(amount),
            &"value greater than 0",
        ));
    }
    Ok(amount)
}

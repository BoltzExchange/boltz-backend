use serde::{Deserialize, Deserializer};

pub fn assert_not_zero<'de, D>(deserializer: D) -> Result<Option<u64>, D::Error>
where
    D: Deserializer<'de>,
{
    let amount = Option::<u64>::deserialize(deserializer)?;
    if amount == Some(0) {
        return Err(serde::de::Error::invalid_value(
            serde::de::Unexpected::Unsigned(0),
            &"value greater than 0",
        ));
    }
    Ok(amount)
}

#[cfg(test)]
mod test {
    use super::*;
    use serde::{Deserialize, Serialize};

    #[derive(Serialize, Deserialize, Debug, PartialEq)]
    struct Test {
        #[serde(default, deserialize_with = "assert_not_zero")]
        test: Option<u64>,
    }

    #[test]
    fn test_assert_not_zero() {
        let data = Test { test: Some(21) };
        assert_eq!(
            serde_json::from_slice::<Test>(&serde_json::to_vec(&data).unwrap()).unwrap(),
            data
        );
    }

    #[test]
    fn test_assert_not_zero_none() {
        assert_eq!(
            serde_json::from_str::<Test>("{}").unwrap(),
            Test { test: None }
        );
    }

    #[test]
    fn test_assert_not_zero_null() {
        assert_eq!(
            serde_json::from_str::<Test>("{\"test\":null}").unwrap(),
            Test { test: None }
        );
    }

    #[test]
    fn test_assert_not_zero_is_zero() {
        let data = Test { test: Some(0) };
        assert_eq!(
            serde_json::from_slice::<Test>(&serde_json::to_vec(&data).unwrap())
                .err()
                .unwrap()
                .to_string(),
            "invalid value: integer `0`, expected value greater than 0 at line 1 column 10"
        );
    }
}

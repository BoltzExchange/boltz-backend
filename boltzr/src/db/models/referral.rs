use crate::db::models::SwapType;
use anyhow::anyhow;
use diesel::{AsChangeset, Insertable, Queryable, Selectable};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

type CustomExpirations = HashMap<String, u64>;

#[derive(Serialize, Deserialize, PartialEq, Debug, Clone)]
struct PairConfig {
    expirations: Option<CustomExpirations>,
}

impl PairConfig {
    fn get_expiration(&self, kind: SwapType) -> Option<u64> {
        self.expirations.as_ref().map(|expirations| {
            expirations
                .get(&<SwapType as Into<u64>>::into(kind).to_string())
                .copied()
        })?
    }
}

#[derive(Serialize, Deserialize, PartialEq, Debug, Clone)]
struct Config {
    #[serde(flatten)]
    pub base: PairConfig,

    pairs: Option<HashMap<String, PairConfig>>,
}

impl Config {
    fn for_pair(&self, pair: &str) -> &PairConfig {
        self.pairs
            .as_ref()
            .map(|pairs| pairs.get(pair).unwrap_or(&self.base))
            .unwrap_or(&self.base)
    }
}

#[derive(Queryable, Selectable, Insertable, AsChangeset, PartialEq, Clone, Debug)]
#[diesel(table_name = crate::db::schema::referrals)]
pub struct Referral {
    pub id: String,
    pub config: Option<serde_json::Value>,
}

impl Referral {
    pub fn custom_expiration_secs(
        &self,
        pair: &str,
        kind: SwapType,
    ) -> anyhow::Result<Option<u64>> {
        if let Some(cfg) = self.parse_config()? {
            return Ok(match cfg.for_pair(pair).get_expiration(kind) {
                Some(expiration) => Some(expiration),
                None => cfg.base.get_expiration(kind),
            });
        }

        Ok(None)
    }

    fn parse_config(&self) -> anyhow::Result<Option<Config>> {
        if let Some(cfg) = &self.config {
            return match serde_json::from_value(cfg.clone()) {
                Ok(config) => Ok(Some(config)),
                Err(err) => Err(anyhow!(
                    "could not parse config of referral {}: {}",
                    self.id,
                    err
                )),
            };
        }

        Ok(None)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use rstest::*;

    #[rstest]
    #[case("{\"expirations\": {\"0\": 600}}", SwapType::Submarine, Some(600))]
    #[case(
        "{\"expirations\": {\"0\": 600, \"1\": 123}}",
        SwapType::Reverse,
        Some(123)
    )]
    #[case(
        "{\"expirations\": {\"0\": 600, \"1\": 123}}",
        SwapType::Submarine,
        Some(600)
    )]
    #[case("{\"expirations\": {\"0\": 600, \"1\": 123}}", SwapType::Chain, None)]
    fn test_pair_config_get_expiration(
        #[case] json: &str,
        #[case] kind: SwapType,
        #[case] expected_expiration: Option<u64>,
    ) {
        let config = serde_json::from_str::<PairConfig>(json).unwrap();
        assert_eq!(config.get_expiration(kind), expected_expiration);
    }

    #[rstest]
    #[case("", "{\"expirations\": {\"0\": 123}}")]
    #[case("L-BTC/BTC", "{\"expirations\": {\"0\": 123}}")]
    #[case("BTC/BTC", "{\"expirations\": {\"1\": 2121}}")]
    fn test_config_for_pair(#[case] pair: &str, #[case] expected: &str) {
        let config = serde_json::from_str::<Config>(
            "{\"expirations\": {\"0\": 123}, \"pairs\": {\"BTC/BTC\": {\"expirations\": {\"1\": 2121}}}}",
        )
        .unwrap();

        let expected = serde_json::from_str::<PairConfig>(expected).unwrap();
        assert_eq!(config.for_pair(pair), &expected);
    }

    #[rstest]
    #[case("BTC/BTC", SwapType::Submarine, Some(600))]
    #[case("L-BTC/BTC", SwapType::Submarine, Some(123))]
    #[case("BTC/BTC", SwapType::Reverse, Some(2121))]
    #[case("L-BTC/BTC", SwapType::Reverse, Some(2121))]
    #[case("BTC/BTC", SwapType::Chain, None)]
    fn test_referral_custom_expiration(
        #[case] pair: &str,
        #[case] kind: SwapType,
        #[case] expected_expiration: Option<u64>,
    ) {
        let config = serde_json::json!({
            "expirations": {
                "0": 123,
                "1": 2121
            },
            "pairs": {
                "BTC/BTC": {
                    "expirations": {
                        "0": 600
                    }
                }
            }
        });
        let referral = Referral {
            id: "id".to_string(),
            config: Some(config),
        };

        let res = referral.custom_expiration_secs(pair, kind).unwrap();

        if let Some(expected_expiration) = expected_expiration {
            assert_eq!(res.unwrap(), expected_expiration);
        } else {
            assert!(res.is_none());
        }
    }
}

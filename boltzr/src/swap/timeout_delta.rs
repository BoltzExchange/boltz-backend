use crate::{
    db::models::SwapType,
    utils::pair::{OrderSide, concat_pair, split_pair},
};
use anyhow::{Result, anyhow};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::LazyLock;
use tracing::{debug, instrument};

const LIGHTNING_BUFFER: u64 = 15;
const CROSS_CHAIN_BUFFER_FACTOR: f64 = 0.25;

/// Map of symbol to block time in minutes
static BLOCK_TIMES: LazyLock<HashMap<String, f64>> = LazyLock::new(|| {
    let mut map = HashMap::new();
    map.insert("BTC".to_string(), 10.0);
    map.insert("LTC".to_string(), 2.5);
    map.insert("RBTC".to_string(), 0.5);
    map.insert("ETH".to_string(), 0.2);
    map.insert("L-BTC".to_string(), 1.0);
    map
});

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct PairTimeoutBlockDelta {
    pub chain: u64,
    pub reverse: u64,

    #[serde(rename = "swapMinimal")]
    pub swap_minimal: u64,
    #[serde(rename = "swapMaximal")]
    pub swap_maximal: u64,
    #[serde(rename = "swapTaproot")]
    pub swap_taproot: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PairConfig {
    pub base: String,
    pub quote: String,

    #[serde(rename = "timeoutDelta")]
    pub timeout_delta: PairTimeoutBlockDelta,
}

#[derive(Debug, Clone, PartialEq, Serialize)]
pub struct PairTimeoutBlockDeltas {
    pub base: PairTimeoutBlockDelta,
    pub quote: PairTimeoutBlockDelta,
}

pub struct TimeoutDeltaProvider {
    pub timeout_deltas: HashMap<String, PairTimeoutBlockDeltas>,
}

impl TimeoutDeltaProvider {
    #[instrument(name = "TimeoutDeltaProvider::new", skip_all)]
    pub fn new(pairs: &[PairConfig]) -> Result<Self> {
        let mut timeout_deltas = HashMap::new();

        for pair in pairs {
            let id = concat_pair(&pair.base, &pair.quote);
            let deltas = Self::minutes_to_blocks(&id, &pair.timeout_delta)?;
            debug!(
                "Setting timeout block deltas for {}: {}",
                id,
                serde_json::to_string_pretty(&deltas)?
            );

            timeout_deltas.insert(id, deltas);
        }

        Ok(Self { timeout_deltas })
    }

    pub fn get_timeouts(
        &self,
        pair: &str,
        order_side: OrderSide,
        swap_type: SwapType,
    ) -> Result<(u64, u64)> {
        let timeouts = match self.timeout_deltas.get(pair) {
            Some(timeouts) => timeouts,
            None => return Err(anyhow!("no timeouts for pair: {}", pair)),
        };
        let pair = split_pair(pair)?;

        Ok(match swap_type {
            SwapType::Reverse => {
                let onchain_delta = if order_side == OrderSide::Buy {
                    timeouts.base.reverse
                } else {
                    timeouts.quote.reverse
                };

                let mut lightning_delta = Self::convert_blocks(
                    if order_side == OrderSide::Buy {
                        &pair.base
                    } else {
                        &pair.quote
                    },
                    if order_side == OrderSide::Buy {
                        &pair.quote
                    } else {
                        &pair.base
                    },
                    onchain_delta,
                )?;

                lightning_delta += if pair.base == pair.quote {
                    LIGHTNING_BUFFER
                } else {
                    (lightning_delta as f64 * CROSS_CHAIN_BUFFER_FACTOR).ceil() as u64
                };

                (onchain_delta, lightning_delta)
            }
            _ => return Err(anyhow!("not implemented")),
        })
    }

    fn convert_blocks(from_symbol: &str, to_symbol: &str, blocks: u64) -> Result<u64> {
        let minutes = blocks as f64 * Self::get_block_time(from_symbol)?;
        Ok((minutes / Self::get_block_time(to_symbol)?).ceil() as u64)
    }

    fn minutes_to_blocks(
        pair: &str,
        deltas: &PairTimeoutBlockDelta,
    ) -> Result<PairTimeoutBlockDeltas> {
        let pair = split_pair(pair)?;

        Ok(PairTimeoutBlockDeltas {
            base: Self::convert_to_blocks(&pair.base, deltas)?,
            quote: Self::convert_to_blocks(&pair.quote, deltas)?,
        })
    }

    fn convert_to_blocks(
        symbol: &str,
        deltas: &PairTimeoutBlockDelta,
    ) -> Result<PairTimeoutBlockDelta> {
        Ok(PairTimeoutBlockDelta {
            chain: Self::calculate_blocks(symbol, deltas.chain)?,
            reverse: Self::calculate_blocks(symbol, deltas.reverse)?,
            swap_minimal: Self::calculate_blocks(symbol, deltas.swap_minimal)?,
            swap_maximal: Self::calculate_blocks(symbol, deltas.swap_maximal)?,
            swap_taproot: Self::calculate_blocks(symbol, deltas.swap_taproot)?,
        })
    }

    fn calculate_blocks(symbol: &str, minutes: u64) -> Result<u64> {
        let minutes_per_block = Self::get_block_time(symbol)?;
        let blocks = (minutes as f64 / minutes_per_block).ceil() as u64;
        if blocks < 1 {
            return Err(anyhow!("invalid timeout block delta"));
        }

        Ok(blocks)
    }

    fn get_block_time(symbol: &str) -> Result<&f64> {
        BLOCK_TIMES
            .get(symbol)
            .ok_or(anyhow!("no block time for symbol: {}", symbol))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use rstest::rstest;

    #[test]
    fn test_new() {
        let pairs = vec![PairConfig {
            base: "L-BTC".to_string(),
            quote: "BTC".to_string(),
            timeout_delta: PairTimeoutBlockDelta {
                chain: 10,
                reverse: 20,
                swap_minimal: 30,
                swap_maximal: 40,
                swap_taproot: 50,
            },
        }];

        let provider = TimeoutDeltaProvider::new(&pairs).unwrap();
        assert_eq!(provider.timeout_deltas.len(), 1);

        let deltas = provider.timeout_deltas.get("L-BTC/BTC").unwrap();
        assert_eq!(
            deltas.base,
            PairTimeoutBlockDelta {
                chain: 10,
                reverse: 20,
                swap_minimal: 30,
                swap_maximal: 40,
                swap_taproot: 50,
            }
        );
        assert_eq!(
            deltas.quote,
            PairTimeoutBlockDelta {
                chain: 1,
                reverse: 2,
                swap_minimal: 3,
                swap_maximal: 4,
                swap_taproot: 5,
            }
        );
    }

    #[rstest]
    #[case("BTC/BTC", OrderSide::Buy, SwapType::Reverse, 120, 120 + 15)]
    #[case("BTC/BTC", OrderSide::Sell, SwapType::Reverse, 120, 120 + 15)]
    #[case("L-BTC/BTC", OrderSide::Buy, SwapType::Reverse, 120, 15)]
    #[case("L-BTC/BTC", OrderSide::Sell, SwapType::Reverse, 12, 150)]
    fn test_get_timeouts(
        #[case] pair: &str,
        #[case] order_side: OrderSide,
        #[case] swap_type: SwapType,
        #[case] expected_onchain: u64,
        #[case] expected_lightning: u64,
    ) {
        let configs = vec![
            PairConfig {
                base: "BTC".to_string(),
                quote: "BTC".to_string(),
                timeout_delta: PairTimeoutBlockDelta {
                    chain: 1200,
                    reverse: 1200,
                    swap_minimal: 300,
                    swap_maximal: 2400,
                    swap_taproot: 1800,
                },
            },
            PairConfig {
                base: "L-BTC".to_string(),
                quote: "BTC".to_string(),
                timeout_delta: PairTimeoutBlockDelta {
                    chain: 120,
                    reverse: 120,
                    swap_minimal: 30,
                    swap_maximal: 240,
                    swap_taproot: 180,
                },
            },
        ];

        let provider = TimeoutDeltaProvider::new(&configs).unwrap();
        let (onchain, lightning) = provider.get_timeouts(pair, order_side, swap_type).unwrap();
        assert_eq!(onchain, expected_onchain);
        assert_eq!(lightning, expected_lightning);
    }

    #[test]
    fn test_get_timeouts_invalid_pair() {
        let provider = TimeoutDeltaProvider::new(&[]).unwrap();
        let result = provider.get_timeouts("INVALID/BTC", OrderSide::Buy, SwapType::Reverse);
        assert!(result.is_err());
    }

    #[test]
    fn test_get_timeouts_invalid_swap_type() {
        let pair_config = PairConfig {
            base: "BTC".to_string(),
            quote: "L-BTC".to_string(),
            timeout_delta: PairTimeoutBlockDelta {
                chain: 120,
                reverse: 120,
                swap_minimal: 30,
                swap_maximal: 240,
                swap_taproot: 180,
            },
        };

        let provider = TimeoutDeltaProvider::new(&[pair_config]).unwrap();
        let result = provider.get_timeouts("BTC/L-BTC", OrderSide::Buy, SwapType::Submarine);
        assert!(result.is_err());
    }

    #[rstest]
    #[case("BTC", "L-BTC", 10, 100)]
    #[case("L-BTC", "BTC", 100, 10)]
    #[case("BTC", "RBTC", 10, 200)]
    #[case("RBTC", "BTC", 200, 10)]
    #[case("BTC", "BTC", 10, 10)]
    fn test_convert_blocks(
        #[case] from_symbol: &str,
        #[case] to_symbol: &str,
        #[case] blocks: u64,
        #[case] expected: u64,
    ) {
        assert_eq!(
            TimeoutDeltaProvider::convert_blocks(from_symbol, to_symbol, blocks).unwrap(),
            expected
        );
    }

    #[test]
    fn test_convert_blocks_invalid_symbol() {
        assert!(TimeoutDeltaProvider::convert_blocks("BTC", "INVALID", 10).is_err());
        assert!(TimeoutDeltaProvider::convert_blocks("INVALID", "BTC", 10).is_err());
    }

    #[test]
    fn test_minutes_to_blocks() {
        let delta = PairTimeoutBlockDelta {
            chain: 60,
            reverse: 120,
            swap_minimal: 30,
            swap_maximal: 240,
            swap_taproot: 180,
        };

        let result = TimeoutDeltaProvider::minutes_to_blocks("L-BTC/BTC", &delta).unwrap();

        assert_eq!(
            result.base,
            PairTimeoutBlockDelta {
                chain: 60,
                reverse: 120,
                swap_minimal: 30,
                swap_maximal: 240,
                swap_taproot: 180,
            }
        );
        assert_eq!(
            result.quote,
            PairTimeoutBlockDelta {
                chain: 6,
                reverse: 12,
                swap_minimal: 3,
                swap_maximal: 24,
                swap_taproot: 18,
            }
        );
    }

    #[test]
    fn test_minutes_to_blocks_invalid_pair() {
        let delta = PairTimeoutBlockDelta {
            chain: 60,
            reverse: 120,
            swap_minimal: 30,
            swap_maximal: 240,
            swap_taproot: 180,
        };

        let result = TimeoutDeltaProvider::minutes_to_blocks("INVALID", &delta);
        assert!(result.is_err());
    }

    #[rstest]
    #[case("BTC", 6, 12, 3, 24, 18)]
    #[case("L-BTC", 60, 120, 30, 240, 180)]
    #[case("RBTC", 120, 240, 60, 480, 360)]
    fn test_convert_to_blocks(
        #[case] symbol: &str,
        #[case] expected_chain: u64,
        #[case] expected_reverse: u64,
        #[case] expected_swap_minimal: u64,
        #[case] expected_swap_maximal: u64,
        #[case] expected_swap_taproot: u64,
    ) {
        let delta = PairTimeoutBlockDelta {
            chain: 60,
            reverse: 120,
            swap_minimal: 30,
            swap_maximal: 240,
            swap_taproot: 180,
        };

        assert_eq!(
            TimeoutDeltaProvider::convert_to_blocks(symbol, &delta).unwrap(),
            PairTimeoutBlockDelta {
                chain: expected_chain,
                reverse: expected_reverse,
                swap_minimal: expected_swap_minimal,
                swap_maximal: expected_swap_maximal,
                swap_taproot: expected_swap_taproot,
            }
        );
    }

    #[rstest]
    #[case("BTC", 10, 1)]
    #[case("BTC", 210, 21)]
    #[case("L-BTC", 210, 210)]
    #[case("RBTC", 210, 420)]
    fn test_calculate_blocks(#[case] symbol: &str, #[case] minutes: u64, #[case] expected: u64) {
        assert_eq!(
            TimeoutDeltaProvider::calculate_blocks(symbol, minutes).unwrap(),
            expected
        );
    }

    #[test]
    fn test_calculate_blocks_invalid() {
        assert!(TimeoutDeltaProvider::calculate_blocks("BTC", 0).is_err());
    }

    #[rstest]
    #[rstest]
    #[case("BTC", &10.0)]
    #[case("L-BTC", &1.0)]
    #[case("RBTC", &0.5)]
    #[case("ETH", &0.2)]
    fn test_get_block_time(#[case] symbol: &str, #[case] expected: &f64) {
        assert_eq!(
            TimeoutDeltaProvider::get_block_time(symbol).unwrap(),
            expected
        );
    }

    #[test]
    fn test_get_block_time_not_found() {
        assert!(TimeoutDeltaProvider::get_block_time("USDT").is_err());
    }
}

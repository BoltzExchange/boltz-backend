use anyhow::{Result, anyhow};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::LazyLock;
use tracing::{debug, instrument};

use crate::{
    db::models::SwapType,
    utils::pair::{OrderSide, concat_pair, split_pair},
};

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

#[derive(Debug, Clone, Serialize, Deserialize)]
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

#[derive(Debug, Clone, Serialize)]
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

                // Add 15 blocks to the delta for same currency swaps and 25% for cross chain ones as buffer
                lightning_delta += if pair.base == pair.quote {
                    15
                } else {
                    (lightning_delta as f64 * 0.25).ceil() as u64
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
        let blocks = minutes as f64 / minutes_per_block;

        // Sanity checks to make sure no impossible deltas are set
        if blocks.fract() != 0.0 || blocks < 1.0 {
            return Err(anyhow!("invalid timeout block delta"));
        }

        Ok(blocks as u64)
    }

    fn get_block_time(symbol: &str) -> Result<&f64> {
        BLOCK_TIMES
            .get(symbol)
            .ok_or(anyhow!("no block time for symbol: {}", symbol))
    }
}

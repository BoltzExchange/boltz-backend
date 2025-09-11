use crate::chain::Client;
use crate::swap::SwapUpdate;
use crate::wallet::Wallet;
use anyhow::Result;
use async_trait::async_trait;
use boltz_core::wrapper::InputDetail;
use serde::de::Visitor;
use serde::{Deserialize, Deserializer, Serialize, Serializer};
use std::fmt;
use std::sync::Arc;
use strum_macros::{Display, EnumString};

mod chain_swap;
mod keys;
mod offer;
mod referral;
mod refund_transaction;
mod reverse_swap;
mod swap;
mod web_hook;

pub use chain_swap::*;
pub use keys::*;
pub use offer::*;
pub use referral::*;
pub use refund_transaction::*;
pub use reverse_swap::*;
pub use swap::*;
pub use web_hook::*;

#[derive(EnumString, Display, PartialEq, Clone, Copy, Debug)]
pub enum SwapType {
    #[strum(serialize = "Submarine")]
    Submarine,
    #[strum(serialize = "Reverse")]
    Reverse,
    #[strum(serialize = "Chain")]
    Chain,
}

impl TryFrom<u64> for SwapType {
    type Error = anyhow::Error;

    fn try_from(value: u64) -> Result<Self, Self::Error> {
        match value {
            0 => Ok(SwapType::Submarine),
            1 => Ok(SwapType::Reverse),
            2 => Ok(SwapType::Chain),
            _ => Err(anyhow::anyhow!("invalid value for SwapType: {}", value)),
        }
    }
}

impl From<SwapType> for u64 {
    fn from(value: SwapType) -> Self {
        match value {
            SwapType::Submarine => 0,
            SwapType::Reverse => 1,
            SwapType::Chain => 2,
        }
    }
}

impl Serialize for SwapType {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        match self {
            SwapType::Submarine => serializer.serialize_str("submarine"),
            SwapType::Reverse => serializer.serialize_str("reverse"),
            SwapType::Chain => serializer.serialize_str("chain"),
        }
    }
}

impl<'de> Deserialize<'de> for SwapType {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        struct SwapTypeVisitor;

        impl Visitor<'_> for SwapTypeVisitor {
            type Value = SwapType;

            fn expecting(&self, formatter: &mut fmt::Formatter) -> fmt::Result {
                formatter.write_str("a valid swap type")
            }

            fn visit_str<E>(self, value: &str) -> Result<Self::Value, E>
            where
                E: serde::de::Error,
            {
                match value {
                    "submarine" => Ok(SwapType::Submarine),
                    "reverse" => Ok(SwapType::Reverse),
                    "chain" => Ok(SwapType::Chain),
                    _ => Err(E::custom(format!("invalid swap type: {value}"))),
                }
            }
        }

        deserializer.deserialize_string(SwapTypeVisitor)
    }
}

#[derive(Display, PartialEq, Clone, Copy, Debug)]
pub enum SwapVersion {
    Legacy = 0,
    Taproot = 1,
}

impl TryFrom<i32> for SwapVersion {
    type Error = anyhow::Error;

    fn try_from(value: i32) -> Result<Self, Self::Error> {
        match value {
            0 => Ok(SwapVersion::Legacy),
            1 => Ok(SwapVersion::Taproot),
            _ => Err(anyhow::anyhow!("invalid value for SwapVersion: {}", value)),
        }
    }
}

#[async_trait]
pub trait SomeSwap {
    fn kind(&self) -> SwapType;

    fn id(&self) -> String;
    fn status(&self) -> SwapUpdate;

    fn refund_symbol(&self) -> anyhow::Result<String>;
    async fn refund_details(
        &self,
        wallet: &Arc<dyn Wallet + Send + Sync>,
        client: &Arc<dyn Client + Send + Sync>,
    ) -> Result<InputDetail>;
}

pub trait LightningSwap {
    fn chain_symbol(&self) -> anyhow::Result<String>;
    fn lightning_symbol(&self) -> anyhow::Result<String>;
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_swap_version_try_from() {
        assert_eq!(SwapVersion::try_from(0).unwrap(), SwapVersion::Legacy);
        assert_eq!(SwapVersion::try_from(1).unwrap(), SwapVersion::Taproot);
        assert!(SwapVersion::try_from(2).is_err());
    }
}

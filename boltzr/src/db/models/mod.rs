use crate::swap::SwapUpdate;
use serde::de::Visitor;
use serde::{Deserialize, Deserializer, Serialize, Serializer};
use std::fmt;
use strum_macros::{Display, EnumString};

mod chain_swap;
mod keys;
mod referral;
mod reverse_swap;
mod swap;
mod web_hook;

pub use chain_swap::*;
pub use keys::*;
pub use referral::*;
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
                    _ => Err(E::custom(format!("invalid swap type: {}", value))),
                }
            }
        }

        deserializer.deserialize_string(SwapTypeVisitor)
    }
}

pub trait SomeSwap {
    fn kind(&self) -> SwapType;

    fn id(&self) -> String;
    fn status(&self) -> SwapUpdate;
}

pub trait LightningSwap {
    fn chain_symbol(&self) -> anyhow::Result<String>;
    fn lightning_symbol(&self) -> anyhow::Result<String>;
}

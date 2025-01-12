use crate::swap::SwapUpdate;
use strum_macros::{Display, EnumString};

mod chain_swap;
mod referral;
mod reverse_swap;
mod swap;
mod web_hook;

pub use chain_swap::*;
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

pub trait SomeSwap {
    fn kind(&self) -> SwapType;

    fn id(&self) -> String;
    fn status(&self) -> SwapUpdate;
}

pub trait LightningSwap {
    fn chain_symbol(&self) -> anyhow::Result<String>;
    fn lightning_symbol(&self) -> anyhow::Result<String>;
}

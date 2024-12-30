use crate::swap::SwapUpdate;
use strum_macros::{Display, EnumString};

mod chain_swap;
mod reverse_swap;
mod swap;
mod web_hook;

pub use chain_swap::*;
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

pub trait SomeSwap {
    fn kind(&self) -> SwapType;

    fn id(&self) -> String;
    fn status(&self) -> SwapUpdate;
}

pub trait LightningSwap {
    fn chain_symbol(&self) -> anyhow::Result<String>;
    fn lightning_symbol(&self) -> anyhow::Result<String>;
}

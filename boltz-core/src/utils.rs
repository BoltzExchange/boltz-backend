use std::{fmt::Display, str::FromStr};

pub const COOPERATIVE_INPUT_ERROR: &str = "cooperative input has to be spent via key-path";

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum OutputType<U, S> {
    Taproot(U),
    SegwitV0(S),
    Compatibility(S),
    Legacy(S),
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum InputType {
    /// Contains the preimage
    Claim([u8; 32]),
    /// Contains the locktime required for the refund
    Refund(u32),
    /// For keypath spends which do not need additional information
    Cooperative,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Destination<'a, A> {
    Single(A),
    Multiple(Outputs<'a, A>),
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Outputs<'a, A> {
    pub change: A,
    pub outputs: &'a [(A, u64)],
}

pub trait Transaction {
    fn input_len(&self) -> usize;
    fn vsize(&self) -> usize;
}

pub trait TxIn {
    fn witness(&self) -> Vec<Vec<u8>>;
    fn script_sig_pushed_bytes(&self) -> Vec<Vec<u8>>;
}

#[derive(PartialEq, Debug, Clone, Copy)]
pub enum Chain {
    Bitcoin,
    Elements,
}

impl FromStr for Chain {
    type Err = anyhow::Error;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "BTC" => Ok(Chain::Bitcoin),
            "L-BTC" | "LBTC" => Ok(Chain::Elements),
            _ => Err(anyhow::anyhow!("unknown symbol {}", s)),
        }
    }
}

impl Display for Chain {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Chain::Bitcoin => write!(f, "BTC"),
            Chain::Elements => write!(f, "L-BTC"),
        }
    }
}

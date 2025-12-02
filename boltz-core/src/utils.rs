use std::{fmt::Display, str::FromStr};

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
pub enum Type {
    Bitcoin,
    Elements,
}

impl FromStr for Type {
    type Err = anyhow::Error;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "BTC" => Ok(Type::Bitcoin),
            "L-BTC" => Ok(Type::Elements),
            _ => Err(anyhow::anyhow!("unknown symbol {}", s)),
        }
    }
}
impl Display for Type {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{self:?}")
    }
}

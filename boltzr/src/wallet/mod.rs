mod bitcoin;
mod elements;

pub use bitcoin::*;
pub use elements::*;

#[derive(PartialEq, Debug, Clone, Copy)]
pub enum Network {
    Mainnet,
    Testnet,
    Regtest,
}

pub trait Wallet {
    fn decode_address(&self, address: &str) -> anyhow::Result<Vec<u8>>;
}

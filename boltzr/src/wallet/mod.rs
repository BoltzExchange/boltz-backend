use ::bitcoin::bip32::Xpriv;
use anyhow::Result;

mod bitcoin;
mod elements;
mod keys;

pub use bitcoin::*;
pub use elements::*;

#[derive(PartialEq, Debug, Clone, Copy)]
pub enum Network {
    Mainnet,
    Testnet,
    Regtest,
}

pub trait Wallet {
    fn decode_address(&self, address: &str) -> Result<Vec<u8>>;
    fn derive_keys(&self, index: u64) -> Result<Xpriv>;
    fn derive_blinding_key(&self, address: &str) -> Result<Vec<u8>>;
}

#[cfg(test)]
pub mod test {
    use super::*;

    pub use keys::test::get_seed;
}

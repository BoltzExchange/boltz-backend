use ::bitcoin::bip32::Xpriv;
use anyhow::Result;
use async_trait::async_trait;

mod bitcoin;
mod elements;
mod keys;

pub use bitcoin::*;
pub use elements::*;

#[derive(PartialEq, Debug, Clone, Copy)]
pub enum Network {
    Mainnet,
    Testnet,
    Signet,
    Regtest,
}

#[async_trait]
pub trait Wallet {
    fn decode_address(&self, address: &str) -> Result<Vec<u8>>;
    fn derive_keys(&self, index: u64) -> Result<Xpriv>;
    fn derive_blinding_key(&self, address: &str) -> Result<Vec<u8>>;

    async fn get_address(&self, label: String) -> Result<String>;
}

impl Network {
    pub fn bitcoin(&self) -> ::bitcoin::Network {
        match self {
            Network::Mainnet => ::bitcoin::Network::Bitcoin,
            Network::Signet => ::bitcoin::Network::Signet,
            Network::Testnet => ::bitcoin::Network::Testnet,
            Network::Regtest => ::bitcoin::Network::Regtest,
        }
    }

    pub fn liquid(&self) -> anyhow::Result<&'static ::elements::AddressParams> {
        match self {
            Network::Mainnet => Ok(&::elements::address::AddressParams::LIQUID),
            Network::Testnet => Ok(&::elements::address::AddressParams::LIQUID_TESTNET),
            Network::Regtest => Ok(&::elements::address::AddressParams::ELEMENTS),
            Network::Signet => Err(anyhow::anyhow!(
                "Signet is not supported for liquid addresses"
            )),
        }
    }
}

#[cfg(test)]
pub mod test {
    use super::*;

    pub use keys::test::get_seed;
}

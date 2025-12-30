use ::bitcoin::bip32::Xpriv;
use anyhow::Result;
use async_trait::async_trait;
pub use boltz_core::Network;

mod bitcoin;
mod elements;
mod keys;

pub use bitcoin::*;
pub use elements::*;

#[async_trait]
pub trait Wallet {
    fn decode_address(&self, address: &str) -> Result<Vec<u8>>;
    fn derive_keys(&self, index: u64) -> Result<Xpriv>;
    fn derive_blinding_key(&self, script_pubkey: Vec<u8>) -> Result<Vec<u8>>;

    async fn get_address(&self, wallet: Option<&str>, label: &str) -> Result<String>;

    fn label_batch_claim(&self, ids: &[&str]) -> String {
        format!("Batch claim of Swaps {}", ids.join(", "))
    }
}

#[cfg(test)]
pub mod test {
    use super::*;

    pub use keys::test::get_seed;
}

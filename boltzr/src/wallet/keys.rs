use anyhow::Result;
use bitcoin::bip32::{DerivationPath, Xpriv};
use bitcoin::key::Secp256k1;
use bitcoin::{NetworkKind, secp256k1};
use std::str::FromStr;

pub struct Keys {
    secp: Secp256k1<secp256k1::SignOnly>,
    xpriv: Xpriv,
    path: String,
}

impl Keys {
    pub fn new(seed: &[u8; 64], path: String) -> Result<Self> {
        Ok(Self {
            path,
            secp: Secp256k1::signing_only(),
            xpriv: Xpriv::new_master(NetworkKind::Main, seed)?,
        })
    }

    pub fn derive_key(&self, index: u64) -> Result<Xpriv> {
        Ok(self.xpriv.derive_priv(
            &self.secp,
            &DerivationPath::from_str(&format!("{}/{}", self.path, index))?,
        )?)
    }
}

#[cfg(test)]
pub mod test {
    use crate::wallet::keys::Keys;
    use bip39::Mnemonic;
    use rstest::rstest;
    use std::str::FromStr;

    pub fn get_seed() -> [u8; 64] {
        Mnemonic::from_str("test test test test test test test test test test test junk")
            .unwrap()
            .to_seed("")
    }

    #[rstest]
    #[case(
        "m/0/0",
        0,
        "034f9213a05b414189ea7edd4466cbce31ab052b03d6f9824e208287841a034bfc"
    )]
    #[case(
        "m/0/0",
        1,
        "03defe74e5f8393f9c48d9c9fb0bf49a883adac25269890bb1d2d7c41af619f2d5"
    )]
    #[case(
        "m/0/1",
        0,
        "0371ce2b829f0de3863be481d9d72fde7a11f780e070be73f35b5ddd4a878327f9"
    )]
    #[case(
        "m/0/1",
        1,
        "03f80e5650435fb598bb07257d50af378d4f7ddf8f2f78181f8b29abb0b05ecb47"
    )]
    fn test_derive_key(#[case] path: String, #[case] index: u64, #[case] expected: &str) {
        let keys = Keys::new(&get_seed(), path).unwrap();
        let key = keys.derive_key(index).unwrap();
        assert_eq!(
            hex::encode(key.private_key.public_key(&keys.secp).serialize()),
            expected
        );
    }
}

use crate::wallet::keys::Keys;
use crate::wallet::{Network, Wallet};
use anyhow::{Result, anyhow};
use bitcoin::bip32::Xpriv;
use std::str::FromStr;

pub struct Bitcoin {
    network: bitcoin::Network,
    keys: Keys,
}

impl Bitcoin {
    pub fn new(network: Network, seed: &[u8; 64], path: String) -> Result<Self> {
        Ok(Self {
            network: match network {
                Network::Mainnet => bitcoin::Network::Bitcoin,
                Network::Testnet => bitcoin::Network::Testnet,
                Network::Regtest => bitcoin::Network::Regtest,
            },
            keys: Keys::new(seed, path)?,
        })
    }
}

impl Wallet for Bitcoin {
    fn decode_address(&self, address: &str) -> Result<Vec<u8>> {
        let dec = bitcoin::address::Address::from_str(address)?;
        Ok(match dec.require_network(self.network) {
            Ok(address) => address.script_pubkey().into_bytes(),
            Err(_) => return Err(anyhow::anyhow!("invalid network")),
        })
    }

    fn derive_keys(&self, index: u64) -> Result<Xpriv> {
        self.keys.derive_key(index)
    }

    fn derive_blinding_key(&self, _address: &str) -> Result<Vec<u8>> {
        Err(anyhow!("not implemented for bitcoin"))
    }
}

#[cfg(test)]
mod test {
    use crate::wallet::{Bitcoin, Network, Wallet};
    use alloy::hex;
    use bip39::Mnemonic;
    use bitcoin::secp256k1::Secp256k1;
    use rstest::*;
    use std::str::FromStr;

    fn get_seed() -> ([u8; 64], String) {
        (
            Mnemonic::from_str("test test test test test test test test test test test junk")
                .unwrap()
                .to_seed(""),
            "m/0/0".to_string(),
        )
    }

    #[rstest]
    #[case::mainnet(Network::Mainnet, bitcoin::Network::Bitcoin)]
    #[case::testnet(Network::Testnet, bitcoin::Network::Testnet)]
    #[case::regtest(Network::Regtest, bitcoin::Network::Regtest)]
    fn test_new(#[case] network: Network, #[case] expected: bitcoin::Network) {
        let (seed, path) = get_seed();
        let wallet = Bitcoin::new(network, &seed, path).unwrap();
        assert_eq!(wallet.network, expected);
    }

    #[rstest]
    #[case::regtest_taproot(
        Network::Regtest,
        "bcrt1ppjkfcyc8dej7ut60fyqh462xx5ga86u2q8smw44qs2r5csmyd2nqc7yuy8"
    )]
    #[case::regtest_segwit(Network::Regtest, "bcrt1q0pgjclqhqlcjpmu5crq8369wk6v5cm4n2l340j")]
    #[case::regtest_nested(Network::Regtest, "2N68eeJDUkhB2anQg6NkmNJJAZYZb9k3qjn")]
    #[case::regtest_legacy(Network::Regtest, "mwc8xtF856a1wGKNPd6cf1DLkSmc7NtcNb")]
    fn test_decode_address(#[case] network: Network, #[case] address: &str) {
        let (seed, path) = get_seed();
        let wallet = Bitcoin::new(network, &seed, path).unwrap();
        assert!(wallet.decode_address(address).is_ok());
    }

    #[test]
    fn test_decode_address_invalid() {
        let (seed, path) = get_seed();
        let result = Bitcoin::new(Network::Regtest, &seed, path)
            .unwrap()
            .decode_address("invalid");
        assert!(result.is_err());
        assert_eq!(result.unwrap_err().to_string(), "base58 error");
    }

    #[test]
    fn test_decode_address_invalid_network() {
        let (seed, path) = get_seed();
        let result = Bitcoin::new(Network::Testnet, &seed, path)
            .unwrap()
            .decode_address("bcrt1pvz6uhg0r5pthsa7d99udl3xct8q03e497cnuj0hn88fl3ph72tns65hlem");
        assert!(result.is_err());
        assert_eq!(result.unwrap_err().to_string(), "invalid network");
    }

    #[test]
    fn test_derive_keys() {
        let (seed, path) = get_seed();
        let result = Bitcoin::new(Network::Testnet, &seed, path)
            .unwrap()
            .derive_keys(0)
            .unwrap();
        assert_eq!(
            hex::encode(
                result
                    .private_key
                    .public_key(&Secp256k1::signing_only())
                    .serialize()
            ),
            "034f9213a05b414189ea7edd4466cbce31ab052b03d6f9824e208287841a034bfc"
        );
    }

    #[test]
    fn test_derive_blinding_key() {
        let (seed, path) = get_seed();
        let err = Bitcoin::new(Network::Testnet, &seed, path)
            .unwrap()
            .derive_blinding_key("")
            .err()
            .unwrap();
        assert_eq!(err.to_string(), "not implemented for bitcoin");
    }
}

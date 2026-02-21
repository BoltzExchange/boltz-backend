use crate::chain::Client;
use crate::wallet::keys::Keys;
use crate::wallet::{Network, Wallet};
use anyhow::{Result, anyhow};
use async_trait::async_trait;
use bitcoin::{bip32::Xpriv, secp256k1};
use std::str::FromStr;
use std::sync::Arc;

pub struct Bitcoin {
    network: bitcoin::Network,
    client: Arc<dyn Client + Send + Sync>,
    keys: Keys,
}

impl Bitcoin {
    pub fn new(
        network: Network,
        seed: &[u8; 64],
        path: String,
        client: Arc<dyn Client + Send + Sync>,
    ) -> Result<Self> {
        Ok(Self {
            network: match network {
                Network::Mainnet => bitcoin::Network::Bitcoin,
                Network::Testnet => bitcoin::Network::Testnet,
                Network::Signet => bitcoin::Network::Signet,
                Network::Regtest => bitcoin::Network::Regtest,
            },
            client,
            keys: Keys::new(seed, path)?,
        })
    }
}

#[async_trait]
impl Wallet for Bitcoin {
    fn decode_address(&self, address: &str) -> Result<Vec<u8>> {
        let dec = bitcoin::address::Address::from_str(address)?;
        Ok(match dec.require_network(self.network) {
            Ok(address) => address.script_pubkey().into_bytes(),
            Err(_) => return Err(anyhow!("invalid network")),
        })
    }

    fn derive_keys(&self, index: u64) -> Result<Xpriv> {
        self.keys.derive_key(index)
    }

    fn derive_pubkey(
        &self,
        secp: &secp256k1::Secp256k1<secp256k1::All>,
        index: u64,
    ) -> Result<secp256k1::PublicKey> {
        Ok(self.derive_keys(index)?.private_key.public_key(secp))
    }

    fn derive_blinding_key(&self, _script_pubkey: Vec<u8>) -> Result<Vec<u8>> {
        Err(anyhow!("not implemented for bitcoin"))
    }

    async fn get_address(&self, wallet: Option<&str>, label: &str) -> Result<String> {
        self.client.get_new_address(wallet, label, None).await
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use crate::chain::chain_client::test::get_client;
    use crate::wallet::keys::test::get_seed;
    use bitcoin::secp256k1::Secp256k1;
    use rstest::*;

    const PATH: &str = "m/0/0";

    #[tokio::test]
    #[rstest]
    #[case::mainnet(Network::Mainnet, bitcoin::Network::Bitcoin)]
    #[case::testnet(Network::Testnet, bitcoin::Network::Testnet)]
    #[case::regtest(Network::Regtest, bitcoin::Network::Regtest)]
    async fn test_new(#[case] network: Network, #[case] expected: bitcoin::Network) {
        let seed = get_seed();
        let wallet = Bitcoin::new(
            network,
            &seed,
            PATH.to_string(),
            Arc::new(get_client().await),
        )
        .unwrap();
        assert_eq!(wallet.network, expected);
    }

    #[tokio::test]
    #[rstest]
    #[case::regtest_taproot(
        Network::Regtest,
        "bcrt1ppjkfcyc8dej7ut60fyqh462xx5ga86u2q8smw44qs2r5csmyd2nqc7yuy8"
    )]
    #[case::regtest_segwit(Network::Regtest, "bcrt1q0pgjclqhqlcjpmu5crq8369wk6v5cm4n2l340j")]
    #[case::regtest_nested(Network::Regtest, "2N68eeJDUkhB2anQg6NkmNJJAZYZb9k3qjn")]
    #[case::regtest_legacy(Network::Regtest, "mwc8xtF856a1wGKNPd6cf1DLkSmc7NtcNb")]
    async fn test_decode_address(#[case] network: Network, #[case] address: &str) {
        let seed = get_seed();
        let wallet = Bitcoin::new(
            network,
            &seed,
            PATH.to_string(),
            Arc::new(get_client().await),
        )
        .unwrap();
        assert!(wallet.decode_address(address).is_ok());
    }

    #[tokio::test]
    async fn test_decode_address_invalid() {
        let seed = get_seed();
        let result = Bitcoin::new(
            Network::Regtest,
            &seed,
            PATH.to_string(),
            Arc::new(get_client().await),
        )
        .unwrap()
        .decode_address("invalid");
        assert!(result.is_err());
        assert_eq!(result.unwrap_err().to_string(), "base58 error");
    }

    #[tokio::test]
    async fn test_decode_address_invalid_network() {
        let seed = get_seed();
        let result = Bitcoin::new(
            Network::Testnet,
            &seed,
            PATH.to_string(),
            Arc::new(get_client().await),
        )
        .unwrap()
        .decode_address("bcrt1pvz6uhg0r5pthsa7d99udl3xct8q03e497cnuj0hn88fl3ph72tns65hlem");
        assert!(result.is_err());
        assert_eq!(result.unwrap_err().to_string(), "invalid network");
    }

    #[tokio::test]
    async fn test_derive_keys() {
        let seed = get_seed();
        let result = Bitcoin::new(
            Network::Testnet,
            &seed,
            PATH.to_string(),
            Arc::new(get_client().await),
        )
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

    #[tokio::test]
    async fn test_derive_pubkey() {
        let seed = get_seed();
        let wallet = Bitcoin::new(
            Network::Testnet,
            &seed,
            PATH.to_string(),
            Arc::new(get_client().await),
        )
        .unwrap();
        let secp = Secp256k1::new();
        let pubkey = wallet.derive_pubkey(&secp, 0).unwrap();
        assert_eq!(
            hex::encode(pubkey.serialize()),
            "034f9213a05b414189ea7edd4466cbce31ab052b03d6f9824e208287841a034bfc"
        );
    }

    #[tokio::test]
    #[rstest]
    #[case(
        0,
        "034f9213a05b414189ea7edd4466cbce31ab052b03d6f9824e208287841a034bfc"
    )]
    #[case(
        1,
        "03defe74e5f8393f9c48d9c9fb0bf49a883adac25269890bb1d2d7c41af619f2d5"
    )]
    async fn test_derive_pubkey_multiple_indices(#[case] index: u64, #[case] expected: &str) {
        let seed = get_seed();
        let wallet = Bitcoin::new(
            Network::Testnet,
            &seed,
            PATH.to_string(),
            Arc::new(get_client().await),
        )
        .unwrap();
        let secp = Secp256k1::new();
        let pubkey = wallet.derive_pubkey(&secp, index).unwrap();
        assert_eq!(hex::encode(pubkey.serialize()), expected);
    }

    #[tokio::test]
    async fn test_derive_blinding_key() {
        let seed = get_seed();
        let err = Bitcoin::new(
            Network::Testnet,
            &seed,
            PATH.to_string(),
            Arc::new(get_client().await),
        )
        .unwrap()
        .derive_blinding_key(vec![])
        .err()
        .unwrap();
        assert_eq!(err.to_string(), "not implemented for bitcoin");
    }
}

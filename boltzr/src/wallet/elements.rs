use crate::chain::Client;
use crate::wallet::keys::Keys;
use crate::wallet::{Network, Wallet};
use anyhow::Result;
use async_trait::async_trait;
use bitcoin::{bip32::Xpriv, secp256k1};
use elements::pset::serialize::Serialize;
use elements_miniscript::slip77;
use lightning::util::ser::Writeable;
use std::str::FromStr;
use std::sync::Arc;

pub struct Elements {
    network: elements::AddressParams,
    client: Arc<dyn Client + Send + Sync>,
    keys: Keys,

    slip77: slip77::MasterBlindingKey,
}

impl Elements {
    pub fn new(
        network: Network,
        seed: &[u8; 64],
        path: String,
        client: Arc<dyn Client + Send + Sync>,
    ) -> Result<Self> {
        Ok(Self {
            network: match network {
                Network::Mainnet => elements::AddressParams::LIQUID,
                Network::Testnet | Network::Signet => elements::AddressParams::LIQUID_TESTNET,
                Network::Regtest => elements::AddressParams::ELEMENTS,
            },
            client,
            keys: Keys::new(seed, path)?,
            slip77: slip77::MasterBlindingKey::from_seed(seed),
        })
    }

    fn decode_address_inner(&self, address: &str) -> Result<elements::Address> {
        let dec = elements::Address::from_str(address)?;
        if *dec.params != self.network {
            return Err(anyhow::anyhow!("invalid network"));
        }

        Ok(dec)
    }
}

#[async_trait]
impl Wallet for Elements {
    fn decode_address(&self, address: &str) -> Result<Vec<u8>> {
        Ok(self
            .decode_address_inner(address)?
            .script_pubkey()
            .serialize())
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

    fn derive_blinding_key(&self, script_pubkey: Vec<u8>) -> Result<Vec<u8>> {
        Ok(self
            .slip77
            .blinding_private_key(&elements_miniscript::elements::Script::from(script_pubkey))
            .encode())
    }

    async fn get_address(&self, wallet: Option<&str>, label: &str) -> Result<String> {
        self.client.get_new_address(wallet, label, None).await
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use crate::chain::elements_client::test::get_client;
    use crate::wallet::keys::test::get_seed;
    use alloy::hex;
    use bitcoin::key::Secp256k1;
    use rstest::*;

    const PATH: &str = "m/0/1";

    #[tokio::test]
    #[rstest]
    #[case::mainnet(Network::Mainnet, elements::AddressParams::LIQUID)]
    #[case::testnet(Network::Testnet, elements::AddressParams::LIQUID_TESTNET)]
    #[case::regtest(Network::Regtest, elements::AddressParams::ELEMENTS)]
    async fn test_new(#[case] network: Network, #[case] expected: elements::AddressParams) {
        let seed = get_seed();
        let wallet =
            Elements::new(network, &seed, PATH.to_string(), Arc::new(get_client().0)).unwrap();
        assert_eq!(wallet.network, expected);
    }

    #[tokio::test]
    #[rstest]
    #[case::regtest_taproot(
        Network::Regtest,
        "el1pqt0dzt0mh2gxxvrezmzqexg0n66rkmd5997wn255wmfpqdegd2qyh284rq5v4h2vtj0ey3399k8d8v8qwsphj3qt4cf9zj08h0zqhraf0qcqltm5nfxq"
    )]
    #[case::regtest_taproot_unconfidential(
        Network::Regtest,
        "ert1p4r63s2x2m4x9e8ujgcjjmrknkrs8gqmegs96uyj3f8nmh3qt375sypfq5m"
    )]
    #[case::regtest_segwit(
        Network::Regtest,
        "el1qq0cm53ae2e5trn6wxa9lhcg7k42rrsdtqkzw2gucr9f30rchqr4dttge6skvgjr4nfu9wa4cmhef2g4vsshr6gxcl9hn0j6t6"
    )]
    #[case::regtest_segwit_unconfidential(
        Network::Regtest,
        "ert1q45vagtxyfp6e57zhw6udmu54y2kggt3a772qqc"
    )]
    #[case::regtest_nested(
        Network::Regtest,
        "Azpnk8khuDiLxTZxyU1SptRGHiScPgEvc8UW91reeM7abwxupYeDRWKYrdXmhBhcWjAU4VBhvn8GS5C1"
    )]
    #[case::regtest_nested_unconfidential(Network::Regtest, "XG1S1H3Wj6jg4CjTGVsrchUmBfNKSRVvuL")]
    #[case::regtest_legacy(
        Network::Regtest,
        "CTEtw32YvtisKRpVzzFdHzWqihHmVfE2NpGVSuCdGnNppzGJU55xvLARDW3PaHEwYSaXtsr5akCiAfNN"
    )]
    #[case::regtest_legacy_unconfidential(Network::Regtest, "2dfnSPrvvTtUmDnW6AdnyeoMYkuNiMRgxQe")]
    async fn test_decode_address(#[case] network: Network, #[case] address: &str) {
        let seed = get_seed();
        let wallet =
            Elements::new(network, &seed, PATH.to_string(), Arc::new(get_client().0)).unwrap();
        assert!(wallet.decode_address(address).is_ok());
    }

    #[tokio::test]
    async fn test_decode_address_invalid() {
        let seed = get_seed();
        let result = Elements::new(
            Network::Regtest,
            &seed,
            PATH.to_string(),
            Arc::new(get_client().0),
        )
        .unwrap()
        .decode_address("invalid");
        assert!(result.is_err());
        assert_eq!(result.unwrap_err().to_string(), "base58 error: decode");
    }

    #[tokio::test]
    async fn test_decode_address_invalid_network() {
        let seed = get_seed();
        let result = Elements::new(
            Network::Testnet,
            &seed,
            PATH.to_string(),
            Arc::new(get_client().0),
        )
        .unwrap()
        .decode_address("2dfnSPrvvTtUmDnW6AdnyeoMYkuNiMRgxQe");
        assert!(result.is_err());
        assert_eq!(result.unwrap_err().to_string(), "invalid network");
    }

    #[tokio::test]
    async fn test_derive_keys() {
        let seed = get_seed();
        let result = Elements::new(
            Network::Testnet,
            &seed,
            PATH.to_string(),
            Arc::new(get_client().0),
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
            "0371ce2b829f0de3863be481d9d72fde7a11f780e070be73f35b5ddd4a878327f9"
        );
    }

    #[tokio::test]
    async fn test_derive_pubkey() {
        let seed = get_seed();
        let wallet = Elements::new(
            Network::Testnet,
            &seed,
            PATH.to_string(),
            Arc::new(get_client().0),
        )
        .unwrap();
        let secp = Secp256k1::new();
        let pubkey = wallet.derive_pubkey(&secp, 0).unwrap();
        assert_eq!(
            hex::encode(pubkey.serialize()),
            "0371ce2b829f0de3863be481d9d72fde7a11f780e070be73f35b5ddd4a878327f9"
        );
    }

    #[tokio::test]
    #[rstest]
    #[case(
        0,
        "0371ce2b829f0de3863be481d9d72fde7a11f780e070be73f35b5ddd4a878327f9"
    )]
    #[case(
        1,
        "03f80e5650435fb598bb07257d50af378d4f7ddf8f2f78181f8b29abb0b05ecb47"
    )]
    async fn test_derive_pubkey_multiple_indices(#[case] index: u64, #[case] expected: &str) {
        let seed = get_seed();
        let wallet = Elements::new(
            Network::Testnet,
            &seed,
            PATH.to_string(),
            Arc::new(get_client().0),
        )
        .unwrap();
        let secp = Secp256k1::new();
        let pubkey = wallet.derive_pubkey(&secp, index).unwrap();
        assert_eq!(hex::encode(pubkey.serialize()), expected);
    }

    #[tokio::test]
    async fn test_derive_blinding_key() {
        let seed = get_seed();
        let wallet = Elements::new(
            Network::Regtest,
            &seed,
            PATH.to_string(),
            Arc::new(get_client().0),
        )
        .unwrap();
        let key = wallet
            .derive_blinding_key(
                wallet.decode_address("el1pqt0dzt0mh2gxxvrezmzqexg0n66rkmd5997wn255wmfpqdegd2qyh284rq5v4h2vtj0ey3399k8d8v8qwsphj3qt4cf9zj08h0zqhraf0qcqltm5nfxq").unwrap()
            )
            .unwrap();
        assert_eq!(
            hex::encode(key),
            "bd47a0bd2544c3d2e171a31cc769b8c2f7e5670f7cb14c06fe1dbf827b18e3cf"
        );
    }
}

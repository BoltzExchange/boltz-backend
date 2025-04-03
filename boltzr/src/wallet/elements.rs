use crate::wallet::keys::Keys;
use crate::wallet::{Network, Wallet};
use anyhow::Result;
use bitcoin::bip32::Xpriv;
use elements::pset::serialize::Serialize;
use elements_miniscript::slip77;
use lightning::util::ser::Writeable;
use std::str::FromStr;

pub struct Elements {
    network: elements::AddressParams,
    keys: Keys,

    slip77: slip77::MasterBlindingKey,
}

impl Elements {
    pub fn new(network: Network, seed: &[u8; 64], path: String) -> Result<Self> {
        Ok(Self {
            network: match network {
                Network::Mainnet => elements::AddressParams::LIQUID,
                Network::Testnet | Network::Signet => elements::AddressParams::LIQUID_TESTNET,
                Network::Regtest => elements::AddressParams::ELEMENTS,
            },
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

    fn derive_blinding_key(&self, address: &str) -> Result<Vec<u8>> {
        let address = self.decode_address_inner(address)?;

        Ok(self
            .slip77
            .blinding_private_key(&address.script_pubkey())
            .encode())
    }
}

#[cfg(test)]
mod test {
    use crate::wallet::{Elements, Network, Wallet};
    use alloy::hex;
    use bip39::Mnemonic;
    use bitcoin::key::Secp256k1;
    use rstest::*;
    use std::str::FromStr;

    fn get_seed() -> ([u8; 64], String) {
        (
            Mnemonic::from_str("test test test test test test test test test test test junk")
                .unwrap()
                .to_seed(""),
            "m/0/1".to_string(),
        )
    }

    #[rstest]
    #[case::mainnet(Network::Mainnet, elements::AddressParams::LIQUID)]
    #[case::testnet(Network::Testnet, elements::AddressParams::LIQUID_TESTNET)]
    #[case::regtest(Network::Regtest, elements::AddressParams::ELEMENTS)]
    fn test_new(#[case] network: Network, #[case] expected: elements::AddressParams) {
        let (seed, path) = get_seed();
        let wallet = Elements::new(network, &seed, path).unwrap();
        assert_eq!(wallet.network, expected);
    }

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
    fn test_decode_address(#[case] network: Network, #[case] address: &str) {
        let (seed, path) = get_seed();
        let wallet = Elements::new(network, &seed, path).unwrap();
        assert!(wallet.decode_address(address).is_ok());
    }

    #[test]
    fn test_decode_address_invalid() {
        let (seed, path) = get_seed();
        let result = Elements::new(Network::Regtest, &seed, path)
            .unwrap()
            .decode_address("invalid");
        assert!(result.is_err());
        assert_eq!(result.unwrap_err().to_string(), "base58 error: decode");
    }

    #[test]
    fn test_decode_address_invalid_network() {
        let (seed, path) = get_seed();
        let result = Elements::new(Network::Testnet, &seed, path)
            .unwrap()
            .decode_address("2dfnSPrvvTtUmDnW6AdnyeoMYkuNiMRgxQe");
        assert!(result.is_err());
        assert_eq!(result.unwrap_err().to_string(), "invalid network");
    }

    #[test]
    fn test_derive_keys() {
        let (seed, path) = get_seed();
        let result = Elements::new(Network::Testnet, &seed, path)
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

    #[test]
    fn test_derive_blinding_key() {
        let (seed, path) = get_seed();
        let key = Elements::new(Network::Regtest, &seed, path)
            .unwrap()
            .derive_blinding_key("el1pqt0dzt0mh2gxxvrezmzqexg0n66rkmd5997wn255wmfpqdegd2qyh284rq5v4h2vtj0ey3399k8d8v8qwsphj3qt4cf9zj08h0zqhraf0qcqltm5nfxq")
            .unwrap();
        assert_eq!(
            hex::encode(key),
            "bd47a0bd2544c3d2e171a31cc769b8c2f7e5670f7cb14c06fe1dbf827b18e3cf"
        );
    }
}

use crate::wallet::{Network, Wallet};
use elements::pset::serialize::Serialize;
use std::str::FromStr;

pub struct Elements {
    network: elements::AddressParams,
}

impl Elements {
    pub fn new(network: Network) -> Self {
        Self {
            network: match network {
                Network::Mainnet => elements::AddressParams::LIQUID,
                Network::Testnet => elements::AddressParams::LIQUID_TESTNET,
                Network::Regtest => elements::AddressParams::ELEMENTS,
            },
        }
    }
}

impl Wallet for Elements {
    fn decode_address(&self, address: &str) -> anyhow::Result<Vec<u8>> {
        let dec = elements::Address::from_str(address)?;
        if *dec.params != self.network {
            return Err(anyhow::anyhow!("invalid network"));
        }

        Ok(dec.script_pubkey().serialize())
    }
}

#[cfg(test)]
mod test {
    use crate::wallet::{Elements, Network, Wallet};
    use rstest::*;

    #[rstest]
    #[case::mainnet(Network::Mainnet, elements::AddressParams::LIQUID)]
    #[case::testnet(Network::Testnet, elements::AddressParams::LIQUID_TESTNET)]
    #[case::regtest(Network::Regtest, elements::AddressParams::ELEMENTS)]
    fn test_new(#[case] network: Network, #[case] expected: elements::AddressParams) {
        let wallet = Elements::new(network);
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
        let wallet = Elements::new(network);
        assert!(wallet.decode_address(address).is_ok());
    }

    #[test]
    fn test_decode_address_invalid() {
        let result = Elements::new(Network::Regtest).decode_address("invalid");
        assert!(result.is_err());
        assert_eq!(result.unwrap_err().to_string(), "base58 error: decode");
    }

    #[test]
    fn test_decode_address_invalid_network() {
        let result =
            Elements::new(Network::Testnet).decode_address("2dfnSPrvvTtUmDnW6AdnyeoMYkuNiMRgxQe");
        assert!(result.is_err());
        assert_eq!(result.unwrap_err().to_string(), "invalid network");
    }
}

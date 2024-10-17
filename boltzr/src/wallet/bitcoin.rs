use crate::wallet::{Network, Wallet};
use std::str::FromStr;

pub struct Bitcoin {
    network: bitcoin::Network,
}

impl Bitcoin {
    pub fn new(network: Network) -> Self {
        Self {
            network: match network {
                Network::Mainnet => bitcoin::Network::Bitcoin,
                Network::Testnet => bitcoin::Network::Testnet,
                Network::Regtest => bitcoin::Network::Regtest,
            },
        }
    }
}

impl Wallet for Bitcoin {
    fn decode_address(&self, address: &str) -> anyhow::Result<Vec<u8>> {
        let dec = bitcoin::address::Address::from_str(address)?;
        Ok(match dec.require_network(self.network) {
            Ok(address) => address.script_pubkey().into_bytes(),
            Err(_) => return Err(anyhow::anyhow!("invalid network")),
        })
    }
}

#[cfg(test)]
mod test {
    use crate::wallet::{Bitcoin, Network, Wallet};
    use rstest::*;

    #[rstest]
    #[case::mainnet(Network::Mainnet, bitcoin::Network::Bitcoin)]
    #[case::testnet(Network::Testnet, bitcoin::Network::Testnet)]
    #[case::regtest(Network::Regtest, bitcoin::Network::Regtest)]
    fn test_new(#[case] network: Network, #[case] expected: bitcoin::Network) {
        let wallet = Bitcoin::new(network);
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
        let wallet = Bitcoin::new(network);
        assert!(wallet.decode_address(address).is_ok());
    }

    #[test]
    fn test_decode_address_invalid() {
        let result = Bitcoin::new(Network::Regtest).decode_address("invalid");
        assert!(result.is_err());
        assert_eq!(result.unwrap_err().to_string(), "base58 error");
    }

    #[test]
    fn test_decode_address_invalid_network() {
        let result = Bitcoin::new(Network::Testnet)
            .decode_address("bcrt1pvz6uhg0r5pthsa7d99udl3xct8q03e497cnuj0hn88fl3ph72tns65hlem");
        assert!(result.is_err());
        assert_eq!(result.unwrap_err().to_string(), "invalid network");
    }
}

use anyhow::{Result, anyhow};
use bitcoin::Network as BitcoinNetwork;
use elements::{BlockHash as ElementsBlockHash, address::AddressParams as ElementsAddressParams};
use std::str::FromStr;

#[derive(PartialEq, Debug, Clone, Copy)]
pub enum Network {
    Mainnet,
    Testnet,
    Signet,
    Regtest,
}

impl Network {
    pub fn bitcoin(&self) -> BitcoinNetwork {
        match self {
            Network::Mainnet => BitcoinNetwork::Bitcoin,
            Network::Signet => BitcoinNetwork::Signet,
            Network::Testnet => BitcoinNetwork::Testnet,
            Network::Regtest => BitcoinNetwork::Regtest,
        }
    }

    pub fn liquid(&self) -> Result<&'static ElementsAddressParams> {
        match self {
            Network::Mainnet => Ok(&ElementsAddressParams::LIQUID),
            Network::Testnet => Ok(&ElementsAddressParams::LIQUID_TESTNET),
            Network::Regtest => Ok(&ElementsAddressParams::ELEMENTS),
            Network::Signet => Err(anyhow::anyhow!(
                "Signet is not supported for liquid addresses"
            )),
        }
    }

    pub fn liquid_genesis_hash(&self) -> Result<ElementsBlockHash> {
        match self {
            Network::Mainnet => Ok(ElementsBlockHash::from_str(
                "1466275836220db2944ca059a3a10ef6fd2ea684b0688d2c379296888a206003",
            )?),
            Network::Testnet => Ok(ElementsBlockHash::from_str(
                "a771da8e52ee6ad581ed1e9a99825e5b3b7992225534eaa2ae23244fe26ab1c1",
            )?),
            Network::Regtest => Ok(ElementsBlockHash::from_str(
                "00902a6b70c2ca83b5d9c815d96a0e2f4202179316970d14ea1847dae5b1ca21",
            )?),
            Network::Signet => Err(anyhow::anyhow!(
                "Signet is not supported for liquid genesis hash"
            )),
        }
    }
}

impl TryFrom<&str> for Network {
    type Error = anyhow::Error;

    fn try_from(network: &str) -> Result<Self, Self::Error> {
        match network.to_lowercase().as_str() {
            "mainnet" => Ok(Network::Mainnet),
            "testnet" => Ok(Network::Testnet),
            "signet" => Ok(Network::Signet),
            "regtest" => Ok(Network::Regtest),
            _ => Err(anyhow!("invalid network: {}", network)),
        }
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use rstest::*;
    use std::convert::TryFrom;

    #[rstest]
    #[case("mainnet", Network::Mainnet)]
    #[case("MAINNET", Network::Mainnet)]
    #[case("mAiNnEt", Network::Mainnet)]
    #[case("testnet", Network::Testnet)]
    #[case("TESTNET", Network::Testnet)]
    #[case("signet", Network::Signet)]
    #[case("SIGNET", Network::Signet)]
    #[case("regtest", Network::Regtest)]
    #[case("REGTEST", Network::Regtest)]
    fn test_try_from_str(#[case] network_str: &str, #[case] expected: Network) {
        assert_eq!(Network::try_from(network_str).unwrap(), expected);
    }

    #[test]
    fn test_try_from_str_invalid() {
        let network = "asdf";
        assert_eq!(
            Network::try_from(network).unwrap_err().to_string(),
            format!("invalid network: {network}")
        );
    }
}

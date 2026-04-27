//! The [`Network`] enum naming the chains `boltz-core` supports
//! (mainnet, testnet, signet, regtest), with conversions to upstream
//! `bitcoin::Network` and Liquid `AddressParams` / genesis hash /
//! L-BTC asset id.

#[cfg(feature = "bitcoin")]
use bitcoin::Network as BitcoinNetwork;
#[cfg(feature = "elements")]
use elements::{BlockHash as ElementsBlockHash, address::AddressParams as ElementsAddressParams};
#[cfg(feature = "elements")]
use std::str::FromStr;

/// Errors returned by [`Network`] operations.
#[derive(Debug, Clone, PartialEq, Eq, thiserror::Error)]
#[non_exhaustive]
pub enum NetworkError {
    /// The provided string did not match a known network name.
    #[error("invalid network: {0}")]
    Invalid(String),
    /// The requested operation is not defined for the Bitcoin signet network
    /// (e.g. there is no Liquid signet equivalent). The argument names the
    /// missing capability.
    #[error("Signet is not supported for {0}")]
    SignetUnsupported(&'static str),
}

/// One of the chains supported by `boltz-core`.
///
/// `Network` is chain-agnostic: it picks the same network on Bitcoin and
/// Liquid (e.g. `Mainnet` maps to Bitcoin mainnet **and** Liquid). Liquid
/// has no signet equivalent, so methods that target Liquid return
/// [`NetworkError::SignetUnsupported`] for [`Network::Signet`].
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum Network {
    /// Production network.
    Mainnet,
    /// Public test network.
    Testnet,
    /// Bitcoin signet (no Liquid equivalent).
    Signet,
    /// Local regression test network.
    Regtest,
}

impl Network {
    /// The corresponding upstream `bitcoin::Network`.
    #[cfg(feature = "bitcoin")]
    pub fn bitcoin(&self) -> BitcoinNetwork {
        match self {
            Network::Mainnet => BitcoinNetwork::Bitcoin,
            Network::Signet => BitcoinNetwork::Signet,
            Network::Testnet => BitcoinNetwork::Testnet,
            Network::Regtest => BitcoinNetwork::Regtest,
        }
    }

    /// The Liquid `AddressParams` for this network.
    ///
    /// Returns [`NetworkError::SignetUnsupported`] for [`Network::Signet`].
    #[cfg(feature = "elements")]
    pub fn liquid(&self) -> Result<&'static ElementsAddressParams, NetworkError> {
        match self {
            Network::Mainnet => Ok(&ElementsAddressParams::LIQUID),
            Network::Testnet => Ok(&ElementsAddressParams::LIQUID_TESTNET),
            Network::Regtest => Ok(&ElementsAddressParams::ELEMENTS),
            Network::Signet => Err(NetworkError::SignetUnsupported("liquid addresses")),
        }
    }

    /// The Liquid genesis block hash for this network, used as the
    /// per-chain identifier in Elements transaction signing.
    ///
    /// Returns [`NetworkError::SignetUnsupported`] for [`Network::Signet`].
    #[cfg(feature = "elements")]
    pub fn liquid_genesis_hash(&self) -> Result<ElementsBlockHash, NetworkError> {
        match self {
            Network::Mainnet => Ok(ElementsBlockHash::from_str(
                "1466275836220db2944ca059a3a10ef6fd2ea684b0688d2c379296888a206003",
            )
            .expect("hardcoded mainnet genesis hash is valid")),
            Network::Testnet => Ok(ElementsBlockHash::from_str(
                "a771da8e52ee6ad581ed1e9a99825e5b3b7992225534eaa2ae23244fe26ab1c1",
            )
            .expect("hardcoded testnet genesis hash is valid")),
            Network::Regtest => Ok(ElementsBlockHash::from_str(
                "00902a6b70c2ca83b5d9c815d96a0e2f4202179316970d14ea1847dae5b1ca21",
            )
            .expect("hardcoded regtest genesis hash is valid")),
            Network::Signet => Err(NetworkError::SignetUnsupported("liquid genesis hash")),
        }
    }

    /// The hex-encoded Liquid Bitcoin (L-BTC) asset id for this network.
    ///
    /// Returns [`NetworkError::SignetUnsupported`] for [`Network::Signet`].
    #[cfg(feature = "elements")]
    pub fn liquid_asset_id(&self) -> Result<&'static str, NetworkError> {
        match self {
            Network::Mainnet => {
                Ok("6f0279e9ed041c3d710a9f57d0c02928416460c4b722ae3457a11eec381c526d")
            }
            Network::Testnet => {
                Ok("144c654344aa716d6f3abcc1ca90e5641e4e2a7f633bc09fe3baf64585819a49")
            }
            Network::Regtest => {
                Ok("5ac9f65c0efcc4775e0baec4ec03abdde22473cd3cf33c0419ca290e0751b225")
            }
            Network::Signet => Err(NetworkError::SignetUnsupported("liquid asset id")),
        }
    }
}

impl TryFrom<&str> for Network {
    type Error = NetworkError;

    fn try_from(network: &str) -> Result<Self, Self::Error> {
        match network.to_lowercase().as_str() {
            "mainnet" => Ok(Network::Mainnet),
            "testnet" => Ok(Network::Testnet),
            "signet" => Ok(Network::Signet),
            "regtest" => Ok(Network::Regtest),
            _ => Err(NetworkError::Invalid(network.to_string())),
        }
    }
}

impl std::fmt::Display for Network {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let name = match self {
            Network::Mainnet => "mainnet",
            Network::Testnet => "testnet",
            Network::Signet => "signet",
            Network::Regtest => "regtest",
        };
        f.write_str(name)
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
            Network::try_from(network).unwrap_err(),
            NetworkError::Invalid(network.to_string())
        );
    }

    #[rstest]
    #[case(Network::Mainnet, "mainnet")]
    #[case(Network::Testnet, "testnet")]
    #[case(Network::Signet, "signet")]
    #[case(Network::Regtest, "regtest")]
    fn test_display(#[case] network: Network, #[case] expected: &str) {
        assert_eq!(network.to_string(), expected);
        assert_eq!(Network::try_from(expected).unwrap(), network);
    }
}

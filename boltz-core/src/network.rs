use bitcoin::Network as BitcoinNetwork;
use elements::address::AddressParams as ElementsAddressParams;

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

    pub fn liquid(&self) -> anyhow::Result<&'static ElementsAddressParams> {
        match self {
            Network::Mainnet => Ok(&ElementsAddressParams::LIQUID),
            Network::Testnet => Ok(&ElementsAddressParams::LIQUID_TESTNET),
            Network::Regtest => Ok(&ElementsAddressParams::ELEMENTS),
            Network::Signet => Err(anyhow::anyhow!(
                "Signet is not supported for liquid addresses"
            )),
        }
    }
}

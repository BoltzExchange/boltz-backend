use crate::chain::chain_client::ChainClient;
use crate::chain::elements_client::ElementsClient;
use crate::chain::Client;
use crate::config::{CurrencyConfig, LiquidConfig};
use crate::lightning::cln::Cln;
use crate::wallet;
use crate::wallet::Wallet;
use std::collections::HashMap;
use std::sync::Arc;
use tracing::{debug, warn};

#[derive(Clone)]
pub struct Currency {
    pub wallet: Arc<dyn Wallet + Send + Sync>,

    pub chain: Option<Arc<Box<dyn Client + Send + Sync>>>,
    pub cln: Option<Cln>,
}

pub type Currencies = HashMap<String, Currency>;

pub async fn connect_nodes(
    network: Option<String>,
    currencies: Option<Vec<CurrencyConfig>>,
    liquid: Option<LiquidConfig>,
) -> anyhow::Result<Currencies> {
    let network = parse_network(network)?;

    let mut curs = HashMap::new();

    match currencies {
        Some(currencies) => {
            for currency in currencies {
                debug!("Connecting to nodes of {}", currency.symbol);

                curs.insert(
                    currency.symbol.clone(),
                    Currency {
                        wallet: Arc::new(wallet::Bitcoin::new(network)),
                        chain: match currency.chain {
                            Some(config) => {
                                let chain = ChainClient::new(
                                    crate::chain::types::Type::Bitcoin,
                                    currency.symbol.clone(),
                                    config,
                                )?;
                                chain.connect().await?;
                                Some(Arc::new(Box::new(chain)))
                            }
                            None => None,
                        },
                        cln: match currency.cln {
                            Some(config) => {
                                let mut cln = Cln::new(&currency.symbol, config).await?;
                                cln.connect().await?;
                                Some(cln)
                            }
                            None => None,
                        },
                    },
                );
            }
        }
        None => {
            warn!("No currencies are configured");
        }
    }

    if let Some(liquid) = liquid {
        debug!(
            "Connecting to nodes of {}",
            crate::chain::elements_client::SYMBOL
        );

        let chain = ElementsClient::new(liquid.chain)?;
        chain.connect().await?;

        curs.insert(
            crate::chain::elements_client::SYMBOL.to_string(),
            Currency {
                cln: None,
                chain: Some(Arc::new(Box::new(chain))),
                wallet: Arc::new(wallet::Elements::new(network)),
            },
        );
    }

    Ok(curs)
}

fn parse_network(network: Option<String>) -> anyhow::Result<wallet::Network> {
    match network {
        Some(network) => match network.to_lowercase().as_str() {
            "mainnet" => Ok(wallet::Network::Mainnet),
            "testnet" => Ok(wallet::Network::Testnet),
            "regtest" => Ok(wallet::Network::Regtest),
            &_ => Err(anyhow::anyhow!("invalid network: {}", network)),
        },
        None => {
            warn!("Network not set; defaulting to regtest");
            Ok(wallet::Network::Regtest)
        }
    }
}

#[cfg(test)]
mod test {
    use crate::currencies::parse_network;
    use crate::wallet::Network;
    use rstest::*;

    #[rstest]
    #[case(Some(String::from("mainnet")), Network::Mainnet)]
    #[case(Some(String::from("MAINNET")), Network::Mainnet)]
    #[case(Some(String::from("mAiNnEt")), Network::Mainnet)]
    #[case(Some(String::from("testnet")), Network::Testnet)]
    #[case(Some(String::from("regtest")), Network::Regtest)]
    #[case(None, Network::Regtest)]
    fn test_parse_network(#[case] network: Option<String>, #[case] expected: Network) {
        assert_eq!(parse_network(network).unwrap(), expected);
    }

    #[test]
    fn test_parse_network_invalid() {
        let network = "asdf";
        assert_eq!(
            parse_network(Some(String::from(network)))
                .unwrap_err()
                .to_string(),
            format!("invalid network: {}", network)
        );
    }
}

use crate::chain::BaseClient;
use crate::chain::chain_client::ChainClient;
use crate::chain::elements_client::ElementsClient;
use crate::config::{CurrencyConfig, LiquidConfig};
use crate::lightning::cln::Cln;
use crate::lightning::lnd::Lnd;
use crate::wallet;
use crate::wallet::Wallet;
use std::collections::HashMap;
use std::sync::Arc;
use tokio_util::sync::CancellationToken;
use tracing::{debug, error, warn};

#[derive(Clone)]
pub struct Currency {
    pub network: wallet::Network,

    pub wallet: Arc<dyn Wallet + Send + Sync>,

    pub chain: Option<Arc<Box<dyn crate::chain::Client + Send + Sync>>>,
    pub cln: Option<Cln>,
    pub lnd: Option<Lnd>,
}

pub type Currencies = Arc<HashMap<String, Currency>>;

pub async fn connect_nodes(
    cancellation_token: CancellationToken,
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
                        network,
                        wallet: Arc::new(wallet::Bitcoin::new(network)),
                        chain: match currency.chain {
                            Some(config) => {
                                #[allow(clippy::manual_map)]
                                match connect_client(ChainClient::new(
                                    crate::chain::types::Type::Bitcoin,
                                    currency.symbol.clone(),
                                    config,
                                ))
                                .await
                                {
                                    Some(client) => Some(Arc::new(Box::new(client))),
                                    None => None,
                                }
                            }
                            None => None,
                        },
                        cln: match currency.cln {
                            Some(config) => {
                                connect_client(Cln::new(&currency.symbol, config).await).await
                            }
                            None => None,
                        },
                        lnd: match currency.lnd {
                            Some(config) => {
                                connect_client(
                                    Lnd::new(cancellation_token.clone(), &currency.symbol, config)
                                        .await,
                                )
                                .await
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

        curs.insert(
            crate::chain::elements_client::SYMBOL.to_string(),
            Currency {
                network,
                cln: None,
                lnd: None,
                wallet: Arc::new(wallet::Elements::new(network)),
                #[allow(clippy::manual_map)]
                chain: match connect_client(ElementsClient::new(liquid.chain)).await {
                    Some(client) => Some(Arc::new(Box::new(client))),
                    None => None,
                },
            },
        );
    }

    Ok(Arc::new(curs))
}

async fn connect_client<T: BaseClient>(client: anyhow::Result<T>) -> Option<T> {
    match client {
        Ok(mut client) => match client.connect().await {
            Ok(_) => Some(client),
            Err(err) => {
                error!(
                    "Could not connect to {} {}: {}",
                    client.symbol(),
                    client.kind(),
                    err
                );
                None
            }
        },
        Err(err) => {
            error!("Could not create client: {}", err);
            None
        }
    }
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

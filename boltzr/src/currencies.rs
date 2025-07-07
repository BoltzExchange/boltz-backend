use crate::api::ws::OfferSubscriptions;
use crate::chain::BaseClient;
use crate::chain::bumper::Bumper;
use crate::chain::bumper::RefundTransactionFetcher;
use crate::chain::chain_client::ChainClient;
use crate::chain::elements_client::ElementsClient;
use crate::config::{CurrencyConfig, LiquidConfig};
use crate::db::Pool;
use crate::db::helpers::keys::KeysHelper;
use crate::db::helpers::offer::OfferHelperDatabase;
use crate::db::helpers::refund_transaction::RefundTransactionHelperDatabase;
use crate::db::helpers::reverse_swap::ReverseSwapHelperDatabase;
use crate::lightning::cln::Cln;
use crate::lightning::lnd::Lnd;
use crate::wallet;
use crate::wallet::Wallet;
use anyhow::anyhow;
use bip39::Mnemonic;
use std::collections::HashMap;
use std::fs;
use std::str::FromStr;
use std::sync::Arc;
use tokio_util::sync::CancellationToken;
use tracing::{debug, error, warn};

#[derive(Clone)]
pub struct Currency {
    pub network: wallet::Network,

    pub wallet: Arc<dyn Wallet + Send + Sync>,

    pub chain: Option<Arc<dyn crate::chain::Client + Send + Sync>>,
    pub bumper: Option<Bumper>,
    pub cln: Option<Cln>,
    pub lnd: Option<Lnd>,
}

pub type Currencies = Arc<HashMap<String, Currency>>;

pub async fn connect_nodes<K: KeysHelper>(
    cancellation_token: CancellationToken,
    keys_helper: K,
    mnemonic_path: Option<String>,
    network: Option<String>,
    currencies: Option<Vec<CurrencyConfig>>,
    liquid: Option<LiquidConfig>,
    db: Pool,
) -> anyhow::Result<(wallet::Network, Currencies, OfferSubscriptions)> {
    let mnemonic = match mnemonic_path {
        Some(path) => fs::read_to_string(path)?,
        None => return Err(anyhow!("no mnemonic path")),
    };
    let seed = Mnemonic::from_str(mnemonic.trim())?.to_seed("");

    let network = parse_network(network)?;
    let offer_subscriptions = OfferSubscriptions::new(network);

    let offer_helper = Arc::new(OfferHelperDatabase::new(db.clone()));
    let reverse_swap_helper = Arc::new(ReverseSwapHelperDatabase::new(db.clone()));

    let mut curs = HashMap::new();

    match currencies {
        Some(currencies) => {
            for currency in currencies {
                debug!("Connecting to nodes of {}", currency.symbol);

                let keys_info = keys_helper.get_for_symbol(&currency.symbol)?;
                let chain = match currency.chain {
                    Some(config) => connect_client(ChainClient::new(
                        cancellation_token.clone(),
                        crate::chain::types::Type::Bitcoin,
                        currency.symbol.clone(),
                        config,
                    ))
                    .await
                    .map(|chain| Arc::new(chain) as Arc<dyn crate::chain::Client + Send + Sync>),
                    None => None,
                };

                curs.insert(
                    currency.symbol.clone(),
                    Currency {
                        network,
                        bumper: chain.as_ref().map(|chain| {
                            create_bumper(cancellation_token.clone(), chain.clone(), db.clone())
                        }),
                        chain,
                        wallet: Arc::new(wallet::Bitcoin::new(
                            network,
                            &seed,
                            keys_info.derivationPath,
                        )?),
                        cln: match currency.cln {
                            Some(config) => {
                                connect_client(
                                    Cln::new(
                                        cancellation_token.clone(),
                                        &currency.symbol,
                                        network,
                                        &config,
                                        offer_helper.clone(),
                                        reverse_swap_helper.clone(),
                                        offer_subscriptions.clone(),
                                    )
                                    .await,
                                )
                                .await
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

        let keys_info = keys_helper.get_for_symbol(crate::chain::elements_client::SYMBOL)?;

        let chain = connect_client(ElementsClient::new(
            cancellation_token.clone(),
            network,
            liquid.chain,
        ))
        .await
        .map(|client| Arc::new(client) as Arc<dyn crate::chain::Client + Send + Sync>);

        curs.insert(
            crate::chain::elements_client::SYMBOL.to_string(),
            Currency {
                network,
                cln: None,
                lnd: None,
                wallet: Arc::new(wallet::Elements::new(
                    network,
                    &seed,
                    keys_info.derivationPath,
                )?),
                bumper: chain.as_ref().map(|chain| {
                    create_bumper(cancellation_token.clone(), chain.clone(), db.clone())
                }),
                chain,
            },
        );
    }

    Ok((network, Arc::new(curs), offer_subscriptions))
}

fn create_bumper(
    cancellation_token: CancellationToken,
    chain: Arc<dyn crate::chain::Client + Send + Sync>,
    db: Pool,
) -> Bumper {
    let bumper = Bumper::new(
        cancellation_token.clone(),
        chain.clone(),
        vec![Arc::new(RefundTransactionFetcher::new(
            chain.symbol(),
            RefundTransactionHelperDatabase::new(db),
        ))],
    );

    {
        let bumper = bumper.clone();
        tokio::spawn(async move {
            bumper.start().await;
        });
    }

    bumper
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
            "signet" => Ok(wallet::Network::Signet),
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
            format!("invalid network: {network}")
        );
    }
}

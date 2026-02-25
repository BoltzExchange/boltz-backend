use crate::api::ws::OfferSubscriptions;
use crate::ark::Config as ArkConfig;
use crate::chain::{
    BaseClient,
    bumper::{Bumper, RefundTransactionHandler},
    chain_client::ChainClient,
    elements_client::ElementsClient,
};
use crate::config::{CurrencyConfig, LiquidConfig};
use crate::db::{
    Pool,
    helpers::{
        chain_swap::ChainSwapHelperDatabase, keys::KeysHelper, offer::OfferHelperDatabase,
        refund_transaction::RefundTransactionHelperDatabase,
        reverse_swap::ReverseSwapHelperDatabase,
    },
};
use crate::lightning::{cln::Cln, lnd::Lnd};
use crate::wallet::{self, Wallet};
use anyhow::{anyhow, Context};
use bip39::Mnemonic;
use boltz_cache::Cache;
use boltz_evm::Manager;
use std::collections::HashMap;
use std::{fs, str::FromStr, sync::Arc};
use tokio::time::{Duration, timeout};
use tokio_util::sync::CancellationToken;
use tracing::{debug, error, warn};

const PREFERRED_WALLET_CORE: &str = "core";
const NODE_CONNECTION_TIMEOUT: Duration = Duration::from_secs(10);

#[derive(Clone)]
pub struct Currency {
    pub network: wallet::Network,

    pub wallet: Option<Arc<dyn Wallet + Send + Sync>>,

    pub chain: Option<Arc<dyn crate::chain::Client + Send + Sync>>,
    pub cln: Option<Cln>,
    pub lnd: Option<Lnd>,
    pub evm_manager: Option<Arc<Manager>>,
}

pub type Currencies = Arc<HashMap<String, Currency>>;

#[allow(clippy::too_many_arguments)]
pub async fn connect_nodes<K: KeysHelper>(
    cancellation_token: CancellationToken,
    keys_helper: K,
    mnemonic_path: Option<String>,
    network: Option<String>,
    currencies: Option<Vec<CurrencyConfig>>,
    liquid: Option<LiquidConfig>,
    ark: Option<ArkConfig>,
    db: Pool,
    cache: Cache,
    evm_mnemonic_path: String,
    evm_configs: HashMap<&'static str, Option<boltz_evm::Config>>,
    webhook_block_list: Option<Vec<String>>,
) -> anyhow::Result<(wallet::Network, Currencies, OfferSubscriptions)> {
    let mnemonic = match mnemonic_path {
        Some(ref path) => fs::read_to_string(path)
            .with_context(|| format!("failed to read mnemonic file: {}", path))?,
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
                if let Some(preferred_wallet) = currency.preferred_wallet
                    && preferred_wallet != PREFERRED_WALLET_CORE
                {
                    return Err(anyhow!(
                        "preferred wallet not supported: {} (supported: {})",
                        preferred_wallet,
                        PREFERRED_WALLET_CORE
                    ));
                }

                debug!("Connecting to nodes of {}", currency.symbol);

                let keys_info = keys_helper.get_for_symbol(&currency.symbol)?;
                let chain = match currency.chain {
                    Some(config) => connect_client(ChainClient::new(
                        cancellation_token.clone(),
                        cache.clone(),
                        crate::chain::types::Type::Bitcoin,
                        network,
                        currency.symbol.clone(),
                        config,
                    ))
                    .await
                    .map(|chain| Arc::new(chain) as Arc<dyn crate::chain::Client + Send + Sync>),
                    None => None,
                };

                let wallet = match chain {
                    Some(ref chain) => Some(wallet::Bitcoin::new(
                        network,
                        &seed,
                        keys_info.derivationPath,
                        chain.clone(),
                    )?),
                    None => None,
                }
                .map(|wallet| Arc::new(wallet) as Arc<dyn Wallet + Send + Sync>);

                if let Some(chain) = chain.as_ref()
                    && let Some(wallet) = wallet.as_ref()
                {
                    create_bumper(
                        cancellation_token.clone(),
                        db.clone(),
                        chain.clone(),
                        wallet.clone(),
                    );
                }

                curs.insert(
                    currency.symbol.clone(),
                    Currency {
                        network,
                        wallet,
                        chain,
                        cln: match currency.cln {
                            Some(config) => {
                                connect_client(
                                    Cln::new(
                                        cancellation_token.clone(),
                                        &currency.symbol,
                                        network,
                                        &config,
                                        webhook_block_list.clone(),
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
                        evm_manager: None,
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
            cache.clone(),
            liquid.chain,
        ))
        .await
        .map(|client| Arc::new(client) as Arc<dyn crate::chain::Client + Send + Sync>);

        let wallet = match chain {
            Some(ref chain) => Some(wallet::Elements::new(
                network,
                &seed,
                keys_info.derivationPath,
                chain.clone(),
            )?),
            None => None,
        }
        .map(|wallet| Arc::new(wallet) as Arc<dyn Wallet + Send + Sync>);

        if let Some(chain) = chain.as_ref()
            && let Some(wallet) = wallet.as_ref()
        {
            create_bumper(
                cancellation_token.clone(),
                db.clone(),
                chain.clone(),
                wallet.clone(),
            );
        }

        curs.insert(
            crate::chain::elements_client::SYMBOL.to_string(),
            Currency {
                network,
                cln: None,
                lnd: None,
                chain,
                wallet,
                evm_manager: None,
            },
        );
    }

    let evm_signer = Manager::read_mnemonic_file(evm_mnemonic_path).await?;

    for (symbol, config) in evm_configs {
        if let Some(config) = config {
            curs.insert(
                symbol.to_string(),
                Currency {
                    network,
                    evm_manager: Some(Arc::new(
                        Manager::new(
                            symbol.to_string(),
                            cache.clone(),
                            evm_signer.clone(),
                            &config,
                        )
                        .await?,
                    )),
                    chain: None,
                    wallet: None,
                    cln: None,
                    lnd: None,
                },
            );
        } else {
            warn!(
                "Not creating {} manager because it was not configured",
                symbol
            );
        }
    }

    if let Some(ark) = ark {
        let client = connect_client(
            crate::ark::ArkClient::new(crate::ark::CHAIN_SYMBOL.to_string(), &ark).await,
        )
        .await
        .map(Arc::new);

        let wallet = client.map(|client| {
            Arc::new(wallet::Ark::new(client.clone())) as Arc<dyn Wallet + Send + Sync>
        });

        curs.insert(
            crate::ark::SYMBOL.to_string(),
            Currency {
                network,
                chain: None,
                wallet,
                cln: None,
                lnd: None,
                evm_manager: None,
            },
        );
    }

    Ok((network, Arc::new(curs), offer_subscriptions))
}

fn create_bumper(
    cancellation_token: CancellationToken,
    db: Pool,
    chain: Arc<dyn crate::chain::Client + Send + Sync>,
    wallet: Arc<dyn Wallet + Send + Sync>,
) {
    let bumper = Bumper::new(
        cancellation_token.clone(),
        chain.clone(),
        vec![Arc::new(RefundTransactionHandler::new(
            RefundTransactionHelperDatabase::new(db.clone()),
            ReverseSwapHelperDatabase::new(db.clone()),
            ChainSwapHelperDatabase::new(db),
            wallet,
            chain,
        ))],
    );

    tokio::spawn(async move {
        bumper.start().await;
    });
}

async fn connect_client<T: BaseClient>(client: anyhow::Result<T>) -> Option<T> {
    match client {
        Ok(mut client) => match timeout(NODE_CONNECTION_TIMEOUT, client.connect()).await {
            Ok(Ok(_)) => Some(client),
            Ok(Err(err)) => {
                error!(
                    "Could not connect to {} {}: {}",
                    client.symbol(),
                    client.kind(),
                    err
                );
                None
            }
            Err(_) => {
                error!(
                    "Connection timeout for {} {} after {} seconds",
                    client.symbol(),
                    client.kind(),
                    NODE_CONNECTION_TIMEOUT.as_secs()
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
        Some(network) => wallet::Network::try_from(network.as_str()),
        None => {
            warn!("Network not set; defaulting to regtest");
            Ok(wallet::Network::Regtest)
        }
    }
}

#[cfg(test)]
mod test {
    use super::*;
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

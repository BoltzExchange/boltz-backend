use crate::chain::chain_client::ChainClient;
use crate::chain::elements_client::ElementsClient;
use crate::chain::Client;
use crate::config::{CurrencyConfig, LiquidConfig};
use crate::lightning::cln::Cln;
use std::collections::HashMap;
use std::sync::Arc;
use tracing::{debug, warn};

#[derive(Clone)]
pub struct Currency {
    pub chain: Option<Arc<Box<dyn Client + Send + Sync>>>,
    pub cln: Option<Cln>,
}

pub type Currencies = HashMap<String, Currency>;

pub async fn connect_nodes(
    currencies: Option<Vec<CurrencyConfig>>,
    liquid: Option<LiquidConfig>,
) -> anyhow::Result<Currencies> {
    let mut curs = HashMap::new();

    match currencies {
        Some(currencies) => {
            for currency in currencies {
                debug!("Connecting to nodes of {}", currency.symbol);

                curs.insert(
                    currency.symbol.clone(),
                    Currency {
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
            },
        );
    }

    Ok(curs)
}

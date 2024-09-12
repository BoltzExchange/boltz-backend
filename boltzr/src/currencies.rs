use crate::config::CurrencyConfig;
use crate::lightning::cln::Cln;
use std::collections::HashMap;
use tracing::{debug, warn};

#[derive(Debug, Clone)]
pub struct Currency {
    pub cln: Option<Cln>,
}

pub type Currencies = HashMap<String, Currency>;

pub async fn connect_nodes(currencies: Option<Vec<CurrencyConfig>>) -> anyhow::Result<Currencies> {
    let mut curs = HashMap::new();

    match currencies {
        Some(currencies) => {
            for currency in currencies {
                debug!("Connecting to nodes of {}", currency.symbol);

                let cln = match currency.cln.clone() {
                    Some(config) => {
                        let mut cln = Cln::new(&currency.symbol, config).await?;
                        cln.connect().await?;
                        Some(cln)
                    }
                    None => None,
                };

                curs.insert(currency.symbol.clone(), Currency { cln });
            }
        }
        None => {
            warn!("No currencies are configured");
        }
    }

    Ok(curs)
}

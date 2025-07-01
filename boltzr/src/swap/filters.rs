use crate::chain::utils::Outpoint;
use crate::currencies::{Currencies, Currency};
use crate::db::helpers::chain_swap::ChainSwapHelper;
use crate::db::helpers::reverse_swap::ReverseSwapHelper;
use crate::db::helpers::swap::SwapHelper;
use crate::db::models::{LightningSwap, SomeSwap};
use crate::swap::status::{SwapUpdate, serialize_swap_updates};
use crate::wallet::Wallet;
use alloy::hex;
use anyhow::Result;
use diesel::{BoolExpressionMethods, ExpressionMethods};
use std::collections::{HashMap, HashSet};
use std::sync::Arc;
use tracing::{trace, warn};

pub type Filters = HashMap<String, (HashSet<Outpoint>, HashSet<Vec<u8>>)>;

pub fn get_input_output_filters(
    currencies: &Currencies,
    swap_repo: &Arc<dyn SwapHelper + Sync + Send>,
    reverse_swap_repo: &Arc<dyn ReverseSwapHelper + Sync + Send>,
    chain_swap_repo: &Arc<dyn ChainSwapHelper + Sync + Send>,
) -> Result<Filters> {
    let mut filters = Filters::new();

    get_swap_filters(currencies, swap_repo, &mut filters)?;
    get_reverse_filters(reverse_swap_repo, &mut filters)?;
    get_chain_filters(currencies, chain_swap_repo, &mut filters)?;

    Ok(filters)
}

fn get_swap_filters(
    currencies: &Currencies,
    swap_repo: &Arc<dyn SwapHelper + Sync + Send>,
    filters: &mut Filters,
) -> Result<()> {
    let pending_swaps = swap_repo.get_all(Box::new(
        crate::db::schema::swaps::dsl::status.ne_all(serialize_swap_updates(&[
            SwapUpdate::SwapExpired,
            SwapUpdate::InvoicePending,
            SwapUpdate::InvoiceFailedToPay,
            SwapUpdate::TransactionClaimed,
            SwapUpdate::TransactionClaimPending,
        ])),
    ))?;

    for swap in pending_swaps {
        let chain_symbol = swap.chain_symbol()?;
        let currency = match get_currency(currencies, &chain_symbol, &swap) {
            Some(currency) => currency,
            None => continue,
        };
        let script = match decode_script(&currency.wallet, &swap, &swap.lockupAddress) {
            Some(script) => script,
            None => continue,
        };

        let (_, outputs) = filters
            .entry(chain_symbol)
            .or_insert((HashSet::new(), HashSet::new()));
        outputs.insert(script);
    }

    Ok(())
}

fn get_reverse_filters(
    reverse_swap_repo: &Arc<dyn ReverseSwapHelper + Sync + Send>,
    filters: &mut Filters,
) -> Result<()> {
    let pending_reverse = reverse_swap_repo.get_all(Box::new(
        crate::db::schema::reverseSwaps::dsl::status
            .eq_any(serialize_swap_updates(&[
                SwapUpdate::TransactionMempool,
                SwapUpdate::TransactionConfirmed,
            ]))
            .and(crate::db::schema::reverseSwaps::dsl::transactionId.is_not_null()),
    ))?;

    for swap in pending_reverse {
        if let Some(ref transaction_id) = swap.transactionId {
            if let Some(vout) = swap.transactionVout {
                let chain_symbol = swap.chain_symbol()?;

                let (inputs, _) = filters
                    .entry(chain_symbol)
                    .or_insert((HashSet::new(), HashSet::new()));
                inputs.insert(Outpoint {
                    vout: vout as u32,
                    hash: parse_transaction_id(transaction_id)?,
                });
            }
        }
    }

    Ok(())
}

fn get_chain_filters(
    currencies: &Currencies,
    chain_swap_repo: &Arc<dyn ChainSwapHelper + Sync + Send>,
    filters: &mut Filters,
) -> Result<()> {
    let pending_chain = chain_swap_repo.get_all(Box::new(
        crate::db::schema::chainSwaps::dsl::status.eq_any(serialize_swap_updates(&[
            SwapUpdate::SwapCreated,
            SwapUpdate::TransactionMempool,
            SwapUpdate::TransactionServerMempool,
            SwapUpdate::TransactionServerConfirmed,
            SwapUpdate::TransactionZeroconfRejected,
        ])),
    ))?;

    for swap in pending_chain {
        match swap.status() {
            SwapUpdate::SwapCreated | SwapUpdate::TransactionMempool => {
                let receiving = swap.receiving();
                let currency = match get_currency(currencies, &receiving.symbol, &swap) {
                    Some(currency) => currency,
                    None => continue,
                };
                let script = match decode_script(&currency.wallet, &swap, &receiving.lockupAddress)
                {
                    Some(script) => script,
                    None => continue,
                };

                let (_, outputs) = filters
                    .entry(receiving.symbol.clone())
                    .or_insert((HashSet::new(), HashSet::new()));
                outputs.insert(script);
            }
            SwapUpdate::TransactionServerMempool | SwapUpdate::TransactionServerConfirmed => {
                let sending = swap.sending();

                if let Some(id) = sending.transactionId.clone() {
                    if let Some(vout) = sending.transactionVout {
                        let (inputs, _) = filters
                            .entry(sending.symbol.clone())
                            .or_insert((HashSet::new(), HashSet::new()));
                        inputs.insert(Outpoint {
                            vout: vout as u32,
                            hash: parse_transaction_id(&id)?,
                        });
                    }
                }
            }
            _ => {}
        }
    }

    Ok(())
}

fn get_currency<'a, S>(currencies: &'a Currencies, symbol: &str, swap: &S) -> Option<&'a Currency>
where
    S: SomeSwap,
{
    match currencies.get(symbol) {
        Some(currency) => {
            if currency.chain.is_some() {
                Some(currency)
            } else {
                None
            }
        }
        None => {
            trace!(
                "Could not recreate filter for {} Swap {}: no currency for symbol {}",
                swap.kind(),
                swap.id(),
                symbol,
            );
            None
        }
    }
}

fn decode_script<S>(
    wallet: &Arc<dyn Wallet + Send + Sync>,
    swap: &S,
    address: &str,
) -> Option<Vec<u8>>
where
    S: SomeSwap,
{
    match wallet.decode_address(address) {
        Ok(script) => Some(script),
        Err(err) => {
            warn!(
                "Could not decode address of {} Swap {}: {}",
                swap.kind(),
                swap.id(),
                err,
            );
            None
        }
    }
}

fn parse_transaction_id(id: &str) -> Result<Vec<u8>> {
    let mut hash = hex::decode(id)?;
    hash.reverse();

    Ok(hash)
}

#[cfg(test)]
mod test {
    use crate::chain::utils::Outpoint;
    use crate::currencies::{Currencies, Currency};
    use crate::db::helpers::QueryResponse;
    use crate::db::helpers::chain_swap::{
        ChainSwapCondition, ChainSwapDataNullableCondition, ChainSwapHelper,
    };
    use crate::db::helpers::reverse_swap::ReverseSwapHelper;
    use crate::db::helpers::reverse_swap::test::MockReverseSwapHelper;
    use crate::db::helpers::swap::{SwapCondition, SwapHelper, SwapNullableCondition};
    use crate::db::models::{ChainSwap, ChainSwapData, ChainSwapInfo, ReverseSwap, Swap};
    use crate::swap::SwapUpdate;
    use crate::swap::filters::{
        decode_script, get_currency, get_input_output_filters, parse_transaction_id,
    };
    use crate::wallet::{Bitcoin, Elements, Network, Wallet};
    use alloy::hex;
    use bip39::Mnemonic;
    use mockall::mock;
    use std::collections::HashMap;
    use std::str::FromStr;
    use std::sync::{Arc, OnceLock};

    mock! {
        SwapHelper {}

        impl Clone for SwapHelper {
            fn clone(&self) -> Self;
        }

        impl SwapHelper for SwapHelper {
            fn get_all(&self, condition: SwapCondition) -> QueryResponse<Vec<Swap>>;
            fn get_all_nullable(&self, condition: SwapNullableCondition) -> QueryResponse<Vec<Swap>>;
            fn update_status(
                &self,
                id: &str,
                status: SwapUpdate,
                failure_reason: Option<String>,
            ) -> QueryResponse<usize>;
        }
    }

    mock! {
        ChainSwapHelper {}

        impl Clone for ChainSwapHelper {
            fn clone(&self) -> Self;
        }

        impl ChainSwapHelper for ChainSwapHelper {
            fn get_all(
                &self,
                condition: ChainSwapCondition,
            ) -> QueryResponse<Vec<ChainSwapInfo>>;
            fn get_by_data_nullable(
                &self,
                condition: ChainSwapDataNullableCondition,
            ) -> QueryResponse<Vec<ChainSwapInfo>>;
        }
    }

    fn get_seed() -> [u8; 64] {
        Mnemonic::from_str("test test test test test test test test test test test junk")
            .unwrap()
            .to_seed("")
    }

    fn get_currencies() -> Currencies {
        static CURRENCIES: OnceLock<Currencies> = OnceLock::new();
        CURRENCIES
            .get_or_init(|| {
                Arc::new(HashMap::<String, Currency>::from([
                    (
                        String::from("BTC"),
                        Currency {
                            network: Network::Regtest,
                            wallet: Arc::new(
                                Bitcoin::new(Network::Regtest, &get_seed(), "m/0/0".to_string())
                                    .unwrap(),
                            ),
                            chain: Some(Arc::new(Box::new(
                                crate::chain::chain_client::test::get_client(),
                            ))),
                            cln: None,
                            lnd: None,
                        },
                    ),
                    (
                        String::from("LTC"),
                        Currency {
                            network: Network::Regtest,
                            wallet: Arc::new(
                                Bitcoin::new(Network::Regtest, &get_seed(), "m/0/1".to_string())
                                    .unwrap(),
                            ),
                            chain: None,
                            cln: None,
                            lnd: None,
                        },
                    ),
                    (
                        String::from("L-BTC"),
                        Currency {
                            network: Network::Regtest,
                            wallet: Arc::new(
                                Elements::new(Network::Regtest, &get_seed(), "m/0/2".to_string())
                                    .unwrap(),
                            ),
                            chain: Some(Arc::new(Box::new(
                                crate::chain::elements_client::test::get_client().0,
                            ))),
                            cln: None,
                            lnd: None,
                        },
                    ),
                ]))
            })
            .clone()
    }

    #[tokio::test]
    async fn get_input_output_filters_swap() {
        let address_bitcoin = "bcrt1pez4zvu0a98p26yfvrqe8utwfve9q9c6gye9kza9dftxl9hm6evpqd760j0";
        let address_elements = "el1pqw0vlh6w9pcsjyk46kz928z6yl5sc3aqkg894853sdqxdflw9w5p2nqljxs8d639qq6ysl296k027h9vvm6pxqg8ure9v5dqa0zmwdmrp5djsywsp7um";

        let mut swap = MockSwapHelper::new();
        swap.expect_get_all().returning(|_| {
            Ok(vec![
                Swap {
                    orderSide: 0,
                    pair: "BTC/BTC".to_string(),
                    lockupAddress: address_bitcoin.to_string(),
                    ..Default::default()
                },
                Swap {
                    orderSide: 1,
                    pair: "L-BTC/BTC".to_string(),
                    lockupAddress: address_elements.to_string(),
                    ..Default::default()
                },
            ])
        });
        let swap_repo: Arc<dyn SwapHelper + Send + Sync> = Arc::new(swap);

        let mut reverse = MockReverseSwapHelper::new();
        reverse.expect_get_all().returning(|_| Ok(Vec::default()));
        let reverse_swap_repo: Arc<dyn ReverseSwapHelper + Send + Sync> = Arc::new(reverse);

        let mut chain = MockChainSwapHelper::new();
        chain.expect_get_all().returning(|_| Ok(Vec::default()));
        let chain_swap_repo: Arc<dyn ChainSwapHelper + Send + Sync> = Arc::new(chain);

        let chain_filters = get_input_output_filters(
            &get_currencies(),
            &swap_repo,
            &reverse_swap_repo,
            &chain_swap_repo,
        )
        .unwrap();

        assert_eq!(chain_filters.len(), 2);

        let (inputs, outputs) = chain_filters.get("BTC").unwrap();
        assert!(inputs.is_empty());
        assert_eq!(outputs.len(), 1);
        assert!(
            outputs.contains(
                &Bitcoin::new(Network::Regtest, &get_seed(), "m/0/0".to_string())
                    .unwrap()
                    .decode_address(address_bitcoin)
                    .unwrap()
            )
        );

        let (inputs, outputs) = chain_filters.get("L-BTC").unwrap();
        assert!(inputs.is_empty());
        assert_eq!(outputs.len(), 1);
        assert!(
            outputs.contains(
                &Elements::new(Network::Regtest, &get_seed(), "m/0/2".to_string())
                    .unwrap()
                    .decode_address(address_elements)
                    .unwrap()
            )
        );
    }

    #[tokio::test]
    async fn get_input_output_filters_reverse() {
        let tx_id = "663aebe19955dd7298b2bb1cc1062d5aabff0233f26a40b4d8900f7da8668858";

        let mut swap = MockSwapHelper::new();
        swap.expect_get_all().returning(|_| Ok(Vec::default()));
        let swap_repo: Arc<dyn SwapHelper + Send + Sync> = Arc::new(swap);

        let mut reverse = MockReverseSwapHelper::new();
        reverse.expect_get_all().returning(|_| {
            Ok(vec![ReverseSwap {
                orderSide: 0,
                transactionVout: Some(2),
                pair: "L-BTC/BTC".to_string(),
                transactionId: Some(tx_id.to_string()),
                ..Default::default()
            }])
        });
        let reverse_swap_repo: Arc<dyn ReverseSwapHelper + Send + Sync> = Arc::new(reverse);

        let mut chain = MockChainSwapHelper::new();
        chain.expect_get_all().returning(|_| Ok(Vec::default()));
        let chain_swap_repo: Arc<dyn ChainSwapHelper + Send + Sync> = Arc::new(chain);

        let chain_filters = get_input_output_filters(
            &get_currencies(),
            &swap_repo,
            &reverse_swap_repo,
            &chain_swap_repo,
        )
        .unwrap();

        assert_eq!(chain_filters.len(), 1);

        let (inputs, outputs) = chain_filters.get("L-BTC").unwrap();
        assert!(outputs.is_empty());
        assert_eq!(inputs.len(), 1);
        assert!(inputs.contains(&Outpoint {
            vout: 2,
            hash: parse_transaction_id(tx_id).unwrap(),
        }));
    }

    #[tokio::test]
    async fn get_input_output_filters_chain() {
        let tx_id = "663aebe19955dd7298b2bb1cc1062d5aabff0233f26a40b4d8900f7da8668858";
        let address = "bcrt1pyuu5lckeqzwrc7jw6asxxkgrervhwzmxslly54hhgd5nukdw06dqqxvy59";

        let mut swap = MockSwapHelper::new();
        swap.expect_get_all().returning(|_| Ok(Vec::default()));
        let swap_repo: Arc<dyn SwapHelper + Send + Sync> = Arc::new(swap);

        let mut reverse = MockReverseSwapHelper::new();
        reverse.expect_get_all().returning(|_| Ok(Vec::default()));
        let reverse_swap_repo: Arc<dyn ReverseSwapHelper + Send + Sync> = Arc::new(reverse);

        let mut chain = MockChainSwapHelper::new();
        chain.expect_get_all().returning(|_| {
            Ok(vec![
                ChainSwapInfo::new(
                    ChainSwap {
                        orderSide: 0,
                        pair: "L-BTC/BTC".to_string(),
                        status: SwapUpdate::TransactionServerMempool.to_string(),
                        ..Default::default()
                    },
                    vec![
                        ChainSwapData {
                            transactionVout: Some(21),
                            symbol: "L-BTC".to_string(),
                            transactionId: Some(tx_id.to_string()),
                            ..Default::default()
                        },
                        ChainSwapData {
                            symbol: "BTC".to_string(),
                            ..Default::default()
                        },
                    ],
                )
                .unwrap(),
                ChainSwapInfo::new(
                    ChainSwap {
                        orderSide: 0,
                        pair: "L-BTC/BTC".to_string(),
                        status: SwapUpdate::SwapCreated.to_string(),
                        ..Default::default()
                    },
                    vec![
                        ChainSwapData {
                            symbol: "L-BTC".to_string(),
                            ..Default::default()
                        },
                        ChainSwapData {
                            symbol: "BTC".to_string(),
                            lockupAddress: address.to_string(),
                            ..Default::default()
                        },
                    ],
                )
                .unwrap(),
            ])
        });
        let chain_swap_repo: Arc<dyn ChainSwapHelper + Send + Sync> = Arc::new(chain);

        let chain_filters = get_input_output_filters(
            &get_currencies(),
            &swap_repo,
            &reverse_swap_repo,
            &chain_swap_repo,
        )
        .unwrap();

        assert_eq!(chain_filters.len(), 2);

        let (inputs, outputs) = chain_filters.get("BTC").unwrap();
        assert!(inputs.is_empty());
        assert_eq!(outputs.len(), 1);
        assert!(
            outputs.contains(
                &Bitcoin::new(Network::Regtest, &get_seed(), "m/0/0".to_string())
                    .unwrap()
                    .decode_address(address)
                    .unwrap()
            )
        );

        let (inputs, outputs) = chain_filters.get("L-BTC").unwrap();
        assert!(outputs.is_empty());
        assert_eq!(inputs.len(), 1);
        assert!(inputs.contains(&Outpoint {
            vout: 21,
            hash: parse_transaction_id(tx_id).unwrap(),
        }));
    }

    #[tokio::test]
    async fn test_get_currency() {
        let currencies = get_currencies();

        let symbol = "BTC";
        let currency = get_currency(&currencies, symbol, &Swap::default());
        assert!(currency.cloned().is_some());
        assert_eq!(currency.unwrap().chain.clone().unwrap().symbol(), symbol);
    }

    #[tokio::test]
    async fn test_get_currency_no_chain_client() {
        let currencies = get_currencies();
        assert!(get_currency(&currencies, "LTC", &Swap::default(),).is_none());
    }

    #[tokio::test]
    async fn test_get_currency_none() {
        let currencies = get_currencies();
        assert!(get_currency(&currencies, "NOTFOUND", &Swap::default()).is_none());
    }

    #[test]
    fn test_decode_script() {
        let wallet: Arc<dyn Wallet + Send + Sync> =
            Arc::new(Bitcoin::new(Network::Regtest, &get_seed(), "m/0/0".to_string()).unwrap());
        let swap = Swap {
            id: "id".to_string(),
            ..Default::default()
        };
        let address = "bcrt1pjcv9r3jeug6xmgug6hu0p4lux7r9996yxk9m2xxammfqq4kxdvkqhdu0h5";

        assert_eq!(
            decode_script(&wallet, &swap, address),
            Some(wallet.decode_address(address).unwrap())
        );
    }

    #[test]
    fn test_decode_script_invalid() {
        let wallet: Arc<dyn Wallet + Send + Sync> =
            Arc::new(Bitcoin::new(Network::Regtest, &get_seed(), "m/0/0".to_string()).unwrap());
        let swap = Swap {
            id: "id".to_string(),
            ..Default::default()
        };

        assert_eq!(decode_script(&wallet, &swap, "invalid"), None);
    }

    #[test]
    fn test_parse_transaction_id() {
        let data = "1f4c57afd46f76420e25b9cbd51f45334382675175bb664bb9127ae96c3bba2c";
        let mut dec = hex::decode(data).unwrap();
        dec.reverse();

        assert_eq!(parse_transaction_id(data).unwrap(), dec);
    }
}

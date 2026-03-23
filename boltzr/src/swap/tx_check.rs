use crate::{
    chain::{
        Transactions,
        utils::{Outpoint, Transaction},
    },
    db::{
        helpers::{
            chain_swap::ChainSwapHelper, reverse_swap::ReverseSwapHelper,
            script_pubkey::ScriptPubKeyHelper,
        },
        models::SomeSwap,
    },
};
use anyhow::Result;
use diesel::{BoolExpressionMethods, ExpressionMethods};
use std::fmt;
use std::{collections::HashMap, sync::Arc};
use tracing::{error, info};

const TX_CHUNK_SIZE: usize = 512;

#[derive(Hash, Eq, PartialEq, Debug, Clone, PartialOrd, Ord)]
pub enum RelevantId {
    Swap(String),
    FundingAddress(String),
}

impl fmt::Display for RelevantId {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            RelevantId::Swap(swap_id) => write!(f, "Swap {}", swap_id),
            RelevantId::FundingAddress(funding_address_id) => {
                write!(f, "Funding Address {}", funding_address_id)
            }
        }
    }
}

#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord)]
pub enum TxDetails {
    Output(Vec<u8>),
    Input(()),
}

type RelevantSwaps = HashMap<Transaction, Vec<(RelevantId, TxDetails)>>;

#[derive(Clone)]
pub struct TxChecker {
    script_pubkey_helper: Arc<dyn ScriptPubKeyHelper + Send + Sync>,
    chain_swap_helper: Arc<dyn ChainSwapHelper + Send + Sync>,
    reverse_swap_helper: Arc<dyn ReverseSwapHelper + Send + Sync>,
}

impl TxChecker {
    pub fn new(
        script_pubkey_helper: Arc<dyn ScriptPubKeyHelper + Send + Sync>,
        chain_swap_helper: Arc<dyn ChainSwapHelper + Send + Sync>,
        reverse_swap_helper: Arc<dyn ReverseSwapHelper + Send + Sync>,
    ) -> Self {
        Self {
            script_pubkey_helper,
            chain_swap_helper,
            reverse_swap_helper,
        }
    }

    pub fn check(&self, symbol: &str, txs: Transactions, confirmed: bool) -> Result<RelevantSwaps> {
        let tx_chunks = txs
            .iter()
            .collect::<Vec<_>>()
            .chunks(TX_CHUNK_SIZE)
            .map(|chunk| chunk.to_vec())
            .collect::<Vec<_>>();

        let mut result = HashMap::new();

        self.check_outputs(symbol, confirmed, &tx_chunks, &mut result)?;
        self.check_inputs(symbol, confirmed, &tx_chunks, &mut result)?;

        Ok(result)
    }

    fn check_outputs(
        &self,
        symbol: &str,
        confirmed: bool,
        txs: &[Vec<&Transaction>],
        map: &mut RelevantSwaps,
    ) -> Result<()> {
        for tx_chunk in txs {
            // Vec as value to support multiple transactions with the same script pubkey
            let mut script_to_txs: HashMap<Vec<u8>, Vec<&Transaction>> = HashMap::new();
            for tx in tx_chunk.iter() {
                for script in tx.output_script_pubkeys() {
                    script_to_txs.entry(script).or_default().push(*tx);
                }
            }

            let script_pubkeys = self
                .script_pubkey_helper
                .get_by_scripts(symbol, &script_to_txs.keys().cloned().collect::<Vec<_>>())?;

            for pubkey in script_pubkeys {
                let txs = match script_to_txs.get(&pubkey.script_pubkey) {
                    Some(txs) => txs,
                    None => continue,
                };

                for tx in txs {
                    let entry = map.entry((**tx).clone()).or_default();

                    let script_pubkey = pubkey.script_pubkey.clone();
                    let id = match (&pubkey.swap_id, &pubkey.funding_address_id) {
                        (Some(swap_id), None) => RelevantId::Swap(swap_id.clone()),
                        (None, Some(funding_address_id)) => {
                            RelevantId::FundingAddress(funding_address_id.clone())
                        }
                        _ => {
                            let pubkey_hex = hex::encode(&script_pubkey);
                            error!(
                                "Script pubkey {pubkey_hex} for symbol {symbol} has both swap_id and funding_address_id",
                            );
                            continue;
                        }
                    };

                    info!(
                        "Found {} output for {} in {} transaction: {}",
                        Self::format_tx_status(confirmed),
                        id,
                        symbol,
                        tx.txid_hex()
                    );
                    entry.push((id, TxDetails::Output(script_pubkey)));
                }
            }
        }

        Ok(())
    }

    fn check_inputs(
        &self,
        symbol: &str,
        confirmed: bool,
        txs: &[Vec<&Transaction>],
        map: &mut RelevantSwaps,
    ) -> Result<()> {
        for tx_chunk in txs {
            let inputs_to_tx = tx_chunk
                .iter()
                .flat_map(|tx| tx.input_outpoints().into_iter().map(move |o| (o, *tx)))
                .collect::<HashMap<Outpoint, &Transaction>>();

            let input_ids = inputs_to_tx
                .keys()
                .cloned()
                .map(|mut o| {
                    o.hash.reverse();
                    hex::encode(o.hash)
                })
                .collect::<Vec<_>>();

            let reverse_swaps = self.reverse_swap_helper.get_all_nullable(Box::new(
                crate::db::schema::reverseSwaps::dsl::transactionId.eq_any(input_ids.clone()),
            ))?;
            let chain_swaps = self.chain_swap_helper.get_by_data_nullable(Box::new(
                crate::db::schema::chainSwapData::dsl::symbol
                    .eq(symbol.to_string())
                    .and(crate::db::schema::chainSwapData::dsl::transactionId.eq_any(input_ids)),
            ))?;
            let chain_swaps = chain_swaps
                .into_iter()
                .filter(|swap| swap.sending().symbol == symbol)
                .collect::<Vec<_>>();

            let relevant_swaps: Vec<Box<dyn SomeSwap>> = reverse_swaps
                .into_iter()
                .map(|swap| Box::new(swap) as Box<dyn SomeSwap>)
                .chain(
                    chain_swaps
                        .into_iter()
                        .map(|swap| Box::new(swap) as Box<dyn SomeSwap>),
                )
                .collect::<Vec<_>>();

            for swap in relevant_swaps {
                let outpoint = match swap.sending_outpoint() {
                    Ok(Some(outpoint)) => outpoint,
                    _ => continue,
                };
                let tx = match inputs_to_tx.get(&outpoint) {
                    Some(tx) => tx,
                    None => continue,
                };

                info!(
                    "Found {} spent input for {} Swap {} in {} transaction: {}",
                    Self::format_tx_status(confirmed),
                    swap.kind(),
                    swap.id(),
                    symbol,
                    tx.txid_hex()
                );

                map.entry((**tx).clone())
                    .or_default()
                    .push((RelevantId::Swap(swap.id()), TxDetails::Input(())));
            }
        }

        Ok(())
    }

    fn format_tx_status(confirmed: bool) -> String {
        format!("{}confirmed", if confirmed { "" } else { "un" })
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use crate::chain::types::Type;
    use crate::chain::utils::Transaction;
    use crate::db::helpers::QueryResponse;
    use crate::db::helpers::chain_swap::{ChainSwapCondition, ChainSwapDataNullableCondition};
    use crate::db::helpers::reverse_swap::{ReverseSwapCondition, ReverseSwapNullableCondition};
    use crate::db::helpers::script_pubkey::test::MockScriptPubKeyHelper;
    use crate::db::models::{
        ChainSwap, ChainSwapData, ChainSwapInfo, ReverseRoutingHint, ReverseSwap, ScriptPubKey,
    };
    use mockall::mock;

    const BITCOIN_TX_HEX: &str = include_str!("../../fixtures/bitcoin-tx.txt");

    mock! {
        ReverseSwapHelper {}

        impl ReverseSwapHelper for ReverseSwapHelper {
            fn get_by_id(&self, id: &str) -> QueryResponse<ReverseSwap>;
            fn get_all(&self, condition: ReverseSwapCondition) -> QueryResponse<Vec<ReverseSwap>>;
            fn get_all_nullable(&self, condition: ReverseSwapNullableCondition) -> QueryResponse<Vec<ReverseSwap>>;
            fn get_routing_hint(&self, preimage_hash: &str) -> QueryResponse<Option<ReverseRoutingHint>>;
            fn get_routing_hints(&self, script_pubkeys: Vec<Vec<u8>>) -> QueryResponse<Vec<ReverseRoutingHint>>;
        }
    }

    mock! {
        ChainSwapHelper {}

        impl ChainSwapHelper for ChainSwapHelper {
            fn get_by_id(&self, id: &str) -> QueryResponse<ChainSwapInfo>;
            fn get_all(&self, condition: ChainSwapCondition) -> QueryResponse<Vec<ChainSwapInfo>>;
            fn get_by_data_nullable(&self, condition: ChainSwapDataNullableCondition) -> QueryResponse<Vec<ChainSwapInfo>>;
        }
    }

    fn get_tx() -> Transaction {
        Transaction::parse_hex(&Type::Bitcoin, BITCOIN_TX_HEX).unwrap()
    }

    #[test]
    fn test_check_no_relevant_transactions() {
        let mut script_pubkey_helper = MockScriptPubKeyHelper::new();
        let mut reverse_swap_helper = MockReverseSwapHelper::new();
        let mut chain_swap_helper = MockChainSwapHelper::new();

        let symbol_check = "BTC";

        let tx = get_tx();
        let expected_outputs = tx.output_script_pubkeys();

        script_pubkey_helper
            .expect_get_by_scripts()
            .withf(move |symbol: &str, script_pubkeys: &[Vec<u8>]| {
                symbol == symbol_check && {
                    let mut received = script_pubkeys.to_vec();
                    let mut expected = expected_outputs.clone();
                    received.sort();
                    expected.sort();
                    received == expected
                }
            })
            .times(1)
            .returning(|_, _| Ok(vec![]));

        reverse_swap_helper
            .expect_get_all_nullable()
            .times(1)
            .returning(|_| Ok(vec![]));

        chain_swap_helper
            .expect_get_by_data_nullable()
            .times(1)
            .returning(|_| Ok(vec![]));

        let checker = TxChecker::new(
            Arc::new(script_pubkey_helper),
            Arc::new(chain_swap_helper),
            Arc::new(reverse_swap_helper),
        );

        let result = checker
            .check(symbol_check, Transactions::Single(tx), false)
            .unwrap();
        assert!(result.is_empty());
    }

    #[test]
    fn test_check_relevant_output() {
        let mut script_pubkey_helper = MockScriptPubKeyHelper::new();
        let mut reverse_swap_helper = MockReverseSwapHelper::new();
        let mut chain_swap_helper = MockChainSwapHelper::new();

        let tx = get_tx();
        let first_output_script = tx.output_script_pubkeys()[0].clone();

        let swap_id = "test_swap_123";
        script_pubkey_helper
            .expect_get_by_scripts()
            .times(1)
            .returning(move |_, _| {
                Ok(vec![ScriptPubKey {
                    swap_id: Some(swap_id.to_string()),
                    symbol: "BTC".to_string(),
                    script_pubkey: first_output_script.clone(),
                    funding_address_id: None,
                }])
            });

        reverse_swap_helper
            .expect_get_all_nullable()
            .times(1)
            .returning(|_| Ok(vec![]));

        chain_swap_helper
            .expect_get_by_data_nullable()
            .times(1)
            .returning(|_| Ok(vec![]));

        let checker = TxChecker::new(
            Arc::new(script_pubkey_helper),
            Arc::new(chain_swap_helper),
            Arc::new(reverse_swap_helper),
        );

        let tx = get_tx();
        let result = checker
            .check("BTC", Transactions::Single(tx.clone()), true)
            .unwrap();
        assert_eq!(result.len(), 1);
        let first_output_script = tx.output_script_pubkeys()[0].clone();
        assert_eq!(
            result.get(&tx),
            Some(&vec![(
                RelevantId::Swap(swap_id.to_string()),
                TxDetails::Output(first_output_script.clone())
            )])
        );
    }

    #[test]
    fn test_check_relevant_input_reverse_swap() {
        let mut script_pubkey_helper = MockScriptPubKeyHelper::new();
        let mut reverse_swap_helper = MockReverseSwapHelper::new();
        let mut chain_swap_helper = MockChainSwapHelper::new();

        script_pubkey_helper
            .expect_get_by_scripts()
            .times(1)
            .returning(|_, _| Ok(vec![]));

        let tx = get_tx();
        let input_outpoint = &tx.input_outpoints()[0];
        let input_txid = {
            let mut txid = input_outpoint.hash.clone();
            txid.reverse();
            hex::encode(txid)
        };
        let input_vout = input_outpoint.vout as i32;

        let swap_id = "reverse_swap_456";
        reverse_swap_helper
            .expect_get_all_nullable()
            .times(1)
            .returning(move |_| {
                Ok(vec![ReverseSwap {
                    id: swap_id.to_string(),
                    transactionId: Some(input_txid.clone()),
                    transactionVout: Some(input_vout),
                    ..Default::default()
                }])
            });

        chain_swap_helper
            .expect_get_by_data_nullable()
            .times(1)
            .returning(|_| Ok(vec![]));

        let checker = TxChecker::new(
            Arc::new(script_pubkey_helper),
            Arc::new(chain_swap_helper),
            Arc::new(reverse_swap_helper),
        );

        let tx = get_tx();
        let result = checker
            .check("BTC", Transactions::Single(tx.clone()), false)
            .unwrap();
        assert_eq!(result.len(), 1);
        assert_eq!(
            result.get(&tx),
            Some(&vec![(
                RelevantId::Swap(swap_id.to_string()),
                TxDetails::Input(())
            )])
        );
    }

    #[test]
    fn test_check_relevant_input_chain_swap() {
        let mut script_pubkey_helper = MockScriptPubKeyHelper::new();
        let mut reverse_swap_helper = MockReverseSwapHelper::new();
        let mut chain_swap_helper = MockChainSwapHelper::new();

        script_pubkey_helper
            .expect_get_by_scripts()
            .times(1)
            .returning(|_, _| Ok(vec![]));

        reverse_swap_helper
            .expect_get_all_nullable()
            .times(1)
            .returning(|_| Ok(vec![]));

        let tx = get_tx();
        let input_outpoint = &tx.input_outpoints()[0];
        let input_txid = {
            let mut txid = input_outpoint.hash.clone();
            txid.reverse();
            hex::encode(txid)
        };
        let input_vout = input_outpoint.vout as i32;

        let swap_id = "chain_swap_789";
        chain_swap_helper
            .expect_get_by_data_nullable()
            .times(1)
            .returning(move |_| {
                let swap = ChainSwap {
                    id: swap_id.to_string(),
                    pair: "L-BTC/BTC".to_string(),
                    orderSide: 1,
                    ..Default::default()
                };
                let sending_data = ChainSwapData {
                    swapId: swap_id.to_string(),
                    symbol: "BTC".to_string(),
                    timeoutBlockHeight: 100,
                    lockupAddress: "".to_string(),
                    transactionId: Some(input_txid.clone()),
                    transactionVout: Some(input_vout),
                    ..Default::default()
                };
                let receiving_data = ChainSwapData {
                    swapId: swap_id.to_string(),
                    symbol: "L-BTC".to_string(),
                    timeoutBlockHeight: 200,
                    lockupAddress: "".to_string(),
                    ..Default::default()
                };
                Ok(vec![
                    ChainSwapInfo::new(swap, vec![sending_data, receiving_data]).unwrap(),
                ])
            });

        let checker = TxChecker::new(
            Arc::new(script_pubkey_helper),
            Arc::new(chain_swap_helper),
            Arc::new(reverse_swap_helper),
        );

        let tx = get_tx();
        let result = checker
            .check("BTC", Transactions::Single(tx.clone()), true)
            .unwrap();
        assert_eq!(result.len(), 1);
        assert_eq!(
            result.get(&tx),
            Some(&vec![(
                RelevantId::Swap(swap_id.to_string()),
                TxDetails::Input(())
            )])
        );
    }

    #[test]
    fn test_check_multiple_relevant_outputs() {
        let mut script_pubkey_helper = MockScriptPubKeyHelper::new();
        let mut reverse_swap_helper = MockReverseSwapHelper::new();
        let mut chain_swap_helper = MockChainSwapHelper::new();

        let tx = get_tx();
        let output_scripts = tx.output_script_pubkeys();
        let first_output = output_scripts[0].clone();
        let second_output = output_scripts[1].clone();

        let swap_id_1 = "swap_1";
        let swap_id_2 = "swap_2";
        script_pubkey_helper
            .expect_get_by_scripts()
            .times(1)
            .returning(move |_, _| {
                Ok(vec![
                    ScriptPubKey {
                        swap_id: Some(swap_id_1.to_string()),
                        symbol: "BTC".to_string(),
                        script_pubkey: first_output.clone(),
                        funding_address_id: None,
                    },
                    ScriptPubKey {
                        swap_id: Some(swap_id_2.to_string()),
                        symbol: "BTC".to_string(),
                        script_pubkey: second_output.clone(),
                        funding_address_id: None,
                    },
                ])
            });

        reverse_swap_helper
            .expect_get_all_nullable()
            .times(1)
            .returning(|_| Ok(vec![]));

        chain_swap_helper
            .expect_get_by_data_nullable()
            .times(1)
            .returning(|_| Ok(vec![]));

        let checker = TxChecker::new(
            Arc::new(script_pubkey_helper),
            Arc::new(chain_swap_helper),
            Arc::new(reverse_swap_helper),
        );

        let tx = get_tx();
        let result = checker
            .check("BTC", Transactions::Single(tx.clone()), false)
            .unwrap();
        assert_eq!(result.len(), 1);
        let swap_ids = result.get(&tx).unwrap();
        assert_eq!(swap_ids.len(), 2);
        assert!(swap_ids.contains(&(
            RelevantId::Swap(swap_id_1.to_string()),
            TxDetails::Output(output_scripts[0].clone())
        )));
        assert!(swap_ids.contains(&(
            RelevantId::Swap(swap_id_2.to_string()),
            TxDetails::Output(output_scripts[1].clone())
        )));
    }

    #[test]
    fn test_check_both_outputs_and_inputs() {
        let mut script_pubkey_helper = MockScriptPubKeyHelper::new();
        let mut reverse_swap_helper = MockReverseSwapHelper::new();
        let mut chain_swap_helper = MockChainSwapHelper::new();

        let tx = get_tx();
        let first_output_script = tx.output_script_pubkeys()[0].clone();

        let input_outpoint = &tx.input_outpoints()[0];
        let input_txid = {
            let mut txid = input_outpoint.hash.clone();
            txid.reverse();
            hex::encode(txid)
        };
        let input_vout = input_outpoint.vout as i32;

        let swap_id_output = "output_swap";
        let swap_id_input_reverse = "input_reverse_swap";
        let swap_id_input_chain = "input_chain_swap";

        script_pubkey_helper
            .expect_get_by_scripts()
            .times(1)
            .returning(move |_, _| {
                Ok(vec![ScriptPubKey {
                    swap_id: Some(swap_id_output.to_string()),
                    symbol: "BTC".to_string(),
                    script_pubkey: first_output_script.clone(),
                    funding_address_id: None,
                }])
            });

        let first_output_script = tx.output_script_pubkeys()[0].clone();
        let input_txid_clone = input_txid.clone();
        reverse_swap_helper
            .expect_get_all_nullable()
            .times(1)
            .returning(move |_| {
                Ok(vec![ReverseSwap {
                    id: swap_id_input_reverse.to_string(),
                    transactionId: Some(input_txid_clone.clone()),
                    transactionVout: Some(input_vout),
                    ..Default::default()
                }])
            });

        chain_swap_helper
            .expect_get_by_data_nullable()
            .times(1)
            .returning(move |_| {
                let swap = ChainSwap {
                    id: swap_id_input_chain.to_string(),
                    pair: "L-BTC/BTC".to_string(),
                    orderSide: 1,
                    ..Default::default()
                };
                let sending_data = ChainSwapData {
                    swapId: swap_id_input_chain.to_string(),
                    symbol: "BTC".to_string(),
                    timeoutBlockHeight: 100,
                    lockupAddress: "".to_string(),
                    transactionId: Some(input_txid.clone()),
                    transactionVout: Some(input_vout),
                    ..Default::default()
                };
                let receiving_data = ChainSwapData {
                    swapId: swap_id_input_chain.to_string(),
                    symbol: "L-BTC".to_string(),
                    timeoutBlockHeight: 200,
                    lockupAddress: "".to_string(),
                    ..Default::default()
                };
                Ok(vec![
                    ChainSwapInfo::new(swap, vec![sending_data, receiving_data]).unwrap(),
                ])
            });

        let checker = TxChecker::new(
            Arc::new(script_pubkey_helper),
            Arc::new(chain_swap_helper),
            Arc::new(reverse_swap_helper),
        );

        let tx = get_tx();
        let result = checker
            .check("BTC", Transactions::Single(tx.clone()), true)
            .unwrap();
        assert_eq!(result.len(), 1);
        let mut entries = result.get(&tx).unwrap().clone();
        entries.sort();

        let mut expected = vec![
            (
                RelevantId::Swap(swap_id_output.to_string()),
                TxDetails::Output(first_output_script.clone()),
            ),
            (
                RelevantId::Swap(swap_id_input_reverse.to_string()),
                TxDetails::Input(()),
            ),
            (
                RelevantId::Swap(swap_id_input_chain.to_string()),
                TxDetails::Input(()),
            ),
        ];
        expected.sort();

        assert_eq!(entries, expected);
    }

    #[test]
    fn test_format_tx_status_confirmed() {
        assert_eq!(TxChecker::format_tx_status(true), "confirmed");
    }

    #[test]
    fn test_format_tx_status_unconfirmed() {
        assert_eq!(TxChecker::format_tx_status(false), "unconfirmed");
    }
}

use crate::{
    chain::utils::Transaction,
    db::{
        helpers::{
            chain_swap::ChainSwapHelper, reverse_swap::ReverseSwapHelper,
            script_pubkey::ScriptPubKeyHelper,
        },
        models::SomeSwap,
    },
};
use anyhow::Result;
use diesel::ExpressionMethods;
use std::sync::Arc;
use tracing::info;

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

    pub fn check(
        &self,
        symbol: &str,
        tx: &Transaction,
        confirmed: bool,
    ) -> Result<Option<Vec<String>>> {
        let mut relevant = self.check_outputs(symbol, tx, confirmed)?;
        relevant.append(&mut self.check_inputs(symbol, tx, confirmed)?);
        relevant.sort();
        relevant.dedup();

        Ok(if relevant.is_empty() {
            None
        } else {
            Some(relevant)
        })
    }

    fn check_outputs(
        &self,
        symbol: &str,
        tx: &Transaction,
        confirmed: bool,
    ) -> Result<Vec<String>> {
        let script_pubkeys = self
            .script_pubkey_helper
            .get_by_scripts(symbol, &tx.output_script_pubkeys())?;

        for script_pubkey in &script_pubkeys {
            info!(
                "Found {} output for Swap {} in {} transaction: {}",
                Self::format_tx_status(confirmed),
                script_pubkey.swap_id,
                symbol,
                tx.txid_hex()
            );
        }

        Ok(script_pubkeys.into_iter().map(|spk| spk.swap_id).collect())
    }

    fn check_inputs(&self, symbol: &str, tx: &Transaction, confirmed: bool) -> Result<Vec<String>> {
        let outputs = tx
            .input_outpoints()
            .into_iter()
            .map(|mut o| {
                o.hash.reverse();
                alloy::hex::encode(o.hash)
            })
            .collect::<Vec<_>>();

        let reverse_swaps = self.reverse_swap_helper.get_all_nullable(Box::new(
            crate::db::schema::reverseSwaps::dsl::transactionId.eq_any(outputs.clone()),
        ))?;
        let chain_swaps = self.chain_swap_helper.get_by_data_nullable(Box::new(
            crate::db::schema::chainSwapData::dsl::transactionId.eq_any(outputs),
        ))?;
        let chain_swaps = chain_swaps
            .into_iter()
            .filter(|swap| swap.sending().symbol == symbol)
            .collect::<Vec<_>>();

        let relevant_swaps = reverse_swaps
            .into_iter()
            .map(|swap| swap.id)
            .chain(chain_swaps.into_iter().map(|swap| swap.id()))
            .collect::<Vec<_>>();

        for swap in &relevant_swaps {
            info!(
                "Found {} spent input for Swap {} in {} transaction: {}",
                Self::format_tx_status(confirmed),
                swap,
                symbol,
                tx.txid_hex()
            );
        }

        Ok(relevant_swaps)
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
    use crate::db::models::{
        ChainSwap, ChainSwapData, ChainSwapInfo, ReverseRoutingHint, ReverseSwap, ScriptPubKey,
    };
    use mockall::mock;

    const BITCOIN_TX_HEX: &str = include_str!("../../fixtures/bitcoin-tx.txt");

    mock! {
        ScriptPubKeyHelper {}

        impl ScriptPubKeyHelper for ScriptPubKeyHelper {
            fn get_by_scripts(
                &self,
                symbol: &str,
                script_pubkeys: &[Vec<u8>],
            ) -> QueryResponse<Vec<ScriptPubKey>>;
        }
    }

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
                symbol == symbol_check && script_pubkeys == expected_outputs.as_slice()
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

        let result = checker.check(symbol_check, &tx, false).unwrap();
        assert!(result.is_none());
    }

    #[test]
    fn test_check_relevant_output() {
        let mut script_pubkey_helper = MockScriptPubKeyHelper::new();
        let mut reverse_swap_helper = MockReverseSwapHelper::new();
        let mut chain_swap_helper = MockChainSwapHelper::new();

        let swap_id = "test_swap_123";
        script_pubkey_helper
            .expect_get_by_scripts()
            .times(1)
            .returning(move |_, _| {
                Ok(vec![ScriptPubKey {
                    swap_id: swap_id.to_string(),
                    symbol: "BTC".to_string(),
                    script_pubkey: vec![1, 2, 3],
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
        let result = checker.check("BTC", &tx, true).unwrap();
        assert_eq!(result, Some(vec![swap_id.to_string()]));
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

        let swap_id = "reverse_swap_456";
        reverse_swap_helper
            .expect_get_all_nullable()
            .times(1)
            .returning(move |_| {
                Ok(vec![ReverseSwap {
                    id: swap_id.to_string(),
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
        let result = checker.check("BTC", &tx, false).unwrap();
        assert_eq!(result, Some(vec![swap_id.to_string()]));
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
        let result = checker.check("BTC", &tx, true).unwrap();
        assert_eq!(result, Some(vec![swap_id.to_string()]));
    }

    #[test]
    fn test_check_multiple_relevant_outputs() {
        let mut script_pubkey_helper = MockScriptPubKeyHelper::new();
        let mut reverse_swap_helper = MockReverseSwapHelper::new();
        let mut chain_swap_helper = MockChainSwapHelper::new();

        let swap_id_1 = "swap_1";
        let swap_id_2 = "swap_2";
        script_pubkey_helper
            .expect_get_by_scripts()
            .times(1)
            .returning(|_, _| {
                Ok(vec![
                    ScriptPubKey {
                        swap_id: swap_id_1.to_string(),
                        symbol: "BTC".to_string(),
                        script_pubkey: vec![1, 2, 3],
                    },
                    ScriptPubKey {
                        swap_id: swap_id_2.to_string(),
                        symbol: "BTC".to_string(),
                        script_pubkey: vec![4, 5, 6],
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
        let result = checker.check("BTC", &tx, false).unwrap();
        assert_eq!(
            result,
            Some(vec![swap_id_1.to_string(), swap_id_2.to_string()])
        );
    }

    #[test]
    fn test_check_both_outputs_and_inputs() {
        let mut script_pubkey_helper = MockScriptPubKeyHelper::new();
        let mut reverse_swap_helper = MockReverseSwapHelper::new();
        let mut chain_swap_helper = MockChainSwapHelper::new();

        let swap_id_output = "output_swap";
        let swap_id_input_reverse = "input_reverse_swap";
        let swap_id_input_chain = "input_chain_swap";

        script_pubkey_helper
            .expect_get_by_scripts()
            .times(1)
            .returning(|_, _| {
                Ok(vec![ScriptPubKey {
                    swap_id: swap_id_output.to_string(),
                    symbol: "BTC".to_string(),
                    script_pubkey: vec![1, 2, 3],
                }])
            });

        reverse_swap_helper
            .expect_get_all_nullable()
            .times(1)
            .returning(|_| {
                Ok(vec![ReverseSwap {
                    id: swap_id_input_reverse.to_string(),
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
        let mut result = checker.check("BTC", &tx, true).unwrap().unwrap();
        result.sort();

        let mut expected = vec![
            swap_id_output.to_string(),
            swap_id_input_reverse.to_string(),
            swap_id_input_chain.to_string(),
        ];
        expected.sort();

        assert_eq!(result, expected);
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

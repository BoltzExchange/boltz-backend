use std::sync::Arc;

use crate::api::ws::types::{
    FundingAddressUpdate, SwapStatus, TransactionInfo, UpdateReceiver, UpdateSender,
};
use crate::chain::utils::Transaction;
use crate::currencies::{Currencies, get_chain_client, get_wallet};
use crate::db::helpers::funding_address::FundingAddressHelper;
use crate::swap::tx_check::{RelevantId, TxDetails};
use crate::swap::{FundingAddressStatus, RelevantTx, SwapUpdate, TxStatus};
use anyhow::Result;
use bitcoin::key::Secp256k1;
use bitcoin::secp256k1::SecretKey;
use elements::confidential::Value;
use tokio::sync::broadcast;
use tokio::sync::broadcast::error::RecvError;
use tracing::{debug, error, info};

#[derive(Clone)]
pub struct FundingAddressNursery {
    funding_address_helper: Arc<dyn FundingAddressHelper + Send + Sync>,
    funding_address_update_tx: UpdateSender<FundingAddressUpdate>,
    currencies: Currencies,
}

impl FundingAddressNursery {
    pub fn new(
        funding_address_helper: Arc<dyn FundingAddressHelper + Send + Sync>,
        funding_address_update_tx: UpdateSender<FundingAddressUpdate>,
        currencies: Currencies,
    ) -> Self {
        Self {
            funding_address_helper,
            funding_address_update_tx,
            currencies,
        }
    }

    pub async fn start(
        self,
        mut relevant_txs: broadcast::Receiver<RelevantTx>,
        mut swap_status_rx: UpdateReceiver<SwapStatus>,
    ) {
        let self_clone = self.clone();
        tokio::spawn(async move {
            loop {
                tokio::select! {
                    res = relevant_txs.recv() => {
                        match res {
                            Ok(relevant_tx) => {
                                if let Err(e) = self.handle_relevant_tx(relevant_tx).await {
                                    error!(
                                        "Funding address nursery failed to handle relevant tx: {}",
                                        e
                                    );
                                }
                            }
                            Err(RecvError::Lagged(skipped)) => {
                                error!("Funding address nursery missed {} relevant tx messages", skipped);
                            }
                            Err(RecvError::Closed) => {
                                error!("Funding address nursery relevant_txs receiver closed unexpectedly");
                                break;
                            }
                        }
                    }
                    res = swap_status_rx.recv() => {
                        match res {
                            Ok((_, swap_statuses)) => {
                                for swap_status in swap_statuses {
                                    if let Err(e) = self_clone.handle_swap_status_update(&swap_status).await {
                                        error!(
                                            "Funding address nursery failed to handle swap status update: {}",
                                            e
                                        );
                                    }
                                }
                            }
                            Err(RecvError::Lagged(skipped)) => {
                                error!("Funding address nursery missed {} swap status update messages", skipped);
                            }
                            Err(RecvError::Closed) => {
                                error!("Funding address nursery swap_status_rx receiver closed unexpectedly");
                                break;
                            }
                        }
                    }
                }
            }
        });
    }

    pub async fn handle_swap_status_update(&self, swap_status: &SwapStatus) -> Result<()> {
        let swap_id = &swap_status.id;
        let status = SwapUpdate::parse(&swap_status.base.status);

        // Only process success or failure events
        if !status.is_success() && !status.is_failed() {
            return Ok(());
        }

        // Check if there's a funding address associated with this swap
        let funding_address = match self.funding_address_helper.get_by_swap_id(swap_id)? {
            Some(fa) => fa,
            None => {
                debug!(
                    "No funding address found for swap {} with status {}",
                    swap_id, status
                );
                return Ok(());
            }
        };

        let funding_address_id = funding_address.id.as_str();

        if status.is_success() {
            info!(
                "Swap {} succeeded with status {}, setting funding address {} to claimed",
                swap_id, status, funding_address_id
            );
            self.funding_address_helper.set_status(
                funding_address_id,
                FundingAddressStatus::TransactionClaimed
                    .to_string()
                    .as_str(),
            )?;
        } else if status.is_failed() {
            info!(
                "Swap {} failed with status {}, delinking funding address {}",
                swap_id, status, funding_address_id
            );
            // Delink the funding address from the swap and clear the presigned tx
            // Status stays the same
            self.funding_address_helper
                .set_presigned_tx(funding_address_id, None)?;
        }

        self.send_update(funding_address_id, None).await?;
        Ok(())
    }

    fn find_output(
        &self,
        tx: &Transaction,
        symbol: &str,
        script_pubkey: Vec<u8>,
    ) -> Result<(usize, u64)> {
        match tx {
            Transaction::Bitcoin(tx) => tx.output.iter().enumerate().find_map(|(vout, output)| {
                if output.script_pubkey.to_bytes() == script_pubkey {
                    Some((vout, output.value.to_sat()))
                } else {
                    None
                }
            }),
            Transaction::Elements(tx) => tx.output.iter().enumerate().find_map(|(vout, output)| {
                if output.script_pubkey.to_bytes() == script_pubkey {
                    match output.value {
                        Value::Explicit(amount) => Some((vout, amount)),
                        Value::Confidential(_) => {
                            let secp = Secp256k1::new();
                            let wallet = get_wallet(&self.currencies, symbol).ok()?;
                            let blinding_key =
                                wallet.derive_blinding_key(script_pubkey.clone()).ok()?;
                            let unblinded = output
                                .unblind(&secp, SecretKey::from_slice(blinding_key.as_ref()).ok()?)
                                .ok()?;
                            Some((vout, unblinded.value))
                        }
                        Value::Null => None,
                    }
                } else {
                    None
                }
            }),
        }
        .ok_or(anyhow::anyhow!("output not found"))
    }

    pub async fn handle_relevant_tx(&self, relevant_tx: RelevantTx) -> Result<()> {
        let tx_id = relevant_tx.tx.txid_hex();
        for entry in relevant_tx.entries.into_iter() {
            if let (
                RelevantId::FundingAddress(funding_address_id),
                TxDetails::Output(script_pubkey),
            ) = entry
            {
                let funding_address = self
                    .funding_address_helper
                    .get_by_id(funding_address_id.as_str())?
                    .ok_or(anyhow::anyhow!("funding address not found".to_string()))?;

                // If an unconfirmed transaction is replaced, forcing a new signing flow.
                let is_rbf = if let Some(previous_tx_id) = &funding_address.lockup_transaction_id
                    && previous_tx_id != &tx_id
                {
                    // if the funding address is not at transaction.mempool (confirmed or claimed/refunded)
                    // it is actually a new unrelated transaction, so we ignore it.
                    let status = FundingAddressStatus::parse(&funding_address.status);
                    if status != FundingAddressStatus::TransactionMempool {
                        info!(
                            "Ignoring relevant tx {tx_id} for funding address {funding_address_id} since its at status {status}",
                        );
                        continue;
                    }
                    true
                } else {
                    false
                };

                let (vout, value) =
                    self.find_output(&relevant_tx.tx, &funding_address.symbol, script_pubkey)?;

                self.funding_address_helper.set_transaction(
                    funding_address_id.as_str(),
                    &tx_id,
                    vout as i32,
                    value as i64,
                    match relevant_tx.status {
                        TxStatus::Confirmed => FundingAddressStatus::TransactionConfirmed,
                        _ => FundingAddressStatus::TransactionMempool,
                    }
                    .to_string()
                    .as_str(),
                    is_rbf,
                )?;
                let tx_hex = alloy::hex::encode(relevant_tx.tx.serialize());
                self.send_update(funding_address_id.as_str(), Some(tx_hex))
                    .await?;
            }
        }
        Ok(())
    }

    async fn send_update(&self, id: &str, tx_hex: Option<String>) -> Result<()> {
        let funding_address = self
            .funding_address_helper
            .get_by_id(id)?
            .ok_or(anyhow::anyhow!("funding address not found"))?;

        let transaction = match &funding_address.lockup_transaction_id {
            Some(tx_id) => {
                let hex = match tx_hex {
                    Some(hex) => Some(hex),
                    None => get_chain_client(&self.currencies, &funding_address.symbol)?
                        .raw_transaction(tx_id)
                        .await
                        .ok(),
                };
                Some(TransactionInfo {
                    id: tx_id.clone(),
                    hex,
                    eta: None,
                })
            }
            None => None,
        };

        let update = FundingAddressUpdate {
            id: funding_address.id,
            status: funding_address.status,
            transaction,
            swap_id: funding_address.swap_id,
        };

        self.funding_address_update_tx.send((None, vec![update]))?;
        Ok(())
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use crate::api::ws::types::SwapStatusNoId;
    use crate::db::helpers::funding_address::test::MockFundingAddressHelper;
    use crate::db::models::FundingAddress;
    use bitcoin::absolute::LockTime;
    use bitcoin::hashes::Hash;
    use bitcoin::transaction::Version;
    use bitcoin::{Amount, ScriptBuf, Transaction as BitcoinTransaction, TxOut};
    use mockall::predicate::*;
    use rstest::*;
    use std::collections::HashMap;

    // Test fixtures and helpers

    fn test_script(seed: u8) -> ScriptBuf {
        ScriptBuf::new_p2pkh(&bitcoin::PubkeyHash::from_slice(&[seed; 20]).unwrap())
    }

    fn test_elements_script(seed: u8) -> elements::Script {
        elements::Script::new_p2pkh(&elements::PubkeyHash::from_slice(&[seed; 20]).unwrap())
    }

    fn test_bitcoin_tx(outputs: Vec<(ScriptBuf, u64)>) -> Transaction {
        Transaction::Bitcoin(BitcoinTransaction {
            version: Version::TWO,
            lock_time: LockTime::ZERO,
            input: vec![],
            output: outputs
                .into_iter()
                .map(|(script, amount)| TxOut {
                    value: Amount::from_sat(amount),
                    script_pubkey: script,
                })
                .collect(),
        })
    }

    fn test_elements_tx(outputs: Vec<(elements::Script, u64)>) -> Transaction {
        use elements::confidential::{Asset, Nonce};

        Transaction::Elements(elements::Transaction {
            version: 2,
            lock_time: elements::LockTime::ZERO,
            input: vec![],
            output: outputs
                .into_iter()
                .map(|(script, amount)| elements::TxOut {
                    asset: Asset::Null,
                    value: Value::Explicit(amount),
                    nonce: Nonce::Null,
                    script_pubkey: script,
                    witness: elements::TxOutWitness::default(),
                })
                .collect(),
        })
    }

    fn test_funding_address(id: &str) -> FundingAddress {
        let mut fa = FundingAddress {
            id: id.to_string(),
            symbol: "BTC".to_string(),
            status: "created".to_string(),
            key_index: 0,
            their_public_key: alloy::hex::decode(
                "02a1633cafcc01ebfb6d78e39f687a1f0995c62fc95f51ead10a02ee0be551b5dc",
            )
            .unwrap(),
            tree: String::new(),
            timeout_block_height: 1000000,
            ..Default::default()
        };
        fa.tree = fa.tree_json().unwrap();
        fa
    }

    fn test_funding_address_with_swap(
        id: &str,
        tx_id: &str,
        amount: i64,
        swap_id: &str,
    ) -> FundingAddress {
        FundingAddress {
            lockup_transaction_id: Some(tx_id.to_string()),
            lockup_amount: Some(amount),
            swap_id: Some(swap_id.to_string()),
            ..test_funding_address(id)
        }
    }

    fn test_funding_address_with_swap_and_status(
        id: &str,
        tx_id: &str,
        amount: i64,
        swap_id: &str,
        status: &str,
    ) -> FundingAddress {
        FundingAddress {
            status: status.to_string(),
            ..test_funding_address_with_swap(id, tx_id, amount, swap_id)
        }
    }

    fn test_swap_status(id: &str, status: SwapUpdate) -> SwapStatus {
        SwapStatus {
            id: id.to_string(),
            base: SwapStatusNoId {
                status: status.to_string(),
                ..Default::default()
            },
        }
    }

    struct TestNursery {
        nursery: FundingAddressNursery,
        #[allow(dead_code)]
        rx: broadcast::Receiver<(Option<u64>, Vec<FundingAddressUpdate>)>,
    }

    impl TestNursery {
        fn new(funding_helper: MockFundingAddressHelper) -> Self {
            Self::new_with_currencies(funding_helper, Arc::new(HashMap::new()))
        }

        fn new_with_currencies(
            funding_helper: MockFundingAddressHelper,
            currencies: Currencies,
        ) -> Self {
            let (tx, rx) = broadcast::channel(16);
            let nursery = FundingAddressNursery::new(Arc::new(funding_helper), tx, currencies);
            Self { nursery, rx }
        }

        #[allow(dead_code)]
        async fn new_with_test_currencies(funding_helper: MockFundingAddressHelper) -> Self {
            use crate::service::test::get_test_currencies;
            Self::new_with_currencies(funding_helper, get_test_currencies().await)
        }
    }

    // find_output tests

    #[test]
    fn find_output_returns_matching_output() {
        let test = TestNursery::new(MockFundingAddressHelper::new());
        let script = test_script(0);
        let tx = test_bitcoin_tx(vec![(script.clone(), 100_000)]);

        let (vout, value) = test
            .nursery
            .find_output(&tx, "BTC", script.to_bytes())
            .unwrap();

        assert_eq!(vout, 0);
        assert_eq!(value, 100_000);
    }

    #[test]
    fn find_output_returns_error_when_not_found() {
        let test = TestNursery::new(MockFundingAddressHelper::new());
        let tx = test_bitcoin_tx(vec![(test_script(0), 100_000)]);

        let result = test
            .nursery
            .find_output(&tx, "BTC", test_script(1).to_bytes());

        assert_eq!(result.unwrap_err().to_string(), "output not found");
    }

    #[test]
    fn find_output_finds_correct_output_among_multiple() {
        let test = TestNursery::new(MockFundingAddressHelper::new());
        let script1 = test_script(0);
        let script2 = test_script(1);
        let tx = test_bitcoin_tx(vec![(script1, 100_000), (script2.clone(), 200_000)]);

        let (vout, value) = test
            .nursery
            .find_output(&tx, "BTC", script2.to_bytes())
            .unwrap();

        assert_eq!(vout, 1);
        assert_eq!(value, 200_000);
    }

    #[test]
    fn find_output_returns_matching_output_lbtc() {
        let test = TestNursery::new(MockFundingAddressHelper::new());
        let script = test_elements_script(0);
        let tx = test_elements_tx(vec![(script.clone(), 100_000)]);

        let (vout, value) = test
            .nursery
            .find_output(&tx, "L-BTC", script.to_bytes())
            .unwrap();

        assert_eq!(vout, 0);
        assert_eq!(value, 100_000);
    }

    #[test]
    fn find_output_returns_error_when_not_found_lbtc() {
        let test = TestNursery::new(MockFundingAddressHelper::new());
        let tx = test_elements_tx(vec![(test_elements_script(0), 100_000)]);

        let result = test
            .nursery
            .find_output(&tx, "L-BTC", test_elements_script(1).to_bytes());

        assert_eq!(result.unwrap_err().to_string(), "output not found");
    }

    #[test]
    fn find_output_finds_correct_output_among_multiple_lbtc() {
        let test = TestNursery::new(MockFundingAddressHelper::new());
        let script1 = test_elements_script(0);
        let script2 = test_elements_script(1);
        let tx = test_elements_tx(vec![(script1, 100_000), (script2.clone(), 200_000)]);

        let (vout, value) = test
            .nursery
            .find_output(&tx, "L-BTC", script2.to_bytes())
            .unwrap();

        assert_eq!(vout, 1);
        assert_eq!(value, 200_000);
    }

    // handle_relevant_tx tests

    #[rstest]
    #[case(TxStatus::NotSafe, "transaction.mempool")]
    #[case(TxStatus::ZeroConfSafe, "transaction.mempool")]
    #[case(TxStatus::Confirmed, "transaction.confirmed")]
    #[tokio::test]
    async fn handle_relevant_tx_sets_status_based_on_tx_status(
        #[case] tx_status: TxStatus,
        #[case] expected_status: &'static str,
    ) {
        let mut mock_helper = MockFundingAddressHelper::new();
        let funding_address = test_funding_address("test_id");
        let fa_clone = funding_address.clone();

        mock_helper
            .expect_get_by_id()
            .with(eq("test_id"))
            .times(2)
            .returning(move |_| Ok(Some(fa_clone.clone())));

        mock_helper
            .expect_set_transaction()
            .withf(move |id, _, vout, amount, status, delink| {
                id == "test_id"
                    && *vout == 0
                    && *amount == 100_000
                    && status == expected_status
                    && !*delink
            })
            .times(1)
            .returning(|_, _, _, _, _, _| Ok(1));

        let test = TestNursery::new(mock_helper);
        let script = test_script(0);

        let relevant_tx = RelevantTx {
            symbol: "BTC".to_string(),
            tx: test_bitcoin_tx(vec![(script.clone(), 100_000)]),
            status: tx_status,
            entries: vec![(
                RelevantId::FundingAddress("test_id".to_string()),
                TxDetails::Output(script.to_bytes()),
            )],
        };

        test.nursery.handle_relevant_tx(relevant_tx).await.unwrap();
    }

    #[tokio::test]
    async fn handle_relevant_tx_delinks_on_rbf_when_at_mempool_status() {
        let mut mock_helper = MockFundingAddressHelper::new();

        let funding_address = test_funding_address_with_swap_and_status(
            "test_id",
            "previous_txid",
            100_000,
            "swap_123",
            "transaction.mempool",
        );
        let fa_clone = funding_address.clone();

        mock_helper
            .expect_get_by_id()
            .with(eq("test_id"))
            .times(2)
            .returning(move |_| Ok(Some(fa_clone.clone())));

        mock_helper
            .expect_set_transaction()
            .withf(|_, _, _, _, status, delink| status == "transaction.mempool" && *delink)
            .returning(|_, _, _, _, _, _| Ok(1));

        let test = TestNursery::new(mock_helper);
        let script = test_script(0);

        let relevant_tx = RelevantTx {
            symbol: "BTC".to_string(),
            tx: test_bitcoin_tx(vec![(script.clone(), 100_000)]),
            status: TxStatus::NotSafe,
            entries: vec![(
                RelevantId::FundingAddress("test_id".to_string()),
                TxDetails::Output(script.to_bytes()),
            )],
        };

        test.nursery.handle_relevant_tx(relevant_tx).await.unwrap();
    }

    #[tokio::test]
    async fn handle_relevant_tx_delinks_swap_on_rbf_with_different_amount() {
        let mut mock_helper = MockFundingAddressHelper::new();

        let funding_address = test_funding_address_with_swap_and_status(
            "test_id",
            "previous_txid",
            100_000,
            "swap_123",
            "transaction.mempool",
        );
        let fa_clone = funding_address.clone();

        mock_helper
            .expect_get_by_id()
            .with(eq("test_id"))
            .times(2)
            .returning(move |_| Ok(Some(fa_clone.clone())));

        mock_helper
            .expect_set_transaction()
            .withf(|_, _, _, amount, status, delink| {
                *amount == 200_000 && status == "transaction.mempool" && *delink
            })
            .returning(|_, _, _, _, _, _| Ok(1));

        let test = TestNursery::new(mock_helper);
        let script = test_script(0);

        let relevant_tx = RelevantTx {
            symbol: "BTC".to_string(),
            tx: test_bitcoin_tx(vec![(script.clone(), 200_000)]),
            status: TxStatus::NotSafe,
            entries: vec![(
                RelevantId::FundingAddress("test_id".to_string()),
                TxDetails::Output(script.to_bytes()),
            )],
        };

        test.nursery.handle_relevant_tx(relevant_tx).await.unwrap();
    }

    #[tokio::test]
    async fn handle_relevant_tx_updates_confirmation_for_same_txid() {
        let mut mock_helper = MockFundingAddressHelper::new();

        let script = test_script(0);
        let tx = test_bitcoin_tx(vec![(script.clone(), 100_000)]);
        let tx_id = tx.txid_hex();

        let funding_address = test_funding_address_with_swap_and_status(
            "test_id",
            &tx_id,
            100_000,
            "swap_123",
            "transaction.mempool",
        );
        let fa_clone = funding_address.clone();

        mock_helper
            .expect_get_by_id()
            .with(eq("test_id"))
            .times(2)
            .returning(move |_| Ok(Some(fa_clone.clone())));

        mock_helper
            .expect_set_transaction()
            .withf(|_, _, _, _, status, delink| status == "transaction.confirmed" && !*delink)
            .returning(|_, _, _, _, _, _| Ok(1));

        let test = TestNursery::new(mock_helper);

        let relevant_tx = RelevantTx {
            symbol: "BTC".to_string(),
            tx,
            status: TxStatus::Confirmed,
            entries: vec![(
                RelevantId::FundingAddress("test_id".to_string()),
                TxDetails::Output(script.to_bytes()),
            )],
        };

        test.nursery.handle_relevant_tx(relevant_tx).await.unwrap();
    }

    #[rstest]
    #[case("transaction.confirmed")]
    #[case("transaction.claimed")]
    #[case("transaction.refunded")]
    #[case("created")]
    #[tokio::test]
    async fn handle_relevant_tx_ignores_rbf_when_not_at_mempool_status(
        #[case] funding_address_status: &'static str,
    ) {
        let mut mock_helper = MockFundingAddressHelper::new();

        let funding_address = test_funding_address_with_swap_and_status(
            "test_id",
            "previous_txid",
            100_000,
            "swap_123",
            funding_address_status,
        );

        mock_helper
            .expect_get_by_id()
            .with(eq("test_id"))
            .returning(move |_| Ok(Some(funding_address.clone())));

        mock_helper.expect_set_transaction().times(0);

        let test = TestNursery::new(mock_helper);
        let script = test_script(0);

        let relevant_tx = RelevantTx {
            symbol: "BTC".to_string(),
            tx: test_bitcoin_tx(vec![(script.clone(), 100_000)]),
            status: TxStatus::NotSafe,
            entries: vec![(
                RelevantId::FundingAddress("test_id".to_string()),
                TxDetails::Output(script.to_bytes()),
            )],
        };

        test.nursery.handle_relevant_tx(relevant_tx).await.unwrap();
    }

    #[tokio::test]
    async fn handle_relevant_tx_returns_error_when_funding_address_not_found() {
        let mut mock_helper = MockFundingAddressHelper::new();

        mock_helper.expect_get_by_id().returning(|_| Ok(None));

        let test = TestNursery::new(mock_helper);
        let script = test_script(0);

        let relevant_tx = RelevantTx {
            symbol: "BTC".to_string(),
            tx: test_bitcoin_tx(vec![(script.clone(), 100_000)]),
            status: TxStatus::NotSafe,
            entries: vec![(
                RelevantId::FundingAddress("nonexistent".to_string()),
                TxDetails::Output(script.to_bytes()),
            )],
        };

        let result = test.nursery.handle_relevant_tx(relevant_tx).await;
        assert!(
            result
                .unwrap_err()
                .to_string()
                .contains("funding address not found")
        );
    }

    #[tokio::test]
    async fn handle_relevant_tx_returns_error_when_output_not_found() {
        let mut mock_helper = MockFundingAddressHelper::new();

        mock_helper
            .expect_get_by_id()
            .returning(|_| Ok(Some(test_funding_address("test_id"))));

        let test = TestNursery::new(mock_helper);

        let relevant_tx = RelevantTx {
            symbol: "BTC".to_string(),
            tx: test_bitcoin_tx(vec![(test_script(0), 100_000)]),
            status: TxStatus::NotSafe,
            entries: vec![(
                RelevantId::FundingAddress("test_id".to_string()),
                TxDetails::Output(test_script(1).to_bytes()),
            )],
        };

        let result = test.nursery.handle_relevant_tx(relevant_tx).await;
        assert_eq!(result.unwrap_err().to_string(), "output not found");
    }

    #[tokio::test]
    async fn handle_relevant_tx_ignores_non_funding_address_entries() {
        let test = TestNursery::new(MockFundingAddressHelper::new());
        let script = test_script(0);

        let relevant_tx = RelevantTx {
            symbol: "BTC".to_string(),
            tx: test_bitcoin_tx(vec![(script.clone(), 100_000)]),
            status: TxStatus::NotSafe,
            entries: vec![(
                RelevantId::Swap("swap_123".to_string()),
                TxDetails::Output(script.to_bytes()),
            )],
        };

        test.nursery.handle_relevant_tx(relevant_tx).await.unwrap();
    }

    #[tokio::test]
    async fn handle_relevant_tx_processes_multiple_entries() {
        let mut mock_helper = MockFundingAddressHelper::new();

        let fa1 = test_funding_address("test_id_1");
        let fa2 = test_funding_address("test_id_2");
        let fa1_clone = fa1.clone();
        let fa2_clone = fa2.clone();

        mock_helper
            .expect_get_by_id()
            .with(eq("test_id_1"))
            .times(2)
            .returning(move |_| Ok(Some(fa1_clone.clone())));

        mock_helper
            .expect_get_by_id()
            .with(eq("test_id_2"))
            .times(2)
            .returning(move |_| Ok(Some(fa2_clone.clone())));

        mock_helper
            .expect_set_transaction()
            .withf(|_, _, _, _, _, delink| !*delink)
            .times(2)
            .returning(|_, _, _, _, _, _| Ok(1));

        let test = TestNursery::new(mock_helper);
        let script1 = test_script(0);
        let script2 = test_script(1);

        let relevant_tx = RelevantTx {
            symbol: "BTC".to_string(),
            tx: test_bitcoin_tx(vec![(script1.clone(), 100_000), (script2.clone(), 200_000)]),
            status: TxStatus::NotSafe,
            entries: vec![
                (
                    RelevantId::FundingAddress("test_id_1".to_string()),
                    TxDetails::Output(script1.to_bytes()),
                ),
                (
                    RelevantId::FundingAddress("test_id_2".to_string()),
                    TxDetails::Output(script2.to_bytes()),
                ),
            ],
        };

        test.nursery.handle_relevant_tx(relevant_tx).await.unwrap();
    }

    // handle_swap_status_update tests

    #[rstest]
    #[case(SwapUpdate::InvoiceSettled)]
    #[case(SwapUpdate::TransactionClaimed)]
    #[tokio::test]
    async fn handle_swap_status_update_sets_claimed_on_success(#[case] status: SwapUpdate) {
        let mut mock_helper = MockFundingAddressHelper::new();

        let funding_address = test_funding_address_with_swap("fa_id", "tx_id", 100_000, "swap_123");
        let fa_clone = funding_address.clone();
        let mut fa_updated = funding_address.clone();
        fa_updated.status = "transaction.claimed".to_string();

        mock_helper
            .expect_get_by_swap_id()
            .with(eq("swap_123"))
            .returning(move |_| Ok(Some(fa_clone.clone())));

        mock_helper
            .expect_set_status()
            .with(eq("fa_id"), eq("transaction.claimed"))
            .returning(|_, _| Ok(1));

        mock_helper
            .expect_get_by_id()
            .with(eq("fa_id"))
            .returning(move |_| Ok(Some(fa_updated.clone())));

        let test = TestNursery::new_with_test_currencies(mock_helper).await;

        test.nursery
            .handle_swap_status_update(&test_swap_status("swap_123", status))
            .await
            .unwrap();
    }

    #[rstest]
    #[case(SwapUpdate::SwapExpired)]
    #[case(SwapUpdate::TransactionFailed)]
    #[case(SwapUpdate::TransactionLockupFailed)]
    #[case(SwapUpdate::InvoiceFailedToPay)]
    #[case(SwapUpdate::TransactionRefunded)]
    #[tokio::test]
    async fn handle_swap_status_update_delinks_on_failure(#[case] status: SwapUpdate) {
        let mut mock_helper = MockFundingAddressHelper::new();

        let funding_address = test_funding_address_with_swap("fa_id", "tx_id", 100_000, "swap_123");
        let fa_clone = funding_address.clone();
        let mut fa_updated = funding_address.clone();
        fa_updated.swap_id = None;
        fa_updated.presigned_tx = None;

        mock_helper
            .expect_get_by_swap_id()
            .with(eq("swap_123"))
            .returning(move |_| Ok(Some(fa_clone.clone())));

        mock_helper
            .expect_set_presigned_tx()
            .with(eq("fa_id"), eq(None))
            .returning(|_, _| Ok(1));

        mock_helper
            .expect_get_by_id()
            .with(eq("fa_id"))
            .returning(move |_| Ok(Some(fa_updated.clone())));

        let test = TestNursery::new_with_test_currencies(mock_helper).await;

        test.nursery
            .handle_swap_status_update(&test_swap_status("swap_123", status))
            .await
            .unwrap();
    }

    #[tokio::test]
    async fn handle_swap_status_update_ignores_swap_without_funding_address() {
        let mut mock_helper = MockFundingAddressHelper::new();

        mock_helper.expect_get_by_swap_id().returning(|_| Ok(None));

        mock_helper.expect_set_status().times(0);
        mock_helper.expect_set_presigned_tx().times(0);

        let test = TestNursery::new(mock_helper);

        test.nursery
            .handle_swap_status_update(&test_swap_status(
                "swap_123",
                SwapUpdate::TransactionClaimed,
            ))
            .await
            .unwrap();
    }

    #[rstest]
    #[case(SwapUpdate::SwapCreated)]
    #[case(SwapUpdate::TransactionMempool)]
    #[case(SwapUpdate::TransactionConfirmed)]
    #[case(SwapUpdate::InvoicePending)]
    #[case(SwapUpdate::TransactionClaimPending)]
    #[tokio::test]
    async fn handle_swap_status_update_ignores_non_terminal_events(#[case] status: SwapUpdate) {
        let test = TestNursery::new(MockFundingAddressHelper::new());

        test.nursery
            .handle_swap_status_update(&test_swap_status("any_swap", status))
            .await
            .unwrap();
    }

    // send_update tests

    #[tokio::test]
    async fn send_update_broadcasts_to_channel() {
        let mut mock_helper = MockFundingAddressHelper::new();
        let funding_address = test_funding_address("test_id");

        mock_helper
            .expect_get_by_id()
            .with(eq("test_id"))
            .returning(move |_| Ok(Some(funding_address.clone())));

        let mut test = TestNursery::new(mock_helper);

        test.nursery.send_update("test_id", None).await.unwrap();
        assert!(test.rx.try_recv().is_ok());
    }

    #[tokio::test]
    async fn send_update_returns_error_when_funding_address_not_found() {
        let mut mock_helper = MockFundingAddressHelper::new();

        mock_helper.expect_get_by_id().returning(|_| Ok(None));

        let test = TestNursery::new(mock_helper);

        let result = test.nursery.send_update("nonexistent", None).await;
        assert!(
            result
                .unwrap_err()
                .to_string()
                .contains("funding address not found")
        );
    }

    #[tokio::test]
    async fn handle_relevant_tx_confirmed_rbf_delinks_and_sets_confirmed() {
        let mut mock_helper = MockFundingAddressHelper::new();

        let funding_address = test_funding_address_with_swap_and_status(
            "test_id",
            "previous_txid",
            100_000,
            "swap_123",
            "transaction.mempool",
        );
        let fa_clone = funding_address.clone();

        mock_helper
            .expect_get_by_id()
            .with(eq("test_id"))
            .times(2)
            .returning(move |_| Ok(Some(fa_clone.clone())));

        // RBF should delink (clear presigned tx and swap) and set status to confirmed
        mock_helper
            .expect_set_transaction()
            .withf(|_, _, _, _, status, delink| status == "transaction.confirmed" && *delink)
            .returning(|_, _, _, _, _, _| Ok(1));

        let test = TestNursery::new(mock_helper);
        let script = test_script(0);

        let relevant_tx = RelevantTx {
            symbol: "BTC".to_string(),
            tx: test_bitcoin_tx(vec![(script.clone(), 100_000)]),
            status: TxStatus::Confirmed, // Confirmed status
            entries: vec![(
                RelevantId::FundingAddress("test_id".to_string()),
                TxDetails::Output(script.to_bytes()),
            )],
        };

        test.nursery.handle_relevant_tx(relevant_tx).await.unwrap();
    }

    #[tokio::test]
    async fn handle_relevant_tx_elements_explicit_value() {
        let mut mock_helper = MockFundingAddressHelper::new();
        let mut funding_address = test_funding_address("test_id");
        funding_address.symbol = "L-BTC".to_string();
        let fa_clone = funding_address.clone();

        mock_helper
            .expect_get_by_id()
            .with(eq("test_id"))
            .times(2)
            .returning(move |_| Ok(Some(fa_clone.clone())));

        mock_helper
            .expect_set_transaction()
            .withf(|id, _, vout, amount, status, delink| {
                id == "test_id"
                    && *vout == 0
                    && *amount == 100_000
                    && status == "transaction.mempool"
                    && !*delink
            })
            .returning(|_, _, _, _, _, _| Ok(1));

        let test = TestNursery::new(mock_helper);
        let script = test_elements_script(0);

        let relevant_tx = RelevantTx {
            symbol: "L-BTC".to_string(),
            tx: test_elements_tx(vec![(script.clone(), 100_000)]),
            status: TxStatus::NotSafe,
            entries: vec![(
                RelevantId::FundingAddress("test_id".to_string()),
                TxDetails::Output(script.to_bytes()),
            )],
        };

        test.nursery.handle_relevant_tx(relevant_tx).await.unwrap();
    }
}

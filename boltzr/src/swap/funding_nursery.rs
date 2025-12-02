use std::sync::Arc;

use crate::api::ws::types::FundingAddressUpdate;
use crate::chain::utils::Transaction;
use crate::currencies::{Currencies, get_wallet};
use crate::db::helpers::funding_address::FundingAddressHelper;
use crate::swap::tx_check::{RelevantId, TxDetails};
use crate::swap::{FundingAddressStatus, RelevantTx, TxStatus};
use anyhow::Result;
use bitcoin::key::Secp256k1;
use bitcoin::secp256k1::SecretKey;
use elements::confidential::Value;
use tokio::sync::broadcast;
use tracing::error;

#[derive(Clone)]
pub struct FundingAddressNursery {
    funding_address_helper: Arc<dyn FundingAddressHelper + Send + Sync>,
    funding_address_update_tx: broadcast::Sender<FundingAddressUpdate>,
    currencies: Currencies,
}

impl FundingAddressNursery {
    pub fn new(
        funding_address_helper: Arc<dyn FundingAddressHelper + Send + Sync>,
        funding_address_update_tx: broadcast::Sender<FundingAddressUpdate>,
        currencies: Currencies,
    ) -> Self {
        Self {
            funding_address_helper,
            funding_address_update_tx,
            currencies,
        }
    }

    pub async fn start(self, mut relevant_txs: broadcast::Receiver<RelevantTx>) {
        tokio::spawn(async move {
            while let Ok(relevant_tx) = relevant_txs.recv().await {
                match self.handle_relevant_tx(relevant_tx).await {
                    Ok(()) => {}
                    Err(e) => {
                        error!(
                            "Funding address nursery failed to handle relevant tx: {}",
                            e
                        );
                    }
                }
            }
        });
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
                    let secp = Secp256k1::new();
                    let wallet = get_wallet(&self.currencies, symbol).ok()?;
                    let blinding_key = wallet.derive_blinding_key(script_pubkey.clone()).ok()?;
                    match output.value {
                        Value::Explicit(amount) => Some((vout, amount)),
                        Value::Confidential(_) => {
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

                let (vout, value) =
                    self.find_output(&relevant_tx.tx, &funding_address.symbol, script_pubkey)?;

                let mut status = match relevant_tx.status {
                    TxStatus::Confirmed => FundingAddressStatus::TransactionConfirmed,
                    _ => FundingAddressStatus::TransactionMempool,
                };

                if let (Some(previous_tx_id), Some(swap_id)) = (
                    funding_address.lockup_transaction_id,
                    funding_address.swap_id,
                ) {
                    // if the transaction is replaced but the amount stays the same,
                    // we emit a signature required event, but don't change the swap id
                    // after signature is received the transaction will be checked again, causing the
                    // funding address to move to the proper transaction.mempool or confirmed status
                    // only if there is a change in lockup amount, we delink the funding address from the swap
                    if previous_tx_id != tx_id {
                        let previous_amount = funding_address.lockup_amount.unwrap_or(0) as u64;
                        let swap_id = if value != previous_amount {
                            // TODO: sanity check that the swap hasnt initiated payment on our side
                            None
                        } else {
                            status = FundingAddressStatus::SignatureRequired;
                            Some(swap_id)
                        };
                        self.funding_address_helper.set_presigned_tx(
                            funding_address_id.as_str(),
                            None,
                            swap_id,
                        )?;
                    }
                }

                self.funding_address_helper.set_transaction(
                    funding_address_id.as_str(),
                    &tx_id,
                    vout as i32,
                    value as i64,
                    status.to_string().as_str(),
                )?;

                self.send_update(funding_address_id.as_str())?;
            }
        }
        Ok(())
    }

    fn send_update(&self, id: &str) -> Result<()> {
        let funding_address = self
            .funding_address_helper
            .get_by_id(id)?
            .ok_or(anyhow::anyhow!("funding address not found"))?;
        self.funding_address_update_tx
            .send(funding_address.into())?;
        Ok(())
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use crate::db::helpers::funding_address::test::MockFundingAddressHelper;
    use crate::db::models::FundingAddress;
    use bitcoin::absolute::LockTime;
    use bitcoin::hashes::Hash;
    use bitcoin::transaction::Version;
    use bitcoin::{Amount, ScriptBuf, Transaction as BitcoinTransaction, TxOut};
    use mockall::predicate::*;
    use std::collections::HashMap;
    use std::sync::Arc;

    fn create_test_bitcoin_tx(output_script: ScriptBuf, amount_sats: u64) -> Transaction {
        let tx = BitcoinTransaction {
            version: Version::TWO,
            lock_time: LockTime::ZERO,
            input: vec![],
            output: vec![TxOut {
                value: Amount::from_sat(amount_sats),
                script_pubkey: output_script,
            }],
        };
        Transaction::Bitcoin(tx)
    }

    fn create_test_funding_address(
        id: &str,
        symbol: &str,
        previous_tx: Option<String>,
        previous_amount: Option<i64>,
        swap_id: Option<String>,
    ) -> FundingAddress {
        FundingAddress {
            id: id.to_string(),
            symbol: symbol.to_string(),
            status: "created".to_string(),
            key_index: 0,
            their_public_key: "030000000000000000000000000000000000000000000000000000000000000000"
                .to_string(),
            timeout_block_height: 1000000,
            lockup_transaction_id: previous_tx,
            lockup_transaction_vout: Some(0),
            lockup_amount: previous_amount,
            swap_id,
            presigned_tx: None,
        }
    }

    #[tokio::test]
    async fn test_find_output_bitcoin_success() {
        let (tx, _rx) = broadcast::channel(16);
        let mock_helper = MockFundingAddressHelper::new();
        let currencies: Currencies = Arc::new(HashMap::new());

        let nursery = FundingAddressNursery::new(Arc::new(mock_helper), tx, currencies);

        let script = ScriptBuf::new_p2pkh(&bitcoin::PubkeyHash::from_slice(&[0u8; 20]).unwrap());
        let btc_tx = create_test_bitcoin_tx(script.clone(), 100000);

        let result = nursery.find_output(&btc_tx, "BTC", script.to_bytes());
        assert!(result.is_ok());
        let (vout, value) = result.unwrap();
        assert_eq!(vout, 0);
        assert_eq!(value, 100000);
    }

    #[tokio::test]
    async fn test_find_output_bitcoin_not_found() {
        let (tx, _rx) = broadcast::channel(16);
        let mock_helper = MockFundingAddressHelper::new();
        let currencies: Currencies = Arc::new(HashMap::new());

        let nursery = FundingAddressNursery::new(Arc::new(mock_helper), tx, currencies);

        let script = ScriptBuf::new_p2pkh(&bitcoin::PubkeyHash::from_slice(&[0u8; 20]).unwrap());
        let different_script =
            ScriptBuf::new_p2pkh(&bitcoin::PubkeyHash::from_slice(&[1u8; 20]).unwrap());
        let btc_tx = create_test_bitcoin_tx(script.clone(), 100000);

        let result = nursery.find_output(&btc_tx, "BTC", different_script.to_bytes());
        assert!(result.is_err());
        assert_eq!(result.unwrap_err().to_string(), "output not found");
    }

    #[tokio::test]
    async fn test_find_output_bitcoin_multiple_outputs() {
        let (tx, _rx) = broadcast::channel(16);
        let mock_helper = MockFundingAddressHelper::new();
        let currencies: Currencies = Arc::new(HashMap::new());

        let nursery = FundingAddressNursery::new(Arc::new(mock_helper), tx, currencies);

        let script1 = ScriptBuf::new_p2pkh(&bitcoin::PubkeyHash::from_slice(&[0u8; 20]).unwrap());
        let script2 = ScriptBuf::new_p2pkh(&bitcoin::PubkeyHash::from_slice(&[1u8; 20]).unwrap());

        let btc_tx = Transaction::Bitcoin(BitcoinTransaction {
            version: Version::TWO,
            lock_time: LockTime::ZERO,
            input: vec![],
            output: vec![
                TxOut {
                    value: Amount::from_sat(100000),
                    script_pubkey: script1.clone(),
                },
                TxOut {
                    value: Amount::from_sat(200000),
                    script_pubkey: script2.clone(),
                },
            ],
        });

        let result = nursery.find_output(&btc_tx, "BTC", script2.to_bytes());
        assert!(result.is_ok());
        let (vout, value) = result.unwrap();
        assert_eq!(vout, 1);
        assert_eq!(value, 200000);
    }

    #[tokio::test]
    async fn test_handle_relevant_tx_new_transaction_mempool() {
        let (update_tx, _rx) = broadcast::channel(16);
        let mut mock_helper = MockFundingAddressHelper::new();
        let currencies: Currencies = Arc::new(HashMap::new());

        let funding_address = create_test_funding_address("test_id", "BTC", None, None, None);

        mock_helper
            .expect_get_by_id()
            .with(eq("test_id"))
            .times(2)
            .returning(move |_| Ok(Some(funding_address.clone())));

        mock_helper
            .expect_set_transaction()
            .with(
                eq("test_id"),
                always(), // txid
                eq(0),
                eq(100000),
                eq("transaction.mempool"),
            )
            .times(1)
            .returning(|_, _, _, _, _| Ok(1));

        let nursery = FundingAddressNursery::new(Arc::new(mock_helper), update_tx, currencies);

        let script = ScriptBuf::new_p2pkh(&bitcoin::PubkeyHash::from_slice(&[0u8; 20]).unwrap());
        let tx = create_test_bitcoin_tx(script.clone(), 100000);

        let relevant_tx = RelevantTx {
            symbol: "BTC".to_string(),
            tx,
            status: TxStatus::NotSafe,
            entries: vec![(
                RelevantId::FundingAddress("test_id".to_string()),
                TxDetails::Output(script.to_bytes()),
            )],
        };

        let result = nursery.handle_relevant_tx(relevant_tx).await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_handle_relevant_tx_new_transaction_confirmed() {
        let (update_tx, _rx) = broadcast::channel(16);
        let mut mock_helper = MockFundingAddressHelper::new();
        let currencies: Currencies = Arc::new(HashMap::new());

        let funding_address = create_test_funding_address("test_id", "BTC", None, None, None);
        let funding_address_clone = funding_address.clone();

        mock_helper
            .expect_get_by_id()
            .with(eq("test_id"))
            .times(2)
            .returning(move |_| Ok(Some(funding_address_clone.clone())));

        mock_helper
            .expect_set_transaction()
            .with(
                eq("test_id"),
                always(),
                eq(0),
                eq(100000),
                eq("transaction.confirmed"),
            )
            .times(1)
            .returning(|_, _, _, _, _| Ok(1));

        let nursery = FundingAddressNursery::new(Arc::new(mock_helper), update_tx, currencies);

        let script = ScriptBuf::new_p2pkh(&bitcoin::PubkeyHash::from_slice(&[0u8; 20]).unwrap());
        let tx = create_test_bitcoin_tx(script.clone(), 100000);

        let relevant_tx = RelevantTx {
            symbol: "BTC".to_string(),
            tx,
            status: TxStatus::Confirmed,
            entries: vec![(
                RelevantId::FundingAddress("test_id".to_string()),
                TxDetails::Output(script.to_bytes()),
            )],
        };

        let result = nursery.handle_relevant_tx(relevant_tx).await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_handle_relevant_tx_replacement_same_amount() {
        let (update_tx, _rx) = broadcast::channel(16);
        let mut mock_helper = MockFundingAddressHelper::new();
        let currencies: Currencies = Arc::new(HashMap::new());

        // Funding address already has a previous transaction
        let funding_address = create_test_funding_address(
            "test_id",
            "BTC",
            Some("previous_txid".to_string()),
            Some(100000),
            Some("swap_123".to_string()),
        );
        let funding_address_clone = funding_address.clone();

        mock_helper
            .expect_get_by_id()
            .with(eq("test_id"))
            .times(2)
            .returning(move |_| Ok(Some(funding_address_clone.clone())));

        // When amount is the same, set_presigned_tx should be called with the swap_id preserved
        mock_helper
            .expect_set_presigned_tx()
            .with(eq("test_id"), eq(None), eq(Some("swap_123".to_string())))
            .times(1)
            .returning(|_, _, _| Ok(1));

        // Status should be signature.required
        mock_helper
            .expect_set_transaction()
            .with(
                eq("test_id"),
                always(),
                eq(0),
                eq(100000),
                eq("signature.required"),
            )
            .times(1)
            .returning(|_, _, _, _, _| Ok(1));

        let nursery = FundingAddressNursery::new(Arc::new(mock_helper), update_tx, currencies);

        let script = ScriptBuf::new_p2pkh(&bitcoin::PubkeyHash::from_slice(&[0u8; 20]).unwrap());
        let tx = create_test_bitcoin_tx(script.clone(), 100000);

        let relevant_tx = RelevantTx {
            symbol: "BTC".to_string(),
            tx,
            status: TxStatus::NotSafe,
            entries: vec![(
                RelevantId::FundingAddress("test_id".to_string()),
                TxDetails::Output(script.to_bytes()),
            )],
        };

        let result = nursery.handle_relevant_tx(relevant_tx).await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_handle_relevant_tx_replacement_different_amount() {
        let (update_tx, _rx) = broadcast::channel(16);
        let mut mock_helper = MockFundingAddressHelper::new();
        let currencies: Currencies = Arc::new(HashMap::new());

        // Funding address already has a previous transaction with different amount
        let funding_address = create_test_funding_address(
            "test_id",
            "BTC",
            Some("previous_txid".to_string()),
            Some(100000),
            Some("swap_123".to_string()),
        );
        let funding_address_clone = funding_address.clone();

        mock_helper
            .expect_get_by_id()
            .with(eq("test_id"))
            .times(2)
            .returning(move |_| Ok(Some(funding_address_clone.clone())));

        // When amount changes, swap_id should be set to None (delink from swap)
        mock_helper
            .expect_set_presigned_tx()
            .with(eq("test_id"), eq(None), eq(None))
            .times(1)
            .returning(|_, _, _| Ok(1));

        // Status should be transaction.mempool (not signature required)
        mock_helper
            .expect_set_transaction()
            .with(
                eq("test_id"),
                always(),
                eq(0),
                eq(200000), // Different amount
                eq("transaction.mempool"),
            )
            .times(1)
            .returning(|_, _, _, _, _| Ok(1));

        let nursery = FundingAddressNursery::new(Arc::new(mock_helper), update_tx, currencies);

        let script = ScriptBuf::new_p2pkh(&bitcoin::PubkeyHash::from_slice(&[0u8; 20]).unwrap());
        let tx = create_test_bitcoin_tx(script.clone(), 200000); // Different amount

        let relevant_tx = RelevantTx {
            symbol: "BTC".to_string(),
            tx,
            status: TxStatus::NotSafe,
            entries: vec![(
                RelevantId::FundingAddress("test_id".to_string()),
                TxDetails::Output(script.to_bytes()),
            )],
        };

        let result = nursery.handle_relevant_tx(relevant_tx).await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_handle_relevant_tx_same_transaction_id() {
        let (update_tx, _rx) = broadcast::channel(16);
        let mut mock_helper = MockFundingAddressHelper::new();
        let currencies: Currencies = Arc::new(HashMap::new());

        let script = ScriptBuf::new_p2pkh(&bitcoin::PubkeyHash::from_slice(&[0u8; 20]).unwrap());
        let tx = create_test_bitcoin_tx(script.clone(), 100000);
        let tx_id = tx.txid_hex();

        // Funding address already has this transaction
        let funding_address = create_test_funding_address(
            "test_id",
            "BTC",
            Some(tx_id.clone()),
            Some(100000),
            Some("swap_123".to_string()),
        );
        let funding_address_clone = funding_address.clone();

        mock_helper
            .expect_get_by_id()
            .with(eq("test_id"))
            .times(2)
            .returning(move |_| Ok(Some(funding_address_clone.clone())));

        // set_presigned_tx should NOT be called because tx_id is the same
        mock_helper.expect_set_presigned_tx().times(0);

        // set_transaction should still be called to update confirmation status
        let expected_tx_id = tx_id.clone();
        mock_helper
            .expect_set_transaction()
            .withf(move |id, txid, vout, amount, status| {
                id == "test_id"
                    && txid == expected_tx_id.as_str()
                    && *vout == 0
                    && *amount == 100000
                    && status == "transaction.confirmed"
            })
            .times(1)
            .returning(|_, _, _, _, _| Ok(1));

        let nursery = FundingAddressNursery::new(Arc::new(mock_helper), update_tx, currencies);

        let relevant_tx = RelevantTx {
            symbol: "BTC".to_string(),
            tx,
            status: TxStatus::Confirmed,
            entries: vec![(
                RelevantId::FundingAddress("test_id".to_string()),
                TxDetails::Output(script.to_bytes()),
            )],
        };

        let result = nursery.handle_relevant_tx(relevant_tx).await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_handle_relevant_tx_funding_address_not_found() {
        let (update_tx, _rx) = broadcast::channel(16);
        let mut mock_helper = MockFundingAddressHelper::new();
        let currencies: Currencies = Arc::new(HashMap::new());

        mock_helper
            .expect_get_by_id()
            .with(eq("nonexistent_id"))
            .times(1)
            .returning(|_| Ok(None));

        let nursery = FundingAddressNursery::new(Arc::new(mock_helper), update_tx, currencies);

        let script = ScriptBuf::new_p2pkh(&bitcoin::PubkeyHash::from_slice(&[0u8; 20]).unwrap());
        let tx = create_test_bitcoin_tx(script.clone(), 100000);

        let relevant_tx = RelevantTx {
            symbol: "BTC".to_string(),
            tx,
            status: TxStatus::NotSafe,
            entries: vec![(
                RelevantId::FundingAddress("nonexistent_id".to_string()),
                TxDetails::Output(script.to_bytes()),
            )],
        };

        let result = nursery.handle_relevant_tx(relevant_tx).await;
        assert!(result.is_err());
        assert!(
            result
                .unwrap_err()
                .to_string()
                .contains("funding address not found")
        );
    }

    #[tokio::test]
    async fn test_handle_relevant_tx_output_not_found() {
        let (update_tx, _rx) = broadcast::channel(16);
        let mut mock_helper = MockFundingAddressHelper::new();
        let currencies: Currencies = Arc::new(HashMap::new());

        let funding_address = create_test_funding_address("test_id", "BTC", None, None, None);
        let funding_address_clone = funding_address.clone();

        mock_helper
            .expect_get_by_id()
            .with(eq("test_id"))
            .times(1)
            .returning(move |_| Ok(Some(funding_address_clone.clone())));

        let nursery = FundingAddressNursery::new(Arc::new(mock_helper), update_tx, currencies);

        let script = ScriptBuf::new_p2pkh(&bitcoin::PubkeyHash::from_slice(&[0u8; 20]).unwrap());
        let different_script =
            ScriptBuf::new_p2pkh(&bitcoin::PubkeyHash::from_slice(&[1u8; 20]).unwrap());
        let tx = create_test_bitcoin_tx(script.clone(), 100000);

        let relevant_tx = RelevantTx {
            symbol: "BTC".to_string(),
            tx,
            status: TxStatus::NotSafe,
            entries: vec![(
                RelevantId::FundingAddress("test_id".to_string()),
                TxDetails::Output(different_script.to_bytes()), // Different script
            )],
        };

        let result = nursery.handle_relevant_tx(relevant_tx).await;
        assert!(result.is_err());
        assert_eq!(result.unwrap_err().to_string(), "output not found");
    }

    #[tokio::test]
    async fn test_handle_relevant_tx_multiple_entries() {
        let (update_tx, _rx) = broadcast::channel(16);
        let mut mock_helper = MockFundingAddressHelper::new();
        let currencies: Currencies = Arc::new(HashMap::new());

        let funding_address1 = create_test_funding_address("test_id_1", "BTC", None, None, None);
        let funding_address2 = create_test_funding_address("test_id_2", "BTC", None, None, None);
        let funding_address1_clone = funding_address1.clone();
        let funding_address2_clone = funding_address2.clone();

        mock_helper
            .expect_get_by_id()
            .with(eq("test_id_1"))
            .times(2)
            .returning(move |_| Ok(Some(funding_address1_clone.clone())));

        mock_helper
            .expect_get_by_id()
            .with(eq("test_id_2"))
            .times(2)
            .returning(move |_| Ok(Some(funding_address2_clone.clone())));

        mock_helper
            .expect_set_transaction()
            .times(2)
            .returning(|_, _, _, _, _| Ok(1));

        let nursery = FundingAddressNursery::new(Arc::new(mock_helper), update_tx, currencies);

        let script1 = ScriptBuf::new_p2pkh(&bitcoin::PubkeyHash::from_slice(&[0u8; 20]).unwrap());
        let script2 = ScriptBuf::new_p2pkh(&bitcoin::PubkeyHash::from_slice(&[1u8; 20]).unwrap());

        let tx = Transaction::Bitcoin(BitcoinTransaction {
            version: Version::TWO,
            lock_time: LockTime::ZERO,
            input: vec![],
            output: vec![
                TxOut {
                    value: Amount::from_sat(100000),
                    script_pubkey: script1.clone(),
                },
                TxOut {
                    value: Amount::from_sat(200000),
                    script_pubkey: script2.clone(),
                },
            ],
        });

        let relevant_tx = RelevantTx {
            symbol: "BTC".to_string(),
            tx,
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

        let result = nursery.handle_relevant_tx(relevant_tx).await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_handle_relevant_tx_zero_conf_safe_status() {
        let (update_tx, _rx) = broadcast::channel(16);
        let mut mock_helper = MockFundingAddressHelper::new();
        let currencies: Currencies = Arc::new(HashMap::new());

        let funding_address = create_test_funding_address("test_id", "BTC", None, None, None);
        let funding_address_clone = funding_address.clone();

        mock_helper
            .expect_get_by_id()
            .with(eq("test_id"))
            .times(2)
            .returning(move |_| Ok(Some(funding_address_clone.clone())));

        mock_helper
            .expect_set_transaction()
            .with(
                eq("test_id"),
                always(),
                eq(0),
                eq(100000),
                eq("transaction.mempool"), // ZeroConfSafe maps to mempool
            )
            .times(1)
            .returning(|_, _, _, _, _| Ok(1));

        let nursery = FundingAddressNursery::new(Arc::new(mock_helper), update_tx, currencies);

        let script = ScriptBuf::new_p2pkh(&bitcoin::PubkeyHash::from_slice(&[0u8; 20]).unwrap());
        let tx = create_test_bitcoin_tx(script.clone(), 100000);

        let relevant_tx = RelevantTx {
            symbol: "BTC".to_string(),
            tx,
            status: TxStatus::ZeroConfSafe,
            entries: vec![(
                RelevantId::FundingAddress("test_id".to_string()),
                TxDetails::Output(script.to_bytes()),
            )],
        };

        let result = nursery.handle_relevant_tx(relevant_tx).await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_send_update_broadcasts_to_channel() {
        let (update_tx, mut rx) = broadcast::channel(16);
        let mut mock_helper = MockFundingAddressHelper::new();
        let currencies: Currencies = Arc::new(HashMap::new());

        let funding_address = create_test_funding_address("test_id", "BTC", None, None, None);
        let funding_address_clone = funding_address.clone();

        mock_helper
            .expect_get_by_id()
            .with(eq("test_id"))
            .times(1)
            .returning(move |_| Ok(Some(funding_address_clone.clone())));

        let nursery = FundingAddressNursery::new(Arc::new(mock_helper), update_tx, currencies);

        let result = nursery.send_update("test_id");
        assert!(result.is_ok());

        // Verify update was broadcast
        let update = rx.try_recv();
        assert!(update.is_ok());
    }

    #[tokio::test]
    async fn test_handle_relevant_tx_ignores_non_funding_address_entries() {
        let (update_tx, _rx) = broadcast::channel(16);
        let mock_helper = MockFundingAddressHelper::new();
        let currencies: Currencies = Arc::new(HashMap::new());

        // No expectations set on mock_helper because it shouldn't be called
        let nursery = FundingAddressNursery::new(Arc::new(mock_helper), update_tx, currencies);

        let script = ScriptBuf::new_p2pkh(&bitcoin::PubkeyHash::from_slice(&[0u8; 20]).unwrap());
        let tx = create_test_bitcoin_tx(script.clone(), 100000);

        let relevant_tx = RelevantTx {
            symbol: "BTC".to_string(),
            tx,
            status: TxStatus::NotSafe,
            entries: vec![
                // Non-FundingAddress entries should be ignored
                (
                    RelevantId::Swap("swap_123".to_string()),
                    TxDetails::Output(script.to_bytes()),
                ),
            ],
        };

        let result = nursery.handle_relevant_tx(relevant_tx).await;
        assert!(result.is_ok());
    }
}

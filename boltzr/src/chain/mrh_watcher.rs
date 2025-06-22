use std::sync::Arc;

use bitcoin::hex::DisplayHex;
use diesel::ExpressionMethods;
use futures::future::try_join_all;
use tokio::sync::broadcast::error::RecvError;
use tokio::sync::broadcast::{self, Receiver};

use crate::api::ws::types::{SwapStatus, TransactionInfo};
use crate::chain::utils::Transaction;
use crate::currencies::Currencies;
use crate::db::helpers::reverse_swap::ReverseSwapHelper;
use crate::swap::SwapUpdate as SwapUpdateStatus;

#[derive(Clone)]
pub struct MrhWatcher {
    reverse_swap_helper: Arc<dyn ReverseSwapHelper + Send + Sync>,
    swap_status_update_tx: broadcast::Sender<SwapStatus>,
}

impl MrhWatcher {
    pub fn new(
        reverse_swap_helper: Arc<dyn ReverseSwapHelper + Send + Sync>,
        swap_status_update_tx: broadcast::Sender<SwapStatus>,
    ) -> Self {
        Self {
            reverse_swap_helper,
            swap_status_update_tx,
        }
    }

    pub async fn start(self, currencies: &Currencies) {
        // Spawn one task for each currency and collect their handles
        let mut handles = Vec::new();

        for (symbol, currency) in currencies.iter() {
            if let Some(chain_client) = currency.chain.as_ref() {
                let stream = chain_client.tx_receiver();
                let watcher = self.clone();
                let symbol = symbol.clone();

                let handle = tokio::spawn(async move {
                    tracing::debug!("Listening to chain client {} for MRH updates", symbol);
                    if let Err(e) = watcher.listen(stream).await {
                        tracing::error!("Failed to listen to chain client {}: {}", symbol, e);
                    }
                });
                handles.push(handle);
            }
        }

        if let Err(e) = try_join_all(handles).await {
            tracing::error!("MRH watcher failed: {}", e);
        }
    }

    async fn process_transaction(&self, tx: Transaction) -> anyhow::Result<()> {
        let output_scripts = tx.output_script_pubkeys();

        let routing_hints = self.reverse_swap_helper.get_routing_hints(Box::new(
            crate::db::schema::reverseRoutingHints::dsl::scriptPubkey.eq_any(output_scripts),
        ))?;

        for routing_hint in routing_hints {
            let update = SwapStatus {
                id: routing_hint.swapId.clone(),
                status: SwapUpdateStatus::TransactionDirect.to_string(),
                zero_conf_rejected: None,
                transaction: Some(TransactionInfo {
                    id: tx.txid_hex(),
                    hex: Some(tx.serialize().to_lower_hex_string()),
                    eta: None,
                }),
                ..Default::default()
            };

            if let Err(e) = self.swap_status_update_tx.send(update) {
                tracing::warn!("Failed to send routing hint update: {}", e);
            }
        }
        Ok(())
    }

    async fn listen(&self, mut stream: Receiver<Transaction>) -> anyhow::Result<()> {
        loop {
            match stream.recv().await {
                Ok(tx) => {
                    if let Err(e) = self.process_transaction(tx).await {
                        tracing::error!("Failed to process transaction: {}", e);
                    }
                }
                Err(RecvError::Closed) => break,
                Err(RecvError::Lagged(skipped)) => {
                    tracing::warn!("Lagged behind by {} messages", skipped);
                }
            }
        }

        Ok(())
    }
}

#[cfg(test)]
mod test {

    use crate::{
        chain::{types::Type, utils::parse_transaction_hex},
        db::{helpers::reverse_swap::test::MockReverseSwapHelper, models::ReverseRoutingHint},
    };

    use super::*;

    const TEST_TX: &str = "010000000001019ea6632532afe2b57234829e8bb87c0586a2db0b37aa9378298c215e55c55b040000000000ffffffff02160b3600000000001600140e9aab3b924ad7f6c4813b1acad0441c655c9b5440420f000000000016001427001f1066a6f58e25f97ea1b353b3e56985fa8802473044022004637adf050dde916f66a9a169217a6c20c8107cd1a11189141cfed34d0e8897022059d1d8d9279152972f0e67d6b5a6ceec122b360214a6aac317888a1aef84e7de012103504290a1e9a3718103a93d40494af17af63dfa2a721d97cdc2cb526863f7055700000000";

    #[tokio::test]
    async fn test_listen() {
        // Create broadcast channels
        let (swap_status_update_tx, mut swap_status_update_rx) = broadcast::channel(256);
        let (tx_sender, tx_receiver) = broadcast::channel(256);

        let mut helper = MockReverseSwapHelper::new();

        helper.expect_get_routing_hints().returning(|_| {
            Ok(vec![ReverseRoutingHint {
                swapId: "123".to_string(),
                symbol: "BTC".to_string(),
                scriptPubkey: vec![0x01],
                blindingPubkey: None,
                params: None,
                signature: vec![],
            }])
        });

        let watcher = Arc::new(MrhWatcher::new(Arc::new(helper), swap_status_update_tx));

        let test_transaction = parse_transaction_hex(&Type::Bitcoin, TEST_TX).unwrap();

        let listen_handle = tokio::spawn(async move {
            watcher.clone().listen(tx_receiver).await.unwrap();
        });

        tx_sender.send(test_transaction.clone()).unwrap();

        let received_update = swap_status_update_rx.recv().await.unwrap();

        assert_eq!(received_update.id, "123");
        assert_eq!(received_update.status, "transaction.direct");
        assert!(received_update.transaction.is_some());

        let transaction_info = received_update.transaction.unwrap();
        assert_eq!(transaction_info.id, test_transaction.txid_hex());
        assert!(transaction_info.hex.is_some());
        assert_eq!(
            transaction_info.hex.unwrap(),
            test_transaction.serialize().to_lower_hex_string()
        );

        drop(tx_sender); // Close the sender to end the listen loop
        listen_handle.await.unwrap();
    }
}

use std::sync::Arc;

use bitcoin::hex::DisplayHex;
use futures::future::try_join_all;
use tokio::sync::broadcast::error::RecvError;
use tokio::sync::broadcast::{self, Receiver};
use tokio_util::sync::CancellationToken;

use crate::api::ws::types::{SwapStatus, TransactionInfo};
use crate::chain::Client;
use crate::chain::utils::Transaction;
use crate::currencies::Currencies;
use crate::db::helpers::reverse_swap::ReverseSwapHelper;
use crate::swap::SwapUpdate as SwapUpdateStatus;

#[derive(Clone)]
pub struct MrhWatcher {
    cancellation_token: CancellationToken,
    reverse_swap_helper: Arc<dyn ReverseSwapHelper + Send + Sync>,
    swap_status_update_tx: broadcast::Sender<SwapStatus>,
}

impl MrhWatcher {
    pub fn new(
        cancellation_token: CancellationToken,
        reverse_swap_helper: Arc<dyn ReverseSwapHelper + Send + Sync>,
        swap_status_update_tx: broadcast::Sender<SwapStatus>,
    ) -> Self {
        Self {
            cancellation_token,
            reverse_swap_helper,
            swap_status_update_tx,
        }
    }

    pub async fn start(self, currencies: &Currencies) {
        // Spawn one task for each currency and collect their handles
        let mut handles = Vec::new();

        for (_, currency) in currencies.iter() {
            if let Some(chain_client) = currency.chain.as_ref() {
                let chain_client = chain_client.clone();
                let stream = chain_client.tx_receiver();
                let watcher = self.clone();

                let handle = tokio::spawn(async move {
                    tracing::debug!(
                        "Listening to chain client {} for MRH updates",
                        chain_client.symbol()
                    );
                    if let Err(e) = watcher.listen(&chain_client, stream).await {
                        tracing::error!(
                            "Failed to listen to chain client {}: {}",
                            chain_client.symbol(),
                            e
                        );
                    }
                });
                handles.push(handle);
            }
        }

        if let Err(e) = try_join_all(handles).await {
            tracing::error!("MRH watcher failed: {}", e);
        }
    }

    async fn process_transaction(
        &self,
        chain_client: &Arc<dyn Client + Send + Sync>,
        tx: Transaction,
    ) -> anyhow::Result<()> {
        let output_scripts = tx.output_script_pubkeys();

        let routing_hints = self.reverse_swap_helper.get_routing_hints(output_scripts)?;
        for routing_hint in routing_hints {
            let tx = tx.clone();
            let chain_client = chain_client.clone();
            let swap_status_update_tx = self.swap_status_update_tx.clone();

            tokio::spawn(async move {
                match chain_client.zero_conf_safe(&tx).await {
                    Ok(true) => {}
                    _ => return,
                }

                let update = SwapStatus {
                    id: routing_hint.swapId.clone(),
                    status: SwapUpdateStatus::TransactionDirect.to_string(),
                    transaction: Some(TransactionInfo {
                        id: tx.txid_hex(),
                        hex: Some(tx.serialize().to_lower_hex_string()),
                        eta: None,
                    }),
                    ..Default::default()
                };

                if let Err(e) = swap_status_update_tx.send(update) {
                    tracing::warn!("Failed to send routing hint update: {}", e);
                }
            });
        }
        Ok(())
    }

    async fn listen(
        &self,
        chain_client: &Arc<dyn Client + Send + Sync>,
        mut stream: Receiver<(Transaction, bool)>,
    ) -> anyhow::Result<()> {
        loop {
            tokio::select! {
                tx = stream.recv() => {
                    match tx {
                        Ok((tx, confirmed)) => {
                            // The watcher is only about speeding up the detection of unconfirmed transactions
                            if confirmed {
                                continue;
                            }

                            if let Err(e) = self.process_transaction(chain_client, tx).await {
                                tracing::error!("Failed to process {} MRH transaction: {}", chain_client.symbol(), e);
                            }
                        }
                        Err(RecvError::Closed) => break,
                        Err(RecvError::Lagged(skipped)) => {
                            tracing::warn!("{} MRH transaction stream lagged behind by {} messages", chain_client.symbol(), skipped);
                        }
                    }
                },
                _ = self.cancellation_token.cancelled() => {
                    break;
                }
            }
        }

        Ok(())
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use crate::{
        chain::elements_client::test::get_client,
        chain::{types::Type, utils::parse_transaction_hex},
        db::{helpers::reverse_swap::test::MockReverseSwapHelper, models::ReverseRoutingHint},
        wallet::Network,
    };

    const TEST_TX: &str = "010000000001019ea6632532afe2b57234829e8bb87c0586a2db0b37aa9378298c215e55c55b040000000000ffffffff02160b3600000000001600140e9aab3b924ad7f6c4813b1acad0441c655c9b5440420f000000000016001427001f1066a6f58e25f97ea1b353b3e56985fa8802473044022004637adf050dde916f66a9a169217a6c20c8107cd1a11189141cfed34d0e8897022059d1d8d9279152972f0e67d6b5a6ceec122b360214a6aac317888a1aef84e7de012103504290a1e9a3718103a93d40494af17af63dfa2a721d97cdc2cb526863f7055700000000";

    #[tokio::test]
    async fn test_listen() {
        let (swap_status_update_tx, mut swap_status_update_rx) = broadcast::channel(256);
        let (tx_sender, tx_receiver) = broadcast::channel(256);

        let mut helper = MockReverseSwapHelper::new();

        helper.expect_get_routing_hints().returning(|_scripts| {
            assert_eq!(
                _scripts[0].to_lower_hex_string(),
                "00140e9aab3b924ad7f6c4813b1acad0441c655c9b54"
            );
            Ok(vec![ReverseRoutingHint {
                swapId: "123".to_string(),
                symbol: "BTC".to_string(),
                scriptPubkey: vec![],
                blindingPubkey: None,
                params: None,
                signature: vec![],
            }])
        });

        let cancellation_token = CancellationToken::new();
        let watcher = Arc::new(MrhWatcher::new(
            cancellation_token.clone(),
            Arc::new(helper),
            swap_status_update_tx,
        ));

        let test_transaction = parse_transaction_hex(&Type::Bitcoin, TEST_TX).unwrap();

        let listen_handle = tokio::spawn(async move {
            watcher
                .clone()
                .listen(&Arc::new(Box::new(get_client().0)), tx_receiver)
                .await
                .unwrap();
        });

        tx_sender.send((test_transaction.clone(), false)).unwrap();

        let received_update = swap_status_update_rx.recv().await.unwrap();

        assert_eq!(received_update.id, "123");
        assert_eq!(
            received_update.status,
            SwapUpdateStatus::TransactionDirect.to_string()
        );
        assert!(received_update.transaction.is_some());

        let transaction_info = received_update.transaction.unwrap();
        assert_eq!(transaction_info.id, test_transaction.txid_hex());
        assert!(transaction_info.hex.is_some());
        assert_eq!(
            transaction_info.hex.unwrap(),
            test_transaction.serialize().to_lower_hex_string()
        );

        cancellation_token.cancel();
        listen_handle.await.unwrap();
    }

    #[tokio::test]
    async fn test_listen_ignore_confirmed() {
        let (swap_status_update_tx, swap_status_update_rx) = broadcast::channel(256);
        let (tx_sender, tx_receiver) = broadcast::channel(256);

        let mut helper = MockReverseSwapHelper::new();

        helper.expect_get_routing_hints().returning(|_scripts| {
            assert_eq!(
                _scripts[0].to_lower_hex_string(),
                "00140e9aab3b924ad7f6c4813b1acad0441c655c9b54"
            );
            Ok(vec![ReverseRoutingHint {
                swapId: "123".to_string(),
                symbol: "BTC".to_string(),
                scriptPubkey: vec![],
                blindingPubkey: None,
                params: None,
                signature: vec![],
            }])
        });

        let cancellation_token = CancellationToken::new();
        let watcher = Arc::new(MrhWatcher::new(
            cancellation_token.clone(),
            Arc::new(helper),
            swap_status_update_tx,
        ));

        let test_transaction = parse_transaction_hex(&Type::Bitcoin, TEST_TX).unwrap();

        let listen_handle = tokio::spawn(async move {
            watcher
                .clone()
                .listen(&Arc::new(Box::new(get_client().0)), tx_receiver)
                .await
                .unwrap();
        });

        tx_sender.send((test_transaction.clone(), true)).unwrap();

        tokio::time::sleep(std::time::Duration::from_secs(1)).await;
        assert!(swap_status_update_rx.is_empty());

        cancellation_token.cancel();
        listen_handle.await.unwrap();
    }

    #[tokio::test]
    async fn test_listen_zero_conf_not_safe() {
        let (swap_status_update_tx, swap_status_update_rx) = broadcast::channel(256);
        let (tx_sender, tx_receiver) = broadcast::channel(256);

        let mut helper = MockReverseSwapHelper::new();

        helper.expect_get_routing_hints().returning(|_scripts| {
            assert_eq!(
                _scripts[0].to_lower_hex_string(),
                "00140e9aab3b924ad7f6c4813b1acad0441c655c9b54"
            );
            Ok(vec![ReverseRoutingHint {
                swapId: "123".to_string(),
                symbol: "BTC".to_string(),
                scriptPubkey: vec![],
                blindingPubkey: None,
                params: None,
                signature: vec![],
            }])
        });

        let cancellation_token = CancellationToken::new();
        let watcher = Arc::new(MrhWatcher::new(
            cancellation_token.clone(),
            Arc::new(helper),
            swap_status_update_tx,
        ));

        let test_transaction = parse_transaction_hex(&Type::Bitcoin, TEST_TX).unwrap();

        let listen_handle = tokio::spawn(async move {
            let mut client = get_client().0;
            client.set_network(Network::Testnet);

            watcher
                .clone()
                .listen(&Arc::new(Box::new(client)), tx_receiver)
                .await
                .unwrap();
        });

        tx_sender.send((test_transaction.clone(), false)).unwrap();

        tokio::time::sleep(std::time::Duration::from_secs(1)).await;
        assert!(swap_status_update_rx.is_empty());

        cancellation_token.cancel();
        listen_handle.await.unwrap();
    }
}

use super::utils::send_with_timeout;
use crate::api::ws::offer_subscriptions::ConnectionId;
use crate::api::ws::types::{FundingAddressUpdate, UpdateSender};
use dashmap::DashMap;
use std::sync::Arc;
use tokio::sync::broadcast::error::RecvError;
use tokio::sync::mpsc;
use tokio_util::sync::CancellationToken;

const SUBSCRIPTION_BUFFER: usize = 16;

type Subscriptions = (Vec<String>, mpsc::Sender<Vec<FundingAddressUpdate>>);

#[derive(Debug, Clone)]
pub struct FundingAddressSubscriptions {
    funding_addresses: Arc<DashMap<String, Vec<ConnectionId>>>,
    subscriptions: Arc<DashMap<ConnectionId, Subscriptions>>,
}

impl FundingAddressSubscriptions {
    pub fn new(
        cancellation_token: CancellationToken,
        funding_address_update_tx: UpdateSender<FundingAddressUpdate>,
    ) -> Self {
        let subscriptions = Self {
            funding_addresses: Arc::new(DashMap::new()),
            subscriptions: Arc::new(DashMap::new()),
        };

        subscriptions.forward_updates(cancellation_token, funding_address_update_tx);
        subscriptions
    }

    pub fn connection_known(&self, connection: ConnectionId) -> bool {
        self.subscriptions.contains_key(&connection)
    }

    pub fn connection_added(
        &self,
        connection: ConnectionId,
    ) -> mpsc::Receiver<Vec<FundingAddressUpdate>> {
        let (tx, rx) = mpsc::channel(SUBSCRIPTION_BUFFER);
        self.subscriptions
            .entry(connection)
            .insert((Vec::new(), tx));
        rx
    }

    pub fn subscription_added(&self, connection: ConnectionId, funding_address_ids: Vec<String>) {
        if let Some(mut sub) = self.subscriptions.get_mut(&connection) {
            for id in funding_address_ids {
                if !sub.0.contains(&id) {
                    sub.0.push(id.clone());
                }

                self.funding_addresses
                    .entry(id)
                    .and_modify(|connections| {
                        if !connections.contains(&connection) {
                            connections.push(connection);
                        }
                    })
                    .or_insert_with(|| vec![connection]);
            }
        }
    }

    pub fn subscription_removed(
        &self,
        connection: ConnectionId,
        funding_address_ids: Vec<String>,
    ) -> Vec<String> {
        if let Some(mut sub) = self.subscriptions.get_mut(&connection) {
            sub.0.retain(|id| !funding_address_ids.contains(id));

            for id in &funding_address_ids {
                if let Some(mut connections) = self.funding_addresses.get_mut(id) {
                    connections.retain(|c| *c != connection);
                }
            }

            self.funding_addresses
                .retain(|_, connections| !connections.is_empty());

            sub.0.clone()
        } else {
            Vec::new()
        }
    }

    pub fn connection_dropped(&self, connection: ConnectionId) {
        self.subscriptions.remove(&connection);
        self.funding_addresses.retain(|_, connections| {
            connections.retain(|c| *c != connection);
            !connections.is_empty()
        });
    }

    pub async fn inject_updates(
        &self,
        connection: ConnectionId,
        updates: Vec<FundingAddressUpdate>,
    ) {
        let to_send = self
            .subscriptions
            .get(&connection)
            .map(|sender| (sender.1.clone(), Self::filter_updates(&sender.0, &updates)));

        if let Some((tx, filtered)) = to_send {
            tokio::spawn(send_with_timeout(tx, filtered));
        }
    }

    fn forward_updates(
        &self,
        cancellation_token: CancellationToken,
        funding_address_update_tx: UpdateSender<FundingAddressUpdate>,
    ) {
        let mut update_rx = funding_address_update_tx.subscribe();

        let funding_addresses = self.funding_addresses.clone();
        let subscriptions = self.subscriptions.clone();

        tokio::spawn(async move {
            loop {
                let (connection_filter, updates) = tokio::select! {
                    msg = update_rx.recv() => {
                        match msg {
                            Ok(msg) => msg,
                            Err(RecvError::Closed) => {
                                tracing::debug!("Funding address update channel closed");
                                break;
                            }
                            Err(RecvError::Lagged(skipped)) => {
                                tracing::warn!("Funding address update channel lagged behind by {} messages", skipped);
                                continue;
                            }
                        }
                    }
                    _ = cancellation_token.cancelled() => {
                        tracing::debug!("Stopping funding address subscriptions forward loop");
                        break;
                    }
                };

                // When a specific connection requested that data, only forward to it
                if let Some(connection) = connection_filter {
                    if let Some(sender) = subscriptions.get(&connection) {
                        let filtered = Self::filter_updates(&sender.0, &updates);
                        let tx = sender.1.clone();
                        tokio::spawn(send_with_timeout(tx, filtered));
                    }
                    continue;
                }

                // Find all connections subscribed to these funding addresses
                for update in &updates {
                    if let Some(connections) = funding_addresses.get(&update.id) {
                        for &connection in connections.iter() {
                            if let Some(sender) = subscriptions.get(&connection) {
                                let tx = sender.1.clone();
                                tokio::spawn(send_with_timeout(tx, vec![update.clone()]));
                            }
                        }
                    }
                }
            }
        });
    }

    fn filter_updates(
        ids: &[String],
        updates: &[FundingAddressUpdate],
    ) -> Vec<FundingAddressUpdate> {
        updates
            .iter()
            .filter(|update| ids.contains(&update.id))
            .cloned()
            .collect()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::Duration;
    use tokio::sync::broadcast;

    type FundingAddressSubscription = (
        FundingAddressSubscriptions,
        UpdateSender<FundingAddressUpdate>,
        CancellationToken,
    );

    fn create_funding_address_update(id: &str, status: &str) -> FundingAddressUpdate {
        FundingAddressUpdate {
            id: id.to_string(),
            status: status.to_string(),
            transaction: None,
            swap_id: None,
        }
    }

    fn create_funding_address_subscriptions() -> FundingAddressSubscription {
        let (update_tx, _) = broadcast::channel(16);
        let cancellation_token = CancellationToken::new();
        let subscriptions =
            FundingAddressSubscriptions::new(cancellation_token.clone(), update_tx.clone());
        (subscriptions, update_tx, cancellation_token)
    }

    #[tokio::test]
    async fn test_new() {
        let (subscriptions, _, _) = create_funding_address_subscriptions();
        assert_eq!(subscriptions.funding_addresses.len(), 0);
        assert_eq!(subscriptions.subscriptions.len(), 0);
    }

    #[tokio::test]
    async fn test_connection_known() {
        let (subscriptions, _, _) = create_funding_address_subscriptions();
        let connection_id = 1;
        assert!(!subscriptions.connection_known(connection_id));
        let _ = subscriptions.connection_added(connection_id);
        assert!(subscriptions.connection_known(connection_id));

        assert!(subscriptions.subscriptions.contains_key(&connection_id));
        assert_eq!(
            subscriptions
                .subscriptions
                .get(&connection_id)
                .unwrap()
                .0
                .len(),
            0
        );
    }

    #[tokio::test]
    async fn test_subscription_added() {
        let (subscriptions, _, _) = create_funding_address_subscriptions();
        let connection_id = 1;
        let _ = subscriptions.connection_added(connection_id);

        subscriptions.subscription_added(connection_id, vec!["fa1".to_string(), "fa2".to_string()]);
        subscriptions.subscription_added(connection_id, vec!["fa2".to_string(), "fa3".to_string()]);

        let sub = subscriptions.subscriptions.get(&connection_id).unwrap();
        assert_eq!(sub.0.len(), 3);
        assert_eq!(sub.0.iter().filter(|id| *id == "fa2").count(), 1);
    }

    #[tokio::test]
    async fn test_subscription_added_populates_funding_addresses_map() {
        let (subscriptions, update_tx, _) = create_funding_address_subscriptions();
        let connection_id = 1;
        let mut rx = subscriptions.connection_added(connection_id);

        subscriptions.subscription_added(connection_id, vec!["fa1".to_string()]);

        tokio::time::sleep(Duration::from_millis(10)).await;

        let update = create_funding_address_update("fa1", "transaction.mempool");
        update_tx.send((None, vec![update.clone()])).unwrap();

        let result = tokio::time::timeout(Duration::from_millis(100), rx.recv()).await;

        let received = result
            .expect("Timeout waiting for update")
            .expect("Channel closed unexpectedly");
        assert_eq!(received.len(), 1);
        assert_eq!(received[0].id, "fa1");
    }

    #[tokio::test]
    async fn test_subscription_removed_removes_specified_ids() {
        let (subscriptions, _, _) = create_funding_address_subscriptions();
        let connection_id = 1;
        let _ = subscriptions.connection_added(connection_id);

        let ids = vec!["fa1".to_string(), "fa2".to_string(), "fa3".to_string()];
        subscriptions.subscription_added(connection_id, ids);

        let remaining = subscriptions.subscription_removed(connection_id, vec!["fa2".to_string()]);

        assert_eq!(remaining.len(), 2);
        assert!(remaining.contains(&"fa1".to_string()));
        assert!(remaining.contains(&"fa3".to_string()));
        assert!(!remaining.contains(&"fa2".to_string()));
    }

    #[tokio::test]
    async fn test_subscription_removed_cleans_up_empty_entries() {
        let (subscriptions, _, _) = create_funding_address_subscriptions();
        let connection_id = 1;
        let _ = subscriptions.connection_added(connection_id);

        subscriptions.subscription_added(connection_id, vec!["fa1".to_string()]);

        assert!(subscriptions.funding_addresses.contains_key("fa1"));

        subscriptions.subscription_removed(connection_id, vec!["fa1".to_string()]);

        assert!(!subscriptions.funding_addresses.contains_key("fa1"));
    }

    #[tokio::test]
    async fn test_connection_dropped_removes_connection() {
        let (subscriptions, _, _) = create_funding_address_subscriptions();
        let connection_id = 1;
        let _ = subscriptions.connection_added(connection_id);

        subscriptions.connection_dropped(connection_id);

        assert!(!subscriptions.subscriptions.contains_key(&connection_id));
    }

    #[tokio::test]
    async fn test_connection_dropped_removes_from_funding_addresses() {
        let (subscriptions, _, _) = create_funding_address_subscriptions();
        let connection_id_1 = 1;
        let connection_id_2 = 2;
        let _ = subscriptions.connection_added(connection_id_1);
        let _ = subscriptions.connection_added(connection_id_2);

        subscriptions
            .funding_addresses
            .insert("fa1".to_string(), vec![connection_id_1, connection_id_2]);

        subscriptions.connection_dropped(connection_id_1);

        let connections = subscriptions.funding_addresses.get("fa1").unwrap();
        assert_eq!(connections.len(), 1);
        assert!(connections.contains(&connection_id_2));
        assert!(!connections.contains(&connection_id_1));
    }

    #[tokio::test]
    async fn test_inject_updates_sends_filtered_updates() {
        let (subscriptions, _, _) = create_funding_address_subscriptions();
        let connection_id = 1;
        let mut rx = subscriptions.connection_added(connection_id);

        subscriptions.subscription_added(connection_id, vec!["fa1".to_string(), "fa2".to_string()]);

        let updates = vec![
            create_funding_address_update("fa1", "transaction.mempool"),
            create_funding_address_update("fa2", "transaction.confirmed"),
            create_funding_address_update("fa3", "created"),
        ];

        subscriptions.inject_updates(connection_id, updates).await;

        let received = rx.recv().await.unwrap();
        assert_eq!(received.len(), 2);
        assert!(received.iter().any(|u| u.id == "fa1"));
        assert!(received.iter().any(|u| u.id == "fa2"));
        assert!(!received.iter().any(|u| u.id == "fa3"));
    }

    #[test]
    fn test_filter_updates_returns_only_matching() {
        let ids = vec!["fa1".to_string(), "fa3".to_string()];
        let updates = vec![
            create_funding_address_update("fa1", "transaction.mempool"),
            create_funding_address_update("fa2", "transaction.confirmed"),
            create_funding_address_update("fa3", "created"),
        ];

        let filtered = FundingAddressSubscriptions::filter_updates(&ids, &updates);

        assert_eq!(filtered.len(), 2);
        assert!(filtered.iter().any(|u| u.id == "fa1"));
        assert!(filtered.iter().any(|u| u.id == "fa3"));
        assert!(!filtered.iter().any(|u| u.id == "fa2"));
    }

    #[test]
    fn test_filter_updates_returns_empty_when_no_matches() {
        let ids = vec!["fa1".to_string()];
        let updates = vec![
            create_funding_address_update("fa2", "transaction.mempool"),
            create_funding_address_update("fa3", "transaction.confirmed"),
        ];

        let filtered = FundingAddressSubscriptions::filter_updates(&ids, &updates);

        assert_eq!(filtered.len(), 0);
    }

    #[tokio::test]
    async fn test_multiple_connections_same_funding_address() {
        let (subscriptions, update_tx, _) = create_funding_address_subscriptions();
        let connection_id_1 = 1;
        let connection_id_2 = 2;
        let mut rx1 = subscriptions.connection_added(connection_id_1);
        let mut rx2 = subscriptions.connection_added(connection_id_2);

        subscriptions.subscription_added(connection_id_1, vec!["fa1".to_string()]);
        subscriptions.subscription_added(connection_id_2, vec!["fa1".to_string()]);

        tokio::time::sleep(Duration::from_millis(10)).await;

        let update = create_funding_address_update("fa1", "transaction.mempool");
        update_tx.send((None, vec![update])).unwrap();

        let received1 = tokio::time::timeout(Duration::from_millis(100), rx1.recv())
            .await
            .expect("Timeout waiting for update on connection 1")
            .expect("Channel closed");

        let received2 = tokio::time::timeout(Duration::from_millis(100), rx2.recv())
            .await
            .expect("Timeout waiting for update on connection 2")
            .expect("Channel closed");

        assert_eq!(received1.len(), 1);
        assert_eq!(received1[0].id, "fa1");
        assert_eq!(received2.len(), 1);
        assert_eq!(received2[0].id, "fa1");
    }

    #[tokio::test]
    async fn test_multiple_connections_different_subscriptions() {
        let (subscriptions, update_tx, _) = create_funding_address_subscriptions();
        let connection_id_1 = 1;
        let connection_id_2 = 2;
        let mut rx1 = subscriptions.connection_added(connection_id_1);
        let mut rx2 = subscriptions.connection_added(connection_id_2);

        subscriptions.subscription_added(connection_id_1, vec!["fa1".to_string()]);
        subscriptions.subscription_added(connection_id_2, vec!["fa2".to_string()]);

        tokio::time::sleep(Duration::from_millis(10)).await;

        // Send update for fa1
        let update1 = create_funding_address_update("fa1", "transaction.mempool");
        update_tx.send((None, vec![update1])).unwrap();

        // Send update for fa2
        let update2 = create_funding_address_update("fa2", "transaction.confirmed");
        update_tx.send((None, vec![update2])).unwrap();

        let received1 = tokio::time::timeout(Duration::from_millis(100), rx1.recv())
            .await
            .expect("Timeout waiting for update on connection 1")
            .expect("Channel closed");

        let received2 = tokio::time::timeout(Duration::from_millis(100), rx2.recv())
            .await
            .expect("Timeout waiting for update on connection 2")
            .expect("Channel closed");

        assert_eq!(received1.len(), 1);
        assert_eq!(received1[0].id, "fa1");
        assert_eq!(received2.len(), 1);
        assert_eq!(received2[0].id, "fa2");
    }
}

use super::utils::send_with_timeout;
use crate::api::ws::{
    offer_subscriptions::ConnectionId,
    types::{SwapStatus, UpdateSender},
};
use dashmap::DashMap;
use std::sync::Arc;
use tokio::sync::mpsc;
use tokio_util::sync::CancellationToken;

const SUBSCRIPTION_BUFFER: usize = 16;

type Subscriptions = (Vec<String>, mpsc::Sender<Vec<SwapStatus>>);

#[derive(Debug, Clone)]
pub struct StatusSubscriptions {
    swaps: Arc<DashMap<String, Vec<ConnectionId>>>,
    subscriptions: Arc<DashMap<ConnectionId, Subscriptions>>,
}

impl StatusSubscriptions {
    pub fn new(cancellation_token: CancellationToken, status_tx: UpdateSender<SwapStatus>) -> Self {
        let subscriptions = Self {
            swaps: Arc::new(DashMap::new()),
            subscriptions: Arc::new(DashMap::new()),
        };

        subscriptions.forward_updates(cancellation_token, status_tx);
        subscriptions
    }

    pub fn connection_known(&self, connection: ConnectionId) -> bool {
        self.subscriptions.contains_key(&connection)
    }

    pub fn connection_added(&self, connection: ConnectionId) -> mpsc::Receiver<Vec<SwapStatus>> {
        let (tx, rx) = mpsc::channel(SUBSCRIPTION_BUFFER);
        self.subscriptions
            .entry(connection)
            .insert((Vec::new(), tx));
        rx
    }

    pub fn subscription_added(&self, connection: ConnectionId, swap_ids: Vec<String>) {
        if let Some(mut sub) = self.subscriptions.get_mut(&connection) {
            for swap_id in swap_ids {
                if !sub.0.contains(&swap_id) {
                    sub.0.push(swap_id.clone());
                }

                self.swaps
                    .entry(swap_id)
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
        swap_ids: Vec<String>,
    ) -> Vec<String> {
        if let Some(mut sub) = self.subscriptions.get_mut(&connection) {
            sub.0.retain(|id| !swap_ids.contains(id));

            for swap_id in &swap_ids {
                if let Some(mut connections) = self.swaps.get_mut(swap_id) {
                    connections.retain(|id| *id != connection);
                }
            }

            self.swaps.retain(|_, connections| !connections.is_empty());

            sub.0.clone()
        } else {
            Vec::new()
        }
    }

    pub fn connection_dropped(&self, connection: ConnectionId) {
        self.subscriptions.remove(&connection);
        self.swaps.retain(|_, connections| {
            connections.retain(|id| *id != connection);
            !connections.is_empty()
        });
    }

    pub async fn inject_updates(&self, connection: ConnectionId, updates: Vec<SwapStatus>) {
        let to_send = self
            .subscriptions
            .get(&connection)
            .map(|sender| (sender.1.clone(), Self::filter_swaps(&sender.0, &updates)));

        if let Some((tx, filtered)) = to_send {
            tokio::spawn(send_with_timeout(tx, filtered));
        }
    }

    fn forward_updates(
        &self,
        cancellation_token: CancellationToken,
        status_tx: UpdateSender<SwapStatus>,
    ) {
        let mut status_tx = status_tx.subscribe();

        let swaps = self.swaps.clone();
        let subscriptions = self.subscriptions.clone();

        tokio::spawn(async move {
            loop {
                let (connection, updates) = tokio::select! {
                    msg = status_tx.recv() => {
                        match msg {
                            Ok(msg) => msg,
                            Err(err) => {
                                tracing::error!("Error receiving status update: {}", err);
                                continue;
                            }
                        }
                    }
                    _ = cancellation_token.cancelled() => {
                        tracing::debug!("Stopping status subscriptions forward loop");
                        break;
                    }
                };

                // When a specific connection requested that data, only forward to it
                if let Some(connection) = connection {
                    if let Some(sender) = subscriptions.get(&connection) {
                        let filtered = Self::filter_swaps(&sender.0, &updates);
                        let tx = sender.1.clone();
                        tokio::spawn(send_with_timeout(tx, filtered));
                    }
                    continue;
                }

                let mut relevant_ids = updates
                    .iter()
                    .flat_map(|update| swaps.get(&update.id).map(|connections| connections.clone()))
                    .flatten()
                    .collect::<Vec<_>>();
                relevant_ids.sort_unstable();
                relevant_ids.dedup();

                for connection in relevant_ids {
                    if let Some(sender) = subscriptions.get(&connection) {
                        let filtered = Self::filter_swaps(&sender.0, &updates);
                        let tx = sender.1.clone();
                        tokio::spawn(send_with_timeout(tx, filtered));
                    }
                }
            }
        });
    }

    fn filter_swaps(ids: &[String], updates: &[SwapStatus]) -> Vec<SwapStatus> {
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
    use crate::api::ws::types::SwapStatusNoId;
    use std::time::Duration;
    use tokio::sync::broadcast;

    type StatusSubscription = (
        StatusSubscriptions,
        UpdateSender<SwapStatus>,
        CancellationToken,
    );

    fn create_swap_status(id: &str, status: &str) -> SwapStatus {
        SwapStatus {
            id: id.to_string(),
            base: SwapStatusNoId {
                status: status.to_string(),
                ..Default::default()
            },
        }
    }

    fn create_status_subscriptions() -> StatusSubscription {
        let (status_tx, _) = broadcast::channel(16);
        let cancellation_token = CancellationToken::new();
        let subscriptions = StatusSubscriptions::new(cancellation_token.clone(), status_tx.clone());
        (subscriptions, status_tx, cancellation_token)
    }

    #[tokio::test]
    async fn test_new() {
        let (subscriptions, _, _) = create_status_subscriptions();
        assert_eq!(subscriptions.swaps.len(), 0);
        assert_eq!(subscriptions.subscriptions.len(), 0);
    }

    #[tokio::test]
    async fn test_connection_known_returns_false_for_unknown_connection() {
        let (subscriptions, _, _) = create_status_subscriptions();
        assert!(!subscriptions.connection_known(1));
    }

    #[tokio::test]
    async fn test_connection_known_returns_true_for_known_connection() {
        let (subscriptions, _, _) = create_status_subscriptions();
        let connection_id = 1;
        let _ = subscriptions.connection_added(connection_id);
        assert!(subscriptions.connection_known(connection_id));
    }

    #[tokio::test]
    async fn test_connection_added_creates_new_subscription() {
        let (subscriptions, _, _) = create_status_subscriptions();
        let connection_id = 1;

        let _rx = subscriptions.connection_added(connection_id);

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
    async fn test_connection_added_returns_receiver() {
        let (subscriptions, _, _) = create_status_subscriptions();
        let connection_id = 1;

        let mut rx = subscriptions.connection_added(connection_id);

        assert!(rx.try_recv().is_err());
    }

    #[tokio::test]
    async fn test_subscription_added_adds_swap_ids() {
        let (subscriptions, _, _) = create_status_subscriptions();
        let connection_id = 1;
        let _ = subscriptions.connection_added(connection_id);

        let swap_ids = vec!["swap1".to_string(), "swap2".to_string()];
        subscriptions.subscription_added(connection_id, swap_ids.clone());

        let sub = subscriptions.subscriptions.get(&connection_id).unwrap();
        assert_eq!(sub.0.len(), 2);
        assert!(sub.0.contains(&"swap1".to_string()));
        assert!(sub.0.contains(&"swap2".to_string()));
    }

    #[tokio::test]
    async fn test_subscription_added_extends_existing_swap_ids() {
        let (subscriptions, _, _) = create_status_subscriptions();
        let connection_id = 1;
        let _ = subscriptions.connection_added(connection_id);

        subscriptions.subscription_added(connection_id, vec!["swap1".to_string()]);
        subscriptions.subscription_added(
            connection_id,
            vec!["swap2".to_string(), "swap3".to_string()],
        );

        let sub = subscriptions.subscriptions.get(&connection_id).unwrap();
        assert_eq!(sub.0.len(), 3);
        assert!(sub.0.contains(&"swap1".to_string()));
        assert!(sub.0.contains(&"swap2".to_string()));
        assert!(sub.0.contains(&"swap3".to_string()));
    }

    #[tokio::test]
    async fn test_subscription_added_prevents_duplicates() {
        let (subscriptions, _, _) = create_status_subscriptions();
        let connection_id = 1;
        let _ = subscriptions.connection_added(connection_id);

        subscriptions.subscription_added(
            connection_id,
            vec!["swap1".to_string(), "swap2".to_string()],
        );
        subscriptions.subscription_added(
            connection_id,
            vec!["swap2".to_string(), "swap3".to_string()],
        );

        let sub = subscriptions.subscriptions.get(&connection_id).unwrap();
        assert_eq!(sub.0.len(), 3);
        assert!(sub.0.contains(&"swap1".to_string()));
        assert!(sub.0.contains(&"swap2".to_string()));
        assert!(sub.0.contains(&"swap3".to_string()));
        assert_eq!(sub.0.iter().filter(|id| *id == "swap2").count(), 1);
    }

    #[tokio::test]
    async fn test_subscription_added_does_nothing_for_unknown_connection() {
        let (subscriptions, _, _) = create_status_subscriptions();
        let connection_id = 1;

        subscriptions.subscription_added(connection_id, vec!["swap1".to_string()]);

        assert!(!subscriptions.subscriptions.contains_key(&connection_id));
    }

    #[tokio::test]
    async fn test_subscription_added_should_populate_swaps_map() {
        let (subscriptions, status_tx, _) = create_status_subscriptions();
        let connection_id = 1;
        let mut rx = subscriptions.connection_added(connection_id);

        subscriptions.subscription_added(connection_id, vec!["swap1".to_string()]);

        tokio::time::sleep(Duration::from_millis(10)).await;

        let updates = vec![
            create_swap_status("swap1", "transaction.mempool"),
            create_swap_status("swap2", "transaction.confirmed"),
        ];

        status_tx.send((None, updates)).unwrap();

        let result = tokio::time::timeout(Duration::from_millis(100), rx.recv()).await;

        let received = result
            .expect("Timeout waiting for update")
            .expect("Channel closed unexpectedly");
        assert_eq!(received.len(), 1);
        assert_eq!(received[0].id, "swap1");
    }

    #[tokio::test]
    async fn test_subscription_removed_removes_specified_swap_ids() {
        let (subscriptions, _, _) = create_status_subscriptions();
        let connection_id = 1;
        let _ = subscriptions.connection_added(connection_id);

        let swap_ids = vec![
            "swap1".to_string(),
            "swap2".to_string(),
            "swap3".to_string(),
        ];
        subscriptions.subscription_added(connection_id, swap_ids);

        let remaining =
            subscriptions.subscription_removed(connection_id, vec!["swap2".to_string()]);

        assert_eq!(remaining.len(), 2);
        assert!(remaining.contains(&"swap1".to_string()));
        assert!(remaining.contains(&"swap3".to_string()));
        assert!(!remaining.contains(&"swap2".to_string()));
    }

    #[tokio::test]
    async fn test_subscription_removed_returns_remaining_swap_ids() {
        let (subscriptions, _, _) = create_status_subscriptions();
        let connection_id = 1;
        let _ = subscriptions.connection_added(connection_id);

        subscriptions.subscription_added(
            connection_id,
            vec!["swap1".to_string(), "swap2".to_string()],
        );
        let remaining = subscriptions.subscription_removed(
            connection_id,
            vec!["swap1".to_string(), "swap2".to_string()],
        );

        assert_eq!(remaining.len(), 0);
    }

    #[tokio::test]
    async fn test_subscription_removed_returns_empty_for_unknown_connection() {
        let (subscriptions, _, _) = create_status_subscriptions();
        let connection_id = 1;

        let remaining =
            subscriptions.subscription_removed(connection_id, vec!["swap1".to_string()]);

        assert_eq!(remaining.len(), 0);
    }

    #[tokio::test]
    async fn test_subscription_removed_should_update_swaps_map() {
        let (subscriptions, status_tx, _) = create_status_subscriptions();
        let connection_id = 1;
        let mut rx = subscriptions.connection_added(connection_id);

        subscriptions.subscription_added(
            connection_id,
            vec!["swap1".to_string(), "swap2".to_string()],
        );

        subscriptions.subscription_removed(connection_id, vec!["swap1".to_string()]);

        tokio::time::sleep(Duration::from_millis(10)).await;

        let updates = vec![
            create_swap_status("swap1", "transaction.mempool"),
            create_swap_status("swap2", "transaction.confirmed"),
        ];

        status_tx.send((None, updates)).unwrap();

        let received = tokio::time::timeout(Duration::from_millis(100), rx.recv())
            .await
            .expect("Timeout waiting for update")
            .expect("Channel closed unexpectedly");
        assert_eq!(received.len(), 1);
        assert_eq!(received[0].id, "swap2");
    }

    #[tokio::test]
    async fn test_subscription_removed_cleans_up_empty_swap_entries() {
        let (subscriptions, _, _) = create_status_subscriptions();
        let connection_id = 1;
        let _ = subscriptions.connection_added(connection_id);

        subscriptions.subscription_added(connection_id, vec!["swap1".to_string()]);

        assert!(subscriptions.swaps.contains_key("swap1"));

        subscriptions.subscription_removed(connection_id, vec!["swap1".to_string()]);

        assert!(!subscriptions.swaps.contains_key("swap1"));
    }

    #[tokio::test]
    async fn test_swaps_map_tracks_multiple_connections_for_same_swap() {
        let (subscriptions, _, _) = create_status_subscriptions();
        let connection_id_1 = 1;
        let connection_id_2 = 2;
        let _ = subscriptions.connection_added(connection_id_1);
        let _ = subscriptions.connection_added(connection_id_2);

        subscriptions.subscription_added(connection_id_1, vec!["swap1".to_string()]);
        subscriptions.subscription_added(connection_id_2, vec!["swap1".to_string()]);

        let connections = subscriptions.swaps.get("swap1").unwrap();
        assert_eq!(connections.len(), 2);
        assert!(connections.contains(&connection_id_1));
        assert!(connections.contains(&connection_id_2));
        drop(connections);

        subscriptions.subscription_removed(connection_id_1, vec!["swap1".to_string()]);

        let connections = subscriptions.swaps.get("swap1").unwrap();
        assert_eq!(connections.len(), 1);
        assert!(connections.contains(&connection_id_2));
        assert!(!connections.contains(&connection_id_1));
        drop(connections);

        subscriptions.subscription_removed(connection_id_2, vec!["swap1".to_string()]);

        assert!(!subscriptions.swaps.contains_key("swap1"));
    }

    #[tokio::test]
    async fn test_connection_dropped_removes_connection() {
        let (subscriptions, _, _) = create_status_subscriptions();
        let connection_id = 1;
        let _ = subscriptions.connection_added(connection_id);

        subscriptions.connection_dropped(connection_id);

        assert!(!subscriptions.subscriptions.contains_key(&connection_id));
    }

    #[tokio::test]
    async fn test_connection_dropped_removes_connection_from_swaps() {
        let (subscriptions, _, _) = create_status_subscriptions();
        let connection_id_1 = 1;
        let connection_id_2 = 2;
        let _ = subscriptions.connection_added(connection_id_1);
        let _ = subscriptions.connection_added(connection_id_2);

        subscriptions
            .swaps
            .insert("swap1".to_string(), vec![connection_id_1, connection_id_2]);

        subscriptions.connection_dropped(connection_id_1);

        let swap_connections = subscriptions.swaps.get("swap1").unwrap();
        assert_eq!(swap_connections.len(), 1);
        assert!(swap_connections.contains(&connection_id_2));
        assert!(!swap_connections.contains(&connection_id_1));
    }

    #[tokio::test]
    async fn test_connection_dropped_removes_swap_entry_if_no_connections_left() {
        let (subscriptions, _, _) = create_status_subscriptions();
        let connection_id = 1;
        let _ = subscriptions.connection_added(connection_id);

        subscriptions
            .swaps
            .insert("swap1".to_string(), vec![connection_id]);

        subscriptions.connection_dropped(connection_id);

        assert!(!subscriptions.swaps.contains_key("swap1"));
    }

    #[tokio::test]
    async fn test_inject_updates_sends_filtered_updates() {
        let (subscriptions, _, _) = create_status_subscriptions();
        let connection_id = 1;
        let mut rx = subscriptions.connection_added(connection_id);

        subscriptions.subscription_added(
            connection_id,
            vec!["swap1".to_string(), "swap2".to_string()],
        );

        let updates = vec![
            create_swap_status("swap1", "transaction.mempool"),
            create_swap_status("swap2", "transaction.confirmed"),
            create_swap_status("swap3", "swap.created"),
        ];

        subscriptions.inject_updates(connection_id, updates).await;

        let received = rx.recv().await.unwrap();
        assert_eq!(received.len(), 2);
        assert!(received.iter().any(|s| s.id == "swap1"));
        assert!(received.iter().any(|s| s.id == "swap2"));
        assert!(!received.iter().any(|s| s.id == "swap3"));
    }

    #[tokio::test]
    async fn test_inject_updates_does_nothing_for_unknown_connection() {
        let (subscriptions, _, _) = create_status_subscriptions();
        let connection_id = 1;

        let updates = vec![create_swap_status("swap1", "transaction.mempool")];

        subscriptions.inject_updates(connection_id, updates).await;
    }

    #[tokio::test]
    async fn test_inject_updates_sends_empty_vec_when_no_matching_swaps() {
        let (subscriptions, _, _) = create_status_subscriptions();
        let connection_id = 1;
        let mut rx = subscriptions.connection_added(connection_id);

        subscriptions.subscription_added(connection_id, vec!["swap1".to_string()]);

        let updates = vec![create_swap_status("swap2", "transaction.mempool")];

        subscriptions.inject_updates(connection_id, updates).await;

        let received = rx.recv().await.unwrap();
        assert_eq!(received.len(), 0);
    }

    #[test]
    fn test_filter_swaps_returns_only_matching_swaps() {
        let ids = vec!["swap1".to_string(), "swap3".to_string()];
        let updates = vec![
            create_swap_status("swap1", "transaction.mempool"),
            create_swap_status("swap2", "transaction.confirmed"),
            create_swap_status("swap3", "swap.created"),
        ];

        let filtered = StatusSubscriptions::filter_swaps(&ids, &updates);

        assert_eq!(filtered.len(), 2);
        assert!(filtered.iter().any(|s| s.id == "swap1"));
        assert!(filtered.iter().any(|s| s.id == "swap3"));
        assert!(!filtered.iter().any(|s| s.id == "swap2"));
    }

    #[test]
    fn test_filter_swaps_returns_empty_when_no_matches() {
        let ids = vec!["swap1".to_string()];
        let updates = vec![
            create_swap_status("swap2", "transaction.mempool"),
            create_swap_status("swap3", "transaction.confirmed"),
        ];

        let filtered = StatusSubscriptions::filter_swaps(&ids, &updates);

        assert_eq!(filtered.len(), 0);
    }

    #[test]
    fn test_filter_swaps_returns_empty_when_ids_empty() {
        let ids = vec![];
        let updates = vec![
            create_swap_status("swap1", "transaction.mempool"),
            create_swap_status("swap2", "transaction.confirmed"),
        ];

        let filtered = StatusSubscriptions::filter_swaps(&ids, &updates);

        assert_eq!(filtered.len(), 0);
    }

    #[test]
    fn test_filter_swaps_returns_empty_when_updates_empty() {
        let ids = vec!["swap1".to_string()];
        let updates = vec![];

        let filtered = StatusSubscriptions::filter_swaps(&ids, &updates);

        assert_eq!(filtered.len(), 0);
    }

    #[tokio::test]
    async fn test_forward_updates_broadcasts_to_specific_connection() {
        let (subscriptions, status_tx, _) = create_status_subscriptions();
        let connection_id = 1;
        let mut rx = subscriptions.connection_added(connection_id);

        subscriptions.subscription_added(connection_id, vec!["swap1".to_string()]);

        tokio::time::sleep(Duration::from_millis(10)).await;

        let updates = vec![
            create_swap_status("swap1", "transaction.mempool"),
            create_swap_status("swap2", "transaction.confirmed"),
        ];

        status_tx
            .send((Some(connection_id), updates.clone()))
            .unwrap();

        let received = tokio::time::timeout(Duration::from_millis(100), rx.recv())
            .await
            .expect("Timeout waiting for update")
            .expect("Channel closed");

        assert_eq!(received.len(), 1);
        assert_eq!(received[0].id, "swap1");
    }

    #[tokio::test]
    async fn test_forward_updates_broadcasts_to_all_subscribed_connections() {
        let (subscriptions, status_tx, _) = create_status_subscriptions();
        let connection_id_1 = 1;
        let connection_id_2 = 2;
        let mut rx1 = subscriptions.connection_added(connection_id_1);
        let mut rx2 = subscriptions.connection_added(connection_id_2);

        subscriptions.subscription_added(connection_id_1, vec!["swap1".to_string()]);
        subscriptions.subscription_added(connection_id_2, vec!["swap1".to_string()]);

        tokio::time::sleep(Duration::from_millis(10)).await;

        let updates = vec![create_swap_status("swap1", "transaction.mempool")];

        status_tx.send((None, updates.clone())).unwrap();

        let received1 = tokio::time::timeout(Duration::from_millis(100), rx1.recv())
            .await
            .expect("Timeout waiting for update on connection 1")
            .expect("Channel closed");

        let received2 = tokio::time::timeout(Duration::from_millis(100), rx2.recv())
            .await
            .expect("Timeout waiting for update on connection 2")
            .expect("Channel closed");

        assert_eq!(received1.len(), 1);
        assert_eq!(received1[0].id, "swap1");
        assert_eq!(received2.len(), 1);
        assert_eq!(received2[0].id, "swap1");
    }

    #[tokio::test]
    async fn test_multiple_connections_different_subscriptions() {
        let (subscriptions, status_tx, _) = create_status_subscriptions();
        let connection_id_1 = 1;
        let connection_id_2 = 2;
        let mut rx1 = subscriptions.connection_added(connection_id_1);
        let mut rx2 = subscriptions.connection_added(connection_id_2);

        subscriptions.subscription_added(connection_id_1, vec!["swap1".to_string()]);
        subscriptions.subscription_added(connection_id_2, vec!["swap2".to_string()]);

        tokio::time::sleep(Duration::from_millis(10)).await;

        let updates = vec![
            create_swap_status("swap1", "transaction.mempool"),
            create_swap_status("swap2", "transaction.confirmed"),
        ];

        status_tx.send((None, updates)).unwrap();

        let received1 = tokio::time::timeout(Duration::from_millis(100), rx1.recv())
            .await
            .expect("Timeout waiting for update on connection 1")
            .expect("Channel closed");

        let received2 = tokio::time::timeout(Duration::from_millis(100), rx2.recv())
            .await
            .expect("Timeout waiting for update on connection 2")
            .expect("Channel closed");

        assert_eq!(received1.len(), 1);
        assert_eq!(received1[0].id, "swap1");
        assert_eq!(received2.len(), 1);
        assert_eq!(received2[0].id, "swap2");
    }
}

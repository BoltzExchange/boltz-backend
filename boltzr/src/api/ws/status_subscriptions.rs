use dashmap::DashMap;
use std::sync::Arc;
use tokio::sync::{broadcast, mpsc};
use tokio_util::sync::CancellationToken;

use crate::api::ws::{offer_subscriptions::ConnectionId, types::SwapStatus};

const SUBSCRIPTION_BUFFER: usize = 16;

#[derive(Debug, Clone)]
pub struct StatusSubscriptions {
    swaps: Arc<DashMap<String, Vec<ConnectionId>>>,
    subscriptions: Arc<DashMap<ConnectionId, (Vec<String>, mpsc::Sender<Vec<SwapStatus>>)>>,
}

impl StatusSubscriptions {
    pub fn new(
        cancellation_token: CancellationToken,
        status_tx: broadcast::Sender<(Option<u64>, Vec<SwapStatus>)>,
    ) -> Self {
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
            sub.0.extend(swap_ids);
        }
    }

    pub fn subscription_removed(
        &self,
        connection: ConnectionId,
        swap_ids: Vec<String>,
    ) -> Vec<String> {
        if let Some(mut sub) = self.subscriptions.get_mut(&connection) {
            sub.0.retain(|id| !swap_ids.contains(id));
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
        if let Some(sender) = self.subscriptions.get(&connection) {
            if let Err(err) = sender.1.send(Self::filter_swaps(&sender.0, &updates)).await {
                tracing::error!("Error injecting status updates: {}", err);
            }
        }
    }

    fn forward_updates(
        &self,
        cancellation_token: CancellationToken,
        status_tx: broadcast::Sender<(Option<u64>, Vec<SwapStatus>)>,
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
                        tokio::spawn(async move {
                            if let Err(err) = tx.send(filtered).await {
                                tracing::error!("Error sending status update: {}", err);
                            }
                        });
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
                        tokio::spawn(async move {
                            if let Err(err) = tx.send(filtered).await {
                                tracing::error!("Error sending status update: {}", err);
                            }
                        });
                    }
                }
            }
        });
    }

    fn filter_swaps(ids: &Vec<String>, updates: &Vec<SwapStatus>) -> Vec<SwapStatus> {
        updates
            .iter()
            .filter(|update| ids.contains(&update.id))
            .cloned()
            .collect()
    }
}

use crate::api::ws::status::SwapInfos;
use crate::grpc::service::boltzr::SwapUpdateResponse;
use async_trait::async_trait;
use dashmap::DashMap;
use std::cell::Cell;
use std::sync::Arc;
use tokio::sync::Mutex;
use tokio::sync::mpsc::Sender;
use tonic::Status;
use tracing::{trace, warn};

type StatusSender = Sender<Result<SwapUpdateResponse, Status>>;

#[derive(Clone)]
pub struct StatusFetcher {
    buffer: Arc<DashMap<u64, Vec<String>>>,

    sender: Arc<Mutex<Cell<Option<StatusSender>>>>,
}

impl StatusFetcher {
    pub fn new() -> Self {
        StatusFetcher {
            buffer: Arc::new(DashMap::new()),
            sender: Arc::new(Mutex::new(Cell::new(None))),
        }
    }

    pub async fn set_sender(&self, sender: Sender<Result<SwapUpdateResponse, Status>>) {
        for entry in self.buffer.iter() {
            if let Err(err) = sender
                .send(Ok(SwapUpdateResponse {
                    id: entry.key().to_string(),
                    swap_ids: entry.value().to_vec(),
                }))
                .await
            {
                warn!("Could not fetch status of buffered swaps: {}", err);
            }
        }
        self.buffer.clear();

        self.sender.lock().await.set(Some(sender));
    }
}

#[async_trait]
impl SwapInfos for StatusFetcher {
    async fn fetch_status_info(&self, connection: u64, ids: &[String]) {
        match self.sender.lock().await.get_mut() {
            Some(sender) => {
                if let Err(err) = sender
                    .send(Ok(SwapUpdateResponse {
                        id: connection.to_string(),
                        swap_ids: ids.to_vec(),
                    }))
                    .await
                {
                    warn!("Could not fetch status of swaps {:?}: {}", ids, err);
                };
            }
            None => {
                trace!(
                    "Buffering fetching of {} swap status updates because: backend not connected",
                    ids.len()
                );
                for id in ids {
                    self.buffer.entry(connection).or_default().push(id.clone());
                }
            }
        }
    }
}

#[cfg(test)]
mod test {
    use crate::api::ws::status::SwapInfos;
    use crate::grpc::service::boltzr::SwapUpdateResponse;
    use crate::grpc::status_fetcher::StatusFetcher;
    use tokio::sync::mpsc;

    #[tokio::test]
    async fn test_fetch_status_info() {
        let fetcher = StatusFetcher::new();

        let (tx, mut rx) = mpsc::channel(128);
        fetcher.set_sender(tx).await;

        let ids = ["1", "21", "n"]
            .iter()
            .map(|s| s.to_string())
            .collect::<Vec<String>>();

        let ids_clone = ids.clone();
        let fetcher_clone = fetcher.clone();

        let connection_id = 21;
        tokio::spawn(async move {
            fetcher_clone
                .fetch_status_info(connection_id, &ids_clone)
                .await;
        });

        let received = rx.recv().await;
        assert_eq!(
            received.unwrap().unwrap(),
            SwapUpdateResponse {
                id: connection_id.to_string(),
                swap_ids: ids
            }
        );
        assert!(fetcher.buffer.is_empty());
    }

    #[tokio::test]
    async fn test_buffered_ids() {
        let fetcher = StatusFetcher::new();

        let mut ids = ["2", "12", "i"]
            .iter()
            .map(|s| s.to_string())
            .collect::<Vec<String>>();

        let ids_clone = ids.clone();
        let fetcher_clone = fetcher.clone();

        let connection_id = 12;
        tokio::spawn(async move {
            fetcher_clone
                .fetch_status_info(connection_id, &ids_clone)
                .await;
        });

        tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
        assert_eq!(
            fetcher
                .buffer
                .iter()
                .fold(0, |acc, entry| { acc + entry.value().len() }),
            ids.len()
        );

        let (tx, mut rx) = mpsc::channel(128);
        fetcher.set_sender(tx).await;

        let received = rx.recv().await.unwrap().unwrap();
        assert_eq!(received.id, connection_id.to_string());

        let mut received_ids = received.swap_ids;
        assert_eq!(received_ids.len(), ids.len());

        received_ids.sort();
        ids.sort();
        assert_eq!(received_ids, ids);

        assert_eq!(fetcher.buffer.len(), 0);
    }
}

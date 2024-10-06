use crate::grpc::service::boltzr::SwapUpdateResponse;
use crate::ws::status::SwapInfos;
use async_trait::async_trait;
use dashmap::DashSet;
use std::cell::Cell;
use std::sync::Arc;
use tokio::sync::mpsc::Sender;
use tokio::sync::Mutex;
use tonic::Status;
use tracing::{trace, warn};

type StatusSender = Sender<Result<SwapUpdateResponse, Status>>;

#[derive(Clone)]
pub struct StatusFetcher {
    buffer: Arc<DashSet<String>>,

    sender: Arc<Mutex<Cell<Option<StatusSender>>>>,
}

impl StatusFetcher {
    pub fn new() -> Self {
        StatusFetcher {
            buffer: Arc::new(DashSet::new()),
            sender: Arc::new(Mutex::new(Cell::new(None))),
        }
    }

    pub async fn set_sender(&self, sender: Sender<Result<SwapUpdateResponse, Status>>) {
        let ids = self.buffered_ids().await;

        if !ids.is_empty() {
            if let Err(err) = sender.send(Ok(SwapUpdateResponse { ids })).await {
                warn!("Could not fetch status of buffered swaps: {}", err);
            };
        }

        self.sender.lock().await.set(Some(sender));
    }

    async fn buffered_ids(&self) -> Vec<String> {
        let ids = self.buffer.iter().map(|s| s.clone()).collect();
        self.buffer.clear();

        ids
    }
}

#[async_trait]
impl SwapInfos for StatusFetcher {
    async fn fetch_status_info(&self, ids: &[String]) {
        match self.sender.lock().await.get_mut() {
            Some(sender) => {
                if let Err(err) = sender
                    .send(Ok(SwapUpdateResponse { ids: ids.to_vec() }))
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
                    self.buffer.insert(id.clone());
                }
            }
        }
    }
}

#[cfg(test)]
mod test {
    use crate::grpc::service::boltzr::SwapUpdateResponse;
    use crate::grpc::status_fetcher::StatusFetcher;
    use crate::ws::status::SwapInfos;
    use tokio::sync::mpsc;

    #[tokio::test]
    async fn test_fetch_status_info() {
        let fetcher = StatusFetcher::new();

        let (tx, mut rx) = mpsc::channel(128);
        fetcher.set_sender(tx).await;

        let ids = vec!["1", "21", "n"]
            .iter()
            .map(|s| s.to_string())
            .collect::<Vec<String>>();

        let ids_clone = ids.clone();
        let fetcher_clone = fetcher.clone();
        tokio::spawn(async move {
            fetcher_clone.fetch_status_info(&ids_clone).await;
        });

        let received = rx.recv().await;
        assert_eq!(received.unwrap().unwrap(), SwapUpdateResponse { ids });
        assert!(fetcher.buffer.is_empty());
    }

    #[tokio::test]
    async fn test_buffered_ids() {
        let fetcher = StatusFetcher::new();

        let mut ids = vec!["2", "12", "i"]
            .iter()
            .map(|s| s.to_string())
            .collect::<Vec<String>>();

        let ids_clone = ids.clone();
        let fetcher_clone = fetcher.clone();
        tokio::spawn(async move {
            fetcher_clone.fetch_status_info(&ids_clone).await;
        });

        tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
        assert_eq!(fetcher.buffer.len(), ids.len());

        let (tx, mut rx) = mpsc::channel(128);
        fetcher.set_sender(tx).await;

        let received = rx.recv().await;
        let mut received_ids = received.unwrap().unwrap().ids;
        assert_eq!(received_ids.len(), ids.len());

        received_ids.sort();
        ids.sort();
        assert_eq!(received_ids, ids);

        assert_eq!(fetcher.buffer.len(), 0);
    }
}

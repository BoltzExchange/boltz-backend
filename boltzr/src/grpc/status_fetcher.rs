use crate::grpc::service::boltzr::SwapUpdateResponse;
use crate::ws::status::SwapInfos;
use async_trait::async_trait;
use std::cell::Cell;
use std::sync::Arc;
use tokio::sync::mpsc::Sender;
use tokio::sync::Mutex;
use tonic::Status;
use tracing::warn;

type StatusSender = Sender<Result<SwapUpdateResponse, Status>>;

#[derive(Clone)]
pub struct StatusFetcher {
    sender: Arc<Mutex<Cell<Option<StatusSender>>>>,
}

impl StatusFetcher {
    pub fn new() -> Self {
        StatusFetcher {
            sender: Arc::new(Mutex::new(Cell::new(None))),
        }
    }

    pub async fn set_sender(&self, sender: Sender<Result<SwapUpdateResponse, Status>>) {
        self.sender.lock().await.set(Some(sender))
    }
}

#[async_trait]
impl SwapInfos for StatusFetcher {
    async fn fetch_status_info(&self, ids: Vec<String>) {
        match self.sender.lock().await.get_mut() {
            Some(sender) => {
                if let Err(err) = sender
                    .send(Ok(SwapUpdateResponse { ids: ids.clone() }))
                    .await
                {
                    warn!("Could not fetch status of swaps {:?}: {}", ids, err);
                };
            }
            None => {
                warn!("Could not fetch status of swaps {:?}: no connection to backend was established", ids);
            }
        }
    }
}

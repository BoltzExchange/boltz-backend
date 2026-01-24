use crate::api::ws::status::{FundingAddressInfos, SwapInfos};
use crate::api::ws::types::{FundingAddressUpdate, SwapStatus, SwapStatusNoId};
use crate::cache::Cache;
use crate::grpc::service::boltzr::SwapUpdateResponse;
use anyhow::Result;
use async_trait::async_trait;
use dashmap::DashMap;
use std::cell::Cell;
use std::sync::Arc;
use tokio::sync::Mutex;
use tokio::sync::mpsc::Sender;
use tonic::Status;
use tracing::{trace, warn};

const CACHE_KEY_SWAP_UPDATE: &str = "swap:update";

type StatusSender = Sender<Result<SwapUpdateResponse, Status>>;

#[derive(Clone)]
pub struct StatusFetcher {
    cache: Cache,

    buffer: Arc<DashMap<u64, Vec<String>>>,

    sender: Arc<Mutex<Cell<Option<StatusSender>>>>,
}

impl StatusFetcher {
    pub fn new(cache: Cache) -> Self {
        StatusFetcher {
            cache,
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
    async fn fetch_status_info(
        &self,
        connection: u64,
        ids: Vec<String>,
    ) -> Result<Option<Vec<SwapStatus>>> {
        let cache_entries = self
            .cache
            .get_multiple::<SwapStatusNoId>(
                CACHE_KEY_SWAP_UPDATE,
                &ids.iter().map(|s| s.as_str()).collect::<Vec<_>>(),
            )
            .await
            .map(|entries| entries.into_iter().collect::<Option<Vec<_>>>())?;

        if let Some(cache_entries) = cache_entries {
            return Ok(Some(
                ids.into_iter()
                    .zip(cache_entries)
                    .map(|(id, entry)| SwapStatus { id, base: entry })
                    .collect(),
            ));
        }

        match self.sender.lock().await.get_mut() {
            Some(sender) => {
                if let Err(err) = sender
                    .send(Ok(SwapUpdateResponse {
                        id: connection.to_string(),
                        swap_ids: ids,
                    }))
                    .await
                {
                    warn!("Could not fetch status of swaps: {}", err);
                };
            }
            None => {
                trace!(
                    "Buffering fetching of {} swap status updates because: backend not connected",
                    ids.len()
                );
                for id in ids {
                    self.buffer.entry(connection).or_default().push(id);
                }
            }
        }

        Ok(None)
    }
}

#[async_trait]
impl FundingAddressInfos for StatusFetcher {
    async fn fetch_funding_address_info(
        &self,
        _connection: u64,
        _ids: Vec<String>,
    ) -> Result<Option<Vec<FundingAddressUpdate>>> {
        // TODO: Implement fetching funding address status from database
        // For now, return None to allow the subscription to complete
        // Updates will be sent when they occur through the broadcast channel
        Ok(None)
    }
}

#[cfg(test)]
mod test {
    use crate::api::ws::status::SwapInfos;
    use crate::cache::{Cache, MemCache};
    use crate::grpc::service::boltzr::SwapUpdateResponse;
    use crate::grpc::status_fetcher::{CACHE_KEY_SWAP_UPDATE, StatusFetcher};
    use tokio::sync::mpsc;

    #[tokio::test]
    async fn test_fetch_status_info() {
        let fetcher = StatusFetcher::new(Cache::Memory(MemCache::new()));

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
                .fetch_status_info(connection_id, ids_clone)
                .await
                .unwrap();
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
        let fetcher = StatusFetcher::new(Cache::Memory(MemCache::new()));

        let mut ids = ["2", "12", "i"]
            .iter()
            .map(|s| s.to_string())
            .collect::<Vec<String>>();

        let ids_clone = ids.clone();
        let fetcher_clone = fetcher.clone();

        let connection_id = 12;
        tokio::spawn(async move {
            fetcher_clone
                .fetch_status_info(connection_id, ids_clone)
                .await
                .unwrap();
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

    #[tokio::test]
    async fn test_cache_hit_all() {
        use crate::api::ws::types::SwapStatusNoId;

        let cache = Cache::Memory(MemCache::new());
        let fetcher = StatusFetcher::new(cache.clone());

        let ids = vec!["swap1".to_string(), "swap2".to_string()];

        // Populate cache
        let status1 = SwapStatusNoId {
            status: "transaction.mempool".to_string(),
            ..Default::default()
        };
        let status2 = SwapStatusNoId {
            status: "transaction.confirmed".to_string(),
            ..Default::default()
        };

        cache
            .set(CACHE_KEY_SWAP_UPDATE, "swap1", &status1, None)
            .await
            .unwrap();
        cache
            .set(CACHE_KEY_SWAP_UPDATE, "swap2", &status2, None)
            .await
            .unwrap();

        let (tx, mut rx) = mpsc::channel(128);
        fetcher.set_sender(tx).await;

        let connection_id = 1;
        let result = fetcher
            .fetch_status_info(connection_id, ids.clone())
            .await
            .unwrap();

        assert!(result.is_some());
        let statuses = result.unwrap();
        assert_eq!(statuses.len(), 2);
        assert_eq!(statuses[0].id, "swap1");
        assert_eq!(statuses[0].base.status, "transaction.mempool");
        assert_eq!(statuses[1].id, "swap2");
        assert_eq!(statuses[1].base.status, "transaction.confirmed");

        // Should not send message to channel
        tokio::time::sleep(tokio::time::Duration::from_millis(50)).await;
        assert!(rx.try_recv().is_err());
    }

    #[tokio::test]
    async fn test_cache_miss_all() {
        let cache = Cache::Memory(MemCache::new());
        let fetcher = StatusFetcher::new(cache.clone());

        let ids = vec!["swap1".to_string(), "swap2".to_string()];

        let (tx, mut rx) = mpsc::channel(128);
        fetcher.set_sender(tx).await;

        let connection_id = 1;
        let result = fetcher
            .fetch_status_info(connection_id, ids.clone())
            .await
            .unwrap();

        assert!(result.is_none());

        let received = rx.recv().await.unwrap().unwrap();
        assert_eq!(received.id, connection_id.to_string());
        assert_eq!(received.swap_ids, ids);
    }

    #[tokio::test]
    async fn test_cache_partial_hit() {
        use crate::api::ws::types::SwapStatusNoId;

        let cache = Cache::Memory(MemCache::new());
        let fetcher = StatusFetcher::new(cache.clone());

        let ids = vec!["swap1".to_string(), "swap2".to_string()];

        let status1 = SwapStatusNoId {
            status: "transaction.mempool".to_string(),
            ..Default::default()
        };

        cache
            .set(CACHE_KEY_SWAP_UPDATE, "swap1", &status1, None)
            .await
            .unwrap();

        let (tx, mut rx) = mpsc::channel(128);
        fetcher.set_sender(tx).await;

        let connection_id = 1;
        let result = fetcher
            .fetch_status_info(connection_id, ids.clone())
            .await
            .unwrap();

        assert!(result.is_none());

        let received = rx.recv().await.unwrap().unwrap();
        assert_eq!(received.id, connection_id.to_string());
        assert_eq!(received.swap_ids, ids);
    }

    #[tokio::test]
    async fn test_cache_hit_no_sender() {
        use crate::api::ws::types::SwapStatusNoId;

        let cache = Cache::Memory(MemCache::new());
        let fetcher = StatusFetcher::new(cache.clone());

        let ids = vec!["swap1".to_string()];

        let status1 = SwapStatusNoId {
            status: "swap.created".to_string(),
            ..Default::default()
        };

        cache
            .set(CACHE_KEY_SWAP_UPDATE, "swap1", &status1, None)
            .await
            .unwrap();

        let connection_id = 1;
        let result = fetcher
            .fetch_status_info(connection_id, ids.clone())
            .await
            .unwrap();

        assert!(result.is_some());
        let statuses = result.unwrap();
        assert_eq!(statuses.len(), 1);
        assert_eq!(statuses[0].id, "swap1");
        assert_eq!(statuses[0].base.status, "swap.created");

        // Buffer should be empty (no need to buffer cached results)
        assert!(fetcher.buffer.is_empty());
    }
}

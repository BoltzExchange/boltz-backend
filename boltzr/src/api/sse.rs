use crate::api::ServerState;
use crate::api::ws::status::SwapInfos;
use crate::api::ws::types::SwapStatus;
use crate::swap::manager::SwapManager;
use async_stream::try_stream;
use axum::response::sse::{Event, Sse};
use axum::{Extension, extract::Query};
use futures_util::stream::Stream;
use serde::Deserialize;
use std::convert::Infallible;
use std::hash::{DefaultHasher, Hash, Hasher};
use std::sync::Arc;
use tracing::{error, trace};

struct SseGuard;

impl Drop for SseGuard {
    fn drop(&mut self) {
        #[cfg(feature = "metrics")]
        metrics::gauge!(crate::metrics::SSE_OPEN_COUNT).decrement(1);
    }
}

#[derive(Deserialize, Debug)]
pub struct IdParams {
    pub id: String,
}

pub async fn sse_handler<S, M>(
    Extension(state): Extension<Arc<ServerState<S, M>>>,
    Query(params): Query<IdParams>,
) -> Sse<impl Stream<Item = Result<Event, Infallible>>>
where
    S: SwapInfos + Send + Sync + Clone + 'static,
    M: SwapManager + Send + Sync + 'static,
{
    trace!("New SSE status stream for swap: {}", params.id);

    #[cfg(feature = "metrics")]
    metrics::gauge!(crate::metrics::SSE_OPEN_COUNT).increment(1);

    let connection_id = sse_id(&params.id);
    let mut rx = state.swap_status_update_tx.subscribe();
    let initial_update = match state
        .swap_infos
        .fetch_status_info(connection_id, vec![params.id.clone()])
        .await
    {
        Ok(value) => value,
        Err(err) => {
            error!("Error fetching initial swap update for SSE: {}", err);
            None
        }
    };

    Sse::new(try_stream! {
        let _guard = SseGuard;

        if let Some(updates) = initial_update {
            for update in updates {
                if let Some(data) = serialize_update(&update) {
                    yield Event::default().data(data);
                }
            }
        }

        loop {
            match rx.recv().await {
                Ok((id, events)) => {
                    if id.is_some_and(|id| id != connection_id) {
                        continue;
                    }

                    for e in events {
                        if e.id != params.id {
                            continue;
                        }

                        if let Some(data) = serialize_update(&e) {
                            yield Event::default().data(data);
                        }
                    }
                },
                Err(err) => {
                    error!("Listening to swap updates failed: {}", err);
                    return;
                }
            }
        }
    })
}

fn serialize_update(update: &SwapStatus) -> Option<String> {
    match serde_json::to_string(update) {
        Ok(data) => Some(data),
        Err(err) => {
            error!("Could not serialize swap update: {}", err);
            None
        }
    }
}

fn sse_id(swap_id: &str) -> u64 {
    let mut hasher = DefaultHasher::new();
    format!("sse-{swap_id}").hash(&mut hasher);
    hasher.finish()
}

#[cfg(test)]
mod test {
    use super::*;
    use crate::api::test::start;
    use crate::api::ws::types::{SwapStatus, SwapStatusNoId};
    use eventsource_client::{Client, SSE};
    use futures_util::StreamExt;
    use tokio_util::sync::CancellationToken;

    #[tokio::test]
    async fn test_sse_handler() {
        let port = 13_002;
        let (cancel, status_tx) = start(port).await;

        let id = "swapId";
        let client = eventsource_client::ClientBuilder::for_url(
            format!("http://127.0.0.1:{port}/streamswapstatus?id={id}").as_str(),
        )
        .unwrap()
        .build();

        let mut count = 0;

        let mut stream = client.stream();
        while let Some(ev) = stream.next().await {
            if let SSE::Event(ev) = ev.unwrap() {
                if count == 0 {
                    assert_eq!(
                        serde_json::from_str::<SwapStatus>(ev.data.as_str()).unwrap(),
                        SwapStatus {
                            id: id.to_string(),
                            base: SwapStatusNoId {
                                status: "swap.created".to_string(),
                                ..Default::default()
                            },
                        }
                    );

                    status_tx
                        .send((
                            None,
                            vec![
                                SwapStatus {
                                    id: "ignored".to_string(),
                                    base: SwapStatusNoId {
                                        status: "ignored".to_string(),
                                        ..Default::default()
                                    },
                                },
                                SwapStatus {
                                    id: id.to_string(),
                                    base: SwapStatusNoId {
                                        status: "new.status".to_string(),
                                        ..Default::default()
                                    },
                                },
                            ],
                        ))
                        .unwrap();
                } else if count == 1 {
                    assert_eq!(
                        serde_json::from_str::<SwapStatus>(ev.data.as_str()).unwrap(),
                        SwapStatus {
                            id: id.to_string(),
                            base: SwapStatusNoId {
                                status: "new.status".to_string(),
                                ..Default::default()
                            },
                        }
                    );
                    break;
                }

                count += 1;
            }
        }

        cancel.cancel();
    }

    #[tokio::test]
    async fn test_sse_handler_id() {
        let port = 13_003;
        let (cancel, status_tx) = start(port).await;

        let id = "swapId";
        let client = eventsource_client::ClientBuilder::for_url(
            format!("http://127.0.0.1:{port}/streamswapstatus?id={id}").as_str(),
        )
        .unwrap()
        .build();

        let mut count = 0;

        let mut stream = client.stream();
        while let Some(ev) = stream.next().await {
            if let SSE::Event(ev) = ev.unwrap() {
                if count == 0 {
                    assert_eq!(
                        serde_json::from_str::<SwapStatus>(ev.data.as_str()).unwrap(),
                        SwapStatus {
                            id: id.to_string(),
                            base: SwapStatusNoId {
                                status: "swap.created".to_string(),
                                ..Default::default()
                            },
                        }
                    );

                    status_tx
                        .send((
                            Some(sse_id("different id")),
                            vec![SwapStatus {
                                id: id.to_string(),
                                base: SwapStatusNoId {
                                    status: "ignored".to_string(),
                                    ..Default::default()
                                },
                            }],
                        ))
                        .unwrap();

                    status_tx
                        .send((
                            Some(sse_id(id)),
                            vec![SwapStatus {
                                id: id.to_string(),
                                base: SwapStatusNoId {
                                    status: "new.status".to_string(),
                                    ..Default::default()
                                },
                            }],
                        ))
                        .unwrap();
                } else if count == 1 {
                    assert_eq!(
                        serde_json::from_str::<SwapStatus>(ev.data.as_str()).unwrap(),
                        SwapStatus {
                            id: id.to_string(),
                            base: SwapStatusNoId {
                                status: "new.status".to_string(),
                                ..Default::default()
                            },
                        }
                    );
                    break;
                }

                count += 1;
            }
        }

        cancel.cancel();
    }

    #[test]
    fn test_sse_id() {
        assert_eq!(sse_id("asdf"), sse_id("asdf"));
        assert_ne!(sse_id("asdf"), sse_id("other id"));
    }

    #[tokio::test]
    async fn test_sse_initial_update() {
        #[derive(Debug, Clone)]
        struct InitialUpdateFetcher {
            updates: Vec<SwapStatus>,
        }

        #[async_trait::async_trait]
        impl SwapInfos for InitialUpdateFetcher {
            async fn fetch_status_info(
                &self,
                _: u64,
                _: Vec<String>,
            ) -> anyhow::Result<Option<Vec<SwapStatus>>> {
                Ok(Some(self.updates.clone()))
            }
        }

        let port = 13_004;
        let (status_tx, _) = tokio::sync::broadcast::channel::<(Option<u64>, Vec<SwapStatus>)>(16);

        let initial_updates = vec![
            SwapStatus {
                id: "swap1".to_string(),
                base: SwapStatusNoId {
                    status: "swap.created".to_string(),
                    ..Default::default()
                },
            },
            SwapStatus {
                id: "swap1".to_string(),
                base: SwapStatusNoId {
                    status: "transaction.mempool".to_string(),
                    transaction: Some(crate::api::ws::types::TransactionInfo {
                        id: "txid123".to_string(),
                        hex: None,
                        eta: None,
                    }),
                    ..Default::default()
                },
            },
        ];

        let cancel = CancellationToken::new();
        let server = crate::api::Server::new(
            crate::api::Config {
                port,
                host: "127.0.0.1".to_string(),
            },
            cancel.clone(),
            Arc::new(crate::swap::manager::test::MockManager::new()),
            Arc::new(crate::service::Service::new_mocked_prometheus(false)),
            InitialUpdateFetcher {
                updates: initial_updates.clone(),
            },
            status_tx,
        );

        tokio::spawn(async move {
            #[cfg(feature = "metrics")]
            server.start(None).await.unwrap();
        });
        tokio::time::sleep(std::time::Duration::from_millis(100)).await;

        let id = "swap1";
        let client = eventsource_client::ClientBuilder::for_url(
            format!("http://127.0.0.1:{port}/streamswapstatus?id={id}").as_str(),
        )
        .unwrap()
        .build();

        let mut count = 0;
        let mut stream = client.stream();

        while let Some(ev) = stream.next().await {
            if let SSE::Event(ev) = ev.unwrap()
                && count < 2
            {
                let received: SwapStatus = serde_json::from_str(ev.data.as_str()).unwrap();
                assert_eq!(received, initial_updates[count]);
                count += 1;
                if count == 2 {
                    break;
                }
            }
        }

        assert_eq!(count, 2, "Should have received 2 initial updates");
        cancel.cancel();
    }

    #[tokio::test]
    async fn test_sse_initial_update_error() {
        #[derive(Debug, Clone)]
        struct ErrorFetcher;

        #[async_trait::async_trait]
        impl SwapInfos for ErrorFetcher {
            async fn fetch_status_info(
                &self,
                _: u64,
                _: Vec<String>,
            ) -> anyhow::Result<Option<Vec<SwapStatus>>> {
                Err(anyhow::anyhow!("Database error"))
            }
        }

        let port = 13_005;
        let (status_tx, _) = tokio::sync::broadcast::channel::<(Option<u64>, Vec<SwapStatus>)>(16);

        let cancel = CancellationToken::new();
        let server = crate::api::Server::new(
            crate::api::Config {
                port,
                host: "127.0.0.1".to_string(),
            },
            cancel.clone(),
            Arc::new(crate::swap::manager::test::MockManager::new()),
            Arc::new(crate::service::Service::new_mocked_prometheus(false)),
            ErrorFetcher,
            status_tx.clone(),
        );

        tokio::spawn(async move {
            #[cfg(feature = "metrics")]
            server.start(None).await.unwrap();

            #[cfg(not(feature = "metrics"))]
            server.start().await.unwrap();
        });
        tokio::time::sleep(std::time::Duration::from_millis(100)).await;

        let id = "swap1";
        let client = eventsource_client::ClientBuilder::for_url(
            format!("http://127.0.0.1:{port}/streamswapstatus?id={id}").as_str(),
        )
        .unwrap()
        .build();

        let update = SwapStatus {
            id: id.to_string(),
            base: crate::api::ws::types::SwapStatusNoId {
                status: "transaction.mempool".to_string(),
                ..Default::default()
            },
        };

        tokio::spawn(async move {
            tokio::time::sleep(std::time::Duration::from_millis(200)).await;
            status_tx.send((None, vec![update.clone()])).unwrap();
        });

        let mut stream = client.stream();
        let mut received_update = false;

        let timeout = tokio::time::timeout(std::time::Duration::from_secs(2), async {
            while let Some(ev) = stream.next().await {
                if let SSE::Event(ev) = ev.unwrap() {
                    let received: SwapStatus = serde_json::from_str(ev.data.as_str()).unwrap();
                    if received.base.status == "transaction.mempool" {
                        received_update = true;
                        break;
                    }
                }
            }
        })
        .await;

        assert!(timeout.is_ok(), "Timeout waiting for update");
        assert!(
            received_update,
            "Should have received update from channel despite initial fetch error"
        );
        cancel.cancel();
    }
}

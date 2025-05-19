use crate::api::ServerState;
use crate::api::ws::status::SwapInfos;
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
    state
        .swap_infos
        .fetch_status_info(connection_id, &[params.id.clone()])
        .await;

    Sse::new(try_stream! {
        let _guard = SseGuard;

        loop {
            match rx.recv().await {
                Ok((id, events)) => {
                    if let Some(event_id) = id {
                        if event_id != connection_id {
                            continue;
                        }
                    }

                    for e in events {
                        if e.id != params.id {
                            continue;
                        }

                        let data = match serde_json::to_string(&e) {
                            Ok(data) => data,
                            Err(err) => {
                                error!("Could not serialize swap update: {}", err);
                                continue;
                            }
                        };

                        yield Event::default().data(data);
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

fn sse_id(swap_id: &str) -> u64 {
    let mut hasher = DefaultHasher::new();
    format!("sse-{}", swap_id).hash(&mut hasher);
    hasher.finish()
}

#[cfg(test)]
mod test {
    use super::*;
    use crate::api::test::start;
    use crate::api::ws::types::SwapStatus;
    use eventsource_client::{Client, SSE};
    use futures_util::StreamExt;

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
                            status: "swap.created".to_string(),
                            zero_conf_rejected: None,
                            transaction: None,
                            failure_reason: None,
                            failure_details: None,
                            channel_info: None,
                        }
                    );

                    status_tx
                        .send((
                            None,
                            vec![
                                SwapStatus {
                                    id: "ignored".to_string(),
                                    status: "ignored".to_string(),
                                    zero_conf_rejected: None,
                                    transaction: None,
                                    failure_reason: None,
                                    failure_details: None,
                                    channel_info: None,
                                },
                                SwapStatus {
                                    id: id.to_string(),
                                    status: "new.status".to_string(),
                                    zero_conf_rejected: None,
                                    transaction: None,
                                    failure_reason: None,
                                    failure_details: None,
                                    channel_info: None,
                                },
                            ],
                        ))
                        .unwrap();
                } else if count == 1 {
                    assert_eq!(
                        serde_json::from_str::<SwapStatus>(ev.data.as_str()).unwrap(),
                        SwapStatus {
                            id: id.to_string(),
                            status: "new.status".to_string(),
                            zero_conf_rejected: None,
                            transaction: None,
                            failure_reason: None,
                            failure_details: None,
                            channel_info: None,
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
                            status: "swap.created".to_string(),
                            zero_conf_rejected: None,
                            transaction: None,
                            failure_reason: None,
                            failure_details: None,
                            channel_info: None,
                        }
                    );

                    status_tx
                        .send((
                            Some(sse_id("different id")),
                            vec![SwapStatus {
                                id: id.to_string(),
                                status: "ignored".to_string(),
                                zero_conf_rejected: None,
                                transaction: None,
                                failure_reason: None,
                                failure_details: None,
                                channel_info: None,
                            }],
                        ))
                        .unwrap();

                    status_tx
                        .send((
                            Some(sse_id(id)),
                            vec![SwapStatus {
                                id: id.to_string(),
                                status: "new.status".to_string(),
                                zero_conf_rejected: None,
                                transaction: None,
                                failure_reason: None,
                                failure_details: None,
                                channel_info: None,
                            }],
                        ))
                        .unwrap();
                } else if count == 1 {
                    assert_eq!(
                        serde_json::from_str::<SwapStatus>(ev.data.as_str()).unwrap(),
                        SwapStatus {
                            id: id.to_string(),
                            status: "new.status".to_string(),
                            zero_conf_rejected: None,
                            transaction: None,
                            failure_reason: None,
                            failure_details: None,
                            channel_info: None,
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
}

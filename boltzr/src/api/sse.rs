use crate::api::ws::status::SwapInfos;
use crate::api::ServerState;
use async_stream::try_stream;
use axum::response::sse::{Event, Sse};
use axum::{extract::Query, Extension};
use futures_util::stream::Stream;
use serde::Deserialize;
use std::convert::Infallible;
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

pub async fn sse_handler<S>(
    Extension(state): Extension<Arc<ServerState<S>>>,
    Query(params): Query<IdParams>,
) -> Sse<impl Stream<Item = Result<Event, Infallible>>>
where
    S: SwapInfos + Send + Sync + Clone + 'static,
{
    trace!("New SSE status stream for swap: {}", params.id);

    #[cfg(feature = "metrics")]
    metrics::gauge!(crate::metrics::SSE_OPEN_COUNT).increment(1);

    let mut rx = state.swap_status_update_tx.subscribe();
    state
        .swap_infos
        .fetch_status_info(&[params.id.clone()])
        .await;

    Sse::new(try_stream! {
        let _guard = SseGuard;

        loop {
            match rx.recv().await {
                Ok(events) => {
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

#[cfg(test)]
mod test {
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
            format!("http://127.0.0.1:{}/streamswapstatus?id={}", port, id).as_str(),
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
                        .send(vec![
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
                        ])
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
}

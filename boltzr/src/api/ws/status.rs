use async_trait::async_trait;
use async_tungstenite::tokio::accept_async;
use async_tungstenite::tungstenite::Message;
use futures::{SinkExt, StreamExt};
use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use std::error::Error;
use std::time::{Duration, SystemTime, SystemTimeError, UNIX_EPOCH};
use tokio::net::{TcpListener, TcpStream};
use tokio::time::Instant;
use tokio_util::sync::CancellationToken;
use tracing::{debug, error, info, trace, warn};

use crate::api::ws::types::SwapStatus;
use crate::api::ws::Config;

const PING_INTERVAL_SECS: u64 = 15;
const ACTIVITY_CHECK_INTERVAL_SECS: u64 = 60;

const ACTIVITY_TIMEOUT_SECS: u64 = 60 * 10;

#[async_trait]
pub trait SwapInfos {
    async fn fetch_status_info(&self, ids: &[String]);
}

struct WsConnectionGuard;

impl Drop for WsConnectionGuard {
    fn drop(&mut self) {
        trace!("Closing socket");

        #[cfg(feature = "metrics")]
        metrics::gauge!(crate::metrics::WEBSOCKET_OPEN_COUNT).decrement(1);
    }
}

#[derive(Serialize, Deserialize, PartialEq, Debug)]
struct ErrorResponse {
    error: String,
}

#[derive(Serialize, Deserialize, Debug, PartialEq)]
enum SubscriptionChannel {
    #[serde(rename = "swap.update")]
    SwapUpdate,
}

#[derive(Deserialize, Serialize, Debug, PartialEq)]
struct SubscribeRequest {
    channel: SubscriptionChannel,
    args: Vec<String>,
}

#[derive(Deserialize, Serialize, Debug, PartialEq)]
struct UnsubscribeRequest {
    channel: SubscriptionChannel,
    args: Vec<String>,
}

#[derive(Deserialize, Debug)]
#[serde(tag = "op")]
enum WsRequest {
    #[serde(rename = "subscribe")]
    Subscribe(SubscribeRequest),
    #[serde(rename = "unsubscribe")]
    Unsubscribe(UnsubscribeRequest),
}

#[derive(Deserialize, Serialize, Debug, PartialEq)]
struct SubscribeResponse {
    channel: SubscriptionChannel,
    args: Vec<String>,

    timestamp: String,
}

#[derive(Deserialize, Serialize, Debug, PartialEq)]
struct UnsubscribeResponse {
    channel: SubscriptionChannel,
    args: Vec<String>,

    timestamp: String,
}

#[derive(Deserialize, Serialize, Debug, PartialEq)]
struct UpdateResponse {
    channel: SubscriptionChannel,
    args: Vec<SwapStatus>,

    timestamp: String,
}

#[derive(Deserialize, Serialize, Debug, PartialEq)]
#[serde(tag = "event")]
enum WsResponse {
    #[serde(rename = "subscribe")]
    Subscribe(SubscribeResponse),
    #[serde(rename = "unsubscribe")]
    Unsubscribe(UnsubscribeResponse),
    #[serde(rename = "update")]
    Update(UpdateResponse),
}

#[derive(Debug, Clone)]
pub struct Status<S> {
    cancellation_token: CancellationToken,

    address: String,

    swap_infos: S,
    swap_status_update_tx: tokio::sync::broadcast::Sender<Vec<SwapStatus>>,
}

impl<S> Status<S>
where
    S: SwapInfos + Clone + Send + Sync + 'static,
{
    pub fn new(
        cancellation_token: CancellationToken,
        config: Config,
        swap_infos: S,
        swap_status_update_tx: tokio::sync::broadcast::Sender<Vec<SwapStatus>>,
    ) -> Self {
        Status {
            swap_infos,
            cancellation_token,
            swap_status_update_tx,
            address: format!("{}:{}", config.host, config.port),
        }
    }

    pub async fn start(&self) -> Result<(), Box<dyn Error>> {
        let listener = TcpListener::bind(self.address.as_str()).await?;
        info!("WebSocket listening on: {}", self.address);

        loop {
            tokio::select! {
                con = listener.accept() => {
                    match con {
                        Ok((stream, _)) => {
                            tokio::spawn(self.clone().accept_connection(stream));
                        },
                        Err(err) => {
                            warn!("Accepting WebSocket connection failed: {}", err);
                        }
                    }
                },
                _ = self.cancellation_token.cancelled() => {
                    info!("Shutting down WebSocket");
                    break;
                }
            }
        }

        Ok(())
    }

    async fn accept_connection(self, stream: TcpStream) {
        trace!(
            "New connection: {}",
            match stream.peer_addr() {
                Ok(peer) => {
                    peer.to_string()
                }
                Err(_) => {
                    "unknown address".to_string()
                }
            }
        );
        let ws_stream = match accept_async(stream).await {
            Ok(stream) => stream,
            Err(err) => {
                error!("Could not accept WebSocket connection: {}", err);
                return;
            }
        };

        #[cfg(feature = "metrics")]
        metrics::gauge!(crate::metrics::WEBSOCKET_OPEN_COUNT).increment(1);

        let _guard = WsConnectionGuard;

        let mut ping_interval = tokio::time::interval(Duration::from_secs(PING_INTERVAL_SECS));
        let mut activity_check_interval =
            tokio::time::interval(Duration::from_secs(ACTIVITY_CHECK_INTERVAL_SECS));
        let mut last_activity = Instant::now();

        let (mut ws_sender, mut ws_receiver) = ws_stream.split();

        let mut subscribed_ids = HashSet::<String>::new();

        let mut swap_status_update_rx = self.swap_status_update_tx.subscribe();

        loop {
            tokio::select! {
                msg = ws_receiver.next() => {
                    if let Some(msg) = msg {
                        let msg = match msg {
                            Ok(msg) => msg,
                            Err(err) => {
                                trace!("Could not receive message: {}", err);
                                break;
                            }
                        };

                        match msg {
                            Message::Text(msg) => {
                                last_activity = Instant::now();

                                let res = match self.handle_message(&mut subscribed_ids, msg.as_ref()).await {
                                    Ok(res) => res.map(|res| serde_json::to_string(&res)),
                                    Err(res) => Some(serde_json::to_string(&res)),
                                };

                                if let Some(res) = res {
                                    match res {
                                        Ok(res) => {
                                            if let Err(err) = ws_sender.send(Message::text(res)).await {
                                                trace!("Could not send message: {}", err);
                                            }
                                        },
                                        Err(err) => {
                                            trace!("Could not serialize message: {}", err);
                                            break;
                                        }
                                    }
                                }
                            },
                            Message::Ping(payload) => {
                                last_activity = Instant::now();

                                if let Err(err) = ws_sender.send(Message::Pong(payload)).await {
                                    trace!("Could not respond to ping: {}", err);
                                    break;
                                }
                            },
                            Message::Pong(_) => {
                                last_activity = Instant::now();
                            },
                            Message::Close(_) => {
                                break;
                            },
                            _ => {}
                        };
                    }
                },
                update = swap_status_update_rx.recv() => {
                    match update {
                        Ok(res) => {
                            let relevant_updates: Vec<SwapStatus> = res.iter().filter(|entry| {
                                subscribed_ids.contains(&entry.id)
                            }).cloned().collect();
                            if relevant_updates.is_empty() {
                                continue;
                            }

                            last_activity = Instant::now();

                            let timestamp = match Self::get_timestamp() {
                                Ok(res) => res,
                                Err(err) => {
                                    error!("Could not get UNIX time: {}", err);
                                    break;
                                }
                            };

                            let msg = match serde_json::to_string(&WsResponse::Update(UpdateResponse {
                                timestamp,
                                channel: SubscriptionChannel::SwapUpdate,
                                args: relevant_updates,
                            })) {
                                Ok(res) => res,
                                Err(err) => {
                                    error!("Could not serialize swap update: {}", err);
                                    break;
                                },
                            };
                            if let Err(err) = ws_sender.send(Message::text(msg)).await {
                                trace!("Could not send swap update: {}", err);
                                break;
                            }
                        },
                        Err(err) => {
                            error!("Listening to swap updates failed: {}", err);
                            break;
                        },
                    }
                },
                _ = ping_interval.tick() => {
                    trace!("Pinging WebSocket");
                    if let Err(err) = ws_sender.send(Message::Ping(bytes::Bytes::new())).await {
                        trace!("Could not send ping: {}", err);
                        break;
                    }
                },
                _ = activity_check_interval.tick() => {
                    trace!("Checking for WebSocket inactivity");
                    if Instant::now().duration_since(last_activity).as_secs() > ACTIVITY_TIMEOUT_SECS {
                        trace!("Inactivity timeout reached; closing WebSocket");
                        break;
                    }
                },
                _ = self.cancellation_token.cancelled() => {
                    break;
                },
            }
        }
    }

    async fn handle_message(
        &self,
        subscribed_ids: &mut HashSet<String>,
        msg: &[u8],
    ) -> Result<Option<WsResponse>, ErrorResponse> {
        let msg = match serde_json::from_slice::<WsRequest>(msg) {
            Ok(msg) => msg,
            Err(err) => {
                debug!("Could not parse message: {}", err);
                return Err(ErrorResponse {
                    error: "could not parse request".to_string(),
                });
            }
        };
        trace!("Got message: {:?}", msg);

        let get_timestamp = || match Self::get_timestamp() {
            Ok(res) => Some(res),
            Err(err) => {
                error!("Could not get UNIX time: {}", err);
                None
            }
        };

        match msg {
            WsRequest::Subscribe(sub) => match sub.channel {
                SubscriptionChannel::SwapUpdate => {
                    for id in &sub.args {
                        subscribed_ids.insert(id.clone());
                    }

                    self.swap_infos.fetch_status_info(&sub.args).await;

                    Ok(Some(WsResponse::Subscribe(SubscribeResponse {
                        timestamp: match get_timestamp() {
                            Some(time) => time,
                            None => return Ok(None),
                        },
                        args: sub.args,
                        channel: SubscriptionChannel::SwapUpdate,
                    })))
                }
            },
            WsRequest::Unsubscribe(unsub) => {
                for id in &unsub.args {
                    subscribed_ids.remove(id);
                }

                Ok(Some(WsResponse::Unsubscribe(UnsubscribeResponse {
                    timestamp: match get_timestamp() {
                        Some(time) => time,
                        None => return Ok(None),
                    },
                    channel: SubscriptionChannel::SwapUpdate,
                    args: subscribed_ids.iter().cloned().collect(),
                })))
            }
        }
    }

    fn get_timestamp() -> Result<String, SystemTimeError> {
        Ok(SystemTime::now()
            .duration_since(UNIX_EPOCH)?
            .as_millis()
            .to_string())
    }
}

#[cfg(test)]
mod status_test {
    use crate::api::ws::status::{
        ErrorResponse, Status, SubscriptionChannel, SwapInfos, WsResponse,
    };
    use crate::api::ws::types::SwapStatus;
    use crate::api::ws::Config;
    use async_trait::async_trait;
    use async_tungstenite::tungstenite::Message;
    use futures::{SinkExt, StreamExt};
    use serde_json::json;
    use std::time::{Duration, SystemTime, UNIX_EPOCH};
    use tokio::sync::broadcast::Sender;
    use tokio_util::sync::CancellationToken;

    #[derive(Debug, Clone)]
    struct Fetcher {
        status_tx: Sender<Vec<SwapStatus>>,
    }

    #[async_trait]
    impl SwapInfos for Fetcher {
        async fn fetch_status_info(&self, ids: &[String]) {
            let mut res = vec![SwapStatus::default(
                "not relevant".into(),
                "swap.created".into(),
            )];
            ids.iter().for_each(|id| {
                res.push(SwapStatus::default(id.clone(), "swap.created".into()));
            });

            self.status_tx.send(res).unwrap();
        }
    }

    impl SwapStatus {
        pub fn default(id: String, status: String) -> Self {
            SwapStatus {
                id,
                status,
                zero_conf_rejected: None,
                transaction: None,
                failure_reason: None,
                failure_details: None,
                channel_info: None,
            }
        }
    }

    #[tokio::test]
    async fn test_connect() {
        let port = 12_001;
        let (cancel, _) = create_server(port).await;

        async_tungstenite::tokio::connect_async(format!("ws://127.0.0.1:{}", port))
            .await
            .unwrap();
        cancel.cancel();
    }

    #[tokio::test]
    async fn test_respond_pings() {
        let port = 12_002;
        let (cancel, _) = create_server(port).await;

        let (client, _) =
            async_tungstenite::tokio::connect_async(format!("ws://127.0.0.1:{}", port))
                .await
                .unwrap();

        let (mut tx, mut rx) = client.split();

        tokio::spawn(async move {
            tx.send(Message::Ping(bytes::Bytes::new())).await.unwrap();
        });

        loop {
            let msg = rx.next().await.unwrap().unwrap();
            if msg.is_pong() {
                break;
            }
        }

        cancel.cancel();
    }

    #[tokio::test]
    async fn test_respond_invalid_message() {
        let port = 12_003;
        let (cancel, _) = create_server(port).await;

        let (client, _) =
            async_tungstenite::tokio::connect_async(format!("ws://127.0.0.1:{}", port))
                .await
                .unwrap();

        let (mut tx, mut rx) = client.split();

        tokio::spawn(async move {
            tx.send(Message::text("not json")).await.unwrap();
        });

        loop {
            let msg = rx.next().await.unwrap().unwrap();
            if !msg.is_text() {
                continue;
            }

            assert_eq!(
                serde_json::from_str::<ErrorResponse>(msg.to_text().unwrap()).unwrap(),
                ErrorResponse {
                    error: "could not parse request".to_string(),
                }
            );
            break;
        }

        cancel.cancel();
    }

    #[tokio::test]
    async fn test_send_existing_status() {
        let port = 12_004;
        let (cancel, _) = create_server(port).await;

        let (client, _) =
            async_tungstenite::tokio::connect_async(format!("ws://127.0.0.1:{}", port))
                .await
                .unwrap();

        let (mut tx, mut rx) = client.split();

        tokio::spawn(async move {
            tx.send(Message::text(
                json!({
                    "op": "subscribe",
                    "channel": "swap.update",
                    "args": vec!["some", "ids"],
                })
                .to_string(),
            ))
            .await
            .unwrap();
        });

        let mut is_first = true;

        loop {
            let msg = rx.next().await.unwrap().unwrap();
            if !msg.is_text() {
                continue;
            }

            let res = serde_json::from_str::<WsResponse>(msg.to_text().unwrap()).unwrap();
            if is_first {
                is_first = false;
                match res {
                    WsResponse::Subscribe(res) => {
                        assert_eq!(res.channel, SubscriptionChannel::SwapUpdate);
                        assert_eq!(res.args, vec!["some".to_string(), "ids".to_string(),]);
                        assert!(
                            res.timestamp.parse::<u128>().unwrap()
                                <= SystemTime::now()
                                    .duration_since(UNIX_EPOCH)
                                    .unwrap()
                                    .as_millis()
                        );
                    }
                    _ => {
                        panic!();
                    }
                };
            } else {
                match res {
                    WsResponse::Update(res) => {
                        assert_eq!(res.channel, SubscriptionChannel::SwapUpdate);
                        assert_eq!(
                            res.args,
                            vec![
                                SwapStatus::default("some".into(), "swap.created".into()),
                                SwapStatus::default("ids".into(), "swap.created".into()),
                            ]
                        );
                        assert!(
                            res.timestamp.parse::<u128>().unwrap()
                                <= SystemTime::now()
                                    .duration_since(UNIX_EPOCH)
                                    .unwrap()
                                    .as_millis()
                        );
                    }
                    _ => {
                        panic!();
                    }
                };
                break;
            }
        }

        cancel.cancel();
    }

    #[tokio::test]
    async fn test_send_update() {
        let port = 12_005;
        let (cancel, update_tx) = create_server(port).await;

        let (client, _) =
            async_tungstenite::tokio::connect_async(format!("ws://127.0.0.1:{}", port))
                .await
                .unwrap();

        let (mut tx, mut rx) = client.split();

        tokio::spawn(async move {
            tx.send(Message::text(
                json!({
                    "op": "subscribe",
                    "channel": "swap.update",
                    "args": vec!["some", "ids"],
                })
                .to_string(),
            ))
            .await
            .unwrap();

            tokio::time::sleep(Duration::from_millis(50)).await;
            update_tx
                .send(vec![SwapStatus::default(
                    "ids".into(),
                    "invoice.set".into(),
                )])
                .unwrap();
        });

        let mut count = 0;

        loop {
            let msg = rx.next().await.unwrap().unwrap();
            if !msg.is_text() {
                continue;
            }

            if count < 2 {
                count += 1;
                continue;
            }

            let res = serde_json::from_str::<WsResponse>(msg.to_text().unwrap()).unwrap();
            match res {
                WsResponse::Update(res) => {
                    assert_eq!(res.channel, SubscriptionChannel::SwapUpdate);
                    assert_eq!(
                        res.args,
                        vec![SwapStatus::default("ids".into(), "invoice.set".into())]
                    );
                    assert!(
                        res.timestamp.parse::<u128>().unwrap()
                            <= SystemTime::now()
                                .duration_since(UNIX_EPOCH)
                                .unwrap()
                                .as_millis()
                    );
                }
                _ => {
                    panic!();
                }
            };
            break;
        }

        cancel.cancel();
    }

    #[tokio::test]
    async fn test_unsubscribe() {
        let port = 12_006;
        let (cancel, update_tx) = create_server(port).await;

        let (client, _) =
            async_tungstenite::tokio::connect_async(format!("ws://127.0.0.1:{}", port))
                .await
                .unwrap();

        let (mut tx, mut rx) = client.split();

        tokio::spawn(async move {
            tx.send(Message::text(
                json!({
                    "op": "subscribe",
                    "channel": "swap.update",
                    "args": vec!["some", "ids"],
                })
                .to_string(),
            ))
            .await
            .unwrap();
            tokio::time::sleep(Duration::from_millis(50)).await;

            update_tx
                .send(vec![SwapStatus::default(
                    "ids".into(),
                    "invoice.set".into(),
                )])
                .unwrap();
            tokio::time::sleep(Duration::from_millis(50)).await;

            tx.send(Message::text(
                json!({
                    "op": "unsubscribe",
                    "channel": "swap.update",
                    "args": vec!["ids"],
                })
                .to_string(),
            ))
            .await
            .unwrap();
            tokio::time::sleep(Duration::from_millis(50)).await;

            update_tx
                .send(vec![SwapStatus::default(
                    "ids".into(),
                    "transaction.mempool".into(),
                )])
                .unwrap();
            tokio::time::sleep(Duration::from_millis(50)).await;

            cancel.cancel();
        });

        let mut update_count = 0;
        let mut unsubscribe_sent = false;

        loop {
            let msg = match rx.next().await {
                Some(msg) => match msg {
                    Ok(msg) => msg,
                    Err(_) => break,
                },
                None => continue,
            };
            if !msg.is_text() {
                continue;
            }

            let res = serde_json::from_str::<WsResponse>(msg.to_text().unwrap()).unwrap();

            match res {
                WsResponse::Update(_) => {
                    update_count += 1;
                }
                WsResponse::Unsubscribe(msg) => {
                    assert_eq!(msg.channel, SubscriptionChannel::SwapUpdate);
                    assert_eq!(msg.args, vec!["some".to_string()]);

                    unsubscribe_sent = true;
                }
                _ => {}
            }
        }

        assert!(unsubscribe_sent);

        // One for the initial update and one for the update that was sent before the unsubscribe
        assert_eq!(update_count, 2);
    }

    async fn create_server(port: u16) -> (CancellationToken, Sender<Vec<SwapStatus>>) {
        let cancel = CancellationToken::new();
        let (status_tx, _status_rx) = tokio::sync::broadcast::channel::<Vec<SwapStatus>>(1);

        let status = Status::new(
            cancel.clone(),
            Config {
                port,
                host: "127.0.0.1".to_string(),
            },
            Fetcher {
                status_tx: status_tx.clone(),
            },
            status_tx.clone(),
        );
        tokio::spawn(async move {
            status.start().await.unwrap();
        });
        tokio::time::sleep(Duration::from_millis(100)).await;

        (cancel, status_tx)
    }
}

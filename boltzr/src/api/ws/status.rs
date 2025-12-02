use crate::api::ws::Config;
use crate::api::ws::offer_subscriptions::{ConnectionId, InvoiceRequestParams};
use crate::api::ws::status_subscriptions::StatusSubscriptions;
use crate::api::ws::types::{FundingAddressUpdate, SwapStatus, UpdateSender};
use crate::webhook::InvoiceRequestCallData;
use async_trait::async_trait;
use async_tungstenite::tokio::accept_async;
use async_tungstenite::tungstenite::Message;
use futures::StreamExt;
use rand::Rng;
use serde::{Deserialize, Serialize};
use std::error::Error;
use std::sync::Arc;
use std::time::{Duration, SystemTime, SystemTimeError, UNIX_EPOCH};
use tokio::net::{TcpListener, TcpStream};
use tokio::time::Instant;
use tokio_util::sync::CancellationToken;
use tracing::{debug, error, info, trace, warn};

use super::{FundingAddressSubscriptions, OfferSubscriptions};

const PING_INTERVAL_SECS: u64 = 15;
const ACTIVITY_CHECK_INTERVAL_SECS: u64 = 60;

const ACTIVITY_TIMEOUT_SECS: u64 = 60 * 10;

#[async_trait]
pub trait SwapInfos {
    async fn fetch_status_info(
        &self,
        connection: u64,
        ids: Vec<String>,
    ) -> anyhow::Result<Option<Vec<SwapStatus>>>;
}

#[async_trait]
pub trait FundingAddressInfos {
    async fn fetch_funding_address_info(
        &self,
        connection: u64,
        ids: Vec<String>,
    ) -> anyhow::Result<Option<Vec<FundingAddressUpdate>>>;
}

struct WsConnectionGuard<'a> {
    connection_id: ConnectionId,
    status_subscriptions: &'a Arc<StatusSubscriptions>,
    offer_subscriptions: &'a Arc<OfferSubscriptions>,
    funding_address_subscriptions: &'a Arc<FundingAddressSubscriptions>,
}

impl Drop for WsConnectionGuard<'_> {
    fn drop(&mut self) {
        trace!("Closing socket {}", self.connection_id);

        self.status_subscriptions
            .connection_dropped(self.connection_id);
        self.offer_subscriptions
            .connection_dropped(self.connection_id);
        self.funding_address_subscriptions
            .connection_dropped(self.connection_id);

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
    #[serde(rename = "invoice.request")]
    InvoiceRequest,
    #[serde(rename = "funding.update")]
    FundingAddressUpdate,
}

#[derive(Serialize, Deserialize, Debug, PartialEq)]
#[serde(tag = "channel")]
enum SubscribeRequest {
    #[serde(rename = "swap.update")]
    SwapUpdate { args: Vec<String> },
    #[serde(rename = "invoice.request")]
    InvoiceRequest { args: Vec<InvoiceRequestParams> },
    #[serde(rename = "funding.update")]
    FundingAddressUpdate { args: Vec<String> },
}

#[derive(Deserialize, Serialize, Debug, PartialEq)]
struct UnsubscribeRequest {
    channel: SubscriptionChannel,
    args: Vec<String>,
}

#[derive(Deserialize, Serialize, Debug, PartialEq)]
struct InvoiceCreated {
    id: String,
    invoice: String,
}

#[derive(Deserialize, Serialize, Debug, PartialEq)]
struct InvoiceError {
    id: String,
    error: String,
}

#[derive(Deserialize, Debug)]
#[serde(tag = "op")]
enum WsRequest {
    #[serde(rename = "subscribe")]
    Subscribe(SubscribeRequest),
    #[serde(rename = "unsubscribe")]
    Unsubscribe(UnsubscribeRequest),
    #[serde(rename = "invoice")]
    Invoice(InvoiceCreated),
    #[serde(rename = "invoice.error")]
    InvoiceError(InvoiceError),
    #[serde(rename = "ping")]
    Ping,
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
struct UpdateResponse<T> {
    channel: SubscriptionChannel,
    args: Vec<T>,

    timestamp: String,
}

#[derive(Deserialize, Serialize, Debug, PartialEq)]
struct InvoiceRequest {
    id: String,
    #[serde(flatten)]
    data: InvoiceRequestCallData,
}

#[derive(Deserialize, Serialize, Debug, PartialEq)]
#[serde(tag = "event")]
enum WsResponse {
    #[serde(rename = "subscribe")]
    Subscribe(SubscribeResponse),
    #[serde(rename = "unsubscribe")]
    Unsubscribe(UnsubscribeResponse),
    #[serde(rename = "update")]
    Update(UpdateResponse<SwapStatus>),
    #[serde(rename = "update")]
    FundingUpdate(UpdateResponse<FundingAddressUpdate>),
    #[serde(rename = "request")]
    InvoiceRequest(UpdateResponse<InvoiceRequest>),
    #[serde(rename = "error")]
    Error(ErrorResponse),
    #[serde(rename = "pong")]
    Pong,
}

#[derive(Debug, Clone)]
pub struct Status<S> {
    cancellation_token: CancellationToken,

    address: String,

    swap_infos: S,

    status_subscriptions: Arc<StatusSubscriptions>,
    offer_subscriptions: Arc<OfferSubscriptions>,
    funding_address_subscriptions: Arc<FundingAddressSubscriptions>,
}

impl<S> Status<S>
where
    S: SwapInfos + FundingAddressInfos + Clone + Send + Sync + 'static,
{
    pub fn new(
        cancellation_token: CancellationToken,
        config: Config,
        swap_infos: S,
        swap_status_update_tx: UpdateSender<SwapStatus>,
        funding_address_update_tx: UpdateSender<FundingAddressUpdate>,
        offer_subscriptions: OfferSubscriptions,
    ) -> Self {
        Status {
            cancellation_token: cancellation_token.clone(),
            address: format!("{}:{}", config.host, config.port),
            swap_infos,
            status_subscriptions: Arc::new(StatusSubscriptions::new(
                cancellation_token.clone(),
                swap_status_update_tx,
            )),
            offer_subscriptions: Arc::new(offer_subscriptions),
            funding_address_subscriptions: Arc::new(FundingAddressSubscriptions::new(
                cancellation_token,
                funding_address_update_tx,
            )),
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
                debug!("Could not accept WebSocket connection: {}", err);
                return;
            }
        };

        #[cfg(feature = "metrics")]
        metrics::gauge!(crate::metrics::WEBSOCKET_OPEN_COUNT).increment(1);

        let connection_id = self.get_connection_id();

        let _guard = WsConnectionGuard {
            connection_id,
            status_subscriptions: &self.status_subscriptions,
            offer_subscriptions: &self.offer_subscriptions,
            funding_address_subscriptions: &self.funding_address_subscriptions,
        };

        let mut invoice_request_rx = self.offer_subscriptions.connection_added(connection_id);
        let mut swap_status_update_rx = self.status_subscriptions.connection_added(connection_id);
        let mut funding_address_update_rx = self
            .funding_address_subscriptions
            .connection_added(connection_id);

        let mut ping_interval = tokio::time::interval(Duration::from_secs(PING_INTERVAL_SECS));
        let mut activity_check_interval =
            tokio::time::interval(Duration::from_secs(ACTIVITY_CHECK_INTERVAL_SECS));
        let mut last_activity = Instant::now();

        let (mut ws_sender, mut ws_receiver) = ws_stream.split();

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

                                let res = match self.handle_message(connection_id, msg.as_ref()).await {
                                    Ok(res) => res.map(|res| serde_json::to_string(&res)),
                                    Err(res) => Some(serde_json::to_string(&res)),
                                };

                                if let Some(res) = res {
                                    match res {
                                        Ok(res) => {
                                            if let Err(err) = ws_sender.send(Message::text(res)).await {
                                                trace!("Could not send message: {}", err);
                                                break;
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
                        Some(updates) => {
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
                                args: updates,
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
                        None => {
                            error!("Swap update stream closed");
                            break;
                        },
                    }
                },
                invoice_request = invoice_request_rx.recv() => {
                    if let Some(invoice_request) = invoice_request {
                        last_activity = Instant::now();

                        let timestamp = match Self::get_timestamp() {
                            Ok(res) => res,
                            Err(err) => {
                                error!("Could not get UNIX time: {}", err);
                                break;
                            }
                        };

                        let msg = match serde_json::to_string(&WsResponse::InvoiceRequest(UpdateResponse {
                            timestamp,
                            channel: SubscriptionChannel::InvoiceRequest,
                            args: vec![InvoiceRequest {
                                id: invoice_request.id().to_string(),
                                data: InvoiceRequestCallData {
                                    offer: invoice_request.offer,
                                    invoice_request: invoice_request.invoice_request,
                                },
                            }],
                        })) {
                            Ok(res) => res,
                            Err(err) => {
                                error!("Could not serialize invoice request: {}", err);
                                break;
                            }
                        };

                        if let Err(err) = ws_sender.send(Message::text(msg)).await {
                            trace!("Could not send invoice request: {}", err);
                            break;
                        }
                    }
                },
                funding_address_update = funding_address_update_rx.recv() => {
                    match funding_address_update {
                        Some(updates) => {
                            last_activity = Instant::now();

                            let timestamp = match Self::get_timestamp() {
                                Ok(res) => res,
                                Err(err) => {
                                    error!("Could not get UNIX time: {}", err);
                                    break;
                                }
                            };

                            let msg = match serde_json::to_string(&WsResponse::FundingUpdate(UpdateResponse {
                                timestamp,
                                channel: SubscriptionChannel::FundingAddressUpdate,
                                args: updates,
                            })) {
                                Ok(res) => res,
                                Err(err) => {
                                    error!("Could not serialize funding address update: {}", err);
                                    break;
                                },
                            };
                            if let Err(err) = ws_sender.send(Message::text(msg)).await {
                                trace!("Could not send funding address update: {}", err);
                                break;
                            }
                        },
                        None => {
                            error!("Funding address update stream closed");
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
        connection_id: ConnectionId,
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
            WsRequest::Subscribe(sub) => match sub {
                SubscribeRequest::SwapUpdate { args } => {
                    self.status_subscriptions
                        .subscription_added(connection_id, args.clone());

                    // Cache hits we directly inject back into the connection
                    match self
                        .swap_infos
                        .fetch_status_info(connection_id, args.clone())
                        .await
                    {
                        Ok(Some(updates)) => {
                            self.status_subscriptions
                                .inject_updates(connection_id, updates)
                                .await;
                        }
                        Ok(None) => {}
                        Err(err) => {
                            tracing::warn!("Error fetching status info: {}", err);
                        }
                    }

                    Ok(Some(WsResponse::Subscribe(SubscribeResponse {
                        timestamp: match get_timestamp() {
                            Some(time) => time,
                            None => return Ok(None),
                        },
                        args,
                        channel: SubscriptionChannel::SwapUpdate,
                    })))
                }
                SubscribeRequest::InvoiceRequest { args } => {
                    if let Err(err) = self
                        .offer_subscriptions
                        .offers_subscribe(connection_id, &args)
                    {
                        return Ok(Some(WsResponse::Error(ErrorResponse {
                            error: format!("could not subscribe to offers: {err}"),
                        })));
                    }

                    Ok(Some(WsResponse::Subscribe(SubscribeResponse {
                        timestamp: match get_timestamp() {
                            Some(time) => time,
                            None => return Ok(None),
                        },
                        channel: SubscriptionChannel::InvoiceRequest,
                        args: args.into_iter().map(|arg| arg.offer).collect(),
                    })))
                }
                SubscribeRequest::FundingAddressUpdate { args } => {
                    self.funding_address_subscriptions
                        .subscription_added(connection_id, args.clone());

                    // Fetch and inject initial state for funding addresses
                    match self
                        .swap_infos
                        .fetch_funding_address_info(connection_id, args.clone())
                        .await
                    {
                        Ok(Some(updates)) => {
                            self.funding_address_subscriptions
                                .inject_updates(connection_id, updates)
                                .await;
                        }
                        Ok(None) => {}
                        Err(err) => {
                            tracing::warn!("Error fetching funding address info: {}", err);
                        }
                    }

                    Ok(Some(WsResponse::Subscribe(SubscribeResponse {
                        timestamp: match get_timestamp() {
                            Some(time) => time,
                            None => return Ok(None),
                        },
                        args,
                        channel: SubscriptionChannel::FundingAddressUpdate,
                    })))
                }
            },
            WsRequest::Invoice(invoice) => {
                match invoice.id.parse::<u64>() {
                    Ok(id) => self
                        .offer_subscriptions
                        .received_invoice_response(id, Ok(invoice.invoice)),
                    Err(err) => {
                        return Ok(Some(WsResponse::Error(ErrorResponse {
                            error: format!("invalid invoice id: {err}"),
                        })));
                    }
                };
                Ok(None)
            }
            WsRequest::InvoiceError(invoice_error) => {
                match invoice_error.id.parse::<u64>() {
                    Ok(id) => self
                        .offer_subscriptions
                        .received_invoice_response(id, Err(invoice_error.error)),
                    Err(err) => {
                        return Ok(Some(WsResponse::Error(ErrorResponse {
                            error: format!("invalid invoice id: {err}"),
                        })));
                    }
                };
                Ok(None)
            }
            WsRequest::Unsubscribe(unsub) => {
                let leftover_subscriptions = match unsub.channel {
                    SubscriptionChannel::SwapUpdate => self
                        .status_subscriptions
                        .subscription_removed(connection_id, unsub.args.clone()),
                    SubscriptionChannel::InvoiceRequest => {
                        match self
                            .offer_subscriptions
                            .offers_unsubscribe(connection_id, &unsub.args)
                        {
                            Ok(res) => res,
                            Err(err) => {
                                return Ok(Some(WsResponse::Error(ErrorResponse {
                                    error: format!("could not unsubscribe from offers: {err}"),
                                })));
                            }
                        }
                    }
                    SubscriptionChannel::FundingAddressUpdate => self
                        .funding_address_subscriptions
                        .subscription_removed(connection_id, unsub.args.clone()),
                };

                Ok(Some(WsResponse::Unsubscribe(UnsubscribeResponse {
                    timestamp: match get_timestamp() {
                        Some(time) => time,
                        None => return Ok(None),
                    },
                    channel: unsub.channel,
                    args: leftover_subscriptions,
                })))
            }
            WsRequest::Ping => Ok(Some(WsResponse::Pong)),
        }
    }

    fn get_connection_id(&self) -> ConnectionId {
        let mut rng = rand::thread_rng();

        loop {
            let id = rng.gen_range(0..=u64::MAX);
            if !self.status_subscriptions.connection_known(id)
                && !self.offer_subscriptions.connection_id_known(id)
                && !self.funding_address_subscriptions.connection_known(id)
            {
                return id;
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
        ErrorResponse, FundingAddressInfos, Status, SubscriptionChannel, SwapInfos, WsResponse,
    };
    use crate::api::ws::types::{FundingAddressUpdate, SwapStatus, SwapStatusNoId};
    use crate::api::ws::{Config, OfferSubscriptions};
    use async_trait::async_trait;
    use async_tungstenite::tungstenite::Message;
    use futures::StreamExt;
    use serde_json::json;
    use std::time::{Duration, SystemTime, UNIX_EPOCH};
    use tokio::sync::broadcast::Sender;
    use tokio_util::sync::CancellationToken;

    #[derive(Debug, Clone)]
    struct Fetcher {
        status_tx: Sender<(Option<u64>, Vec<SwapStatus>)>,
    }

    #[async_trait]
    impl SwapInfos for Fetcher {
        async fn fetch_status_info(
            &self,
            _: u64,
            ids: Vec<String>,
        ) -> anyhow::Result<Option<Vec<SwapStatus>>> {
            let mut res = vec![SwapStatus::default(
                "not relevant".into(),
                "swap.created".into(),
            )];
            ids.iter().for_each(|id| {
                res.push(SwapStatus::default(id.clone(), "swap.created".into()));
            });

            self.status_tx.send((None, res)).unwrap();
            Ok(None)
        }
    }

    #[async_trait]
    impl FundingAddressInfos for Fetcher {
        async fn fetch_funding_address_info(
            &self,
            _: u64,
            _ids: Vec<String>,
        ) -> anyhow::Result<Option<Vec<FundingAddressUpdate>>> {
            Ok(None)
        }
    }

    impl SwapStatus {
        pub fn default(id: String, status: String) -> Self {
            SwapStatus {
                id,
                base: SwapStatusNoId {
                    status,
                    ..Default::default()
                },
            }
        }
    }

    #[tokio::test]
    async fn test_connect() {
        let port = 12_001;
        let (cancel, _) = create_server(port).await;

        async_tungstenite::tokio::connect_async(format!("ws://127.0.0.1:{port}"))
            .await
            .unwrap();
        cancel.cancel();
    }

    #[tokio::test]
    async fn test_respond_pings() {
        let port = 12_002;
        let (cancel, _) = create_server(port).await;

        let (client, _) = async_tungstenite::tokio::connect_async(format!("ws://127.0.0.1:{port}"))
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
    async fn test_respond_app_level_pings() {
        let port = 12_003;
        let (cancel, _) = create_server(port).await;

        let (client, _) = async_tungstenite::tokio::connect_async(format!("ws://127.0.0.1:{port}"))
            .await
            .unwrap();

        let (mut tx, mut rx) = client.split();

        tokio::spawn(async move {
            tx.send(Message::text(
                json!({
                    "op": "ping",
                })
                .to_string(),
            ))
            .await
            .unwrap();
        });

        loop {
            let msg = rx.next().await.unwrap().unwrap();
            if !msg.is_text() {
                continue;
            }

            let res = serde_json::from_str::<WsResponse>(msg.to_text().unwrap()).unwrap();

            if let WsResponse::Pong = res {
                break;
            }
        }

        cancel.cancel();
    }

    #[tokio::test]
    async fn test_respond_invalid_message() {
        let port = 12_004;
        let (cancel, _) = create_server(port).await;

        let (client, _) = async_tungstenite::tokio::connect_async(format!("ws://127.0.0.1:{port}"))
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
        let port = 12_005;
        let (cancel, _) = create_server(port).await;

        let (client, _) = async_tungstenite::tokio::connect_async(format!("ws://127.0.0.1:{port}"))
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
        let port = 12_006;
        let (cancel, update_tx) = create_server(port).await;

        let (client, _) = async_tungstenite::tokio::connect_async(format!("ws://127.0.0.1:{port}"))
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
                .send((
                    None,
                    vec![SwapStatus::default("ids".into(), "invoice.set".into())],
                ))
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
    async fn test_send_update_connection_id() {
        let port = 12_007;
        let (cancel, update_tx) = create_server(port).await;

        let (client, _) = async_tungstenite::tokio::connect_async(format!("ws://127.0.0.1:{port}"))
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
                .send((
                    Some(123),
                    vec![SwapStatus::default("ids".into(), "ignored".into())],
                ))
                .unwrap();

            update_tx
                .send((
                    None,
                    vec![SwapStatus::default("ids".into(), "invoice.set".into())],
                ))
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
        let port = 12_008;
        let (cancel, update_tx) = create_server(port).await;

        let (client, _) = async_tungstenite::tokio::connect_async(format!("ws://127.0.0.1:{port}"))
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
                .send((
                    None,
                    vec![SwapStatus::default("ids".into(), "invoice.set".into())],
                ))
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
                .send((
                    None,
                    vec![SwapStatus::default(
                        "ids".into(),
                        "transaction.mempool".into(),
                    )],
                ))
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

    #[tokio::test]
    async fn test_cache_hit_with_updates() {
        #[derive(Debug, Clone)]
        struct CacheFetcher {
            updates: Vec<SwapStatus>,
        }

        #[async_trait]
        impl SwapInfos for CacheFetcher {
            async fn fetch_status_info(
                &self,
                _: u64,
                _ids: Vec<String>,
            ) -> anyhow::Result<Option<Vec<SwapStatus>>> {
                Ok(Some(self.updates.clone()))
            }
        }

        #[async_trait]
        impl FundingAddressInfos for CacheFetcher {
            async fn fetch_funding_address_info(
                &self,
                _: u64,
                _ids: Vec<String>,
            ) -> anyhow::Result<Option<Vec<FundingAddressUpdate>>> {
                Ok(None)
            }
        }

        let port = 12_009;
        let cancel = CancellationToken::new();
        let (status_tx, _status_rx) =
            tokio::sync::broadcast::channel::<(Option<u64>, Vec<SwapStatus>)>(16);
        let (funding_address_update_tx, _funding_address_rx) =
            tokio::sync::broadcast::channel::<(Option<u64>, Vec<FundingAddressUpdate>)>(16);

        let cached_updates = vec![
            SwapStatus::default("cached1".into(), "swap.created".into()),
            SwapStatus::default("cached2".into(), "invoice.set".into()),
        ];

        let status = Status::new(
            cancel.clone(),
            Config {
                port,
                host: "127.0.0.1".to_string(),
            },
            CacheFetcher {
                updates: cached_updates.clone(),
            },
            status_tx.clone(),
            funding_address_update_tx,
            OfferSubscriptions::new(crate::wallet::Network::Regtest),
        );
        tokio::spawn(async move {
            status.start().await.unwrap();
        });
        tokio::time::sleep(Duration::from_millis(100)).await;

        let (client, _) = async_tungstenite::tokio::connect_async(format!("ws://127.0.0.1:{port}"))
            .await
            .unwrap();

        let (mut tx, mut rx) = client.split();

        tokio::spawn(async move {
            tx.send(Message::text(
                json!({
                    "op": "subscribe",
                    "channel": "swap.update",
                    "args": vec!["cached1", "cached2"],
                })
                .to_string(),
            ))
            .await
            .unwrap();
        });

        let mut received_subscribe = false;
        let mut received_update = false;

        loop {
            let msg = match tokio::time::timeout(Duration::from_secs(2), rx.next()).await {
                Ok(Some(Ok(msg))) => msg,
                _ => break,
            };

            if !msg.is_text() {
                continue;
            }

            let res = serde_json::from_str::<WsResponse>(msg.to_text().unwrap()).unwrap();
            match res {
                WsResponse::Subscribe(res) => {
                    assert_eq!(res.channel, SubscriptionChannel::SwapUpdate);
                    assert_eq!(
                        res.args,
                        vec!["cached1".to_string(), "cached2".to_string(),]
                    );
                    received_subscribe = true;
                }
                WsResponse::Update(res) => {
                    assert_eq!(res.channel, SubscriptionChannel::SwapUpdate);
                    assert_eq!(res.args, cached_updates);
                    received_update = true;
                    break;
                }
                _ => {}
            }
        }

        assert!(received_subscribe);
        assert!(received_update);

        cancel.cancel();
    }

    #[tokio::test]
    async fn test_cache_hit_no_updates() {
        #[derive(Debug, Clone)]
        struct EmptyCacheFetcher;

        #[async_trait]
        impl SwapInfos for EmptyCacheFetcher {
            async fn fetch_status_info(
                &self,
                _: u64,
                _ids: Vec<String>,
            ) -> anyhow::Result<Option<Vec<SwapStatus>>> {
                Ok(None)
            }
        }

        #[async_trait]
        impl FundingAddressInfos for EmptyCacheFetcher {
            async fn fetch_funding_address_info(
                &self,
                _: u64,
                _ids: Vec<String>,
            ) -> anyhow::Result<Option<Vec<FundingAddressUpdate>>> {
                Ok(None)
            }
        }

        let port = 12_010;
        let cancel = CancellationToken::new();
        let (status_tx, _status_rx) =
            tokio::sync::broadcast::channel::<(Option<u64>, Vec<SwapStatus>)>(16);
        let (funding_address_update_tx, _funding_address_rx) =
            tokio::sync::broadcast::channel::<(Option<u64>, Vec<FundingAddressUpdate>)>(16);

        let status = Status::new(
            cancel.clone(),
            Config {
                port,
                host: "127.0.0.1".to_string(),
            },
            EmptyCacheFetcher,
            status_tx.clone(),
            funding_address_update_tx,
            OfferSubscriptions::new(crate::wallet::Network::Regtest),
        );
        tokio::spawn(async move {
            status.start().await.unwrap();
        });
        tokio::time::sleep(Duration::from_millis(100)).await;

        let (client, _) = async_tungstenite::tokio::connect_async(format!("ws://127.0.0.1:{port}"))
            .await
            .unwrap();

        let (mut tx, mut rx) = client.split();

        tokio::spawn(async move {
            tx.send(Message::text(
                json!({
                    "op": "subscribe",
                    "channel": "swap.update",
                    "args": vec!["test1"],
                })
                .to_string(),
            ))
            .await
            .unwrap();
        });

        let mut received_subscribe = false;
        let mut received_unexpected_update = false;

        loop {
            let msg = match tokio::time::timeout(Duration::from_millis(500), rx.next()).await {
                Ok(Some(Ok(msg))) => msg,
                _ => break,
            };

            if !msg.is_text() {
                continue;
            }

            let res = serde_json::from_str::<WsResponse>(msg.to_text().unwrap()).unwrap();
            match res {
                WsResponse::Subscribe(_) => {
                    received_subscribe = true;
                }
                WsResponse::Update(_) => {
                    received_unexpected_update = true;
                }
                _ => {}
            }
        }

        assert!(received_subscribe);
        assert!(!received_unexpected_update);

        cancel.cancel();
    }

    #[tokio::test]
    async fn test_cache_hit_fetch_error() {
        #[derive(Debug, Clone)]
        struct ErrorFetcher;

        #[async_trait]
        impl SwapInfos for ErrorFetcher {
            async fn fetch_status_info(
                &self,
                _: u64,
                _ids: Vec<String>,
            ) -> anyhow::Result<Option<Vec<SwapStatus>>> {
                Err(anyhow::anyhow!("simulated fetch error"))
            }
        }

        #[async_trait]
        impl FundingAddressInfos for ErrorFetcher {
            async fn fetch_funding_address_info(
                &self,
                _: u64,
                _ids: Vec<String>,
            ) -> anyhow::Result<Option<Vec<FundingAddressUpdate>>> {
                Ok(None)
            }
        }

        let port = 12_011;
        let cancel = CancellationToken::new();
        let (status_tx, _status_rx) =
            tokio::sync::broadcast::channel::<(Option<u64>, Vec<SwapStatus>)>(16);
        let (funding_address_update_tx, _funding_address_rx) =
            tokio::sync::broadcast::channel::<(Option<u64>, Vec<FundingAddressUpdate>)>(16);

        let status = Status::new(
            cancel.clone(),
            Config {
                port,
                host: "127.0.0.1".to_string(),
            },
            ErrorFetcher,
            status_tx.clone(),
            funding_address_update_tx,
            OfferSubscriptions::new(crate::wallet::Network::Regtest),
        );
        tokio::spawn(async move {
            status.start().await.unwrap();
        });
        tokio::time::sleep(Duration::from_millis(100)).await;

        let (client, _) = async_tungstenite::tokio::connect_async(format!("ws://127.0.0.1:{port}"))
            .await
            .unwrap();

        let (mut tx, mut rx) = client.split();

        tokio::spawn(async move {
            tx.send(Message::text(
                json!({
                    "op": "subscribe",
                    "channel": "swap.update",
                    "args": vec!["test1"],
                })
                .to_string(),
            ))
            .await
            .unwrap();
        });

        let mut received_subscribe = false;
        let mut received_unexpected_update = false;

        loop {
            let msg = match tokio::time::timeout(Duration::from_millis(500), rx.next()).await {
                Ok(Some(Ok(msg))) => msg,
                _ => break,
            };

            if !msg.is_text() {
                continue;
            }

            let res = serde_json::from_str::<WsResponse>(msg.to_text().unwrap()).unwrap();
            match res {
                WsResponse::Subscribe(_) => {
                    received_subscribe = true;
                }
                WsResponse::Update(_) => {
                    received_unexpected_update = true;
                }
                WsResponse::Error(_) => {
                    // The error should be logged, not returned to client
                    panic!("Should not receive error response");
                }
                _ => {}
            }
        }

        assert!(received_subscribe);
        assert!(!received_unexpected_update);

        cancel.cancel();
    }

    async fn create_server(
        port: u16,
    ) -> (CancellationToken, Sender<(Option<u64>, Vec<SwapStatus>)>) {
        let cancel = CancellationToken::new();
        let (status_tx, _status_rx) =
            tokio::sync::broadcast::channel::<(Option<u64>, Vec<SwapStatus>)>(16);
        let (funding_address_update_tx, _funding_address_rx) =
            tokio::sync::broadcast::channel::<(Option<u64>, Vec<FundingAddressUpdate>)>(16);

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
            funding_address_update_tx,
            OfferSubscriptions::new(crate::wallet::Network::Regtest),
        );
        tokio::spawn(async move {
            status.start().await.unwrap();
        });
        tokio::time::sleep(Duration::from_millis(100)).await;

        (cancel, status_tx)
    }
}

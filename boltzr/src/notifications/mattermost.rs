use crate::notifications::commands::CommandHandler;
use crate::notifications::utils::{contains_code_block, format_prefix, split_message, CODE_BLOCK};
use crate::notifications::{Config, NotificationClient};
use anyhow::anyhow;
use async_trait::async_trait;
use async_tungstenite::tungstenite::Message;
use futures::StreamExt;
use serde::de::DeserializeOwned;
use serde::{Deserialize, Serialize};
use serde_json::json;
use std::error::Error;
use std::fmt::{Display, Formatter};
use std::time::Duration;
use tokio_util::sync::CancellationToken;
use tracing::{debug, error, info, instrument, trace, warn};

const HEADER_AUTHORIZATION: &str = "Authorization";
const HEADER_BEARER: &str = "BEARER";

const WEBSOCKET_RECONNECT_INTERVAL_SECONDS: u64 = 15;

const MAX_MESSAGE_LENGTH: usize = 4_000;

#[derive(Debug)]
enum MattermostError {
    ChannelNotFound(String),
    WebSocketClosed,
}

impl Display for MattermostError {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        match self {
            MattermostError::ChannelNotFound(channel) => {
                write!(f, "could not find channel: {}", channel)
            }
            MattermostError::WebSocketClosed => {
                write!(f, "WebSocket closed")
            }
        }
    }
}

impl Error for MattermostError {}

#[derive(Deserialize, PartialEq, Clone, Debug)]
struct UserProfile {
    pub id: String,
    pub username: String,
}

#[derive(Deserialize, PartialEq, Clone, Debug)]
struct Channel {
    pub id: String,
    pub name: String,
    pub display_name: String,
}

#[derive(Serialize, Deserialize, PartialEq, Clone, Debug)]
struct Post {
    pub id: Option<String>,
    pub message: String,
    pub channel_id: String,
    pub user_id: Option<String>,
}

#[derive(Deserialize, Debug)]
struct WebSocketBroadcast {
    pub channel_id: String,
}

#[derive(Deserialize, Debug)]
struct WebSocketPost {
    pub post: String,
}

#[derive(Deserialize, Debug)]
struct WebSocketMessage<T> {
    pub data: T,
    pub broadcast: WebSocketBroadcast,
}

#[derive(Deserialize, Debug)]
#[serde(tag = "event")]
enum WebSocketEvent {
    #[serde(rename = "posted")]
    Posted(WebSocketMessage<WebSocketPost>),
}

#[derive(Clone, Debug)]
pub struct Client<C> {
    cancellation_token: CancellationToken,

    token: String,
    endpoint: String,
    prefix: Option<String>,

    user_id: String,

    channel_id: String,
    channel_id_alerts: Option<String>,

    msg_tx: tokio::sync::broadcast::Sender<String>,

    commands: C,
    alert_client: Option<crate::notifications::alerts::Client>,
}

impl<C> Client<C>
where
    C: CommandHandler + Send + Sync,
{
    #[instrument(name = "Mattermost::new", skip_all)]
    pub async fn new(
        cancellation_token: CancellationToken,
        config: Config,
        commands: C,
    ) -> anyhow::Result<Self> {
        let (msg_tx, _) = tokio::sync::broadcast::channel::<String>(128);

        let alert_client = match config.alert_webhook {
            Some(endpoint) => Some(crate::notifications::alerts::Client::new(endpoint)),
            None => {
                warn!("No alert endpoint configured");
                None
            }
        };

        let mut c = Client {
            msg_tx,
            commands,
            alert_client,
            cancellation_token,
            token: config.token,
            prefix: config.prefix,
            endpoint: config
                .mattermost_url
                .strip_suffix("/")
                .unwrap_or(config.mattermost_url.as_str())
                .to_string(),

            user_id: String::new(),
            channel_id: String::new(),
            channel_id_alerts: None,
        };

        debug!("Connecting to: {}", c.endpoint);

        let user_res = c.send_get_request::<UserProfile>("users/me").await?;
        c.user_id = user_res.id;
        info!("Connected as user: {}", user_res.username);

        let channels_res = c
            .send_get_request::<Vec<Channel>>("users/me/channels")
            .await?;

        c.channel_id = match Self::find_channel(&config.channel, &channels_res) {
            Some(chan) => chan,
            None => {
                return Err(anyhow!(
                    "{}",
                    MattermostError::ChannelNotFound(config.channel)
                ))
            }
        }
        .id
        .clone();

        if let Some(alerts) = config.channel_alert {
            match Self::find_channel(&alerts, &channels_res) {
                Some(channel) => {
                    c.channel_id_alerts = Some(channel.id.clone());
                }
                None => {
                    warn!("Could not find alert channel: {}", alerts);
                }
            }
        }

        Ok(c)
    }

    pub async fn listen(&self) {
        let url = self
            .format_endpoint("websocket")
            .replace("http://", "ws://")
            .replace("https://", "wss://");

        loop {
            match self.connect_websocket(&url).await {
                // When the connection exits gracefully, we do not try to reconnect
                Ok(_) => break,
                Err(err) => {
                    warn!("WebSocket connection closed: {}", err);

                    let sleep_duration = Duration::from_secs(WEBSOCKET_RECONNECT_INTERVAL_SECONDS);
                    info!("Reconnecting to WebSocket in: {:#?}", sleep_duration);
                    tokio::time::sleep(sleep_duration).await;
                }
            };
        }
    }

    async fn connect_websocket(&self, url: &String) -> anyhow::Result<()> {
        let (mut ws_stream, _) = async_tungstenite::tokio::connect_async(url).await?;
        debug!("Connected to WebSocket");

        ws_stream
            .send(
                serde_json::to_string(&json!({
                  "seq": 1,
                  "action": "authentication_challenge",
                  "data": {
                    "token": self.token,
                  }
                }))
                .unwrap()
                .into(),
            )
            .await?;

        loop {
            tokio::select! {
                event = ws_stream.next() => {
                    if let Some(event) = event {
                        let msg = match event {
                            Ok(msg) => msg,
                            Err(err) => return Err(err.into()),
                        };

                        let msg = match msg {
                            Message::Text(data) => data,
                            Message::Ping(data) => {
                                ws_stream.send(Message::Pong(data)).await?;
                                continue;
                            }
                            Message::Close(_) => return Err(MattermostError::WebSocketClosed.into()),
                            _ => continue,
                        };

                        if let Err(err) = self.handle_websocket_message(msg).await {
                            error!("Handling message failed: {}", err);
                        };
                    }
                },
                _ = self.cancellation_token.cancelled() => {
                    debug!("Stopping WebSocket");
                    ws_stream.close(None).await.unwrap_or_else(|err| {
                        warn!("Closing WebSocket failed: {}", err);
                    });
                    return Ok(());
                }
            }
        }
    }

    async fn handle_websocket_message(&self, msg: String) -> anyhow::Result<()> {
        let msg = match serde_json::from_str::<WebSocketEvent>(&msg) {
            Ok(res) => res,
            // We just ignore messages we cannot parse
            Err(_) => return Ok(()),
        };

        let WebSocketEvent::Posted(posted) = msg;
        if posted.broadcast.channel_id != self.channel_id {
            return Ok(());
        }

        let post = match serde_json::from_str::<Post>(&posted.data.post) {
            Ok(post) => post,
            Err(_) => return Ok(()),
        };
        // Ignore our own messages
        if post.user_id.is_some() && post.user_id.unwrap() == self.user_id {
            return Ok(());
        }

        trace!("Got WebSocket message: {}", post.message);

        let (handled, res) = self.commands.handle_message(&post.message).await?;
        if let Some(res) = res {
            self.send_message(&res, false, false).await?;
        }

        if !handled {
            let _ = self.msg_tx.send(post.message);
        }

        Ok(())
    }

    async fn send_get_request<T: DeserializeOwned>(&self, path: &str) -> anyhow::Result<T> {
        let client = reqwest::Client::new();
        Ok(client
            .get(self.format_endpoint(path))
            .header(HEADER_AUTHORIZATION, self.format_auth_header())
            .send()
            .await?
            .json::<T>()
            .await?)
    }

    async fn send_post_request<S: Serialize, T: DeserializeOwned>(
        &self,
        path: &str,
        data: &S,
    ) -> anyhow::Result<T> {
        let client = reqwest::Client::new();
        Ok(client
            .post(self.format_endpoint(path))
            .json(data)
            .header(HEADER_AUTHORIZATION, self.format_auth_header())
            .send()
            .await?
            .json::<T>()
            .await?)
    }

    async fn send_raw_message(&self, message: String, is_alert: bool) -> anyhow::Result<()> {
        match self
            .send_post_request::<_, Post>(
                "posts",
                &Post {
                    message,
                    id: None,
                    user_id: None,
                    channel_id: self.get_channel(is_alert),
                },
            )
            .await
        {
            Ok(_) => Ok(()),
            Err(err) => Err(err),
        }
    }

    fn get_channel(&self, is_alert: bool) -> String {
        if is_alert {
            self.channel_id_alerts
                .clone()
                .unwrap_or_else(|| self.channel_id.clone())
        } else {
            self.channel_id.clone()
        }
    }

    fn format_endpoint(&self, path: &str) -> String {
        format!("{}/api/v4/{}", self.endpoint, path)
    }

    fn format_auth_header(&self) -> String {
        format!("{} {}", HEADER_BEARER, &self.token)
    }

    fn find_channel<'a>(name: &str, channels: &'a [Channel]) -> Option<&'a Channel> {
        channels
            .iter()
            .find(|channel| channel.name == name || channel.display_name == name)
    }
}

#[async_trait]
impl<C> NotificationClient for Client<C>
where
    C: CommandHandler + Send + Sync,
{
    fn listen_to_messages(&self) -> tokio::sync::broadcast::Receiver<String> {
        self.msg_tx.subscribe()
    }

    async fn send_message(
        &self,
        message: &str,
        is_alert: bool,
        send_alert: bool,
    ) -> anyhow::Result<()> {
        if send_alert {
            if let Some(alert_client) = self.alert_client.clone() {
                alert_client.send_alert("Boltz alert".to_string()).await?;
            }
        }

        if message.len() + self.prefix.clone().unwrap_or("".to_string()).len() + 10
            < MAX_MESSAGE_LENGTH
        {
            let message = if contains_code_block(message) {
                format!(
                    "\n{}json\n{}\n{}",
                    CODE_BLOCK,
                    message
                        .strip_prefix(CODE_BLOCK)
                        .unwrap_or(message)
                        .strip_suffix(CODE_BLOCK)
                        .unwrap_or(message),
                    CODE_BLOCK
                )
            } else {
                message.to_string()
            };

            self.send_raw_message(
                if let Some(prefix) = self.prefix.clone() {
                    format!("{}{}", format_prefix(&prefix), message)
                } else {
                    message
                },
                is_alert,
            )
            .await?;
            return Ok(());
        }

        if let Some(prefix) = self.prefix.clone() {
            self.send_raw_message(format_prefix(&prefix), is_alert)
                .await?;
        }
        for part in split_message(MAX_MESSAGE_LENGTH, message) {
            self.send_raw_message(part, is_alert).await?;
        }

        Ok(())
    }
}

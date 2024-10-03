use std::error::Error;

use async_trait::async_trait;
use serde::{Deserialize, Serialize};

mod alerts;
pub mod mattermost;
mod utils;

#[async_trait]
pub trait NotificationClient {
    fn listen_to_messages(&self) -> tokio::sync::broadcast::Receiver<String>;

    async fn send_message(
        &self,
        message: &str,
        is_important: bool,
        send_alert: bool,
    ) -> Result<(), Box<dyn Error>>;
}

#[derive(Deserialize, Serialize, PartialEq, Clone, Debug)]
pub struct Config {
    #[serde(rename = "mattermostUrl")]
    pub mattermost_url: String,
    pub token: String,
    pub channel: String,
    #[serde(rename = "channelAlerts")]
    pub channel_alert: Option<String>,
    pub prefix: Option<String>,

    #[serde(rename = "alertWebhook")]
    pub alert_webhook: Option<String>,
}

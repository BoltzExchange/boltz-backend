use std::error::Error;

use async_trait::async_trait;
use serde::{Deserialize, Serialize};

pub mod mattermost;
mod utils;

#[async_trait]
pub trait NotificationClient {
    async fn send_message(&self, message: &str, is_alert: bool) -> Result<(), Box<dyn Error>>;

    fn listen_to_messages(&self) -> tokio::sync::broadcast::Receiver<String>;
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
}

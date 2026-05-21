use crate::chain::elements::zero_conf_tool::ws::protocol::{send_subscribe, send_unsubscribe};
use anyhow::{Context, Result};
use async_tungstenite::tokio::ConnectStream;
use async_tungstenite::{WebSocketReceiver, WebSocketSender};
use std::collections::HashSet;
use std::time::Duration;

pub struct WsConnection {
    pub sink: WebSocketSender<ConnectStream>,
    pub stream: WebSocketReceiver<ConnectStream>,
    subscribed: HashSet<String>,
}

impl WsConnection {
    pub fn is_subscribed_to(&self, txid: &str) -> bool {
        self.subscribed.contains(txid)
    }

    pub async fn connect(endpoint: &str, timeout: Duration) -> Result<Self> {
        let connect =
            tokio::time::timeout(timeout, async_tungstenite::tokio::connect_async(endpoint))
                .await
                .context("websocket connect timed out")?
                .context("websocket connect failed")?;

        let (sink, stream) = connect.0.split();
        Ok(WsConnection {
            sink,
            stream,
            subscribed: HashSet::new(),
        })
    }

    pub async fn subscribe(&mut self, txid: &str) -> Result<()> {
        if self.subscribed.contains(txid) {
            return Ok(());
        }

        send_subscribe(&mut self.sink, txid).await?;
        self.subscribed.insert(txid.to_string());
        Ok(())
    }

    pub async fn unsubscribe(&mut self, txid: &str) -> Result<()> {
        if !self.subscribed.remove(txid) {
            return Ok(());
        }

        send_unsubscribe(&mut self.sink, txid).await?;
        Ok(())
    }

    pub async fn close(mut self) -> Result<()> {
        self.sink
            .close(None)
            .await
            .context("close websocket connection")
    }
}

use crate::chain::elements::zero_conf_tool::shared::Observations;
use anyhow::{Context, Result};
use async_tungstenite::tungstenite::Message;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Debug)]
#[serde(tag = "action", rename_all = "lowercase")]
enum Outbound<'a> {
    Subscribe { txid: &'a str },
    Unsubscribe { txid: &'a str },
}

#[derive(Deserialize, Debug)]
#[serde(tag = "action", rename_all = "lowercase")]
pub enum Inbound {
    Subscribed,
    Snapshot {
        txid: String,
        observations: Option<Observations>,
    },
    Expired {
        txid: String,
    },
    Error {
        #[serde(default)]
        txid: Option<String>,
        #[serde(default)]
        reason: Option<String>,
        #[serde(default)]
        message: Option<String>,
    },
}

pub async fn send_subscribe<S>(sink: &mut S, txid: &str) -> Result<()>
where
    S: futures::Sink<Message> + Unpin,
    S::Error: std::error::Error + Send + Sync + 'static,
{
    let frame = serde_json::to_string(&Outbound::Subscribe { txid })
        .context("serialize subscribe frame")?;
    futures::SinkExt::send(sink, Message::text(frame))
        .await
        .with_context(|| format!("send subscribe for {txid}"))?;
    Ok(())
}

pub async fn send_unsubscribe<S>(sink: &mut S, txid: &str) -> Result<()>
where
    S: futures::Sink<Message> + Unpin,
    S::Error: std::error::Error + Send + Sync + 'static,
{
    let frame = serde_json::to_string(&Outbound::Unsubscribe { txid })
        .context("serialize unsubscribe frame")?;
    futures::SinkExt::send(sink, Message::text(frame))
        .await
        .with_context(|| format!("send unsubscribe for {txid}"))?;
    Ok(())
}

pub async fn send_pong<S>(sink: &mut S, payload: bytes::Bytes) -> Result<()>
where
    S: futures::Sink<Message> + Unpin,
    S::Error: std::error::Error + Send + Sync + 'static,
{
    futures::SinkExt::send(sink, Message::Pong(payload))
        .await
        .context("send pong")?;
    Ok(())
}

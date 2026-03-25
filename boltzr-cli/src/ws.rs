use anyhow::{Context, Result, anyhow, bail};
use async_tungstenite::tokio::connect_async;
use async_tungstenite::tungstenite::Message;
use boltz_utils::ws::{
    SwapUpdateSubscribeRequest, SwapUpdateSubscriptionRequest, SwapUpdateWsRequest,
    SwapUpdateWsResponse,
};
use futures::StreamExt;

pub async fn subscribe_swap_updates(endpoint: &str, ids: Vec<String>) -> Result<()> {
    let (stream, _) = connect_async(endpoint)
        .await
        .with_context(|| format!("failed to connect to {endpoint}"))?;
    let (mut sender, mut receiver) = stream.split();

    let request = serde_json::to_string(&SwapUpdateWsRequest::Subscribe(
        SwapUpdateSubscribeRequest::SwapUpdate(SwapUpdateSubscriptionRequest { args: ids }),
    ))?;
    sender
        .send(Message::text(request))
        .await
        .context("failed to send swap update subscription request")?;

    while let Some(message) = receiver.next().await {
        match message.context("failed to receive WebSocket message")? {
            Message::Text(text) => {
                let response = serde_json::from_str::<SwapUpdateWsResponse>(text.as_ref())
                    .map_err(|err| anyhow!("failed to parse WebSocket message `{text}`: {err}"))?;
                println!("{}", serde_json::to_string_pretty(&response)?);
            }
            Message::Ping(payload) => {
                sender
                    .send(Message::Pong(payload))
                    .await
                    .context("failed to respond to WebSocket ping")?;
            }
            Message::Close(_) => break,
            Message::Binary(_) => bail!("received unexpected binary WebSocket message"),
            Message::Pong(_) | Message::Frame(_) => {}
        }
    }

    Ok(())
}

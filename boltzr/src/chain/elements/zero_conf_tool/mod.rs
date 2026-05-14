use crate::chain::elements::ZeroConfCheck;
use anyhow::{Context, Result};
use std::sync::Arc;
use tokio_util::sync::CancellationToken;

pub use config::ZeroConfToolConfig;
pub use http::HttpZeroConfTool;
pub use ws::WsZeroConfTool;

mod config;
mod http;
mod shared;
mod ws;

pub fn new(
    cancellation_token: CancellationToken,
    symbol: String,
    config: ZeroConfToolConfig,
) -> Result<Arc<dyn ZeroConfCheck + Send + Sync>> {
    let url = reqwest::Url::parse(&config.endpoint)
        .with_context(|| format!("invalid zeroConfTool endpoint: {}", config.endpoint))?;

    match url.scheme() {
        "http" | "https" => Ok(Arc::new(HttpZeroConfTool::new(
            cancellation_token,
            symbol,
            config,
        ))),
        "ws" | "wss" => Ok(Arc::new(WsZeroConfTool::new(
            cancellation_token,
            symbol,
            config,
        ))),
        other => anyhow::bail!(
            "unsupported zeroConfTool endpoint scheme `{}` (expected http/https/ws/wss): {}",
            other,
            config.endpoint
        ),
    }
}

#[cfg(test)]
mod test {
    use super::*;

    fn cfg(endpoint: &str) -> ZeroConfToolConfig {
        ZeroConfToolConfig {
            endpoint: endpoint.to_string(),
            interval: None,
            max_retries: None,
            deadline_secs: None,
        }
    }

    #[tokio::test]
    async fn factory_accepts_http() {
        let cancel = CancellationToken::new();
        let res = new(cancel.clone(), "L-BTC".into(), cfg("http://127.0.0.1:1"));
        assert!(res.is_ok());
        cancel.cancel();
    }

    #[tokio::test]
    async fn factory_accepts_https() {
        let cancel = CancellationToken::new();
        let res = new(cancel.clone(), "L-BTC".into(), cfg("https://example.com"));
        assert!(res.is_ok());
        cancel.cancel();
    }

    #[tokio::test]
    async fn factory_accepts_ws() {
        let cancel = CancellationToken::new();
        let res = new(cancel.clone(), "L-BTC".into(), cfg("ws://127.0.0.1:1"));
        assert!(res.is_ok());
        cancel.cancel();
    }

    #[tokio::test]
    async fn factory_accepts_wss() {
        let cancel = CancellationToken::new();
        let res = new(cancel.clone(), "L-BTC".into(), cfg("wss://example.com"));
        assert!(res.is_ok());
        cancel.cancel();
    }

    #[tokio::test]
    async fn factory_rejects_unsupported_scheme() {
        let cancel = CancellationToken::new();
        let err = match new(cancel.clone(), "L-BTC".into(), cfg("ftp://example.com")) {
            Ok(_) => panic!("ftp must be rejected"),
            Err(e) => e,
        };
        let msg = format!("{err:#}");
        assert!(
            msg.contains("unsupported"),
            "unexpected error message: {msg}"
        );
        cancel.cancel();
    }

    #[tokio::test]
    async fn factory_rejects_unparseable_endpoint() {
        let cancel = CancellationToken::new();
        let err = match new(cancel.clone(), "L-BTC".into(), cfg("not a url")) {
            Ok(_) => panic!("malformed url must be rejected"),
            Err(e) => e,
        };
        let msg = format!("{err:#}");
        assert!(msg.contains("invalid"), "unexpected error message: {msg}");
        cancel.cancel();
    }
}

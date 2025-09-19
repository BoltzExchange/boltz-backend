use crate::chain::Config;
use crate::chain::types::{RpcParam, RpcRequest, RpcResponse};
use anyhow::anyhow;
use base64::Engine;
use base64::prelude::BASE64_STANDARD;
use reqwest::header::{CONTENT_TYPE, HeaderMap, HeaderValue};
use serde::de::DeserializeOwned;
use std::fs;
use std::sync::Arc;
use tracing::{debug, instrument};

#[derive(Debug, Clone)]
pub struct RpcClient {
    pub(crate) symbol: String,
    client: Arc<reqwest::Client>,
    endpoint: String,
    endpoint_wallet: String,
    cookie: String,
}

impl PartialEq for RpcClient {
    fn eq(&self, other: &Self) -> bool {
        self.symbol == other.symbol
            && self.endpoint == other.endpoint
            && self.endpoint_wallet == other.endpoint_wallet
            && self.cookie == other.cookie
    }
}

impl RpcClient {
    #[instrument(name = "RpcClient::new", skip(config))]
    pub fn new(symbol: String, config: Config) -> anyhow::Result<Self> {
        let auth = match config.cookie {
            Some(cookie) => {
                let cookie = fs::read(cookie)?;
                debug!("Using cookie file auth for {} chain client", symbol);

                cookie
            }
            None => {
                if config.user.is_none() || config.password.is_none() {
                    return Err(anyhow!("missing authentication"));
                }

                debug!("Using password auth for {} chain client", symbol);
                format!("{}:{}", config.user.unwrap(), config.password.unwrap())
                    .as_bytes()
                    .to_vec()
            }
        };

        let endpoint = format!("http://{}:{}", config.host, config.port);

        Ok(Self {
            symbol,
            client: Arc::new(reqwest::Client::new()),
            cookie: format!("Basic {}", BASE64_STANDARD.encode(auth)),
            endpoint_wallet: match config.wallet {
                Some(wallet) => format!("{endpoint}/wallet/{wallet}"),
                None => endpoint.clone(),
            },
            endpoint,
        })
    }

    #[instrument(name = "RpcClient::request", skip(self), fields(symbol = self.symbol))]
    pub async fn request<T: DeserializeOwned + std::fmt::Debug>(
        &self,
        method: &str,
        params: Option<&[RpcParam<'_>]>,
    ) -> anyhow::Result<T> {
        self.request_internal(&self.endpoint, method, params).await
    }

    #[instrument(name = "RpcClient::request_wallet", skip(self), fields(symbol = self.symbol))]
    pub async fn request_wallet<T: DeserializeOwned + std::fmt::Debug>(
        &self,
        method: &str,
        params: Option<&[RpcParam<'_>]>,
    ) -> anyhow::Result<T> {
        self.request_internal(&self.endpoint_wallet, method, params)
            .await
    }

    #[instrument(name = "RpcClient::request_batch", skip(self, params), fields(symbol = self.symbol))]
    pub async fn request_batch<T: DeserializeOwned + std::fmt::Debug>(
        &self,
        method: &str,
        params: &[Vec<RpcParam<'_>>],
    ) -> anyhow::Result<Vec<anyhow::Result<T>>> {
        let response = self
            .client
            .post(&self.endpoint)
            .headers(self.get_headers()?)
            .json(
                &params
                    .iter()
                    .map(|params| RpcRequest {
                        method,
                        params: Some(params.as_slice()),
                    })
                    .collect::<Vec<RpcRequest>>(),
            )
            .send()
            .await?;

        let data = response.json::<Vec<RpcResponse<T>>>().await?;

        Ok(data
            .into_iter()
            .map(|res| {
                if let Some(err) = res.error {
                    Err(anyhow!(err.message))
                } else if let Some(res) = res.result {
                    Ok(res)
                } else {
                    Err(anyhow::anyhow!("no result"))
                }
            })
            .collect::<Vec<anyhow::Result<T>>>())
    }

    async fn request_internal<T: DeserializeOwned + std::fmt::Debug>(
        &self,
        endpoint: &str,
        method: &str,
        params: Option<&[RpcParam<'_>]>,
    ) -> anyhow::Result<T> {
        let response = self
            .client
            .post(endpoint)
            .headers(self.get_headers()?)
            .json(&RpcRequest { method, params })
            .send()
            .await?;

        let data = response.json::<RpcResponse<T>>().await?;
        if let Some(err) = data.error {
            return Err(anyhow!(err.message));
        }

        match data.result {
            Some(res) => Ok(res),
            None => Err(anyhow::anyhow!("no result")),
        }
    }

    fn get_headers(&self) -> anyhow::Result<HeaderMap> {
        let mut headers = HeaderMap::new();
        headers.insert("Authorization", HeaderValue::from_str(&self.cookie)?);
        headers.insert(CONTENT_TYPE, HeaderValue::from_static("application/json"));

        Ok(headers)
    }
}

#[cfg(test)]
mod test {
    use super::*;

    fn get_config() -> Config {
        Config {
            host: "127.0.0.1".to_string(),
            port: 18_443,
            user: Some("backend".to_string()),
            password: Some("DPGn0yNNWN5YvBBeRX2kEcJBwv8zwrw9Mw9nkIl05o4".to_string()),
            wallet: Some("regtest".to_string()),
            ..Default::default()
        }
    }

    #[test]
    fn test_wallet_endpoint() {
        let mut config_no_wallet = get_config();
        config_no_wallet.wallet = None;
        let client = RpcClient::new("BTC".to_string(), config_no_wallet).unwrap();
        assert_eq!(client.endpoint, client.endpoint_wallet);

        let mut config = get_config();
        config.wallet = Some("test".to_string());

        let client = RpcClient::new("BTC".to_string(), config.clone()).unwrap();
        assert_eq!(
            client.endpoint_wallet,
            format!("{}/wallet/{}", client.endpoint, config.wallet.unwrap())
        );
    }

    #[tokio::test]
    async fn test_request() {
        let client = RpcClient::new("BTC".to_string(), get_config()).unwrap();
        let res = client.request::<u64>("getblockcount", None).await.unwrap();
        assert!(res > 0);
    }

    #[tokio::test]
    async fn test_request_wallet() {
        let client = RpcClient::new("BTC".to_string(), get_config()).unwrap();
        let res = client
            .request_wallet::<String>("getnewaddress", None)
            .await
            .unwrap();
        assert!(res.starts_with("bcrt1"));
    }

    #[tokio::test]
    async fn test_request_not_found() {
        let client = RpcClient::new("BTC".to_string(), get_config()).unwrap();
        let res = client
            .request::<String>("notfound", None)
            .await
            .unwrap_err();
        assert_eq!(res.to_string(), "Method not found");
    }

    #[tokio::test]
    async fn test_request_invalid_param() {
        let client = RpcClient::new("BTC".to_string(), get_config()).unwrap();
        let res = client
            .request_wallet::<String>(
                "getnewaddress",
                Some(&[RpcParam::Str(""), RpcParam::Str("invalid")]),
            )
            .await
            .unwrap_err();
        assert_eq!(res.to_string(), "Unknown address type 'invalid'");
    }
}

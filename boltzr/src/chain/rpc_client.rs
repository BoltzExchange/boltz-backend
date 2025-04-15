use crate::chain::Config;
use crate::chain::types::{RpcParam, RpcRequest, RpcResponse};
use anyhow::anyhow;
use base64::Engine;
use base64::prelude::BASE64_STANDARD;
use reqwest::header::{CONTENT_TYPE, HeaderMap, HeaderValue};
use serde::de::DeserializeOwned;
use serde_json::json;
use std::fs;
use tracing::{debug, instrument};

#[derive(PartialEq, Debug, Clone)]
pub struct RpcClient {
    pub(crate) symbol: String,

    endpoint: String,
    cookie: String,
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

        Ok(Self {
            symbol,
            endpoint: format!("http://{}:{}/wallet/default", config.host, config.port),
            cookie: format!("Basic {}", BASE64_STANDARD.encode(auth)),
        })
    }

    #[instrument(name = "RpcClient::request", skip(self), fields(symbol = self.symbol))]
    pub async fn request<T: DeserializeOwned>(
        &self,
        method: &str,
        params: Option<Vec<RpcParam>>,
    ) -> anyhow::Result<T> {
        let client = reqwest::Client::new();

        let response = client
            .post(&self.endpoint)
            .headers(self.get_headers()?)
            .json(&json!({
                "method": method,
                "params": params.unwrap_or_default(),
            }))
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

    #[instrument(name = "RpcClient::request_batch", skip(self, params), fields(symbol = self.symbol))]
    pub async fn request_batch<T: DeserializeOwned>(
        &self,
        method: &str,
        params: Vec<Vec<RpcParam>>,
    ) -> anyhow::Result<Vec<anyhow::Result<T>>> {
        let client = reqwest::Client::new();

        let response = client
            .post(&self.endpoint)
            .headers(self.get_headers()?)
            .json(
                &params
                    .into_iter()
                    .map(|params| RpcRequest {
                        params: Some(params),
                        method: method.to_string(),
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

    fn get_headers(&self) -> anyhow::Result<HeaderMap> {
        let mut headers = HeaderMap::new();
        headers.insert("Authorization", HeaderValue::from_str(&self.cookie)?);
        headers.insert(CONTENT_TYPE, HeaderValue::from_static("application/json"));

        Ok(headers)
    }
}

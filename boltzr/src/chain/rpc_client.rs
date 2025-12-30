use crate::chain::Config;
use crate::chain::types::{RpcParam, RpcRequest, RpcResponse};
use anyhow::anyhow;
use base64::Engine;
use base64::prelude::BASE64_STANDARD;
use reqwest::Url;
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
                Some(wallet) => Self::wallet_endpoint_format(&endpoint, &wallet)?,
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
        wallet: Option<&str>,
        method: &str,
        params: Option<&[RpcParam<'_>]>,
    ) -> anyhow::Result<T> {
        self.request_internal(&self.wallet_endpoint(wallet)?, method, params)
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

    fn wallet_endpoint(&self, wallet: Option<&str>) -> anyhow::Result<String> {
        match wallet {
            Some(wallet) => Self::wallet_endpoint_format(&self.endpoint, wallet),
            None => Ok(self.endpoint_wallet.clone()),
        }
    }

    fn wallet_endpoint_format(endpoint: &str, wallet: &str) -> anyhow::Result<String> {
        let mut url = Url::parse(endpoint)?;
        match url.path_segments_mut() {
            Ok(mut segments) => segments.push("wallet").push(wallet),
            Err(_) => return Err(anyhow::anyhow!("invalid endpoint")),
        };
        Ok(url.to_string())
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use rstest::rstest;

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

    #[test]
    fn test_wallet_endpoint_format() {
        let endpoint = "http://127.0.0.1:18443";
        let wallet = "testwallet";

        let result = RpcClient::wallet_endpoint_format(endpoint, wallet).unwrap();
        assert_eq!(result, "http://127.0.0.1:18443/wallet/testwallet");
    }

    #[rstest]
    #[case("my-wallet_123", "http://localhost:8332/wallet/my-wallet_123")]
    #[case(
        "wallet with spaces",
        "http://localhost:8332/wallet/wallet%20with%20spaces"
    )]
    #[case(
        "wallet/with/slashes",
        "http://localhost:8332/wallet/wallet%2Fwith%2Fslashes"
    )]
    #[case("wallet?query", "http://localhost:8332/wallet/wallet%3Fquery")]
    #[case("wallet&ampersand", "http://localhost:8332/wallet/wallet&ampersand")]
    #[case("wallet#hash", "http://localhost:8332/wallet/wallet%23hash")]
    #[case("wallet%percent", "http://localhost:8332/wallet/wallet%25percent")]
    #[case("wallet@at", "http://localhost:8332/wallet/wallet@at")]
    #[case("wallet=equals", "http://localhost:8332/wallet/wallet=equals")]
    #[case("wallet+plus", "http://localhost:8332/wallet/wallet+plus")]
    fn test_wallet_endpoint_format_with_special_chars(
        #[case] wallet: &str,
        #[case] expected: &str,
    ) {
        let endpoint = "http://localhost:8332";

        let result = RpcClient::wallet_endpoint_format(endpoint, wallet).unwrap();
        assert_eq!(result, expected);
    }

    #[test]
    fn test_wallet_endpoint_method_with_some_wallet() {
        let config = get_config();
        let client = RpcClient::new("BTC".to_string(), config).unwrap();

        let result = client.wallet_endpoint(Some("custom_wallet")).unwrap();
        assert_eq!(result, format!("{}/wallet/custom_wallet", client.endpoint));
    }

    #[test]
    fn test_wallet_endpoint_method_with_none() {
        let config = get_config();
        let client = RpcClient::new("BTC".to_string(), config).unwrap();

        let result = client.wallet_endpoint(None).unwrap();
        assert_eq!(result, client.endpoint_wallet);
    }

    #[test]
    fn test_wallet_endpoint_method_fallback() {
        let mut config_no_wallet = get_config();
        config_no_wallet.wallet = None;
        let client = RpcClient::new("BTC".to_string(), config_no_wallet).unwrap();

        let result = client.wallet_endpoint(None).unwrap();
        assert_eq!(result, client.endpoint);

        let result_with_wallet = client.wallet_endpoint(Some("override_wallet")).unwrap();
        assert_eq!(
            result_with_wallet,
            format!("{}/wallet/override_wallet", client.endpoint)
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
            .request_wallet::<String>(None, "getnewaddress", None)
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
                None,
                "getnewaddress",
                Some(&[RpcParam::Str(""), RpcParam::Str("invalid")]),
            )
            .await
            .unwrap_err();
        assert_eq!(res.to_string(), "Unknown address type 'invalid'");
    }
}

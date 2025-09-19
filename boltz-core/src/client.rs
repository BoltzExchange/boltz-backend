use anyhow::{Result, anyhow};
use base64::{Engine, prelude::BASE64_STANDARD};
use reqwest::header::{CONTENT_TYPE, HeaderMap, HeaderValue};
use serde::{Deserialize, Serialize, Serializer, de::DeserializeOwned};
use serde_json::json;
use std::sync::Arc;

const REGTEST_HOST: &str = "127.0.0.1";

#[derive(Debug, Clone, Copy)]
#[allow(dead_code)]
pub enum RpcParam<'a> {
    Str(&'a str),
    Int(i64),
    Float(f64),
}

impl Serialize for RpcParam<'_> {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        match *self {
            RpcParam::Str(s) => serializer.serialize_str(s),
            RpcParam::Int(num) => serializer.serialize_i64(num),
            RpcParam::Float(num) => serializer.serialize_f64(num),
        }
    }
}

#[derive(Deserialize, Debug)]
pub struct RpcError {
    pub message: String,
}

#[derive(Deserialize, Debug)]
pub struct RpcResponse<T>
where
    T: std::fmt::Debug,
{
    pub result: Option<T>,
    pub error: Option<RpcError>,
}

#[derive(Deserialize, Debug)]
pub struct RpcBlock {
    pub hash: String,
}

#[derive(Debug, Clone)]
pub struct RpcClient {
    endpoint: String,
    cookie: String,
    client: Arc<reqwest::blocking::Client>,
}

impl RpcClient {
    pub fn new(host: &str, port: u16, user: &str, password: &str, wallet: &str) -> Self {
        Self {
            endpoint: format!("http://{host}:{port}/wallet/{wallet}"),
            cookie: format!(
                "Basic {}",
                BASE64_STANDARD.encode(format!("{user}:{password}").as_bytes())
            ),
            client: Arc::new(reqwest::blocking::Client::new()),
        }
    }

    pub fn new_bitcoin_regtest() -> Self {
        Self::new(
            REGTEST_HOST,
            18443,
            "backend",
            "DPGn0yNNWN5YvBBeRX2kEcJBwv8zwrw9Mw9nkIl05o4",
            "regtest",
        )
    }

    pub fn new_elements_regtest() -> Self {
        Self::new(REGTEST_HOST, 18884, "regtest", "regtest", "regtest")
    }

    pub fn request<T: DeserializeOwned + std::fmt::Debug>(
        &self,
        method: &str,
        params: Option<&[RpcParam]>,
    ) -> Result<T> {
        let response = self
            .client
            .post(&self.endpoint)
            .headers(self.get_headers()?)
            .json(&json!({
                "method": method,
                "params": params.unwrap_or_default(),
            }))
            .send()?;

        let data = response.json::<RpcResponse<T>>()?;
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

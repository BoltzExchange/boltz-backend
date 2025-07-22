use anyhow::{Result, anyhow};
use base64::{Engine, prelude::BASE64_STANDARD};
use reqwest::header::{CONTENT_TYPE, HeaderMap, HeaderValue};
use serde::{Deserialize, Serialize, Serializer, de::DeserializeOwned};
use serde_json::json;

const REGTEST_HOST: &str = "127.0.0.1";
const REGTEST_USER: &str = "boltz";
const REGTEST_PASSWORD: &str = "anoVB0m1KvX0SmpPxvaLVADg0UQVLQTEx3jCD3qtuRI";

#[derive(Debug, Clone)]
#[allow(dead_code)]
pub enum RpcParam {
    Str(String),
    Int(i64),
    Float(f64),
}

impl Serialize for RpcParam {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        match *self {
            RpcParam::Str(ref s) => serializer.serialize_str(s),
            RpcParam::Int(num) => serializer.serialize_i64(num),
            RpcParam::Float(num) => serializer.serialize_f64(num),
        }
    }
}

#[derive(Deserialize)]
pub struct RpcError {
    pub message: String,
}

#[derive(Deserialize)]
pub struct RpcResponse<T> {
    pub result: Option<T>,
    pub error: Option<RpcError>,
}

#[derive(Deserialize)]
pub struct RpcBlock {
    pub hash: String,
}

#[derive(Debug, Clone)]
pub struct RpcClient {
    endpoint: String,
    cookie: String,
}

impl RpcClient {
    pub fn new(host: &str, port: u16, user: &str, password: &str) -> Self {
        Self {
            endpoint: format!("http://{host}:{port}"),
            cookie: format!(
                "Basic {}",
                BASE64_STANDARD.encode(format!("{user}:{password}").as_bytes())
            ),
        }
    }

    pub fn new_bitcoin_regtest() -> Self {
        Self::new(REGTEST_HOST, 18443, REGTEST_USER, REGTEST_PASSWORD)
    }

    pub fn new_elements_regtest() -> Self {
        Self::new(REGTEST_HOST, 18884, REGTEST_USER, REGTEST_PASSWORD)
    }

    pub fn request<T: DeserializeOwned>(
        &self,
        method: &str,
        params: Option<Vec<RpcParam>>,
    ) -> Result<T> {
        let client = reqwest::blocking::Client::new();

        let response = client
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

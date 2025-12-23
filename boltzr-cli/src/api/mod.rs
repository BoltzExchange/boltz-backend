use anyhow::Result;
use hmac::{Hmac, Mac};
use reqwest::RequestBuilder;
use serde::{Deserialize, de::DeserializeOwned};
use std::time::{Duration, SystemTime, UNIX_EPOCH};

const REQUEST_TIMEOUT: Duration = Duration::from_secs(30);

#[derive(Debug, Clone, Deserialize)]
pub struct ErrorResponse {
    pub error: String,
}

#[derive(Debug, Clone, Deserialize)]
pub struct ReferralIdResponse {
    pub id: String,
}

pub struct Client {
    client: reqwest::Client,
    endpoint: String,
    api_key: String,
    api_secret: String,
}

impl Client {
    pub fn new(endpoint: String, api_key: String, api_secret: String) -> Self {
        Self {
            client: reqwest::Client::new(),
            endpoint: endpoint.trim_end_matches('/').to_string(),
            api_key,
            api_secret,
        }
    }

    pub async fn referral_id(&self) -> Result<String> {
        let path = "/v2/referral";

        Ok(self
            .send_request::<ReferralIdResponse>(self.authenticate_request(
                self.client.get(format!("{}{}", self.endpoint, path)),
                "GET",
                path,
            )?)
            .await?
            .id)
    }

    pub async fn referral_stats(&self) -> Result<serde_json::Value> {
        let path = "/v2/referral/stats";

        self.send_request::<serde_json::Value>(self.authenticate_request(
            self.client.get(format!("{}{}", self.endpoint, path)),
            "GET",
            path,
        )?)
        .await
    }

    async fn send_request<T: DeserializeOwned>(&self, builder: RequestBuilder) -> Result<T> {
        let response = builder.timeout(REQUEST_TIMEOUT).send().await?;

        if !response.status().is_success() {
            let error = response
                .json::<ErrorResponse>()
                .await
                .map_err(|e| anyhow::anyhow!("failed to parse error response: {}", e))?;
            return Err(anyhow::anyhow!("{}", error.error));
        }

        response
            .json::<T>()
            .await
            .map_err(|e| anyhow::anyhow!("failed to parse response: {}", e))
    }

    fn authenticate_request(
        &self,
        builder: RequestBuilder,
        method: &str,
        path: &str,
    ) -> Result<RequestBuilder> {
        let ts = SystemTime::now().duration_since(UNIX_EPOCH)?.as_secs();

        let mut mac = Hmac::<sha2::Sha256>::new_from_slice(self.api_secret.as_bytes())?;
        mac.update(format!("{ts}{method}{path}").as_bytes());
        let hmac = alloy::hex::encode(mac.finalize().into_bytes());

        Ok(builder
            .header("TS", ts.to_string())
            .header("API-KEY", self.api_key.clone())
            .header("API-HMAC", hmac))
    }
}

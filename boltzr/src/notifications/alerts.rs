use serde::{Deserialize, Serialize};
use std::error::Error;
use std::fmt::{Display, Formatter};
use std::time::{SystemTime, UNIX_EPOCH};

#[derive(Debug)]
enum AlertError {
    RequestFailed(u16),
}

impl Display for AlertError {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        match self {
            AlertError::RequestFailed(status) => {
                write!(f, "alert request failed with status code: {}", status)
            }
        }
    }
}

impl Error for AlertError {}

#[derive(Deserialize, Serialize, PartialEq, Clone, Debug)]
struct WebhookRequest {
    alert_uid: String,
    title: String,
}

#[derive(Clone, Debug)]
pub struct Client {
    endpoint: String,
}

impl Client {
    pub fn new(endpoint: String) -> Self {
        Self { endpoint }
    }

    pub async fn send_alert(&self, title: String) -> anyhow::Result<()> {
        let client = reqwest::Client::new();
        let res = client
            .post(self.endpoint.clone())
            .json(&WebhookRequest {
                title,
                // Unique enough for this use case
                alert_uid: SystemTime::now()
                    .duration_since(UNIX_EPOCH)?
                    .as_millis()
                    .to_string(),
            })
            .send()
            .await?;

        if !res.status().is_success() {
            return Err(AlertError::RequestFailed(res.status().as_u16()).into());
        }

        Ok(())
    }
}

#[cfg(test)]
mod test {
    use crate::notifications::alerts::{AlertError, Client, WebhookRequest};
    use axum::http::StatusCode;
    use axum::response::IntoResponse;
    use axum::routing::post;
    use axum::{Extension, Json, Router};
    use serde_json::json;
    use std::sync::{Arc, Mutex};
    use std::time::{Duration, SystemTime, UNIX_EPOCH};
    use tokio_util::sync::CancellationToken;

    #[tokio::test]
    async fn test_send_alert() {
        let port = 12_101;
        let (cancellation_token, calls) = start_server(port).await;

        let client = Client::new(format!("http://127.0.0.1:{}/", port));
        let title = "test";

        assert!(client.send_alert(title.to_string()).await.is_ok());

        assert_eq!(calls.lock().unwrap().len(), 1);

        let call = calls.lock().unwrap()[0].clone();
        let time_now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_millis();

        assert_eq!(call.title, title);
        assert!(call.alert_uid.parse::<u128>().unwrap() <= time_now);
        assert!(call.alert_uid.parse::<u128>().unwrap() > time_now - 100);

        cancellation_token.cancel();
    }

    #[tokio::test]
    async fn test_send_alert_fail() {
        let port = 12_102;
        let (cancellation_token, _) = start_server(port).await;

        let client = Client::new(format!("http://127.0.0.1:{}/fail", port));
        assert_eq!(
            client
                .send_alert("test fail".to_string())
                .await
                .err()
                .unwrap()
                .to_string(),
            AlertError::RequestFailed(StatusCode::INTERNAL_SERVER_ERROR.as_u16()).to_string()
        );

        cancellation_token.cancel();
    }

    async fn start_server(port: u16) -> (CancellationToken, Arc<Mutex<Vec<WebhookRequest>>>) {
        struct ServerState {
            received_calls: Arc<Mutex<Vec<WebhookRequest>>>,
        }

        async fn ok_handler(
            Extension(state): Extension<Arc<ServerState>>,
            Json(body): Json<WebhookRequest>,
        ) -> impl IntoResponse {
            state.received_calls.lock().unwrap().push(body);
            (StatusCode::OK, Json(json!("{}")))
        }

        async fn failure_handler(
            Extension(state): Extension<Arc<ServerState>>,
            Json(body): Json<WebhookRequest>,
        ) -> impl IntoResponse {
            state.received_calls.lock().unwrap().push(body);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!("{\"error\": \"epic fail\"}")),
            )
        }

        let received_calls = Arc::new(Mutex::new(Vec::new()));
        let router = Router::new()
            .route("/", post(ok_handler))
            .route("/fail", post(failure_handler))
            .layer(Extension(Arc::new(ServerState {
                received_calls: received_calls.clone(),
            })));

        let listener = tokio::net::TcpListener::bind(format!("127.0.0.1:{}", port))
            .await
            .unwrap();

        let cancellation_token = CancellationToken::new();
        let token = cancellation_token.clone();
        tokio::spawn(async move {
            axum::serve(listener, router)
                .with_graceful_shutdown(async move {
                    token.cancelled().await;
                })
                .await
                .unwrap();
        });
        tokio::time::sleep(Duration::from_millis(10)).await;

        (cancellation_token, received_calls)
    }
}

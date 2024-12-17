use std::error::Error;
use std::sync::Arc;
use std::time::Duration;
use std::{cmp, fmt};

use dashmap::DashMap;
use futures::future;
use reqwest::Url;
use serde::{Deserialize, Serialize};
use tokio_util::sync::CancellationToken;
use tracing::{debug, error, info, instrument, trace, warn};

use crate::db::helpers::web_hook::WebHookHelper;
use crate::db::models::{WebHook, WebHookState};
use crate::webhook::types::{WebHookCallData, WebHookCallParams, WebHookEvent};

const DEFAULT_REQUEST_TIMEOUT: u64 = 15;
const DEFAULT_MAX_RETRIES: u64 = 5;
const DEFAULT_RETRY_INTERVAL: u64 = 60;

const MAX_URL_LENGTH: usize = 250;

#[derive(Debug, Clone, PartialEq)]
pub enum CallResult {
    Success,
    Failed,
    NotIncluded,
}

#[derive(Debug, Clone)]
pub enum UrlError {
    MoreThanMaxLen,
    HttpsRequired,
}

impl fmt::Display for UrlError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match *self {
            UrlError::MoreThanMaxLen => {
                f.write_str("URL length is more than the maximum length permitted")
            }
            UrlError::HttpsRequired => f.write_str("only HTTPS URLs are permitted"),
        }
    }
}

impl Error for UrlError {}

#[derive(Serialize, Deserialize, PartialEq, Clone, Debug)]
pub struct Config {
    #[serde(rename = "requestTimeout")]
    pub request_timeout: Option<u64>,

    #[serde(rename = "maxRetries")]
    pub max_retries: Option<u64>,

    #[serde(rename = "retryInterval")]
    pub retry_interval: Option<u64>,
}

#[derive(Clone)]
pub struct Caller {
    cancellation_token: CancellationToken,

    retry_count: Arc<DashMap<String, u64>>,
    web_hook_helper: Arc<Box<dyn WebHookHelper + Sync + Send>>,

    request_timeout: Duration,

    max_retries: u64,
    retry_interval: Duration,
}

impl Caller {
    pub fn new(
        cancellation_token: CancellationToken,
        config: Config,
        web_hook_helper: Box<dyn WebHookHelper + Sync + Send>,
    ) -> Self {
        let max_retries = config.max_retries.unwrap_or(DEFAULT_MAX_RETRIES);
        debug!("Max WebHook call retries: {}", max_retries);

        let timeout = config.request_timeout.unwrap_or(DEFAULT_REQUEST_TIMEOUT);
        trace!("WebHook call timeout: {}s", timeout);

        Caller {
            max_retries,
            cancellation_token,
            retry_count: Arc::new(DashMap::new()),
            web_hook_helper: Arc::new(web_hook_helper),
            request_timeout: Duration::from_secs(timeout),
            retry_interval: Duration::from_secs(
                config.retry_interval.unwrap_or(DEFAULT_RETRY_INTERVAL),
            ),
        }
    }

    pub async fn start(&self) {
        info!("Starting WebHook retry loop");

        async fn retry(caller: &Caller) {
            trace!("Retrying failed WebHook calls");
            match caller.retry_calls().await {
                Ok(_) => {}
                Err(err) => {
                    error!("WebHook retry iteration failed: {}", err);
                }
            };
        }

        retry(self).await;

        debug!(
            "Retrying failed WebHook calls every: {:#?}",
            self.retry_interval
        );

        loop {
            tokio::select! {
                _ = tokio::time::sleep(self.retry_interval) => {
                    retry(self).await;
                }
                _ = self.cancellation_token.cancelled() => {
                    debug!("Stopping WebHook retry loop");
                    break;
                }
            }
        }
    }

    #[instrument(name = "Caller::call_webhook", skip(self, hook, status))]
    pub async fn call_webhook(
        &self,
        hook: &WebHook,
        status: &String,
    ) -> Result<CallResult, Box<dyn Error>> {
        if let Some(status_include) = &hook.status {
            if !status_include.contains(status) {
                trace!("Not calling WebHook for swap {} because status update {} is not in include list", hook.id, status);
                return Ok(CallResult::NotIncluded);
            }
        }

        debug!(
            "Calling WebHook for swap {} for status update {}: {}",
            hook.id, status, hook.url,
        );

        let client = reqwest::Client::builder()
            .connect_timeout(self.request_timeout)
            .timeout(self.request_timeout)
            .build()
            .unwrap();
        let req_err = match client
            .post(&hook.url)
            .json(&WebHookCallParams {
                event: WebHookEvent::SwapUpdate,
                data: WebHookCallData {
                    status: status.clone(),
                    id: Self::format_swap_id(hook.id.clone(), hook.hash_swap_id),
                },
            })
            .send()
            .await
        {
            Ok(res) => match res.error_for_status() {
                Ok(_) => None,
                Err(err) => Some(err),
            },
            Err(err) => Some(err),
        };

        match req_err {
            None => {
                info!(
                    "Called WebHook for swap {} for status update: {}",
                    hook.id.clone(),
                    status,
                );

                #[cfg(feature = "metrics")]
                metrics::counter!(crate::metrics::WEBHOOK_CALL_COUNT, "status" => "success")
                    .increment(1);

                self.retry_count.remove(&hook.id);
                self.web_hook_helper.set_state(&hook.id, WebHookState::Ok)?;

                Ok(CallResult::Success)
            }
            Some(err) => {
                warn!("Request for swap {} failed: {}", hook.id, err);

                #[cfg(feature = "metrics")]
                metrics::counter!(crate::metrics::WEBHOOK_CALL_COUNT, "status" => "failed")
                    .increment(1);

                self.web_hook_helper
                    .set_state(&hook.id, WebHookState::Failed)?;

                Ok(CallResult::Failed)
            }
        }
    }

    #[instrument(name = "Caller::retry_calls", skip(self))]
    async fn retry_calls(&self) -> Result<(), Box<dyn Error>> {
        let to_retry = self.web_hook_helper.get_by_state(WebHookState::Failed)?;

        if to_retry.is_empty() {
            return Ok(());
        }

        debug!("Retrying {} WebHook calls", to_retry.len());

        let num_workers = cmp::min(num_cpus::get(), to_retry.len());
        let (sender, receiver) = crossbeam_channel::unbounded();

        let futures: Vec<_> = (0..num_workers)
            .map(|_| {
                let self_cp = self.clone();
                let receiver: crossbeam_channel::Receiver<WebHook> = receiver.clone();

                tokio::spawn(async move {
                    while let Ok(hook) = receiver.recv() {
                        if let Err(err) = self_cp.retry_call(&hook).await {
                            warn!("Could not retry WebHook call for swap {}: {}", hook.id, err);
                        };
                    }
                })
            })
            .collect();

        to_retry
            .iter()
            .for_each(|entry| sender.send(entry.clone()).unwrap());
        drop(sender);

        future::join_all(futures).await;
        Ok(())
    }

    #[instrument(name = "Caller::retry_call", skip(self))]
    async fn retry_call(&self, hook: &WebHook) -> Result<(), Box<dyn Error>> {
        let status = self.web_hook_helper.get_swap_status(&hook.id)?;

        if let Some(status) = status {
            trace!(
                "Retrying WebHook call for swap {} for status update {} to: {}",
                hook.id,
                status,
                hook.url
            );
            let res = self.call_webhook(hook, &status.to_string()).await?;

            if res == CallResult::Success {
                self.retry_count.remove(&hook.id);
                return Ok(());
            }

            let prev_count = match self.retry_count.get(&hook.id) {
                Some(val) => *val.value(),
                None => 0,
            };

            let failed_count = prev_count + 1;
            debug!(
                "WebHook retry call {}/{} for {} failed",
                failed_count, self.max_retries, hook.id
            );

            if res == CallResult::NotIncluded || failed_count >= self.max_retries {
                info!(
                    "Abandoning WebHook call for swap {} with status {}",
                    hook.id, status,
                );

                #[cfg(feature = "metrics")]
                metrics::counter!(
                    crate::metrics::WEBHOOK_CALL_COUNT,
                    "status" => "abandoned",
                )
                .increment(1);

                self.retry_count.remove(&hook.id);
                self.web_hook_helper
                    .set_state(&hook.id, WebHookState::Abandoned)?;
            } else {
                self.retry_count.insert(hook.id.clone(), failed_count);
            }
        } else {
            warn!("No status for swap {} in database", hook.id);
        }

        Ok(())
    }

    pub fn validate_url(url: &str) -> Option<Box<dyn Error>> {
        if url.len() > MAX_URL_LENGTH {
            return Some(UrlError::MoreThanMaxLen.into());
        }

        let url = match Url::parse(url) {
            Ok(url) => url,
            Err(err) => return Some(err.into()),
        };

        if url.scheme() != "https" {
            return Some(UrlError::HttpsRequired.into());
        }

        None
    }

    fn format_swap_id(id: String, hash_swap_id: bool) -> String {
        if !hash_swap_id {
            return id;
        }

        let hash = bitcoin_hashes::Sha256::hash(id.as_bytes());
        hash.to_string()
    }
}

#[cfg(test)]
mod caller_test {
    use crate::db::helpers::web_hook::WebHookHelper;
    use crate::db::helpers::QueryResponse;
    use crate::db::models::{WebHook, WebHookState};
    use crate::webhook::caller::{CallResult, Caller, Config, UrlError, MAX_URL_LENGTH};
    use crate::webhook::types::{WebHookCallData, WebHookCallParams, WebHookEvent};
    use axum::http::StatusCode;
    use axum::response::IntoResponse;
    use axum::routing::post;
    use axum::{Extension, Json, Router};
    use mockall::{mock, predicate};
    use serde_json::json;
    use std::sync::{Arc, Mutex};
    use std::time::Duration;
    use tokio_util::sync::CancellationToken;

    mock! {
        WebHookHelper {}

        impl Clone for WebHookHelper {
            fn clone(&self) -> Self;
        }

        impl WebHookHelper for WebHookHelper {
            fn insert_web_hook(&self, hook: &WebHook) -> QueryResponse<usize>;
            fn set_state(&self, id: &str, state: WebHookState) -> QueryResponse<usize>;
            fn get_by_id(&self, id: &str) -> QueryResponse<Option<WebHook>>;
            fn get_by_state(&self, state: WebHookState) -> QueryResponse<Vec<WebHook>>;
            fn get_swap_status(&self, id: &str) -> QueryResponse<Option<String>>;
        }
    }

    #[tokio::test]
    async fn test_call_webhook() {
        let mut web_hook_helper = make_mock_hook_helper();

        let id = "gm";
        web_hook_helper
            .expect_set_state()
            .with(predicate::eq(id), predicate::eq(WebHookState::Ok))
            .returning(|_, _| Ok(1));

        let caller = Caller::new(
            CancellationToken::new(),
            Config {
                max_retries: Some(5),
                retry_interval: Some(60),
                request_timeout: Some(10),
            },
            Box::new(web_hook_helper),
        );

        let port = 10001;
        let (cancel_token, received_calls) = start_server(port).await;

        let status = "some.update";

        caller.retry_count.insert(id.to_string(), 21);
        let res = caller
            .call_webhook(
                &WebHook {
                    id: id.to_string(),
                    state: String::from(WebHookState::Ok.as_ref()),
                    url: format!("http://127.0.0.1:{}", port),
                    hash_swap_id: false,
                    status: None,
                },
                &status.to_string(),
            )
            .await
            .unwrap();
        assert_eq!(res, CallResult::Success);

        assert!(caller.retry_count.get(&id.to_string()).is_none());

        assert_eq!(received_calls.lock().unwrap().len(), 1);
        assert_eq!(
            received_calls.lock().unwrap()[0],
            WebHookCallParams {
                event: WebHookEvent::SwapUpdate,
                data: WebHookCallData {
                    id: id.to_string(),
                    status: status.to_string()
                },
            }
        );

        cancel_token.cancel();
    }

    #[tokio::test]
    async fn test_call_webhook_failed_connect() {
        let mut web_hook_helper = make_mock_hook_helper();

        let id = "gm";
        web_hook_helper
            .expect_set_state()
            .with(predicate::eq(id), predicate::eq(WebHookState::Failed))
            .returning(|_, _| Ok(1));

        let caller = Caller::new(
            CancellationToken::new(),
            Config {
                max_retries: None,
                retry_interval: Some(60),
                request_timeout: Some(10),
            },
            Box::new(web_hook_helper),
        );

        let status = "some.update";
        let url = format!("http://127.0.0.1:{}", 10002);
        let res = caller
            .call_webhook(
                &WebHook {
                    id: id.to_string(),
                    state: String::from(WebHookState::Ok.as_ref()),
                    url,
                    hash_swap_id: false,
                    status: None,
                },
                &status.to_string(),
            )
            .await
            .unwrap();
        assert_eq!(res, CallResult::Failed);
    }

    #[tokio::test]
    async fn test_call_webhook_failed_request() {
        let mut web_hook_helper = make_mock_hook_helper();

        let id = "gm";
        web_hook_helper
            .expect_set_state()
            .with(predicate::eq(id), predicate::eq(WebHookState::Failed))
            .returning(|_, _| Ok(1));

        let caller = Caller::new(
            CancellationToken::new(),
            Config {
                max_retries: None,
                retry_interval: Some(60),
                request_timeout: Some(10),
            },
            Box::new(web_hook_helper),
        );

        let port = 10003;
        let (cancel_token, received_calls) = start_server(port).await;

        let status = "some.update";
        let url = format!("http://127.0.0.1:{}/fail", port);
        let res = caller
            .call_webhook(
                &WebHook {
                    id: id.to_string(),
                    state: String::from(WebHookState::Ok.as_ref()),
                    url,
                    hash_swap_id: false,
                    status: None,
                },
                &status.to_string(),
            )
            .await
            .unwrap();
        assert_eq!(res, CallResult::Failed);

        assert_eq!(received_calls.lock().unwrap().len(), 1);
        assert_eq!(
            received_calls.lock().unwrap()[0],
            WebHookCallParams {
                event: WebHookEvent::SwapUpdate,
                data: WebHookCallData {
                    id: id.to_string(),
                    status: status.to_string()
                },
            }
        );

        cancel_token.cancel();
    }

    #[tokio::test]
    async fn test_call_webhook_ignored_status() {
        let mut web_hook_helper = make_mock_hook_helper();

        let id = "gm";
        web_hook_helper
            .expect_set_state()
            .with(predicate::eq(id), predicate::eq(WebHookState::Ok))
            .returning(|_, _| Ok(1));

        let caller = Caller::new(
            CancellationToken::new(),
            Config {
                max_retries: None,
                retry_interval: Some(60),
                request_timeout: Some(10),
            },
            Box::new(web_hook_helper),
        );

        let port = 10004;
        let (cancel_token, received_calls) = start_server(port).await;

        let status = "some.update";
        let url = format!("http://127.0.0.1:{}", port);
        let res = caller
            .call_webhook(
                &WebHook {
                    id: id.to_string(),
                    state: String::from(WebHookState::Ok.as_ref()),
                    url: url.clone(),
                    hash_swap_id: false,
                    status: Some(vec!["other.update".to_string()]),
                },
                &status.to_string(),
            )
            .await
            .unwrap();
        assert_eq!(res, CallResult::NotIncluded);
        assert_eq!(received_calls.lock().unwrap().len(), 0);

        let res = caller
            .call_webhook(
                &WebHook {
                    id: id.to_string(),
                    state: String::from(WebHookState::Ok.as_ref()),
                    url,
                    hash_swap_id: false,
                    status: Some(vec![status.to_string()]),
                },
                &status.to_string(),
            )
            .await
            .unwrap();
        assert_eq!(res, CallResult::Success);
        assert_eq!(received_calls.lock().unwrap().len(), 1);

        cancel_token.cancel();
    }

    #[tokio::test]
    async fn test_start_retry() {
        let mut web_hook_helper = make_mock_hook_helper();

        let port = 10005;

        let id = "gm";
        let status = "some.update";
        let url = format!("http://127.0.0.1:{}", port);

        web_hook_helper
            .expect_get_by_state()
            .with(predicate::eq(WebHookState::Failed))
            .returning(move |_| {
                Ok(vec![WebHook {
                    url: url.clone(),
                    id: id.to_string(),
                    state: WebHookState::Failed.as_ref().to_string(),
                    hash_swap_id: false,
                    status: None,
                }])
            });

        web_hook_helper
            .expect_get_swap_status()
            .with(predicate::eq(id))
            .returning(|_| Ok(Some(status.to_string())));

        web_hook_helper
            .expect_set_state()
            .with(predicate::eq(id), predicate::eq(WebHookState::Ok))
            .returning(|_, _| Ok(1));

        let caller_cancel = CancellationToken::new();
        let caller = Caller::new(
            caller_cancel.clone(),
            Config {
                max_retries: None,
                retry_interval: Some(1),
                request_timeout: Some(1),
            },
            Box::new(web_hook_helper),
        );

        let (cancel_token, received_calls) = start_server(port).await;

        let caller_cp = caller.clone();
        let retry_loop_future = tokio::spawn(async move {
            caller_cp.start().await;
        });
        tokio::time::sleep(Duration::from_millis(900)).await;

        assert_eq!(received_calls.lock().unwrap().len(), 1);
        assert_eq!(
            received_calls.lock().unwrap()[0],
            WebHookCallParams {
                event: WebHookEvent::SwapUpdate,
                data: WebHookCallData {
                    id: id.to_string(),
                    status: status.to_string()
                },
            }
        );

        caller_cancel.cancel();
        cancel_token.cancel();

        retry_loop_future.await.unwrap();
    }

    #[tokio::test]
    async fn test_retry_calls() {
        let mut web_hook_helper = make_mock_hook_helper();

        let port = 10006;

        let id = "gm";
        let status = "some.update";
        let id_two = "gm2";
        let status_two = "other.update";
        let url = format!("http://127.0.0.1:{}", port);

        web_hook_helper
            .expect_get_by_state()
            .with(predicate::eq(WebHookState::Failed))
            .returning(move |_| {
                Ok(vec![
                    WebHook {
                        url: url.clone(),
                        id: id.to_string(),
                        state: WebHookState::Failed.as_ref().to_string(),
                        hash_swap_id: false,
                        status: None,
                    },
                    WebHook {
                        url: url.clone(),
                        id: id_two.to_string(),
                        state: WebHookState::Failed.as_ref().to_string(),
                        hash_swap_id: true,
                        status: None,
                    },
                ])
            });

        web_hook_helper
            .expect_get_swap_status()
            .returning(move |param| {
                if param == id {
                    return Ok(Some(status.to_string()));
                } else if param == id_two {
                    return Ok(Some(status_two.to_string()));
                }

                panic!("invalid id");
            });

        web_hook_helper.expect_set_state().returning(|_, _| Ok(1));

        let caller_cancel = CancellationToken::new();
        let caller = Caller::new(
            caller_cancel.clone(),
            Config {
                max_retries: Some(5),
                retry_interval: Some(5),
                request_timeout: Some(5),
            },
            Box::new(web_hook_helper),
        );

        let (cancel_token, received_calls) = start_server(port).await;
        caller.retry_calls().await.unwrap();

        assert_eq!(received_calls.lock().unwrap().len(), 2);
        assert!(received_calls.lock().unwrap().iter().any(|entry| {
            *entry
                == WebHookCallParams {
                    event: WebHookEvent::SwapUpdate,
                    data: WebHookCallData {
                        id: id.to_string(),
                        status: status.to_string(),
                    },
                }
        }));
        assert!(received_calls.lock().unwrap().iter().any(|entry| {
            *entry
                == WebHookCallParams {
                    event: WebHookEvent::SwapUpdate,
                    data: WebHookCallData {
                        id: Caller::format_swap_id(id_two.to_string(), true),
                        status: status_two.to_string(),
                    },
                }
        }));

        cancel_token.cancel();
    }

    #[tokio::test]
    async fn test_retry_calls_abandon() {
        let mut web_hook_helper = make_mock_hook_helper();

        let port = 10007;

        let id = "gm";
        let status = "some.update";
        let url = format!("http://127.0.0.1:{}", port);

        web_hook_helper
            .expect_get_by_state()
            .with(predicate::eq(WebHookState::Failed))
            .returning(move |_| {
                Ok(vec![WebHook {
                    url: url.clone(),
                    id: id.to_string(),
                    state: WebHookState::Failed.as_ref().to_string(),
                    hash_swap_id: false,
                    status: None,
                }])
            });

        web_hook_helper
            .expect_get_swap_status()
            .returning(move |_| Ok(Some(status.to_string())));

        web_hook_helper
            .expect_set_state()
            .returning(move |_, _| Ok(1));

        let caller_cancel = CancellationToken::new();
        let max_retries = 2;
        let caller = Caller::new(
            caller_cancel.clone(),
            Config {
                max_retries: Some(max_retries),
                retry_interval: Some(5),
                request_timeout: Some(5),
            },
            Box::new(web_hook_helper),
        );

        assert!(caller.retry_count.get(&id.to_string()).is_none());
        caller.retry_calls().await.unwrap();
        assert_eq!(*caller.retry_count.get(&id.to_string()).unwrap().value(), 1);
        caller.retry_calls().await.unwrap();
        assert!(caller.retry_count.get(&id.to_string()).is_none());
    }

    #[tokio::test]
    async fn test_retry_calls_not_included() {
        let mut web_hook_helper = make_mock_hook_helper();

        let id = "included";
        let status = "not.included";
        let url = format!("http://127.0.0.1:{}", 1234);

        web_hook_helper
            .expect_get_by_state()
            .with(predicate::eq(WebHookState::Failed))
            .returning(move |_| {
                Ok(vec![WebHook {
                    url: url.clone(),
                    id: id.to_string(),
                    hash_swap_id: false,
                    status: Some(vec!["invoice.set".to_string()]),
                    state: WebHookState::Failed.as_ref().to_string(),
                }])
            });

        web_hook_helper
            .expect_get_swap_status()
            .returning(move |_| Ok(Some(status.to_string())));

        web_hook_helper
            .expect_set_state()
            .with(predicate::eq(id), predicate::eq(WebHookState::Abandoned))
            .returning(move |_, _| Ok(1));

        let caller_cancel = CancellationToken::new();
        let max_retries = 2;
        let caller = Caller::new(
            caller_cancel.clone(),
            Config {
                max_retries: Some(max_retries),
                retry_interval: Some(5),
                request_timeout: Some(5),
            },
            Box::new(web_hook_helper),
        );

        assert!(caller.retry_count.get(&id.to_string()).is_none());
        caller.retry_calls().await.unwrap();
        assert!(caller.retry_count.get(&id.to_string()).is_none());
    }

    #[test]
    fn test_validate_url_valid() {
        assert!(Caller::validate_url("https://bol.tz").is_none());
    }

    #[test]
    fn test_validate_url_max_length() {
        assert_eq!(
            Caller::validate_url(&(0..MAX_URL_LENGTH + 1).map(|_| "B").collect::<String>())
                .unwrap()
                .to_string(),
            UrlError::MoreThanMaxLen.to_string(),
        );
    }

    #[test]
    fn test_validate_url_parse_fail() {
        assert_eq!(
            Caller::validate_url("invalid url").unwrap().to_string(),
            "relative URL without a base",
        );
    }

    #[test]
    fn test_validate_url_not_https() {
        assert_eq!(
            Caller::validate_url("http://bol.tz").unwrap().to_string(),
            UrlError::HttpsRequired.to_string(),
        );
    }

    #[test]
    fn test_format_swap_id_no_hash() {
        let id = String::from("test");
        assert_eq!(Caller::format_swap_id(id.clone(), false), id);
    }

    #[test]
    fn test_format_swap_id_hash() {
        let id = String::from("test");
        assert_eq!(
            Caller::format_swap_id(id, true),
            "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08".to_string()
        );
    }

    async fn start_server(port: u16) -> (CancellationToken, Arc<Mutex<Vec<WebHookCallParams>>>) {
        struct ServerState {
            received_calls: Arc<Mutex<Vec<WebHookCallParams>>>,
        }

        async fn ok_handler(
            Extension(state): Extension<Arc<ServerState>>,
            Json(body): Json<WebHookCallParams>,
        ) -> impl IntoResponse {
            state.received_calls.lock().unwrap().push(body);
            (StatusCode::OK, Json(json!("{}")))
        }

        async fn failed_handler(
            Extension(state): Extension<Arc<ServerState>>,
            Json(body): Json<WebHookCallParams>,
        ) -> impl IntoResponse {
            state.received_calls.lock().unwrap().push(body);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!("{\"error\": \"ngmi\"}")),
            )
        }

        let received_calls = Arc::new(Mutex::new(Vec::new()));
        let router = Router::new()
            .route("/", post(ok_handler))
            .route("/fail", post(failed_handler))
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

    fn make_mock_hook_helper() -> MockWebHookHelper {
        let mut hook_helper = MockWebHookHelper::new();
        hook_helper.expect_clone().returning(make_mock_hook_helper);

        hook_helper
    }
}

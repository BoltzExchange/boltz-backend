use anyhow::Result;
use dashmap::DashMap;
use futures::future;
use reqwest::Url;
use serde::{Deserialize, Serialize};
use std::error::Error;
use std::fmt::Debug;
use std::net::IpAddr;
use std::str::FromStr;
use std::sync::Arc;
use std::time::Duration;
use std::{cmp, fmt};
use tokio::sync::broadcast::{Receiver, Sender};
use tokio_util::sync::CancellationToken;
use tracing::{debug, error, info, instrument, trace, warn};

use crate::db::models::WebHookState;
use crate::webhook::types::WebHookCallParams;
use crate::webhook::{WebHookCallData, WebHookEvent};

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

#[derive(Debug, Copy, Clone, PartialEq)]
pub enum UrlError {
    MoreThanMaxLen,
    HttpsRequired,
    InvalidHost,
    Blocked,
}

impl fmt::Display for UrlError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match *self {
            UrlError::MoreThanMaxLen => {
                f.write_str("URL length is more than the maximum length permitted")
            }
            UrlError::HttpsRequired => f.write_str("only HTTPS URLs are permitted"),
            UrlError::InvalidHost => f.write_str("invalid host"),
            UrlError::Blocked => f.write_str("blocked host"),
        }
    }
}

impl Error for UrlError {}

#[derive(Serialize, Deserialize, Default, PartialEq, Clone, Debug)]
pub struct Config {
    #[serde(rename = "requestTimeout")]
    pub request_timeout: Option<u64>,
    #[serde(rename = "maxRetries")]
    pub max_retries: Option<u64>,
    #[serde(rename = "retryInterval")]
    pub retry_interval: Option<u64>,
    #[serde(rename = "blockList")]
    pub block_list: Option<Vec<String>>,
}

pub trait Hook {
    type Id;

    fn id(&self) -> Self::Id;
    fn url(&self) -> String;
}

pub trait HookState<H: Hook> {
    fn should_be_skipped(&self, hook: &H, params: &WebHookCallData) -> bool;

    fn get_by_state(&self, state: WebHookState) -> Result<Vec<H>>;
    fn get_retry_data(&self, hook: &H) -> Result<Option<WebHookCallData>>;
    fn set_state(&self, hook: &H, state: WebHookState) -> Result<()>;
}

#[derive(Clone)]
pub struct Caller<H, S>
where
    H: Hook + Clone + Send + Sync,
    S: HookState<H> + Clone + Send + Sync,
{
    name: String,
    hook_state: Arc<S>,
    cancellation_token: CancellationToken,
    retry_count: Arc<DashMap<H::Id, u64>>,
    successful_calls: Sender<(H, Vec<u8>)>,

    allow_insecure: bool,
    request_timeout: Duration,
    max_retries: u64,
    retry_interval: Duration,
    block_list: Vec<String>,
}

impl<H, S> Caller<H, S>
where
    H: Hook + Clone + Debug + Send + Sync + 'static,
    H::Id: fmt::Display + Eq + std::hash::Hash + Clone + Send + Sync + 'static,
    S: HookState<H> + Clone + Send + Sync + 'static,
{
    pub fn new(
        cancellation_token: CancellationToken,
        name: String,
        config: Config,
        allow_insecure: bool,
        hook_state: S,
    ) -> Self {
        let max_retries = config.max_retries.unwrap_or(DEFAULT_MAX_RETRIES);
        debug!("Max {} WebHook call retries: {}", name, max_retries);

        let timeout = config.request_timeout.unwrap_or(DEFAULT_REQUEST_TIMEOUT);
        trace!("{} WebHook call timeout: {}s", name, timeout);

        let (tx, _) = tokio::sync::broadcast::channel(256);

        Self {
            name,
            max_retries,
            allow_insecure,
            cancellation_token,
            successful_calls: tx,
            hook_state: Arc::new(hook_state),
            retry_count: Arc::new(DashMap::new()),
            request_timeout: Duration::from_secs(timeout),
            retry_interval: Duration::from_secs(
                config.retry_interval.unwrap_or(DEFAULT_RETRY_INTERVAL),
            ),
            block_list: config.block_list.unwrap_or_default(),
        }
    }

    pub async fn start(&self) {
        info!("Starting {} WebHook retry loop", self.name);

        let retry = || async {
            trace!("Retrying failed {} WebHook calls", self.name);
            match self.retry_calls().await {
                Ok(_) => {}
                Err(err) => {
                    error!("{} WebHook retry iteration failed: {}", self.name, err);
                }
            };
        };

        retry().await;

        debug!(
            "Retrying failed {} WebHook calls every: {:#?}",
            self.name, self.retry_interval
        );

        loop {
            tokio::select! {
                _ = tokio::time::sleep(self.retry_interval) => {
                    retry().await;
                }
                _ = self.cancellation_token.cancelled() => {
                    debug!("Stopping {} WebHook retry loop", self.name);
                    break;
                }
            }
        }
    }

    pub fn validate_url(&self, url: &str, allow_http: bool) -> Result<()> {
        if url.len() > MAX_URL_LENGTH {
            return Err(UrlError::MoreThanMaxLen.into());
        }

        let url = match Url::parse(url) {
            Ok(url) => url,
            Err(err) => return Err(err.into()),
        };

        if !allow_http && url.scheme() != "https" {
            return Err(UrlError::HttpsRequired.into());
        }

        let host = url.host_str().ok_or(UrlError::InvalidHost)?;
        if self.block_list.iter().any(|blocked| host.contains(blocked)) {
            return Err(UrlError::Blocked.into());
        }

        Ok(())
    }

    pub fn subscribe_successful_calls(&self) -> Receiver<(H, Vec<u8>)> {
        self.successful_calls.subscribe()
    }

    #[instrument(name = "Caller::call_webhook", skip(self, hook, data))]
    pub async fn call_webhook(
        &self,
        hook: H,
        data: WebHookCallData,
    ) -> Result<CallResult, Box<dyn Error>> {
        if self.hook_state.should_be_skipped(&hook, &data) {
            trace!("Skipping call to {} WebHook for {}", self.name, hook.id());
            return Ok(CallResult::NotIncluded);
        }

        if let Err(err) = check_ip(&hook.url(), self.allow_insecure).await {
            warn!(
                "IP check failed for {} WebHook {}: {}",
                self.name,
                hook.id(),
                err
            );
            return Ok(CallResult::Failed);
        }

        debug!(
            "Calling {} WebHook for {}: {}",
            self.name,
            hook.id(),
            hook.url(),
        );

        let client = reqwest::Client::builder()
            .connect_timeout(self.request_timeout)
            .timeout(self.request_timeout)
            .build()
            .unwrap();

        let res = match client
            .post(hook.url())
            .json(&WebHookCallParams {
                event: match data {
                    WebHookCallData::SwapUpdate(_) => WebHookEvent::SwapUpdate,
                    WebHookCallData::InvoiceRequest(_) => WebHookEvent::InvoiceRequest,
                },
                data,
            })
            .send()
            .await
        {
            Ok(res) => {
                let status = res.status();
                if status.is_success() {
                    res.bytes().await.map_err(|err| anyhow::anyhow!(err))
                } else {
                    Err(anyhow::anyhow!("HTTP {}", status.as_u16()))
                }
            }
            Err(err) => Err(anyhow::anyhow!(err)),
        };

        match res {
            Ok(res) => {
                info!("Called {} WebHook for {}", self.name, hook.id());

                #[cfg(feature = "metrics")]
                metrics::counter!(crate::metrics::WEBHOOK_CALL_COUNT, "status" => "success", "type" => self.name.clone())
                    .increment(1);

                self.retry_count.remove(&hook.id());
                self.hook_state.set_state(&hook, WebHookState::Ok)?;

                if self.successful_calls.receiver_count() > 0
                    && let Err(send_err) = self.successful_calls.send((hook, res.to_vec()))
                {
                    warn!(
                        "Failed to send successful WebHook call to channel: {}",
                        send_err
                    );
                }

                Ok(CallResult::Success)
            }
            Err(err) => {
                warn!(
                    "{} WebHook request for {} failed: {}",
                    self.name,
                    hook.id(),
                    err
                );

                #[cfg(feature = "metrics")]
                metrics::counter!(crate::metrics::WEBHOOK_CALL_COUNT, "status" => "failed", "type" => self.name.clone())
                    .increment(1);

                self.hook_state.set_state(&hook, WebHookState::Failed)?;

                Ok(CallResult::Failed)
            }
        }
    }

    #[instrument(name = "Caller::retry_calls", skip(self))]
    async fn retry_calls(&self) -> Result<(), Box<dyn Error>> {
        let to_retry = self.hook_state.get_by_state(WebHookState::Failed)?;

        if to_retry.is_empty() {
            return Ok(());
        }

        debug!("Retrying {} {} WebHook calls", to_retry.len(), self.name);

        let num_workers = cmp::min(num_cpus::get(), to_retry.len());
        let (sender, receiver) = crossbeam_channel::unbounded();

        let self_cp = self.clone();
        let futures: Vec<_> = (0..num_workers)
            .map(|_| {
                let self_cp = self_cp.clone();
                let receiver: crossbeam_channel::Receiver<H> = receiver.clone();

                tokio::spawn(async move {
                    while let Ok(hook) = receiver.recv() {
                        let id = hook.id();
                        if let Err(err) = self_cp.retry_call(hook).await {
                            warn!(
                                "Could not retry {} WebHook call for {}: {}",
                                self_cp.name, id, err
                            );
                        };
                    }
                })
            })
            .collect();

        to_retry
            .into_iter()
            .for_each(|entry| sender.send(entry).unwrap());
        drop(sender);

        future::join_all(futures).await;
        Ok(())
    }

    #[instrument(name = "Caller::retry_call", skip(self, hook))]
    async fn retry_call(&self, hook: H) -> Result<(), Box<dyn Error>> {
        let params = self.hook_state.get_retry_data(&hook)?;

        let abandon_hook = |hook: H| -> Result<(), Box<dyn Error>> {
            info!("Abandoning {} WebHook call for {}", self.name, hook.id());

            #[cfg(feature = "metrics")]
            metrics::counter!(
                crate::metrics::WEBHOOK_CALL_COUNT,
                "status" => "abandoned",
                "type" => self.name.clone()
            )
            .increment(1);

            self.retry_count.remove(&hook.id());
            self.hook_state.set_state(&hook, WebHookState::Abandoned)?;

            Ok(())
        };

        if let Some(params) = params {
            trace!(
                "Retrying {} WebHook call for {}: {}",
                self.name,
                hook.id(),
                hook.url()
            );
            let res = self.call_webhook(hook.clone(), params).await?;

            if res == CallResult::Success {
                self.retry_count.remove(&hook.id());
                return Ok(());
            }

            let prev_count = match self.retry_count.get(&hook.id()) {
                Some(val) => *val.value(),
                None => 0,
            };

            let failed_count = prev_count + 1;
            debug!(
                "{} WebHook retry call {}/{} for {} failed",
                self.name,
                failed_count,
                self.max_retries,
                hook.id()
            );

            if res == CallResult::NotIncluded || failed_count >= self.max_retries {
                abandon_hook(hook)?;
            } else {
                self.retry_count.insert(hook.id(), failed_count);
            }
        } else {
            warn!(
                "No {} WebHook call data for {} in database",
                self.name,
                hook.id()
            );

            abandon_hook(hook)?;
        }

        Ok(())
    }
}

pub async fn check_ip(url: &str, allow_insecure: bool) -> Result<()> {
    if allow_insecure {
        return Ok(());
    }

    const DNS_LOOKUP_TIMEOUT: u64 = 2;

    fn sanitize_ipv6(host: &str) -> &str {
        host.strip_prefix("[")
            .unwrap_or(host)
            .strip_suffix("]")
            .unwrap_or(host)
    }

    let url = Url::parse(url)?;
    let host = url.host_str().ok_or(UrlError::InvalidHost)?;

    let ips = match IpAddr::from_str(sanitize_ipv6(host)) {
        Ok(ip) => vec![ip],
        Err(_) => tokio::time::timeout(
            tokio::time::Duration::from_secs(DNS_LOOKUP_TIMEOUT),
            tokio::net::lookup_host(format!(
                "{}:{}",
                host,
                url.port_or_known_default().unwrap_or(443)
            )),
        )
        .await??
        .map(|sock| sock.ip())
        .collect(),
    };

    if ips.iter().any(|ip| match ip {
        IpAddr::V4(ip) => {
            ip.is_loopback()
                || ip.is_link_local()
                || ip.is_multicast()
                || ip.is_broadcast()
                || ip.is_private()
                || ip.is_unspecified()
        }
        IpAddr::V6(ip) => {
            ip.is_loopback()
                || ip.is_multicast()
                || ip.is_unicast_link_local()
                || ip.is_unique_local()
                || ip.is_unspecified()
        }
    }) {
        return Err(UrlError::InvalidHost.into());
    }

    Ok(())
}

#[cfg(test)]
mod caller_test {
    use super::*;
    use crate::db::models::{WebHook, WebHookState};
    use crate::webhook::SwapUpdateCallData;
    use crate::webhook::types::{WebHookCallData, WebHookCallParams, WebHookEvent};
    use axum::http::StatusCode;
    use axum::response::IntoResponse;
    use axum::routing::post;
    use axum::{Extension, Json, Router};
    use mockall::{mock, predicate};
    use rstest::rstest;
    use serde_json::json;
    use std::sync::{Arc, Mutex};
    use std::time::Duration;
    use tokio_util::sync::CancellationToken;

    mock! {
        HookState {}

        impl Clone for HookState {
            fn clone(&self) -> Self;
        }

        impl HookState<WebHook> for HookState {
            fn should_be_skipped(&self, hook: &WebHook, params: &WebHookCallData) -> bool;

            fn get_by_state(&self, state: WebHookState) -> Result<Vec<WebHook>>;
            fn get_retry_data(&self, id: &WebHook) -> Result<Option<WebHookCallData>>;
            fn set_state(&self, id: &WebHook, state: WebHookState) -> Result<()>;
        }
    }

    #[tokio::test]
    async fn test_call_webhook() {
        let mut web_hook_helper = make_mock_hook_state();
        web_hook_helper
            .expect_should_be_skipped()
            .returning(|_, _| false);

        let id = "gm";
        let port = 10001;

        let hook = WebHook {
            id: id.to_string(),
            url: format!("http://127.0.0.1:{port}"),
            ..Default::default()
        };

        web_hook_helper
            .expect_set_state()
            .with(predicate::eq(hook.clone()), predicate::eq(WebHookState::Ok))
            .returning(|_, _| Ok(()));

        let caller = Caller::new(
            CancellationToken::new(),
            "test".to_string(),
            Config {
                max_retries: Some(5),
                retry_interval: Some(60),
                request_timeout: Some(10),
                block_list: None,
            },
            true,
            web_hook_helper,
        );

        let (cancel_token, received_calls, _received_headers) = start_server(port).await;
        let data = WebHookCallData::SwapUpdate(SwapUpdateCallData {
            id: id.to_string(),
            status: "some.update".to_string(),
        });

        caller.retry_count.insert(id.to_string(), 21);
        let res = caller.call_webhook(hook, data.clone()).await.unwrap();
        assert!(res == CallResult::Success);

        assert!(caller.retry_count.get(&id.to_string()).is_none());

        assert_eq!(received_calls.lock().unwrap().len(), 1);
        assert_eq!(
            received_calls.lock().unwrap()[0],
            WebHookCallParams {
                event: WebHookEvent::SwapUpdate,
                data,
            }
        );

        cancel_token.cancel();
    }

    #[tokio::test]
    async fn test_call_webhook_content_type_header() {
        let mut web_hook_helper = make_mock_hook_state();
        web_hook_helper
            .expect_should_be_skipped()
            .returning(|_, _| false);

        let id = "header_test";
        let port = 10008;

        let hook = WebHook {
            id: id.to_string(),
            url: format!("http://127.0.0.1:{port}"),
            ..Default::default()
        };

        web_hook_helper
            .expect_set_state()
            .with(predicate::eq(hook.clone()), predicate::eq(WebHookState::Ok))
            .returning(|_, _| Ok(()));

        let caller = Caller::new(
            CancellationToken::new(),
            "test".to_string(),
            Config {
                max_retries: Some(5),
                retry_interval: Some(60),
                request_timeout: Some(10),
                block_list: None,
            },
            true,
            web_hook_helper,
        );

        let (cancel_token, received_calls, received_headers) = start_server(port).await;
        let data = WebHookCallData::SwapUpdate(SwapUpdateCallData {
            id: id.to_string(),
            status: "header.test".to_string(),
        });

        let res = caller.call_webhook(hook, data.clone()).await.unwrap();
        assert!(res == CallResult::Success);

        assert_eq!(received_calls.lock().unwrap().len(), 1);
        let headers = received_headers.lock().unwrap();
        assert_eq!(headers.len(), 1);
        assert_eq!(
            headers[0], "application/json",
            "Content-Type header should be application/json"
        );

        cancel_token.cancel();
    }

    #[tokio::test]
    async fn test_call_webhook_failed_connect() {
        let mut web_hook_helper = make_mock_hook_state();
        web_hook_helper
            .expect_should_be_skipped()
            .returning(|_, _| false);

        let id = "gm";
        let hook = WebHook {
            url: format!("http://127.0.0.1:{}", 10002),
            id: id.to_string(),
            ..Default::default()
        };

        web_hook_helper
            .expect_set_state()
            .with(
                predicate::eq(hook.clone()),
                predicate::eq(WebHookState::Failed),
            )
            .returning(|_, _| Ok(()));

        let caller = Caller::new(
            CancellationToken::new(),
            "test".to_string(),
            Config {
                max_retries: None,
                retry_interval: Some(60),
                request_timeout: Some(10),
                block_list: None,
            },
            true,
            web_hook_helper,
        );

        let res = caller
            .call_webhook(
                hook,
                WebHookCallData::SwapUpdate(SwapUpdateCallData {
                    id: id.to_string(),
                    status: "some.update".to_string(),
                }),
            )
            .await
            .unwrap();
        assert_eq!(res, CallResult::Failed);
    }

    #[tokio::test]
    async fn test_call_webhook_failed_request() {
        let mut web_hook_helper = make_mock_hook_state();
        web_hook_helper
            .expect_should_be_skipped()
            .returning(|_, _| false);

        let id = "gm";
        let port = 10003;
        let hook = WebHook {
            id: id.to_string(),
            url: format!("http://127.0.0.1:{port}/fail"),
            ..Default::default()
        };

        web_hook_helper
            .expect_set_state()
            .with(
                predicate::eq(hook.clone()),
                predicate::eq(WebHookState::Failed),
            )
            .returning(|_, _| Ok(()));

        let caller = Caller::new(
            CancellationToken::new(),
            "test".to_string(),
            Config {
                max_retries: None,
                retry_interval: Some(60),
                request_timeout: Some(10),
                block_list: None,
            },
            true,
            web_hook_helper,
        );

        let (cancel_token, received_calls, _received_headers) = start_server(port).await;

        let data = WebHookCallData::SwapUpdate(SwapUpdateCallData {
            id: id.to_string(),
            status: "some.update".to_string(),
        });

        let res = caller.call_webhook(hook, data.clone()).await.unwrap();
        assert_eq!(res, CallResult::Failed);

        assert_eq!(received_calls.lock().unwrap().len(), 1);
        assert_eq!(
            received_calls.lock().unwrap()[0],
            WebHookCallParams {
                event: WebHookEvent::SwapUpdate,
                data,
            }
        );

        cancel_token.cancel();
    }

    #[tokio::test]
    async fn test_call_webhook_skipped() {
        let mut web_hook_helper = make_mock_hook_state();
        let mut is_first_call = true;
        web_hook_helper
            .expect_should_be_skipped()
            .times(2)
            .returning(move |_, _| {
                if is_first_call {
                    is_first_call = false;
                    true
                } else {
                    false
                }
            });

        let id = "gm";
        let port = 10004;
        let url = format!("http://127.0.0.1:{port}");
        let hook = WebHook {
            id: id.to_string(),
            url: url.clone(),
            ..Default::default()
        };

        web_hook_helper
            .expect_set_state()
            .with(predicate::eq(hook.clone()), predicate::eq(WebHookState::Ok))
            .returning(|_, _| Ok(()));

        let caller = Caller::new(
            CancellationToken::new(),
            "test".to_string(),
            Config {
                max_retries: None,
                retry_interval: Some(60),
                request_timeout: Some(10),
                block_list: None,
            },
            true,
            web_hook_helper,
        );

        let (cancel_token, received_calls, _received_headers) = start_server(port).await;

        let data = WebHookCallData::SwapUpdate(SwapUpdateCallData {
            id: id.to_string(),
            status: "some.update".to_string(),
        });

        let res = caller
            .call_webhook(hook.clone(), data.clone())
            .await
            .unwrap();
        assert_eq!(res, CallResult::NotIncluded);
        assert_eq!(received_calls.lock().unwrap().len(), 0);

        let res = caller.call_webhook(hook, data).await.unwrap();
        assert_eq!(res, CallResult::Success);
        assert_eq!(received_calls.lock().unwrap().len(), 1);

        cancel_token.cancel();
    }

    #[tokio::test]
    async fn test_start_retry() {
        let mut web_hook_helper = make_mock_hook_state();
        web_hook_helper
            .expect_should_be_skipped()
            .returning(|_, _| false);

        let port = 10005;

        let id = "gm";
        let status = "some.update";

        let hook = WebHook {
            url: format!("http://127.0.0.1:{port}"),
            id: id.to_string(),
            state: WebHookState::Failed.as_ref().to_string(),
            hash_swap_id: false,
            status: None,
        };

        let hook_cp = hook.clone();
        web_hook_helper
            .expect_get_by_state()
            .with(predicate::eq(WebHookState::Failed))
            .returning(move |_| Ok(vec![hook_cp.clone()]));

        web_hook_helper
            .expect_get_retry_data()
            .with(predicate::eq(WebHook {
                url: format!("http://127.0.0.1:{port}"),
                id: id.to_string(),
                state: WebHookState::Failed.as_ref().to_string(),
                hash_swap_id: false,
                status: None,
            }))
            .returning(|_| {
                Ok(Some(WebHookCallData::SwapUpdate(SwapUpdateCallData {
                    id: id.to_string(),
                    status: status.to_string(),
                })))
            });

        web_hook_helper
            .expect_set_state()
            .with(predicate::eq(hook), predicate::eq(WebHookState::Ok))
            .returning(|_, _| Ok(()));

        let caller_cancel = CancellationToken::new();
        let caller = Caller::new(
            caller_cancel.clone(),
            "test".to_string(),
            Config {
                max_retries: None,
                retry_interval: Some(1),
                request_timeout: Some(1),
                block_list: None,
            },
            true,
            web_hook_helper,
        );

        let (cancel_token, received_calls, _received_headers) = start_server(port).await;

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
                data: WebHookCallData::SwapUpdate(SwapUpdateCallData {
                    id: id.to_string(),
                    status: status.to_string(),
                }),
            }
        );

        caller_cancel.cancel();
        cancel_token.cancel();

        retry_loop_future.await.unwrap();
    }

    #[tokio::test]
    async fn test_retry_calls() {
        let mut web_hook_helper = make_mock_hook_state();
        web_hook_helper
            .expect_should_be_skipped()
            .returning(|_, _| false);

        let port = 10006;

        let id = "gm";
        let status = "some.update";
        let id_two = "gm2";
        let status_two = "other.update";
        let url = format!("http://127.0.0.1:{port}");

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
            .expect_get_retry_data()
            .returning(move |param| {
                if param.id == id {
                    return Ok(Some(WebHookCallData::SwapUpdate(SwapUpdateCallData {
                        id: id.to_string(),
                        status: status.to_string(),
                    })));
                } else if param.id == id_two {
                    return Ok(Some(WebHookCallData::SwapUpdate(SwapUpdateCallData {
                        id: id_two.to_string(),
                        status: status_two.to_string(),
                    })));
                }

                panic!("invalid id");
            });

        web_hook_helper.expect_set_state().returning(|_, _| Ok(()));

        let caller_cancel = CancellationToken::new();
        let caller = Caller::new(
            caller_cancel.clone(),
            "test".to_string(),
            Config {
                max_retries: Some(5),
                retry_interval: Some(5),
                request_timeout: Some(5),
                block_list: None,
            },
            true,
            web_hook_helper,
        );

        let (cancel_token, received_calls, _received_headers) = start_server(port).await;
        caller.retry_calls().await.unwrap();

        assert_eq!(received_calls.lock().unwrap().len(), 2);
        assert!(received_calls.lock().unwrap().iter().any(|entry| {
            *entry
                == WebHookCallParams {
                    event: WebHookEvent::SwapUpdate,
                    data: WebHookCallData::SwapUpdate(SwapUpdateCallData {
                        id: id.to_string(),
                        status: status.to_string(),
                    }),
                }
        }));
        assert!(received_calls.lock().unwrap().iter().any(|entry| {
            *entry
                == WebHookCallParams {
                    event: WebHookEvent::SwapUpdate,
                    data: WebHookCallData::SwapUpdate(SwapUpdateCallData {
                        id: id_two.to_string(),
                        status: status_two.to_string(),
                    }),
                }
        }));

        cancel_token.cancel();
    }

    #[tokio::test]
    async fn test_retry_calls_abandon() {
        let mut web_hook_helper = make_mock_hook_state();
        web_hook_helper
            .expect_should_be_skipped()
            .returning(|_, _| false);

        let port = 10007;

        let id = "gm";
        let status = "some.update";
        let url = format!("http://127.0.0.1:{port}");

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

        web_hook_helper.expect_get_retry_data().returning(move |_| {
            Ok(Some(WebHookCallData::SwapUpdate(SwapUpdateCallData {
                id: id.to_string(),
                status: status.to_string(),
            })))
        });

        web_hook_helper
            .expect_set_state()
            .returning(move |_, _| Ok(()));

        let caller_cancel = CancellationToken::new();
        let max_retries = 2;
        let caller = Caller::new(
            caller_cancel.clone(),
            "test".to_string(),
            Config {
                max_retries: Some(max_retries),
                retry_interval: Some(5),
                request_timeout: Some(5),
                block_list: None,
            },
            true,
            web_hook_helper,
        );

        assert!(caller.retry_count.get(&id.to_string()).is_none());
        caller.retry_calls().await.unwrap();
        assert_eq!(*caller.retry_count.get(&id.to_string()).unwrap().value(), 1);
        caller.retry_calls().await.unwrap();
        assert!(caller.retry_count.get(&id.to_string()).is_none());
    }

    #[tokio::test]
    async fn test_retry_calls_not_included() {
        let mut web_hook_helper = make_mock_hook_state();
        web_hook_helper
            .expect_should_be_skipped()
            .returning(|_, _| true);

        let id = "included";
        let status = "not.included";
        let url = format!("http://127.0.0.1:{}", 1234);

        let hook = WebHook {
            url: url.clone(),
            id: id.to_string(),
            hash_swap_id: false,
            status: Some(vec!["invoice.set".to_string()]),
            state: WebHookState::Failed.as_ref().to_string(),
        };
        let hook_cp = hook.clone();
        web_hook_helper
            .expect_get_by_state()
            .with(predicate::eq(WebHookState::Failed))
            .returning(move |_| Ok(vec![hook_cp.clone()]));

        web_hook_helper.expect_get_retry_data().returning(move |_| {
            Ok(Some(WebHookCallData::SwapUpdate(SwapUpdateCallData {
                id: id.to_string(),
                status: status.to_string(),
            })))
        });

        web_hook_helper
            .expect_set_state()
            .with(
                predicate::eq(hook.clone()),
                predicate::eq(WebHookState::Abandoned),
            )
            .returning(move |_, _| Ok(()));

        let caller_cancel = CancellationToken::new();
        let max_retries = 2;
        let caller = Caller::new(
            caller_cancel.clone(),
            "test".to_string(),
            Config {
                max_retries: Some(max_retries),
                retry_interval: Some(5),
                request_timeout: Some(5),
                block_list: None,
            },
            true,
            web_hook_helper,
        );

        assert!(caller.retry_count.get(&id.to_string()).is_none());
        caller.retry_calls().await.unwrap();
        assert!(caller.retry_count.get(&id.to_string()).is_none());
    }

    fn get_validate_caller() -> Caller<WebHook, MockHookState> {
        Caller::new(
            CancellationToken::new(),
            "test".to_string(),
            Config::default(),
            true,
            make_mock_hook_state(),
        )
    }

    #[test]
    fn test_validate_url_valid() {
        assert!(
            get_validate_caller()
                .validate_url("https://bol.tz", false)
                .is_ok()
        );
    }

    #[test]
    fn test_validate_url_max_length() {
        assert_eq!(
            get_validate_caller()
                .validate_url(
                    &(0..MAX_URL_LENGTH + 1).map(|_| "B").collect::<String>(),
                    false
                )
                .err()
                .unwrap()
                .to_string(),
            UrlError::MoreThanMaxLen.to_string(),
        );
    }

    #[test]
    fn test_validate_url_parse_fail() {
        assert_eq!(
            get_validate_caller()
                .validate_url("invalid url", false)
                .err()
                .unwrap()
                .to_string(),
            "relative URL without a base",
        );
    }

    #[test]
    fn test_validate_url_not_https() {
        assert_eq!(
            get_validate_caller()
                .validate_url("http://bol.tz", false)
                .err()
                .unwrap()
                .to_string(),
            UrlError::HttpsRequired.to_string(),
        );
    }

    #[test]
    fn test_validate_url_allow_http() {
        assert!(
            get_validate_caller()
                .validate_url("http://bol.tz", true)
                .is_ok()
        );
    }

    #[test]
    fn test_validate_url_blocked_host() {
        let mut caller = get_validate_caller();
        caller.block_list = vec!["bol.tz".to_string()];
        assert_eq!(
            caller
                .validate_url("https://bol.tz", false)
                .err()
                .unwrap()
                .to_string(),
            UrlError::Blocked.to_string(),
        );
        assert_eq!(
            caller
                .validate_url("https://api.bol.tz/v2", false)
                .err()
                .unwrap()
                .to_string(),
            UrlError::Blocked.to_string(),
        );

        assert!(caller.validate_url("https://boltz.exchange", false).is_ok());
    }

    #[rstest]
    #[case("https://8.8.8.8", true)] // Valid public IP v4
    #[case("https://[2001:4860:4860::8888]", true)] // Valid public IP v6
    #[case("https://bol.tz", true)] // Valid public domain
    #[case("https://127.0.0.1", false)] // Loopback v4
    #[case("https://192.168.1.1", false)] // Private v4
    #[case("https://10.0.0.1", false)] // Private v4
    #[case("https://172.16.0.1", false)] // Private v4
    #[case("https://169.254.1.1", false)] // Link-local v4
    #[case("https://224.0.0.1", false)] // Multicast v4
    #[case("https://255.255.255.255", false)] // Broadcast v4
    #[case("http://[::1]", false)] // Loopback v6
    #[case("http://[fe80::1]", false)] // Link-local v6
    #[case("http://[ff00::1]", false)] // Multicast v6
    #[case("invalid-url", false)] // Invalid URL format
    #[case("https://", false)] // Invalid URL format
    #[case("https://example.invalid", false)] // Non-resolvable TLD
    #[tokio::test]
    async fn test_check_ip(#[case] url: &str, #[case] should_pass: bool) {
        let result = check_ip(url, false).await;
        assert_eq!(result.is_ok(), should_pass, "err: {:?}", result.err());
    }

    #[rstest]
    #[case("https://127.0.0.1", true)] // Loopback v4 allowed with insecure
    #[case("https://192.168.1.1", true)] // Private v4 allowed with insecure
    #[case("https://[::1]", true)] // Loopback v6 allowed with insecure
    #[case("https://[fe80::1]", true)] // Link-local v6 allowed with insecure
    #[tokio::test]
    async fn test_check_ip_allow_insecure(#[case] url: &str, #[case] should_pass: bool) {
        let result = check_ip(url, true).await;
        assert_eq!(result.is_ok(), should_pass, "err: {:?}", result.err());
    }

    async fn start_server(
        port: u16,
    ) -> (
        CancellationToken,
        Arc<Mutex<Vec<WebHookCallParams>>>,
        Arc<Mutex<Vec<String>>>,
    ) {
        use axum::http::HeaderMap;

        struct ServerState {
            received_calls: Arc<Mutex<Vec<WebHookCallParams>>>,
            received_headers: Arc<Mutex<Vec<String>>>,
        }

        async fn ok_handler(
            Extension(state): Extension<Arc<ServerState>>,
            headers: HeaderMap,
            Json(body): Json<WebHookCallParams>,
        ) -> impl IntoResponse {
            if let Some(content_type) = headers.get("content-type")
                && let Ok(value) = content_type.to_str()
            {
                state
                    .received_headers
                    .lock()
                    .unwrap()
                    .push(value.to_string());
            }
            state.received_calls.lock().unwrap().push(body);
            (StatusCode::OK, Json(json!("{}")))
        }

        async fn failed_handler(
            Extension(state): Extension<Arc<ServerState>>,
            headers: HeaderMap,
            Json(body): Json<WebHookCallParams>,
        ) -> impl IntoResponse {
            if let Some(content_type) = headers.get("content-type")
                && let Ok(value) = content_type.to_str()
            {
                state
                    .received_headers
                    .lock()
                    .unwrap()
                    .push(value.to_string());
            }
            state.received_calls.lock().unwrap().push(body);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!("{\"error\": \"ngmi\"}")),
            )
        }

        let received_calls = Arc::new(Mutex::new(Vec::new()));
        let received_headers = Arc::new(Mutex::new(Vec::new()));
        let router = Router::new()
            .route("/", post(ok_handler))
            .route("/fail", post(failed_handler))
            .layer(Extension(Arc::new(ServerState {
                received_calls: received_calls.clone(),
                received_headers: received_headers.clone(),
            })));

        let listener = tokio::net::TcpListener::bind(format!("127.0.0.1:{port}"))
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

        (cancellation_token, received_calls, received_headers)
    }

    fn make_mock_hook_state() -> MockHookState {
        let mut hook_helper = MockHookState::new();
        hook_helper.expect_clone().returning(make_mock_hook_state);

        hook_helper
    }
}

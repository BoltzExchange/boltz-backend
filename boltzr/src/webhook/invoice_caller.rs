use crate::db::models::WebHookState;
use crate::lightning::cln::ReplyBlindedPath;
use crate::types;
use crate::webhook::WebHookCallData;
use crate::webhook::caller::{CallResult, Caller, Config, Hook, HookState};
use crate::webhook::types::InvoiceRequestCallData;
use alloy::hex;
use anyhow::{Result, anyhow};
use dashmap::DashMap;
use std::hash::{DefaultHasher, Hash, Hasher};
use std::sync::Arc;
use tokio::sync::broadcast::Receiver;
use tokio_util::sync::CancellationToken;

const NAME: &str = "BOLT12 invoice";

#[derive(PartialEq, Debug, Clone)]
pub struct InvoiceHook<T: types::Bool> {
    pub offer: String,
    pub invoice_request: String,
    pub reply_blinded_path: Option<ReplyBlindedPath>,

    url: Option<String>,

    phantom: std::marker::PhantomData<T>,
}

#[derive(Clone)]
pub struct InvoiceHookState {
    // Invoice requests time out quickly, so we don't need to store them in the database
    to_retry: Arc<DashMap<u64, InvoiceHook<types::True>>>,
}

#[derive(Clone)]
pub struct InvoiceCaller {
    caller: Caller<InvoiceHook<types::True>, InvoiceHookState>,
}

impl InvoiceHook<types::False> {
    pub fn new(
        offer: String,
        invoice_request: &[u8],
        reply_blinded_path: Option<ReplyBlindedPath>,
    ) -> Self {
        Self {
            offer,
            invoice_request: hex::encode(invoice_request),
            reply_blinded_path,
            url: None,
            phantom: std::marker::PhantomData,
        }
    }
}

impl<T: types::Bool> InvoiceHook<T> {
    pub fn with_url(self, url: String) -> InvoiceHook<types::True> {
        InvoiceHook {
            offer: self.offer,
            invoice_request: self.invoice_request,
            reply_blinded_path: self.reply_blinded_path,
            url: Some(url),
            phantom: std::marker::PhantomData,
        }
    }

    pub fn id(&self) -> u64 {
        let mut hasher = DefaultHasher::new();
        self.invoice_request.hash(&mut hasher);
        hasher.finish()
    }
}

impl Hook for InvoiceHook<types::True> {
    type Id = u64;

    fn id(&self) -> Self::Id {
        self.id()
    }

    fn url(&self) -> String {
        self.url.clone().unwrap()
    }
}

impl<T: types::Bool> From<&InvoiceHook<T>> for WebHookCallData {
    fn from(hook: &InvoiceHook<T>) -> Self {
        WebHookCallData::InvoiceRequest(InvoiceRequestCallData {
            offer: hook.offer.clone(),
            invoice_request: hook.invoice_request.clone(),
        })
    }
}

impl InvoiceHookState {
    pub fn new() -> Self {
        Self {
            to_retry: Arc::new(DashMap::new()),
        }
    }
}

impl HookState<InvoiceHook<types::True>> for InvoiceHookState {
    fn should_be_skipped(
        &self,
        _hook: &InvoiceHook<types::True>,
        _params: &WebHookCallData,
    ) -> bool {
        false
    }

    fn get_by_state(&self, state: WebHookState) -> Result<Vec<InvoiceHook<types::True>>> {
        if state != WebHookState::Failed {
            return Ok(Vec::new());
        }

        Ok(self.to_retry.iter().map(|e| e.value().clone()).collect())
    }

    fn get_retry_data(&self, hook: &InvoiceHook<types::True>) -> Result<Option<WebHookCallData>> {
        Ok(Some(hook.into()))
    }

    fn set_state(&self, hook: &InvoiceHook<types::True>, state: WebHookState) -> Result<()> {
        if state == WebHookState::Failed {
            self.to_retry.insert(hook.id(), hook.clone());
        } else {
            self.to_retry.remove(&hook.id());
        }

        Ok(())
    }
}

impl InvoiceCaller {
    pub fn new(
        cancellation_token: CancellationToken,
        config: Config,
        allow_insecure: bool,
    ) -> Self {
        Self {
            caller: Caller::new(
                cancellation_token,
                NAME.to_string(),
                config,
                allow_insecure,
                InvoiceHookState::new(),
            ),
        }
    }

    pub async fn start(&self) {
        self.caller.start().await;
    }

    pub fn subscribe_successful_calls(&self) -> Receiver<(InvoiceHook<types::True>, Vec<u8>)> {
        self.caller.subscribe_successful_calls()
    }

    pub async fn call(&self, hook: InvoiceHook<types::True>) -> Result<CallResult> {
        let res = self
            .caller
            .call_webhook(hook.clone(), (&hook).into())
            .await
            .map_err(|e| anyhow!("{}", e))?;

        Ok(res)
    }

    pub fn validate_url(&self, url: &str, allow_http: bool) -> anyhow::Result<()> {
        self.caller.validate_url(url, allow_http)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_invoice_hook_id() {
        let same_req = "test_request";
        let hook1 = InvoiceHook::<types::True> {
            invoice_request: same_req.to_string(),
            offer: "test_offer".to_string(),
            reply_blinded_path: None,
            url: Some("https://example.com".to_string()),
            phantom: std::marker::PhantomData,
        };

        let hook2 = InvoiceHook::<types::True> {
            invoice_request: same_req.to_string(),
            offer: "test_offer".to_string(),
            reply_blinded_path: None,
            url: Some("https://different.com".to_string()),
            phantom: std::marker::PhantomData,
        };

        assert_eq!(hook1.id(), hook2.id());

        let hook3 = InvoiceHook::<types::True> {
            invoice_request: "different_request".to_string(),
            offer: "test_offer".to_string(),
            reply_blinded_path: None,
            url: Some("https://example.com".to_string()),
            phantom: std::marker::PhantomData,
        };

        // Hook with different invoice request should have a different ID
        assert_ne!(hook1.id(), hook3.id());
    }

    #[test]
    fn test_invoice_hook_url() {
        let url = "https://example.com/webhook";
        let hook = InvoiceHook::<types::True> {
            invoice_request: "test_request".to_string(),
            offer: "test_offer".to_string(),
            reply_blinded_path: None,
            url: Some(url.to_string()),
            phantom: std::marker::PhantomData,
        };

        assert_eq!(hook.url(), url);
    }

    #[test]
    fn test_should_be_skipped() {
        let state = InvoiceHookState::new();
        let hook = InvoiceHook::<types::True> {
            invoice_request: "test_request".to_string(),
            offer: "test_offer".to_string(),
            reply_blinded_path: None,
            url: Some("http://example.com".to_string()),
            phantom: std::marker::PhantomData,
        };
        let params = (&hook).into();

        assert!(!state.should_be_skipped(&hook, &params));
    }

    #[test]
    fn test_get_by_state() {
        let state = InvoiceHookState::new();
        let hook = InvoiceHook::<types::True> {
            invoice_request: "test_request".to_string(),
            offer: "test_offer".to_string(),
            reply_blinded_path: None,
            url: Some("http://example.com".to_string()),
            phantom: std::marker::PhantomData,
        };

        assert!(state.get_by_state(WebHookState::Failed).unwrap().is_empty());

        state.set_state(&hook, WebHookState::Failed).unwrap();

        let failed_hooks = state.get_by_state(WebHookState::Failed).unwrap();
        assert_eq!(failed_hooks.len(), 1);
        assert_eq!(failed_hooks[0], hook);

        assert!(state.get_by_state(WebHookState::Ok).unwrap().is_empty());
    }

    #[test]
    fn test_get_retry_data() {
        let state = InvoiceHookState::new();
        let hook = InvoiceHook::<types::True> {
            invoice_request: "test_request".to_string(),
            offer: "test_offer".to_string(),
            reply_blinded_path: None,
            url: Some("http://example.com".to_string()),
            phantom: std::marker::PhantomData,
        };

        let retry_data = state.get_retry_data(&hook).unwrap().unwrap();
        match retry_data {
            WebHookCallData::InvoiceRequest(data) => {
                assert_eq!(data.invoice_request, hook.invoice_request);
            }
            _ => panic!("Expected InvoiceRequest call data"),
        }
    }

    #[test]
    fn test_set_state() {
        let state = InvoiceHookState::new();
        let hook = InvoiceHook::<types::True> {
            invoice_request: "test_request".to_string(),
            offer: "test_offer".to_string(),
            reply_blinded_path: None,
            url: Some("http://example.com".to_string()),
            phantom: std::marker::PhantomData,
        };

        state.set_state(&hook, WebHookState::Failed).unwrap();
        assert!(state.to_retry.contains_key(&hook.id()));

        state.set_state(&hook, WebHookState::Ok).unwrap();
        assert!(!state.to_retry.contains_key(&hook.id()));
    }
}

use crate::db::models::WebHookState;
use crate::lightning::cln::ReplyBlindedPath;
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
pub struct InvoiceHook {
    pub url: String,
    pub offer: String,
    pub invoice_request: String,
    pub reply_blinded_path: Option<ReplyBlindedPath>,
}

#[derive(Clone)]
pub struct InvoiceHookState {
    // Invoice requests time out quickly, so we don't need to store them in the database
    to_retry: Arc<DashMap<u64, InvoiceHook>>,
}

#[derive(Clone)]
pub struct InvoiceCaller {
    caller: Caller<InvoiceHook, InvoiceHookState>,
}

impl InvoiceHook {
    pub fn new(
        invoice_request: &[u8],
        url: String,
        offer: String,
        reply_blinded_path: Option<ReplyBlindedPath>,
    ) -> Self {
        Self {
            url,
            offer,
            invoice_request: hex::encode(invoice_request),
            reply_blinded_path,
        }
    }

    pub fn respond_with_onion(&self) -> bool {
        self.reply_blinded_path.is_some()
    }
}

impl Hook for InvoiceHook {
    type Id = u64;

    fn id(&self) -> Self::Id {
        let mut hasher = DefaultHasher::new();
        self.invoice_request.hash(&mut hasher);
        hasher.finish()
    }

    fn url(&self) -> String {
        self.url.clone()
    }
}

impl From<&InvoiceHook> for WebHookCallData {
    fn from(hook: &InvoiceHook) -> Self {
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

impl HookState<InvoiceHook> for InvoiceHookState {
    fn should_be_skipped(&self, _hook: &InvoiceHook, _params: &WebHookCallData) -> bool {
        false
    }

    fn get_by_state(&self, state: WebHookState) -> Result<Vec<InvoiceHook>> {
        if state != WebHookState::Failed {
            return Ok(Vec::new());
        }

        Ok(self.to_retry.iter().map(|e| e.value().clone()).collect())
    }

    fn get_retry_data(&self, hook: &InvoiceHook) -> Result<Option<WebHookCallData>> {
        Ok(Some(hook.into()))
    }

    fn set_state(&self, hook: &InvoiceHook, state: WebHookState) -> Result<()> {
        if state == WebHookState::Failed {
            self.to_retry.insert(hook.id(), hook.clone());
        } else {
            self.to_retry.remove(&hook.id());
        }

        Ok(())
    }
}

impl InvoiceCaller {
    pub fn new(cancellation_token: CancellationToken, config: Config) -> Self {
        Self {
            caller: Caller::new(
                cancellation_token,
                NAME.to_string(),
                config,
                InvoiceHookState::new(),
            ),
        }
    }

    pub async fn start(&self) {
        self.caller.start().await;
    }

    pub fn subscribe_successful_calls(&self) -> Receiver<(InvoiceHook, Vec<u8>)> {
        self.caller.subscribe_successful_calls()
    }

    pub async fn call(&self, hook: InvoiceHook) -> Result<CallResult> {
        let res = self
            .caller
            .call_webhook(hook.clone(), (&hook).into())
            .await
            .map_err(|e| anyhow!("{}", e))?;

        Ok(res)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_invoice_hook_id() {
        let same_req = "test_request";
        let hook1 = InvoiceHook {
            invoice_request: same_req.to_string(),
            offer: "test_offer".to_string(),
            reply_blinded_path: None,
            url: "https://example.com".to_string(),
        };

        let hook2 = InvoiceHook {
            invoice_request: same_req.to_string(),
            offer: "test_offer".to_string(),
            reply_blinded_path: None,
            url: "https://different.com".to_string(),
        };

        assert_eq!(hook1.id(), hook2.id());

        let hook3 = InvoiceHook {
            invoice_request: "different_request".to_string(),
            offer: "test_offer".to_string(),
            reply_blinded_path: None,
            url: "https://example.com".to_string(),
        };

        // Hook with different invoice request should have a different ID
        assert_ne!(hook1.id(), hook3.id());
    }

    #[test]
    fn test_invoice_hook_url() {
        let url = "https://example.com/webhook";
        let hook = InvoiceHook {
            invoice_request: "test_request".to_string(),
            offer: "test_offer".to_string(),
            reply_blinded_path: None,
            url: url.to_string(),
        };

        assert_eq!(hook.url(), url);
    }

    #[test]
    fn test_should_be_skipped() {
        let state = InvoiceHookState::new();
        let hook = InvoiceHook {
            invoice_request: "test_request".to_string(),
            offer: "test_offer".to_string(),
            reply_blinded_path: None,
            url: "http://example.com".to_string(),
        };
        let params = (&hook).into();

        assert!(!state.should_be_skipped(&hook, &params));
    }

    #[test]
    fn test_get_by_state() {
        let state = InvoiceHookState::new();
        let hook = InvoiceHook {
            invoice_request: "test_request".to_string(),
            offer: "test_offer".to_string(),
            reply_blinded_path: None,
            url: "http://example.com".to_string(),
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
        let hook = InvoiceHook {
            invoice_request: "test_request".to_string(),
            offer: "test_offer".to_string(),
            reply_blinded_path: None,
            url: "http://example.com".to_string(),
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
        let hook = InvoiceHook {
            invoice_request: "test_request".to_string(),
            offer: "test_offer".to_string(),
            reply_blinded_path: None,
            url: "http://example.com".to_string(),
        };

        state.set_state(&hook, WebHookState::Failed).unwrap();
        assert!(state.to_retry.contains_key(&hook.id()));

        state.set_state(&hook, WebHookState::Ok).unwrap();
        assert!(!state.to_retry.contains_key(&hook.id()));
    }
}

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

#[derive(Debug, Clone)]
pub struct InvoiceHook {
    pub invoice_request: String,
    pub reply_blinded_path: ReplyBlindedPath,
    pub url: String,
}

#[derive(Clone)]
pub struct InvoiceHookState {
    to_retry: Arc<DashMap<u64, InvoiceHook>>,
}

#[derive(Clone)]
pub struct InvoiceCaller {
    caller: Caller<InvoiceHook, InvoiceHookState>,
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
        Ok(Some(WebHookCallData::InvoiceRequest(
            InvoiceRequestCallData {
                invoice_request: hook.invoice_request.clone(),
            },
        )))
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

    pub async fn call(
        &self,
        url: String,
        reply_blinded_path: ReplyBlindedPath,
        invoice_request: &[u8],
    ) -> Result<CallResult> {
        let invoice_request = hex::encode(invoice_request);
        let hook = InvoiceHook {
            invoice_request: invoice_request.clone(),
            reply_blinded_path,
            url,
        };
        let res = self
            .caller
            .call_webhook(
                hook.clone(),
                WebHookCallData::InvoiceRequest(InvoiceRequestCallData { invoice_request }),
            )
            .await
            .map_err(|e| anyhow!("{}", e))?;

        Ok(res)
    }
}

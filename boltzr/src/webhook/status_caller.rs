use super::caller::{CallResult, Caller, Config};
use crate::db::helpers::web_hook::WebHookHelperDatabase;
use crate::db::models::WebHook;
use crate::webhook::types::{SwapUpdateCallData, WebHookCallData};
use std::error::Error;
use tokio_util::sync::CancellationToken;

const NAME: &str = "swap status";

#[derive(Clone)]
pub struct StatusCaller {
    caller: Caller<WebHook, WebHookHelperDatabase>,
}

impl StatusCaller {
    pub fn new(
        cancellation_token: CancellationToken,
        config: Config,
        allow_insecure: bool,
        web_hook_helper: WebHookHelperDatabase,
    ) -> Self {
        Self {
            caller: Caller::new(
                cancellation_token,
                NAME.to_string(),
                config,
                allow_insecure,
                web_hook_helper,
            ),
        }
    }

    pub async fn start(&self) {
        self.caller.start().await;
    }

    pub async fn call_webhook(
        &self,
        hook: WebHook,
        status: String,
    ) -> Result<CallResult, Box<dyn Error>> {
        let data = WebHookCallData::SwapUpdate(SwapUpdateCallData {
            status,
            id: WebHookHelperDatabase::format_swap_id(hook.id.clone(), hook.hash_swap_id),
        });
        self.caller.call_webhook(hook, data).await
    }
}

#[cfg(test)]
pub mod test {
    use super::*;
    use crate::db::helpers::web_hook::test::get_pool;

    pub fn new_caller(cancellation_token: CancellationToken) -> StatusCaller {
        StatusCaller::new(
            cancellation_token,
            Config {
                request_timeout: None,
                max_retries: None,
                retry_interval: None,
            },
            true,
            WebHookHelperDatabase::new(get_pool()),
        )
    }
}

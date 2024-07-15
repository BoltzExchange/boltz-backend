use crate::db::helpers::web_hook::WebHookHelper;
use crate::db::models::{WebHook, WebHookState};
use crate::grpc::service::boltzr::boltz_r_server::BoltzR;
use crate::grpc::service::boltzr::{
    CreateWebHookRequest, CreateWebHookResponse, GetInfoRequest, GetInfoResponse,
    SendWebHookRequest, SendWebHookResponse, StartWebHookRetriesRequest,
    StartWebHookRetriesResponse,
};
use crate::webhook::caller::Caller;
use std::cell::Cell;
use std::sync::Arc;
use tokio::sync::Mutex;
use tonic::{Code, Request, Response, Status};
use tracing::{debug, trace};

pub mod boltzr {
    tonic::include_proto!("boltzr");
}

pub struct BoltzService {
    pub web_hook_helper: Arc<Box<dyn WebHookHelper + Sync + Send>>,
    pub web_hook_caller: Arc<Caller>,

    pub web_hook_retry_handle: Arc<Mutex<Cell<Option<tokio::task::JoinHandle<()>>>>>,
}

#[tonic::async_trait]
impl BoltzR for BoltzService {
    async fn get_info(
        &self,
        _request: Request<GetInfoRequest>,
    ) -> Result<Response<GetInfoResponse>, Status> {
        Ok(Response::new(GetInfoResponse {
            version: crate::utils::get_version(),
        }))
    }

    async fn start_web_hook_retries(
        &self,
        _request: Request<StartWebHookRetriesRequest>,
    ) -> Result<Response<StartWebHookRetriesResponse>, Status> {
        let handle_lock = self.web_hook_retry_handle.clone();
        let mut handle = handle_lock.lock().await;
        if handle.get_mut().is_some() {
            return Err(Status::new(
                Code::AlreadyExists,
                "WebHook retry loop already started",
            ));
        }

        let caller_cp = self.web_hook_caller.clone();
        handle.set(Some(tokio::spawn(async move {
            caller_cp.start().await;
        })));

        Ok(Response::new(StartWebHookRetriesResponse::default()))
    }

    async fn create_web_hook(
        &self,
        request: Request<CreateWebHookRequest>,
    ) -> Result<Response<CreateWebHookResponse>, Status> {
        let params = request.into_inner();
        debug!("Adding new WebHook for swap {}", params.id);
        trace!("Adding WebHook: {:#?}", params);

        if let Some(err) = Caller::validate_url(&params.url) {
            debug!("Invalid WebHook url for swap {}: {}", params.id, params.url);
            return Err(Status::new(Code::InvalidArgument, err.to_string()));
        }

        match self.web_hook_helper.insert_web_hook(&WebHook {
            id: params.id,
            state: WebHookState::None.into(),
            url: params.url,
            hash_swap_id: params.hash_swap_id,
        }) {
            Ok(_) => Ok(Response::new(CreateWebHookResponse {})),
            Err(err) => Err(Status::new(Code::InvalidArgument, err.to_string())),
        }
    }

    async fn send_web_hook(
        &self,
        request: Request<SendWebHookRequest>,
    ) -> Result<Response<SendWebHookResponse>, Status> {
        let params = request.into_inner();

        let hook = match self.web_hook_helper.get_by_id(&params.id) {
            Ok(hook) => match hook {
                Some(hook) => hook,
                None => {
                    trace!("No WebHook found for swap: {}", params.id);
                    return Err(Status::new(
                        Code::NotFound,
                        format!("could find hook for swap {}", params.id),
                    ));
                }
            },
            Err(err) => return Err(Status::new(Code::Internal, err.to_string())),
        };

        match self
            .web_hook_caller
            .call_webhook(&params.id, &params.status, &hook.url, false)
            .await
        {
            Ok(ok) => Ok(Response::new(SendWebHookResponse { ok })),
            Err(err) => Err(Status::new(Code::InvalidArgument, err.to_string())),
        }
    }
}

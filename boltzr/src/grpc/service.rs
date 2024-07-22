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
use tracing::{debug, instrument, trace};

pub mod boltzr {
    tonic::include_proto!("boltzr");
}

pub struct BoltzService {
    pub web_hook_retry_handle: Arc<Mutex<Cell<Option<tokio::task::JoinHandle<()>>>>>,

    web_hook_helper: Arc<Box<dyn WebHookHelper + Sync + Send>>,
    web_hook_caller: Arc<Caller>,
}

impl BoltzService {
    pub(crate) fn new(
        web_hook_helper: Arc<Box<dyn WebHookHelper + Sync + Send>>,
        web_hook_caller: Arc<Caller>,
    ) -> Self {
        BoltzService {
            web_hook_helper,
            web_hook_caller,
            web_hook_retry_handle: Arc::new(Default::default()),
        }
    }
}

#[cfg(feature = "otel")]
struct MetadataMap<'a>(&'a tonic::metadata::MetadataMap);

#[cfg(feature = "otel")]
impl<'a> opentelemetry::propagation::Extractor for MetadataMap<'a> {
    fn get(&self, key: &str) -> Option<&str> {
        self.0.get(key).and_then(|metadata| metadata.to_str().ok())
    }

    fn keys(&self) -> Vec<&str> {
        self.0
            .keys()
            .map(|key| match key {
                tonic::metadata::KeyRef::Ascii(v) => v.as_str(),
                tonic::metadata::KeyRef::Binary(v) => v.as_str(),
            })
            .collect::<Vec<_>>()
    }
}

#[tonic::async_trait]
impl BoltzR for BoltzService {
    #[instrument(name = "grpc::get_info", skip(self, request))]
    async fn get_info(
        &self,
        request: Request<GetInfoRequest>,
    ) -> Result<Response<GetInfoResponse>, Status> {
        extract_parent_context(&request);

        Ok(Response::new(GetInfoResponse {
            version: crate::utils::get_version(),
        }))
    }

    #[instrument(name = "grpc::start_web_hook_retries", skip(self, request))]
    async fn start_web_hook_retries(
        &self,
        request: Request<StartWebHookRetriesRequest>,
    ) -> Result<Response<StartWebHookRetriesResponse>, Status> {
        extract_parent_context(&request);

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

    #[instrument(name = "grpc::create_web_hook", skip(self, request))]
    async fn create_web_hook(
        &self,
        request: Request<CreateWebHookRequest>,
    ) -> Result<Response<CreateWebHookResponse>, Status> {
        extract_parent_context(&request);

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

    #[instrument(name = "grpc::send_web_hook", skip(self, request))]
    async fn send_web_hook(
        &self,
        request: Request<SendWebHookRequest>,
    ) -> Result<Response<SendWebHookResponse>, Status> {
        extract_parent_context(&request);

        let params = request.into_inner();

        let hook = match self.web_hook_helper.get_by_id(&params.id) {
            Ok(hook) => match hook {
                Some(hook) => hook,
                None => {
                    trace!("No WebHook found for swap: {}", params.id);
                    return Err(Status::new(
                        Code::NotFound,
                        format!("could not find hook for swap {}", params.id),
                    ));
                }
            },
            Err(err) => return Err(Status::new(Code::Internal, err.to_string())),
        };

        match self
            .web_hook_caller
            .call_webhook(&params.id, &params.status, &hook.url, hook.hash_swap_id)
            .await
        {
            Ok(ok) => Ok(Response::new(SendWebHookResponse { ok })),
            Err(err) => Err(Status::new(Code::Internal, err.to_string())),
        }
    }
}

fn extract_parent_context<T>(request: &Request<T>) {
    #[cfg(feature = "otel")]
    {
        use tracing_opentelemetry::OpenTelemetrySpanExt;

        let parent_cx = opentelemetry::global::get_text_map_propagator(|prop| {
            prop.extract(&MetadataMap(request.metadata()))
        });
        tracing::Span::current().set_parent(parent_cx);
    }
}

#[cfg(test)]
mod test {
    use std::sync::Arc;

    use mockall::mock;
    use tokio_util::sync::CancellationToken;
    use tonic::{Code, Request};

    use crate::db::helpers::web_hook::{QueryResponse, WebHookHelper};
    use crate::db::models::{WebHook, WebHookState};
    use crate::grpc::service::boltzr::boltz_r_server::BoltzR;
    use crate::grpc::service::boltzr::{
        CreateWebHookRequest, CreateWebHookResponse, GetInfoRequest, GetInfoResponse,
        SendWebHookRequest, SendWebHookResponse, StartWebHookRetriesRequest,
        StartWebHookRetriesResponse,
    };
    use crate::grpc::service::BoltzService;
    use crate::webhook::caller::{Caller, Config};

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
    async fn test_get_info() {
        let (_, svc) = make_service();
        assert_eq!(
            svc.get_info(Request::new(GetInfoRequest {}))
                .await
                .unwrap()
                .into_inner(),
            GetInfoResponse {
                version: crate::utils::get_version(),
            }
        );
    }

    #[tokio::test]
    async fn test_web_hook_retries() {
        let (cancel_token, svc) = make_service();
        assert!(svc
            .web_hook_retry_handle
            .clone()
            .lock()
            .await
            .get_mut()
            .is_none());
        assert_eq!(
            svc.start_web_hook_retries(Request::new(StartWebHookRetriesRequest {}))
                .await
                .unwrap()
                .into_inner(),
            StartWebHookRetriesResponse {}
        );

        assert!(svc
            .web_hook_retry_handle
            .clone()
            .lock()
            .await
            .get_mut()
            .is_some());
        cancel_token.cancel();
        svc.web_hook_retry_handle
            .clone()
            .lock()
            .await
            .take()
            .unwrap()
            .await
            .unwrap();
    }

    #[tokio::test]
    async fn test_create_web_hook() {
        let (_, svc) = make_service();
        assert_eq!(
            svc.create_web_hook(Request::new(CreateWebHookRequest {
                id: "id".to_string(),
                url: "https://some.url".to_string(),
                hash_swap_id: false,
            }))
            .await
            .unwrap()
            .into_inner(),
            CreateWebHookResponse {}
        );
    }

    #[tokio::test]
    async fn test_create_web_hook_invalid_url() {
        let (_, svc) = make_service();
        let err = svc
            .create_web_hook(Request::new(CreateWebHookRequest {
                id: "adsf".to_string(),
                url: "notAUrl".to_string(),
                hash_swap_id: false,
            }))
            .await
            .err()
            .unwrap();
        assert_eq!(err.code(), Code::InvalidArgument);
        assert_eq!(err.message(), "relative URL without a base");
    }

    #[tokio::test]
    async fn test_send_web_hook() {
        let (_, svc) = make_service();
        assert_eq!(
            svc.send_web_hook(Request::new(SendWebHookRequest {
                id: "id".to_string(),
                status: "some.status".to_string(),
            }))
            .await
            .unwrap()
            .into_inner(),
            SendWebHookResponse { ok: false }
        );
    }

    #[tokio::test]
    async fn test_send_web_hook_no_hook() {
        let (_, svc) = make_service();
        let id = "notFound";
        let err = svc
            .send_web_hook(Request::new(SendWebHookRequest {
                id: id.to_string(),
                status: "some.status".to_string(),
            }))
            .await
            .err()
            .unwrap();
        assert_eq!(err.code(), Code::NotFound);
        assert_eq!(
            err.message(),
            format!("could not find hook for swap {}", id)
        );
    }

    fn make_service() -> (CancellationToken, BoltzService) {
        let token = CancellationToken::new();
        (
            token.clone(),
            BoltzService::new(
                Arc::new(Box::new(make_mock_hook_helper())),
                Arc::new(Caller::new(
                    token,
                    Config {
                        max_retries: None,
                        retry_interval: None,
                        request_timeout: None,
                    },
                    Box::new(make_mock_hook_helper()),
                )),
            ),
        )
    }

    fn make_mock_hook_helper() -> MockWebHookHelper {
        let mut hook_helper = MockWebHookHelper::new();
        hook_helper.expect_get_by_id().returning(|id| {
            if id == "notFound" {
                Ok(None)
            } else {
                Ok(Some(WebHook {
                    id: id.to_string(),
                    state: WebHookState::None.into(),
                    url: "http://127.0.0.1:11001".to_string(),
                    hash_swap_id: false,
                }))
            }
        });
        hook_helper
            .expect_get_by_state()
            .returning(|_| Ok(Vec::new()));
        hook_helper.expect_insert_web_hook().returning(|_| Ok(1));
        hook_helper.expect_set_state().returning(|_, _| Ok(1));
        hook_helper.expect_clone().returning(make_mock_hook_helper);

        hook_helper
    }
}

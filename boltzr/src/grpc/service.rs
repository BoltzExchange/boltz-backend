use std::cell::Cell;
use std::pin::Pin;
use std::sync::Arc;

use alloy::primitives::{Address, FixedBytes};
use futures::StreamExt;
use tokio::sync::{mpsc, Mutex};
use tonic::codegen::tokio_stream::wrappers::ReceiverStream;
use tonic::codegen::tokio_stream::Stream;
use tonic::{Code, Request, Response, Status, Streaming};
use tracing::{debug, error, instrument, trace};

use crate::db::helpers::web_hook::WebHookHelper;
use crate::db::models::{WebHook, WebHookState};
use crate::evm::refund_signer::RefundSigner;
use crate::grpc::service::boltzr::boltz_r_server::BoltzR;
use crate::grpc::service::boltzr::{
    CreateWebHookRequest, CreateWebHookResponse, GetInfoRequest, GetInfoResponse,
    GetMessagesRequest, GetMessagesResponse, SendMessageRequest, SendMessageResponse,
    SendWebHookRequest, SendWebHookResponse, SignEvmRefundRequest, SignEvmRefundResponse,
    StartWebHookRetriesRequest, StartWebHookRetriesResponse, SwapUpdateRequest, SwapUpdateResponse,
};
use crate::grpc::status_fetcher::StatusFetcher;
use crate::notifications::NotificationClient;
use crate::webhook::caller::Caller;
use crate::ws::types::SwapStatus;

pub mod boltzr {
    tonic::include_proto!("boltzr");
}

pub struct BoltzService<T> {
    pub web_hook_retry_handle: Arc<Mutex<Cell<Option<tokio::task::JoinHandle<()>>>>>,

    web_hook_helper: Arc<Box<dyn WebHookHelper + Sync + Send>>,
    web_hook_caller: Arc<Caller>,

    refund_signer: Option<Arc<dyn RefundSigner + Sync + Send>>,
    notification_client: Option<Arc<T>>,

    status_fetcher: StatusFetcher,
    swap_status_update_tx: tokio::sync::broadcast::Sender<Vec<SwapStatus>>,
}

impl<T> BoltzService<T> {
    pub(crate) fn new(
        status_fetcher: StatusFetcher,
        swap_status_update_tx: tokio::sync::broadcast::Sender<Vec<SwapStatus>>,
        web_hook_helper: Arc<Box<dyn WebHookHelper + Sync + Send>>,
        web_hook_caller: Arc<Caller>,
        refund_signer: Option<Arc<dyn RefundSigner + Sync + Send>>,
        notification_client: Option<Arc<T>>,
    ) -> Self {
        BoltzService {
            refund_signer,
            status_fetcher,
            web_hook_caller,
            web_hook_helper,
            notification_client,
            swap_status_update_tx,
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
impl<T> BoltzR for BoltzService<T>
where
    T: NotificationClient + Send + Sync + 'static,
{
    #[instrument(name = "grpc::get_info", skip_all)]
    async fn get_info(
        &self,
        request: Request<GetInfoRequest>,
    ) -> Result<Response<GetInfoResponse>, Status> {
        extract_parent_context(&request);

        Ok(Response::new(GetInfoResponse {
            version: crate::utils::get_version(),
        }))
    }

    #[instrument(name = "grpc::send_message", skip_all)]
    async fn send_message(
        &self,
        request: Request<SendMessageRequest>,
    ) -> Result<Response<SendMessageResponse>, Status> {
        extract_parent_context(&request);

        let client = match &self.notification_client {
            Some(client) => client,
            None => {
                return Err(Status::new(
                    Code::Internal,
                    "Notification client not enabled",
                ));
            }
        };

        let params = request.into_inner();
        match client
            .send_message(&params.message, params.is_alert.unwrap_or(false))
            .await
        {
            Ok(_) => Ok(Response::new(SendMessageResponse::default())),
            Err(err) => Err(Status::new(
                Code::Internal,
                format!("sending message failed: {}", err),
            )),
        }
    }

    type GetMessagesStream =
        Pin<Box<dyn Stream<Item = Result<GetMessagesResponse, Status>> + Send>>;

    #[instrument(name = "grpc::get_messages", skip_all)]
    async fn get_messages(
        &self,
        request: Request<GetMessagesRequest>,
    ) -> Result<Response<Self::GetMessagesStream>, Status> {
        extract_parent_context(&request);

        let client = match &self.notification_client {
            Some(client) => client,
            None => {
                return Err(Status::new(
                    Code::Internal,
                    "Notification client not enabled",
                ));
            }
        };
        let mut notification_rx = client.listen_to_messages();

        let (tx, rx) = mpsc::channel(128);
        tokio::spawn(async move {
            while let Ok(message) = notification_rx.recv().await {
                match tx.send(Ok(GetMessagesResponse { message })).await {
                    Ok(_) => {}
                    Err(err) => {
                        debug!("GetMessage stream closed: {}", err);
                        break;
                    }
                };
            }
        });

        Ok(Response::new(Box::pin(ReceiverStream::new(rx))))
    }

    type SwapUpdateStream = Pin<Box<dyn Stream<Item = Result<SwapUpdateResponse, Status>> + Send>>;

    #[instrument(name = "grpc::swap_update", skip_all)]
    async fn swap_update(
        &self,
        request: Request<Streaming<SwapUpdateRequest>>,
    ) -> Result<Response<Self::SwapUpdateStream>, Status> {
        extract_parent_context(&request);

        let mut in_stream = request.into_inner();
        let (tx, rx) = mpsc::channel(128);

        self.status_fetcher.set_sender(tx.clone()).await;
        let swap_status_update_tx = self.swap_status_update_tx.clone();

        tokio::spawn(async move {
            while let Some(res) = in_stream.next().await {
                match res {
                    Ok(res) => {
                        if let Err(err) = swap_status_update_tx
                            .send(res.status.iter().map(|entry| entry.into()).collect())
                        {
                            error!("Could not propagate swap status update: {}", err);
                            break;
                        }
                    }
                    Err(err) => {
                        if tx.send(Err(err)).await.is_err() {
                            break;
                        }
                    }
                }
            }
        });

        Ok(Response::new(Box::pin(ReceiverStream::new(rx))))
    }

    #[instrument(name = "grpc::start_web_hook_retries", skip_all)]
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

    #[instrument(name = "grpc::create_web_hook", skip_all)]
    async fn create_web_hook(
        &self,
        request: Request<CreateWebHookRequest>,
    ) -> Result<Response<CreateWebHookResponse>, Status> {
        extract_parent_context(&request);

        let params = request.into_inner();
        debug!("Adding new WebHook for swap {}", params.id);
        trace!("Adding WebHook: {:#?}", params);

        if let Some(err) = Caller::validate_url(&params.url) {
            debug!("Invalid WebHook URL for swap {}: {}", params.id, params.url);
            return Err(Status::new(Code::InvalidArgument, err.to_string()));
        }

        match self.web_hook_helper.insert_web_hook(&WebHook {
            id: params.id,
            state: WebHookState::None.into(),
            url: params.url,
            hash_swap_id: params.hash_swap_id,
            status: if !params.status.is_empty() {
                Some(params.status.to_vec())
            } else {
                None
            },
        }) {
            Ok(_) => Ok(Response::new(CreateWebHookResponse {})),
            Err(err) => Err(Status::new(Code::InvalidArgument, err.to_string())),
        }
    }

    #[instrument(name = "grpc::send_web_hook", skip_all)]
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
            .call_webhook(&hook, &params.status)
            .await
        {
            Ok(ok) => Ok(Response::new(SendWebHookResponse { ok })),
            Err(err) => Err(Status::new(Code::Internal, err.to_string())),
        }
    }

    #[instrument(name = "grpc::sign_evm_refund", skip_all)]
    async fn sign_evm_refund(
        &self,
        request: Request<SignEvmRefundRequest>,
    ) -> Result<Response<SignEvmRefundResponse>, Status> {
        extract_parent_context(&request);

        let refund_signer = match &self.refund_signer {
            Some(signer) => signer,
            None => {
                return Err(Status::new(Code::Internal, "RSK signer not enabled"));
            }
        };

        let params = request.into_inner();

        let preimage_hash = match FixedBytes::<32>::try_from(params.preimage_hash.as_slice()) {
            Ok(res) => res,
            Err(err) => {
                return Err(Status::new(
                    Code::InvalidArgument,
                    format!("could not parse preimage hash: {}", err),
                ));
            }
        };
        let amount = match crate::evm::utils::parse_wei(&params.amount) {
            Ok(res) => res,
            Err(err) => {
                return Err(Status::new(
                    Code::InvalidArgument,
                    format!("could not parse amount: {}", err),
                ));
            }
        };
        let token_address = match params.token_address {
            Some(address) => match address.parse::<Address>() {
                Ok(res) => Some(res),
                Err(err) => {
                    return Err(Status::new(
                        Code::InvalidArgument,
                        format!("could not parse token address: {}", err),
                    ));
                }
            },
            None => None,
        };

        let signature = match refund_signer
            .sign(preimage_hash, amount, token_address, params.timeout)
            .await
        {
            Ok(res) => res,
            Err(err) => {
                return Err(Status::new(
                    Code::Internal,
                    format!("signing failed: {}", err),
                ));
            }
        };

        Ok(Response::new(SignEvmRefundResponse {
            signature: Vec::from(signature.as_bytes()),
        }))
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
    use std::error::Error;
    use std::str::FromStr;
    use std::sync::Arc;

    use alloy::primitives::{Address, FixedBytes, Signature, U256};
    use alloy::signers::k256;
    use mockall::mock;
    use rand::Rng;
    use tokio_util::sync::CancellationToken;
    use tonic::{Code, Request};

    use crate::db::helpers::web_hook::{QueryResponse, WebHookHelper};
    use crate::db::models::{WebHook, WebHookState};
    use crate::evm::refund_signer::RefundSigner;
    use crate::grpc::service::boltzr::boltz_r_server::BoltzR;
    use crate::grpc::service::boltzr::{
        CreateWebHookRequest, CreateWebHookResponse, GetInfoRequest, GetInfoResponse,
        SendWebHookRequest, SendWebHookResponse, SignEvmRefundRequest, StartWebHookRetriesRequest,
        StartWebHookRetriesResponse,
    };
    use crate::grpc::service::BoltzService;
    use crate::grpc::status_fetcher::StatusFetcher;
    use crate::webhook::caller::{Caller, Config};
    use crate::ws;

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

    mock! {
        RefundSigner {}

        #[tonic::async_trait]
        impl RefundSigner for RefundSigner {
            async fn sign(
                &self,
                preimage_hash: FixedBytes<32>,
                amount: U256,
                token_address: Option<Address>,
                timeout: u64,
            ) -> Result<Signature, Box<dyn Error>>;
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
                status: vec![],
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
                status: vec![],
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

    #[tokio::test]
    async fn test_sign_evm_refund() {
        let (_, mut svc) = make_service();

        let mut preimage_hash = FixedBytes::<32>::default();
        rand::thread_rng().fill(&mut preimage_hash[..]);

        let req = SignEvmRefundRequest {
            preimage_hash: preimage_hash.to_vec(),
            amount: "321".to_string(),
            token_address: Some("0xB65828B4729754fD7d3ce72344DAF00fC3F5E06B".to_string()),
            timeout: 123,
        };

        let mut signer = MockRefundSigner::new();
        let sig_str = "0xd247cfedc0c62ea93f4f3093a3b2941c329773f140ab0cdc04a641376982d34e0aa7152cb2dd9036fad543646a3fdc8b22c8d83e62e13684d61f630afdd08b0f1c";
        signer
            .expect_sign()
            .returning(|_, _, _, _| Ok(alloy::signers::Signature::from_str(sig_str).unwrap()));
        svc.refund_signer = Some(Arc::new(signer));

        let res = svc
            .sign_evm_refund(Request::new(req))
            .await
            .unwrap()
            .into_inner();
        assert_eq!(
            res.signature,
            Vec::from(
                alloy::signers::Signature::from_str(sig_str)
                    .unwrap()
                    .as_bytes()
            )
        );
    }

    #[tokio::test]
    async fn test_sign_evm_refund_signing_failed() {
        let (_, mut svc) = make_service();

        let mut preimage_hash = FixedBytes::<32>::default();
        rand::thread_rng().fill(&mut preimage_hash[..]);

        let req = SignEvmRefundRequest {
            preimage_hash: preimage_hash.to_vec(),
            amount: "321".to_string(),
            token_address: Some("0xB65828B4729754fD7d3ce72344DAF00fC3F5E06B".to_string()),
            timeout: 123,
        };

        let mut signer = MockRefundSigner::new();
        signer
            .expect_sign()
            .returning(|_, _, _, _| Err(Box::new(k256::ecdsa::Error::new())));
        svc.refund_signer = Some(Arc::new(signer));

        let err = svc.sign_evm_refund(Request::new(req)).await.err().unwrap();
        assert_eq!(err.code(), Code::Internal);
        assert_eq!(err.message(), "signing failed: signature error");
    }

    #[tokio::test]
    async fn test_sign_evm_refund_no_signer() {
        let (_, mut svc) = make_service();
        svc.refund_signer = None;

        let err = svc
            .sign_evm_refund(Request::new(SignEvmRefundRequest {
                preimage_hash: vec![],
                amount: "".to_string(),
                token_address: None,
                timeout: 0,
            }))
            .await
            .err()
            .unwrap();
        assert_eq!(err.code(), Code::Internal);
        assert_eq!(err.message(), "RSK signer not enabled");
    }

    #[tokio::test]
    async fn test_sign_evm_refund_invalid_preimage() {
        let (_, svc) = make_service();

        let mut preimage_hash = FixedBytes::<33>::default();
        rand::thread_rng().fill(&mut preimage_hash[..]);

        let err = svc
            .sign_evm_refund(Request::new(SignEvmRefundRequest {
                preimage_hash: preimage_hash.to_vec(),
                amount: "".to_string(),
                token_address: None,
                timeout: 0,
            }))
            .await
            .err()
            .unwrap();
        assert_eq!(err.code(), Code::InvalidArgument);
        assert_eq!(
            err.message(),
            "could not parse preimage hash: could not convert slice to array"
        );
    }

    #[tokio::test]
    async fn test_sign_evm_refund_invalid_amount() {
        let (_, svc) = make_service();

        let mut preimage_hash = FixedBytes::<32>::default();
        rand::thread_rng().fill(&mut preimage_hash[..]);

        let err = svc
            .sign_evm_refund(Request::new(SignEvmRefundRequest {
                preimage_hash: preimage_hash.to_vec(),
                amount: "-1".to_string(),
                token_address: None,
                timeout: 0,
            }))
            .await
            .err()
            .unwrap();
        assert_eq!(err.code(), Code::InvalidArgument);
        assert_eq!(
            err.message(),
            "could not parse amount: could not parse negative Ether amount"
        );
    }

    #[tokio::test]
    async fn test_sign_evm_refund_invalid_token_address() {
        let (_, svc) = make_service();

        let mut preimage_hash = FixedBytes::<32>::default();
        rand::thread_rng().fill(&mut preimage_hash[..]);

        let err = svc
            .sign_evm_refund(Request::new(SignEvmRefundRequest {
                preimage_hash: preimage_hash.to_vec(),
                amount: "21".to_string(),
                token_address: Some("clearly not an address".to_string()),
                timeout: 0,
            }))
            .await
            .err()
            .unwrap();
        assert_eq!(err.code(), Code::InvalidArgument);
        assert_eq!(
            err.message(),
            "could not parse token address: invalid string length"
        );
    }

    fn make_service() -> (
        CancellationToken,
        BoltzService<crate::notifications::mattermost::Client>,
    ) {
        let token = CancellationToken::new();
        let refund_signer = Arc::new(MockRefundSigner::new());
        let (status_tx, _) = tokio::sync::broadcast::channel::<Vec<ws::types::SwapStatus>>(1);

        (
            token.clone(),
            BoltzService::new(
                StatusFetcher::new(),
                status_tx,
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
                Some(refund_signer.clone()),
                None,
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
                    status: None,
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

use crate::api::ws::types::SwapStatus;
use crate::db::helpers::web_hook::WebHookHelper;
use crate::evm::RefundSigner;
use crate::grpc::service::BoltzService;
use crate::grpc::service::boltzr::boltz_r_server::BoltzRServer;
use crate::grpc::status_fetcher::StatusFetcher;
use crate::grpc::tls::load_certificates;
use crate::notifications::NotificationClient;
use crate::payjoin::PayjoinManager;
use crate::service::Service;
use crate::swap::manager::SwapManager;
use crate::tracing_setup::ReloadHandler;
use crate::webhook::status_caller::StatusCaller;
use serde::{Deserialize, Serialize};
use std::cell::Cell;
use std::error::Error;
use std::net::{IpAddr, SocketAddr};
use std::str::FromStr;
use std::sync::Arc;
use tokio::sync::Mutex;
use tokio_util::sync::CancellationToken;
use tonic::transport::ServerTlsConfig;
use tracing::{debug, info, warn};

#[derive(Deserialize, Serialize, PartialEq, Clone, Debug)]
pub struct Config {
    pub host: String,
    pub port: u16,

    #[serde(rename = "disableSsl")]
    pub disable_ssl: Option<bool>,
    pub certificates: Option<String>,
}

#[derive(Clone)]
pub struct Server<M, W, N> {
    config: Config,

    log_reload_handler: ReloadHandler,

    service: Arc<Service>,
    manager: Arc<M>,
    payjoin_manager: Arc<PayjoinManager>,

    web_hook_helper: Box<W>,
    web_hook_status_caller: StatusCaller,

    refund_signer: Option<Arc<dyn RefundSigner + Sync + Send>>,
    notification_client: Option<Arc<N>>,

    status_fetcher: StatusFetcher,
    swap_status_update_tx: tokio::sync::broadcast::Sender<Vec<SwapStatus>>,

    cancellation_token: CancellationToken,
}

impl<M, W, N> Server<M, W, N>
where
    M: SwapManager + Send + Sync + Clone + 'static,
    W: WebHookHelper + Send + Sync + Clone + 'static,
    N: NotificationClient + Send + Sync + Clone + 'static,
{
    #[allow(clippy::too_many_arguments)]
    pub fn new(
        cancellation_token: CancellationToken,
        config: Config,
        log_reload_handler: ReloadHandler,
        service: Arc<Service>,
        manager: Arc<M>,
        payjoin_manager: Arc<PayjoinManager>,
        swap_status_update_tx: tokio::sync::broadcast::Sender<Vec<SwapStatus>>,
        web_hook_helper: Box<W>,
        web_hook_status_caller: StatusCaller,
        refund_signer: Option<Arc<dyn RefundSigner + Sync + Send>>,
        notification_client: Option<Arc<N>>,
    ) -> Self {
        Server {
            config,
            service,
            manager,
            payjoin_manager,
            refund_signer,
            web_hook_helper,
            cancellation_token,
            log_reload_handler,
            notification_client,
            swap_status_update_tx,
            web_hook_status_caller,
            status_fetcher: StatusFetcher::new(),
        }
    }

    pub fn status_fetcher(&self) -> StatusFetcher {
        self.status_fetcher.clone()
    }

    pub async fn start(&mut self) -> Result<(), Box<dyn Error>> {
        let socket_addr = SocketAddr::new(
            IpAddr::from_str(self.config.host.as_str())?,
            self.config.port,
        );
        info!("Starting gRPC server on: {}", socket_addr);

        let web_hook_retry_handle: Arc<Mutex<Cell<Option<tokio::task::JoinHandle<()>>>>> =
            Arc::new(Default::default());

        let service = BoltzService::new(
            self.log_reload_handler.clone(),
            self.service.clone(),
            self.manager.clone(),
            self.payjoin_manager.clone(),
            self.status_fetcher.clone(),
            self.swap_status_update_tx.clone(),
            Arc::new(self.web_hook_helper.clone()),
            Arc::new(self.web_hook_status_caller.clone()),
            self.refund_signer.clone(),
            self.notification_client.clone(),
        );

        #[cfg(feature = "metrics")]
        let svc = BoltzRServer::with_interceptor(
            service,
            |req: tonic::Request<()>| -> Result<tonic::Request<()>, tonic::Status> {
                metrics::counter!(crate::metrics::GRPC_REQUEST_COUNT).increment(1);
                Ok(req)
            },
        );

        #[cfg(not(feature = "metrics"))]
        let svc = BoltzRServer::new(service);

        let mut server = tonic::transport::Server::builder();

        if !self.config.disable_ssl.unwrap_or(false) {
            debug!("Starting gRPC server with TLS authentication");
            let (identity, ca) = load_certificates(self.config.certificates.clone().unwrap())?;
            server = server.tls_config(
                ServerTlsConfig::new()
                    .identity(identity)
                    .client_ca_root(ca)
                    .client_auth_optional(false),
            )?;
        } else {
            warn!("Starting insecure gRPC server");
        }

        Ok(server
            .add_service(svc)
            .serve_with_shutdown(socket_addr, async {
                let _ = self.cancellation_token.cancelled().await;
                debug!("Shutting down gRPC server");

                if let Some(handle) = web_hook_retry_handle.lock().await.take() {
                    handle.await.unwrap();
                };
            })
            .await?)
    }
}

#[cfg(test)]
mod server_test {
    use crate::api::ws;
    use crate::api::ws::types::SwapStatus;
    use crate::chain::utils::Transaction;
    use crate::currencies::Currency;
    use crate::db::helpers::QueryResponse;
    use crate::db::helpers::web_hook::WebHookHelper;
    use crate::db::models::{WebHook, WebHookState};
    use crate::evm::RefundSigner;
    use crate::grpc::server::{Config, Server};
    use crate::grpc::service::boltzr::GetInfoRequest;
    use crate::grpc::service::boltzr::boltz_r_client::BoltzRClient;
    use crate::notifications::commands::Commands;
    use crate::swap::manager::SwapManager;
    use crate::tracing_setup::ReloadHandler;
    use alloy::primitives::{Address, FixedBytes, PrimitiveSignature, U256};
    use async_trait::async_trait;
    use mockall::{mock, predicate::*};
    use std::collections::HashMap;
    use std::fs;
    use std::path::{Path, PathBuf};
    use std::sync::Arc;
    use std::time::Duration;
    use tokio::task::JoinHandle;
    use tokio_util::sync::CancellationToken;
    use tonic::transport::{Certificate, Channel, ClientTlsConfig, Identity};

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

        #[async_trait]
        impl RefundSigner for RefundSigner {
            fn version_for_address(&self, contract_address: &Address) -> anyhow::Result<u8>;

            async fn sign_cooperative_refund(
                &self,
                contract_version: u8,
                preimage_hash: FixedBytes<32>,
                amount: U256,
                token_address: Option<Address>,
                timeout: u64,
            ) -> anyhow::Result<PrimitiveSignature>;
        }
    }

    mock! {
        Manager {}

        impl Clone for Manager {
            fn clone(&self) -> Self;
        }

        #[async_trait]
        impl SwapManager for Manager {
            fn get_network(&self) -> crate::wallet::Network;
            fn get_currency(&self, symbol: &str) -> Option<Currency>;
            fn get_timeouts(
                &self,
                receiving: &str,
                sending: &str,
                swap_type: crate::db::models::SwapType,
            ) -> anyhow::Result<(u64, u64)>;
            fn listen_to_updates(&self) -> tokio::sync::broadcast::Receiver<SwapStatus>;
            async fn scan_mempool(
                &self,
                symbols: Option<Vec<String>>,
            ) -> anyhow::Result<HashMap<String, Vec<Transaction>>>;
        }
    }

    #[tokio::test]
    async fn test_connect() {
        let token = CancellationToken::new();
        let (status_tx, _) = tokio::sync::broadcast::channel::<Vec<SwapStatus>>(1);

        let server = Server::<_, _, crate::notifications::mattermost::Client<Commands>>::new(
            token.clone(),
            Config {
                host: "127.0.0.1".to_string(),
                port: 9124,
                certificates: None,
                disable_ssl: Some(true),
            },
            ReloadHandler::new(),
            Arc::new(crate::service::Service::new_mocked_prometheus(false)),
            Arc::new(make_mock_manager()),
            status_tx,
            Box::new(make_mock_hook_helper()),
            crate::webhook::status_caller::test::new_caller(token.clone()),
            Some(Arc::new(MockRefundSigner::default())),
            None,
        );

        let mut server_cp = server.clone();

        let server_thread = tokio::spawn(async move {
            server_cp.start().await.unwrap();
        });
        tokio::time::sleep(Duration::from_millis(10)).await;

        let mut client = BoltzRClient::connect(format!(
            "http://{}:{}",
            server.config.host, server.config.port
        ))
        .await
        .unwrap();

        let res = client.get_info(GetInfoRequest {}).await.unwrap();
        assert_eq!(res.into_inner().version, crate::utils::get_version());

        token.cancel();
        server_thread.await.unwrap();
    }

    #[tokio::test]
    async fn test_connect_tls() {
        let (certs_dir, server, token, server_thread) = start_server_tls(9125).await;

        let tls = ClientTlsConfig::new()
            .domain_name("sidecar")
            .ca_certificate(Certificate::from_pem(
                fs::read_to_string(certs_dir.clone().join("ca.pem")).unwrap(),
            ))
            .identity(Identity::from_pem(
                fs::read_to_string(certs_dir.clone().join("client.pem")).unwrap(),
                fs::read_to_string(certs_dir.clone().join("client-key.pem")).unwrap(),
            ));

        let channel = Channel::from_shared(format!(
            "https://{}:{}",
            server.config.host, server.config.port
        ))
        .unwrap()
        .tls_config(tls)
        .unwrap()
        .connect()
        .await
        .unwrap();

        let mut client = BoltzRClient::new(channel);

        let res = client.get_info(GetInfoRequest {}).await.unwrap();
        assert_eq!(res.into_inner().version, crate::utils::get_version());

        token.cancel();
        server_thread.await.unwrap();

        fs::remove_dir_all(certs_dir).unwrap()
    }

    #[tokio::test]
    async fn test_connect_tls_invalid_client_certificate() {
        let (certs_dir, server, token, server_thread) = start_server_tls(9126).await;

        let tls = ClientTlsConfig::new()
            .domain_name("sidecar")
            .ca_certificate(Certificate::from_pem(
                fs::read_to_string(certs_dir.clone().join("ca.pem")).unwrap(),
            ));

        let channel = Channel::from_shared(format!(
            "https://{}:{}",
            server.config.host, server.config.port
        ))
        .unwrap()
        .tls_config(tls)
        .unwrap()
        .connect()
        .await
        .unwrap();

        let mut client = BoltzRClient::new(channel);

        let res = client.get_info(GetInfoRequest {}).await;
        assert_eq!(res.err().unwrap().message(), "transport error");

        token.cancel();
        server_thread.await.unwrap();

        fs::remove_dir_all(certs_dir).unwrap()
    }

    async fn start_server_tls(
        port: u16,
    ) -> (
        PathBuf,
        Server<MockManager, MockWebHookHelper, crate::notifications::mattermost::Client<Commands>>,
        CancellationToken,
        JoinHandle<()>,
    ) {
        let certs_dir = Path::new(env!("CARGO_MANIFEST_DIR")).join(format!("test-certs-{}", port));

        let token = CancellationToken::new();
        let (status_tx, _) = tokio::sync::broadcast::channel::<Vec<ws::types::SwapStatus>>(1);

        let server = Server::new(
            token.clone(),
            Config {
                port,
                host: "127.0.0.1".to_string(),
                certificates: Some(certs_dir.clone().to_str().unwrap().to_string()),
                disable_ssl: Some(false),
            },
            ReloadHandler::new(),
            Arc::new(crate::service::Service::new_mocked_prometheus(false)),
            Arc::new(make_mock_manager()),
            status_tx,
            Box::new(make_mock_hook_helper()),
            crate::webhook::status_caller::test::new_caller(token.clone()),
            Some(Arc::new(MockRefundSigner::default())),
            None,
        );

        let mut server_cp = server.clone();
        let server_thread = tokio::spawn(async move {
            server_cp.start().await.unwrap();
        });
        tokio::time::sleep(Duration::from_millis(100)).await;

        (certs_dir, server, token, server_thread)
    }

    fn make_mock_manager() -> MockManager {
        let mut manager = MockManager::new();
        manager.expect_clone().returning(make_mock_manager);

        manager
    }

    fn make_mock_hook_helper() -> MockWebHookHelper {
        let mut hook_helper = MockWebHookHelper::new();
        hook_helper.expect_clone().returning(make_mock_hook_helper);

        hook_helper
    }
}

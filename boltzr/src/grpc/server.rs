use crate::currencies::Currencies;
use crate::db::helpers::web_hook::WebHookHelper;
use crate::evm::refund_signer::RefundSigner;
use crate::grpc::service::boltzr::boltz_r_server::BoltzRServer;
use crate::grpc::service::BoltzService;
use crate::grpc::status_fetcher::StatusFetcher;
use crate::grpc::tls::load_certificates;
use crate::notifications::NotificationClient;
use crate::webhook::caller::Caller;
use crate::ws::types::SwapStatus;
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
pub struct Server<W, N> {
    config: Config,

    currencies: Currencies,

    web_hook_helper: Box<W>,
    web_hook_caller: Caller,

    refund_signer: Option<Arc<dyn RefundSigner + Sync + Send>>,
    notification_client: Option<Arc<N>>,

    status_fetcher: StatusFetcher,
    swap_status_update_tx: tokio::sync::broadcast::Sender<Vec<SwapStatus>>,

    cancellation_token: CancellationToken,
}

impl<W, N> Server<W, N>
where
    W: WebHookHelper + Send + Sync + Clone + 'static,
    N: NotificationClient + Send + Sync + 'static,
{
    #[allow(clippy::too_many_arguments)]
    pub fn new(
        cancellation_token: CancellationToken,
        config: Config,
        currencies: Currencies,
        swap_status_update_tx: tokio::sync::broadcast::Sender<Vec<SwapStatus>>,
        web_hook_helper: Box<W>,
        web_hook_caller: Caller,
        refund_signer: Option<Arc<dyn RefundSigner + Sync + Send>>,
        notification_client: Option<Arc<N>>,
    ) -> Self {
        Server {
            config,
            currencies,
            refund_signer,
            web_hook_helper,
            web_hook_caller,
            cancellation_token,
            notification_client,
            swap_status_update_tx,
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
            self.currencies.clone(),
            self.status_fetcher.clone(),
            self.swap_status_update_tx.clone(),
            Arc::new(self.web_hook_helper.clone()),
            Arc::new(self.web_hook_caller.clone()),
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
    use crate::db::helpers::web_hook::QueryResponse;
    use crate::db::helpers::web_hook::WebHookHelper;
    use crate::db::models::{WebHook, WebHookState};
    use crate::evm::refund_signer::RefundSigner;
    use crate::grpc::server::{Config, Server};
    use crate::grpc::service::boltzr::boltz_r_client::BoltzRClient;
    use crate::grpc::service::boltzr::GetInfoRequest;
    use crate::webhook::caller;
    use crate::ws;
    use alloy::primitives::{Address, FixedBytes, Signature, U256};
    use mockall::{mock, predicate::*};
    use std::collections::HashMap;
    use std::error::Error;
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
    async fn test_connect() {
        let token = CancellationToken::new();
        let (status_tx, _) = tokio::sync::broadcast::channel::<Vec<ws::types::SwapStatus>>(1);

        let server = Server::<_, crate::notifications::mattermost::Client>::new(
            token.clone(),
            Config {
                host: "127.0.0.1".to_string(),
                port: 9123,
                certificates: None,
                disable_ssl: Some(true),
            },
            HashMap::new(),
            status_tx,
            Box::new(make_mock_hook_helper()),
            caller::Caller::new(
                token.clone(),
                caller::Config {
                    max_retries: None,
                    retry_interval: None,
                    request_timeout: None,
                },
                Box::new(make_mock_hook_helper()),
            ),
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
        let (certs_dir, server, token, server_thread) = start_server_tls(9124).await;

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
        let (certs_dir, server, token, server_thread) = start_server_tls(9125).await;

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
        Server<MockWebHookHelper, crate::notifications::mattermost::Client>,
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
            HashMap::new(),
            status_tx,
            Box::new(make_mock_hook_helper()),
            caller::Caller::new(
                token.clone(),
                caller::Config {
                    max_retries: None,
                    retry_interval: None,
                    request_timeout: None,
                },
                Box::new(make_mock_hook_helper()),
            ),
            Some(Arc::new(MockRefundSigner::default())),
            None,
        );

        let mut server_cp = server.clone();
        let server_thread = tokio::spawn(async move {
            server_cp.start().await.unwrap();
            ()
        });
        tokio::time::sleep(Duration::from_millis(100)).await;

        (certs_dir, server, token, server_thread)
    }

    fn make_mock_hook_helper() -> MockWebHookHelper {
        let mut hook_helper = MockWebHookHelper::new();
        hook_helper.expect_clone().returning(make_mock_hook_helper);

        hook_helper
    }
}

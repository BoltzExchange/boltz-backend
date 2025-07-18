use crate::api::errors::{error_middleware, logging_middleware};
use crate::api::rescue::swap_rescue;
use crate::api::sse::sse_handler;
use crate::api::stats::get_stats;
#[cfg(feature = "metrics")]
use crate::metrics::server::MetricsLayer;
use crate::service::Service;
use crate::swap::manager::SwapManager;
use axum::routing::{get, patch, post};
use axum::{Extension, Router};
use serde::{Deserialize, Serialize};
use std::error::Error;
use std::sync::Arc;
use tokio_util::sync::CancellationToken;
use tracing::{debug, info};
use ws::status::SwapInfos;
use ws::types::SwapStatus;

mod bolt12;
mod errors;
mod headers;
mod lightning;
mod quoter;
mod rescue;
mod sse;
mod stats;
mod types;
pub mod ws;

pub use bolt12::MagicRoutingHint;

#[derive(Deserialize, Serialize, PartialEq, Clone, Debug)]
pub struct Config {
    pub host: String,
    pub port: u16,
}

pub struct Server<S, M> {
    config: Config,
    cancellation_token: CancellationToken,

    manager: Arc<M>,
    service: Arc<Service>,

    swap_infos: S,
    swap_status_update_tx: tokio::sync::broadcast::Sender<(Option<u64>, Vec<SwapStatus>)>,
}

struct ServerState<S, M> {
    manager: Arc<M>,
    service: Arc<Service>,

    swap_infos: S,
    swap_status_update_tx: tokio::sync::broadcast::Sender<(Option<u64>, Vec<SwapStatus>)>,
}

impl<S, M> Server<S, M>
where
    S: SwapInfos + Clone + Send + Sync + 'static,
    M: SwapManager + Send + Sync + 'static,
{
    pub fn new(
        config: Config,
        cancellation_token: CancellationToken,
        manager: Arc<M>,
        service: Arc<Service>,
        swap_infos: S,
        swap_status_update_tx: tokio::sync::broadcast::Sender<(Option<u64>, Vec<SwapStatus>)>,
    ) -> Self {
        Server {
            config,
            manager,
            service,
            swap_infos,
            cancellation_token,
            swap_status_update_tx,
        }
    }

    #[cfg(feature = "metrics")]
    pub async fn start(&self, metrics_layer: Option<MetricsLayer>) -> Result<(), Box<dyn Error>> {
        let mut router = Router::new();
        router = Self::add_routes(router);

        if let Some(metrics_layer) = metrics_layer {
            router = router.layer(metrics_layer);
        }

        self.listen(router).await
    }

    #[cfg(not(feature = "metrics"))]
    pub async fn start(&self) -> Result<(), Box<dyn Error>> {
        self.listen(Self::add_routes(Router::new())).await
    }

    async fn listen(&self, router: Router) -> Result<(), Box<dyn Error>> {
        let address = format!("{}:{}", self.config.host, self.config.port);
        info!("Starting API server on: {}", address);

        let cancellation_token = self.cancellation_token.clone();
        let listener = tokio::net::TcpListener::bind(address).await;
        match listener {
            Ok(listener) => {
                axum::serve(
                    listener,
                    router.layer(Extension(Arc::new(ServerState {
                        manager: self.manager.clone(),
                        service: self.service.clone(),
                        swap_infos: self.swap_infos.clone(),
                        swap_status_update_tx: self.swap_status_update_tx.clone(),
                    }))),
                )
                .with_graceful_shutdown(async move {
                    cancellation_token.cancelled().await;
                    debug!("Shutting down API server");
                })
                .await?;
                Ok(())
            }
            Err(err) => Err(err.into()),
        }
    }

    fn add_routes(router: Router) -> Router {
        router
            .route("/streamswapstatus", get(sse_handler::<S, M>))
            .route(
                "/v2/swap/{swap_type}/stats/{from}/{to}",
                get(get_stats::<S, M>),
            )
            .route("/v2/swap/rescue", post(swap_rescue::<S, M>))
            .route(
                "/v2/lightning/{currency}/node/{node}",
                get(lightning::node_info::<S, M>),
            )
            .route(
                "/v2/lightning/{currency}/channel/{id}",
                get(lightning::channel::<S, M>),
            )
            .route(
                "/v2/lightning/{currency}/channels/{node}",
                get(lightning::channels::<S, M>),
            )
            .route(
                "/v2/lightning/{currency}/search",
                get(lightning::search::<S, M>),
            )
            .route(
                "/v2/lightning/{currency}/bolt12",
                post(bolt12::create::<S, M>),
            )
            .route(
                "/v2/lightning/{currency}/bolt12",
                patch(bolt12::update::<S, M>),
            )
            .route(
                "/v2/lightning/{currency}/bolt12/delete",
                post(bolt12::delete::<S, M>),
            )
            .route(
                "/v2/lightning/{currency}/bolt12/{receiving}",
                get(bolt12::params::<S, M>),
            )
            .route(
                "/v2/lightning/{currency}/bolt12/fetch",
                post(bolt12::fetch::<S, M>),
            )
            .route("/v2/{currency}/quote", get(quoter::quote::<S, M>))
            .route("/v2/{currency}/quote/encode", post(quoter::encode::<S, M>))
            .layer(axum::middleware::from_fn(error_middleware))
            .layer(axum::middleware::from_fn(logging_middleware))
    }
}

#[cfg(test)]
pub mod test {
    use crate::api::ws::status::SwapInfos;
    use crate::api::ws::types::SwapStatus;
    use crate::api::{Config, Server};
    use crate::service::Service;
    use crate::swap::manager::test::MockManager;
    use async_trait::async_trait;
    use reqwest::StatusCode;
    use std::sync::Arc;
    use std::time::Duration;
    use tokio::sync::broadcast::Sender;
    use tokio_util::sync::CancellationToken;

    #[derive(Debug, Clone)]
    pub struct Fetcher {
        pub status_tx: Sender<(Option<u64>, Vec<SwapStatus>)>,
    }

    #[async_trait]
    impl SwapInfos for Fetcher {
        async fn fetch_status_info(&self, _: u64, ids: &[String]) {
            let mut res = Vec::new();
            ids.iter().for_each(|id| {
                res.push(SwapStatus::default(id.clone(), "swap.created".into()));
            });

            self.status_tx.send((None, res)).unwrap();
        }
    }

    #[tokio::test]
    async fn start_server() {
        let port = 13_001;
        let (cancel, _) = start(port).await;

        let res = reqwest::get(format!("http://127.0.0.1:{port}"))
            .await
            .unwrap();
        assert_eq!(res.status(), StatusCode::NOT_FOUND);

        cancel.cancel();
    }

    pub async fn start(port: u16) -> (CancellationToken, Sender<(Option<u64>, Vec<SwapStatus>)>) {
        let cancel = CancellationToken::new();
        let (status_tx, _) = tokio::sync::broadcast::channel::<(Option<u64>, Vec<SwapStatus>)>(16);

        let server = Server::new(
            Config {
                port,
                host: "127.0.0.1".to_string(),
            },
            cancel.clone(),
            Arc::new(MockManager::new()),
            Arc::new(Service::new_mocked_prometheus(false)),
            Fetcher {
                status_tx: status_tx.clone(),
            },
            status_tx.clone(),
        );
        tokio::spawn(async move {
            server.start(None).await.unwrap();
        });
        tokio::time::sleep(Duration::from_millis(100)).await;

        (cancel, status_tx)
    }
}

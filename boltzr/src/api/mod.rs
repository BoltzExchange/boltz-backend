use crate::api::sse::sse_handler;
use axum::routing::get;
use axum::{Extension, Router};
use serde::{Deserialize, Serialize};
use std::error::Error;
use std::sync::Arc;
use tokio_util::sync::CancellationToken;
use tracing::{debug, info};
use ws::status::SwapInfos;
use ws::types::SwapStatus;

#[cfg(feature = "metrics")]
use crate::metrics::server::MetricsLayer;

mod sse;
pub mod ws;

#[derive(Deserialize, Serialize, PartialEq, Clone, Debug)]
pub struct Config {
    pub host: String,
    pub port: u16,
}

pub struct Server<S> {
    swap_infos: S,
    config: Config,
    cancellation_token: CancellationToken,
    swap_status_update_tx: tokio::sync::broadcast::Sender<Vec<SwapStatus>>,
}

struct ServerState<S> {
    swap_infos: S,
    swap_status_update_tx: tokio::sync::broadcast::Sender<Vec<SwapStatus>>,
}

impl<S> Server<S>
where
    S: SwapInfos + Clone + Send + Sync + 'static,
{
    pub fn new(
        config: Config,
        cancellation_token: CancellationToken,
        swap_infos: S,
        swap_status_update_tx: tokio::sync::broadcast::Sender<Vec<SwapStatus>>,
    ) -> Self {
        Server {
            config,
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
        router.route("/streamswapstatus", get(sse_handler::<S>))
    }
}

#[cfg(test)]
mod test {
    use crate::api::ws::status::SwapInfos;
    use crate::api::ws::types::SwapStatus;
    use crate::api::{Config, Server};
    use async_trait::async_trait;
    use reqwest::StatusCode;
    use std::time::Duration;
    use tokio::sync::broadcast::Sender;
    use tokio_util::sync::CancellationToken;

    #[derive(Debug, Clone)]
    struct Fetcher {
        status_tx: Sender<Vec<SwapStatus>>,
    }

    #[async_trait]
    impl SwapInfos for Fetcher {
        async fn fetch_status_info(&self, ids: &[String]) {
            let mut res = Vec::new();
            ids.iter().for_each(|id| {
                res.push(SwapStatus::default(id.clone(), "swap.created".into()));
            });

            self.status_tx.send(res).unwrap();
        }
    }

    #[tokio::test]
    async fn start_server() {
        let port = 13_001;
        let (cancel, _) = start(port).await;

        let res = reqwest::get(format!("http://127.0.0.1:{}", port))
            .await
            .unwrap();
        assert_eq!(res.status(), StatusCode::NOT_FOUND);

        cancel.cancel();
    }

    pub async fn start(port: u16) -> (CancellationToken, Sender<Vec<SwapStatus>>) {
        let cancel = CancellationToken::new();
        let (status_tx, _) = tokio::sync::broadcast::channel::<Vec<SwapStatus>>(1);

        let server = Server::new(
            Config {
                port,
                host: "127.0.0.1".to_string(),
            },
            cancel.clone(),
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

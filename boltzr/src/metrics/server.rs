use axum::routing::get;
use axum::Router;
use axum_prometheus::metrics_exporter_prometheus::PrometheusHandle;
use axum_prometheus::GenericMetricLayer;
use metrics::{describe_counter, describe_gauge, Unit};
use serde::{Deserialize, Serialize};
use std::error::Error;
use tokio_util::sync::CancellationToken;
use tracing::{debug, error, info};

pub type MetricsLayer = GenericMetricLayer<'static, PrometheusHandle, axum_prometheus::Handle>;

#[derive(Deserialize, Serialize, PartialEq, Clone, Debug)]
pub struct Config {
    pub host: String,
    pub port: u16,

    #[serde(rename = "disableProcessMetrics")]
    pub disable_process_metrics: Option<bool>,

    #[serde(rename = "disableServerMetrics")]
    pub disable_server_metrics: Option<bool>,
}

#[derive(Clone)]
pub struct Server {
    config: Option<Config>,

    cancellation_token: CancellationToken,

    api_metrics_layer: Option<MetricsLayer>,
    api_metrics_handle: Option<PrometheusHandle>,
}

impl Server {
    pub fn new(cancellation_token: CancellationToken, config: Option<Config>) -> Self {
        if let Some(cfg) = config.clone() {
            if !cfg.disable_server_metrics.unwrap_or(false) {
                let (prometheus_layer, metric_handle) =
                    axum_prometheus::PrometheusMetricLayer::pair();

                return Server {
                    config,
                    cancellation_token,
                    api_metrics_handle: Some(metric_handle),
                    api_metrics_layer: Some(prometheus_layer),
                };
            }
        }

        Server {
            config,
            cancellation_token,
            api_metrics_layer: None,
            api_metrics_handle: None,
        }
    }

    pub fn api_metrics_layer(&self) -> Option<MetricsLayer> {
        self.api_metrics_layer.clone()
    }

    pub async fn start(&mut self) -> Result<(), Box<dyn Error>> {
        if self.config.is_none() {
            info!("Not starting metrics server because it was not configured");
            return Ok(());
        }
        let config = self.config.clone().unwrap();

        let mut router = Router::new();

        let prom_collector = Self::setup_prometheus_collector();

        if !config.disable_process_metrics.unwrap_or(false) {
            debug!("Enabling process metrics");

            let collector = metrics_process::Collector::default();
            collector.describe();

            router = router.route(
                "/",
                get(move || {
                    collector.collect();
                    std::future::ready(prom_collector.render())
                }),
            );
        }

        if let Some(api_metrics_handle) = self.api_metrics_handle.clone() {
            router = router.route(
                "/api",
                get(move || std::future::ready(api_metrics_handle.render())),
            );
        }

        let address = format!("{}:{}", config.host, config.port);
        info!("Starting metrics server on: {}", address);

        let listener = tokio::net::TcpListener::bind(address).await;

        let cancel_token = self.cancellation_token.clone();
        match listener {
            Ok(listener) => {
                axum::serve(listener, router)
                    .with_graceful_shutdown(async move {
                        cancel_token.cancelled().await;
                        debug!("Shutting down metrics server");
                    })
                    .await?;
                Ok(())
            }
            Err(err) => Err(err.into()),
        }
    }

    fn setup_prometheus_collector() -> metrics_exporter_prometheus::PrometheusHandle {
        let prom_collector = metrics_exporter_prometheus::PrometheusBuilder::new().build_recorder();
        let handle = prom_collector.handle();

        metrics::set_global_recorder(prom_collector).unwrap_or_else(|err| {
            error!("Could not set global metrics collector: {}", err);
        });

        describe_counter!(
            crate::metrics::GRPC_REQUEST_COUNT,
            Unit::Count,
            "number of gRPC requests received"
        );

        describe_counter!(
            crate::metrics::WEBHOOK_CALL_COUNT,
            Unit::Count,
            "number of Webhook calls made"
        );

        describe_gauge!(
            crate::metrics::WEBSOCKET_OPEN_COUNT,
            Unit::Count,
            "number of open WebSockets"
        );

        describe_gauge!(
            crate::metrics::SSE_OPEN_COUNT,
            Unit::Count,
            "number of open SSE streams",
        );

        handle
    }
}

#[cfg(test)]
mod server_test {
    use std::time::Duration;

    use axum::http::StatusCode;
    use tokio_util::sync::CancellationToken;

    use crate::metrics::server::{Config, Server};

    #[tokio::test]
    async fn test_start_server() {
        let (config, token) = start_server(9103, Some(true), Some(true)).await;

        let res = reqwest::get(format!("http://{}:{}/notFound", config.host, config.port))
            .await
            .unwrap();
        assert_eq!(res.status(), StatusCode::NOT_FOUND);

        token.cancel();
    }

    #[tokio::test]
    async fn test_serve_metrics() {
        let (config, token) = start_server(9104, Some(true), None).await;

        let res = reqwest::get(format!("http://{}:{}", config.host, config.port))
            .await
            .unwrap();
        assert_eq!(res.status(), StatusCode::OK);

        token.cancel();
    }

    #[tokio::test]
    async fn test_serve_api_metrics() {
        let (config, token) = start_server(9105, None, Some(true)).await;

        let res = reqwest::get(format!("http://{}:{}/api", config.host, config.port))
            .await
            .unwrap();
        assert_eq!(res.status(), StatusCode::OK);

        token.cancel();
    }

    async fn start_server(
        port: u16,
        disable_server_metrics: Option<bool>,
        disable_process_metrics: Option<bool>,
    ) -> (Config, CancellationToken) {
        let token = CancellationToken::new();
        let config = Config {
            port,
            disable_server_metrics,
            disable_process_metrics,
            host: "127.0.0.1".to_string(),
        };
        let mut server = Server::new(token.clone(), Some(config.clone()));

        tokio::spawn(async move { server.start().await.unwrap() });
        tokio::time::sleep(Duration::from_millis(50)).await;

        (config, token)
    }
}

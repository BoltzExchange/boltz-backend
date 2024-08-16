use axum::routing::get;
use axum::Router;
use metrics::{describe_counter, describe_gauge, Unit};
use serde::{Deserialize, Serialize};
use std::error::Error;
use tokio_util::sync::CancellationToken;
use tracing::{debug, error, info};

#[derive(Deserialize, Serialize, PartialEq, Clone, Debug)]
pub struct Config {
    pub host: String,
    pub port: u16,

    #[serde(rename = "disableProcessMetrics")]
    pub disable_process_metrics: Option<bool>,

    #[serde(rename = "disableServerMetrics")]
    pub disable_server_metrics: Option<bool>,
}

#[derive(Clone, Debug)]
pub struct Server {
    config: Option<Config>,

    cancellation_token: CancellationToken,
}

impl Server {
    pub fn new(cancellation_token: CancellationToken, config: Option<Config>) -> Self {
        Server {
            config,
            cancellation_token,
        }
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

        if !config.disable_server_metrics.unwrap_or(false) {
            let (prometheus_layer, metric_handle) = axum_prometheus::PrometheusMetricLayer::pair();
            router = router
                .route(
                    "/metrics_server",
                    get(move || std::future::ready(metric_handle.render())),
                )
                .layer(prometheus_layer);
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
    async fn test_serve_axum_metrics() {
        let (config, token) = start_server(9105, None, Some(true)).await;

        let res = reqwest::get(format!(
            "http://{}:{}/metrics_server",
            config.host, config.port
        ))
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

use axum::Router;
use axum::routing::get;
use axum_prometheus::GenericMetricLayer;
use axum_prometheus::metrics_exporter_prometheus::PrometheusHandle;
use metrics::{Unit, describe_counter, describe_gauge};
use serde::{Deserialize, Serialize};
use std::error::Error;
use tokio_util::sync::CancellationToken;
use tracing::{debug, error, info, warn};

pub type MetricsLayer = GenericMetricLayer<'static, PrometheusHandle, axum_prometheus::Handle>;

#[derive(Deserialize, Serialize, PartialEq, Clone, Debug)]
pub struct Config {
    pub host: String,
    pub port: u16,
}

#[derive(Clone)]
pub struct Server {
    config: Option<Config>,

    cancellation_token: CancellationToken,

    api_metrics_layer: MetricsLayer,
}

impl Server {
    pub fn new(cancellation_token: CancellationToken, config: Option<Config>) -> Self {
        let (api_metrics_layer, _) = axum_prometheus::PrometheusMetricLayerBuilder::new()
            .with_group_patterns_as("/api", &["/api"])
            // Swap stats
            .with_group_patterns_as("/v2/swap/:type/stats/:from/:to", &["/v2/swap/*/stats/*/*"])
            // Asset rescue
            .with_group_patterns_as(
                "/v2/asset/:currency/rescue/setup",
                &["/v2/asset/*/rescue/setup"],
            )
            .with_group_patterns_as(
                "/v2/asset/:currency/rescue/broadcast",
                &["/v2/asset/*/rescue/broadcast"],
            )
            // Lightning - more specific patterns first
            .with_group_patterns_as(
                "/v2/lightning/:currency/bolt12/fetch",
                &["/v2/lightning/*/bolt12/fetch"],
            )
            .with_group_patterns_as(
                "/v2/lightning/:currency/bolt12/delete",
                &["/v2/lightning/*/bolt12/delete"],
            )
            .with_group_patterns_as(
                "/v2/lightning/:currency/bolt12/:receiving",
                &["/v2/lightning/*/bolt12/*"],
            )
            .with_group_patterns_as(
                "/v2/lightning/:currency/bolt12",
                &["/v2/lightning/*/bolt12"],
            )
            .with_group_patterns_as(
                "/v2/lightning/:currency/node/:pubkey",
                &["/v2/lightning/*/node/*"],
            )
            .with_group_patterns_as(
                "/v2/lightning/:currency/channels/:pubkey",
                &["/v2/lightning/*/channels/*"],
            )
            .with_group_patterns_as(
                "/v2/lightning/:currency/channel/:id",
                &["/v2/lightning/*/channel/*"],
            )
            .with_group_patterns_as(
                "/v2/lightning/:currency/search",
                &["/v2/lightning/*/search"],
            )
            // Quoter
            .with_group_patterns_as("/v2/quote/:currency/in", &["/v2/quote/*/in"])
            .with_group_patterns_as("/v2/quote/:currency/out", &["/v2/quote/*/out"])
            .with_group_patterns_as("/v2/quote/:currency/encode", &["/v2/quote/*/encode"])
            .with_metrics_from_fn(|| {
                axum_prometheus::metrics_exporter_prometheus::PrometheusBuilder::new()
                    .build_recorder()
                    .handle()
            })
            .build_pair();

        Server {
            config,
            cancellation_token,
            api_metrics_layer,
        }
    }

    pub fn api_metrics_layer(&self) -> MetricsLayer {
        self.api_metrics_layer.clone()
    }

    pub async fn start(&mut self) -> Result<(), Box<dyn Error>> {
        if self.config.is_none() {
            warn!("Not starting metrics server because it was not configured");
            return Ok(());
        }
        let config = self.config.clone().unwrap();

        let mut router = Router::new();

        let prom_collector = Self::setup_prometheus_collector();

        let process_collector = metrics_process::Collector::default();
        process_collector.describe();

        router = router.route(
            "/",
            get(move || {
                process_collector.collect();
                std::future::ready(prom_collector.render())
            }),
        );

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

        describe_gauge!(
            crate::metrics::ZEROCONF_TOOL_TXS,
            Unit::Count,
            "number of transactions checked with the 0-conf tool",
        );

        describe_gauge!(
            crate::metrics::ZEROCONF_TOOL_TXS_CALLS,
            Unit::Count,
            "number of calls made to the 0-conf tool for accepted transactions",
        );

        describe_gauge!(
            crate::metrics::FEE_TARGET,
            Unit::Count,
            "RBF bumper fee target in sat/vbyte",
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
        let (config, token) = start_server(9103).await;

        let res = reqwest::get(format!("http://{}:{}/notFound", config.host, config.port))
            .await
            .unwrap();
        assert_eq!(res.status(), StatusCode::NOT_FOUND);

        token.cancel();
    }

    #[tokio::test]
    async fn test_serve_metrics() {
        let (config, token) = start_server(9104).await;

        let res = reqwest::get(format!("http://{}:{}", config.host, config.port))
            .await
            .unwrap();
        assert_eq!(res.status(), StatusCode::OK);

        token.cancel();
    }

    async fn start_server(port: u16) -> (Config, CancellationToken) {
        let token = CancellationToken::new();
        let config = Config {
            port,
            host: "127.0.0.1".to_string(),
        };
        let mut server = Server::new(token.clone(), Some(config.clone()));

        tokio::spawn(async move { server.start().await.unwrap() });
        tokio::time::sleep(Duration::from_millis(50)).await;

        (config, token)
    }
}

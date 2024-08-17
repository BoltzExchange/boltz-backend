use crate::config::GlobalConfig;
use crate::utils::built_info;
use std::fs;
use std::fs::OpenOptions;
use std::path::Path;
use tracing::{debug, error, info, warn, Subscriber};
use tracing_subscriber::layer::SubscriberExt;
use tracing_subscriber::{fmt, EnvFilter, Layer, Registry};

#[cfg(feature = "otel")]
use opentelemetry::trace::TracerProvider;

macro_rules! stdout_tracing {
    ($level: expr) => {
        fmt::layer()
            .compact()
            .with_file(true)
            .with_line_number(true)
            .with_filter(get_filter($level, false))
    };
}

macro_rules! file_tracing {
    ($level: expr, $file: expr) => {{
        let log_file_dir = Path::new($file.as_str()).parent().unwrap();
        if !log_file_dir.exists() {
            fs::create_dir_all(log_file_dir).unwrap_or_else(|e| {
                panic!("Could not create directory for log file: {}", e);
            });
        }

        let file = OpenOptions::new()
            .create(true)
            .append(true)
            .open($file.clone())
            .unwrap_or_else(|e| {
                panic!("Could not open log file: {}", e);
            });

        debug!("Logging to file: {}", $file);
        fmt::layer()
            .with_writer(file)
            .with_filter(get_filter($level, false))
    }};
}

pub fn setup_startup_tracing(log_level: String) -> impl Subscriber {
    Registry::default().with(stdout_tracing!(log_level.clone()))
}

#[warn(unused_variables)]
pub fn setup_global_tracing(log_level: String, config: &GlobalConfig) {
    let stdout_log = stdout_tracing!(log_level.clone());

    let log_file_path = config.sidecar.log_file.clone().unwrap();
    let file_log = file_tracing!(log_level.clone(), log_file_path);

    let layers: Box<dyn Layer<_> + Send + Sync + 'static> = Box::new(stdout_log.and_then(file_log));

    #[cfg(feature = "otel")]
    let layers: Box<dyn Layer<_> + Send + Sync + 'static> = {
        let tracer = init_tracer(config).unwrap_or_else(|err| {
            error!("Could not create OpenTelemetry: {}", err);
            None
        });
        if let Some(tracer) = tracer {
            Box::new(
                layers.and_then(
                    tracing_opentelemetry::layer()
                        .with_tracer(tracer)
                        .with_filter(get_filter(log_level.clone(), true)),
                ),
            )
        } else {
            Box::new(layers)
        }
    };

    #[cfg(feature = "loki")]
    let layers: Box<dyn Layer<_> + Send + Sync + 'static> = {
        let loki_log = setup_loki(config).unwrap_or_else(|err| {
            error!("Could not create Loki: {}", err);
            None
        });
        if let Some(loki_log) = loki_log {
            Box::new(layers.and_then(loki_log.with_filter(get_filter(log_level, false))))
        } else {
            Box::new(layers)
        }
    };

    tracing::subscriber::set_global_default(Registry::default().with(layers))
        .unwrap_or_else(|e| panic!("Could not set tracing subscriber: {}", e));
}

#[cfg(feature = "loki")]
fn setup_loki(
    config: &GlobalConfig,
) -> Result<Option<tracing_loki::Layer>, Box<dyn std::error::Error>> {
    if config.loki_endpoint.is_none() || config.loki_endpoint.clone().unwrap() == "" {
        warn!("Not enabling Loki because it was not configured");
        return Ok(None);
    }

    info!("Enabling Loki");

    let network = crate::utils::get_network(&config.network);
    let (loki_layer, loki_task) = tracing_loki::builder()
        .label("job", crate::utils::get_name(&network))?
        .label("service_name", crate::utils::get_name(&network))?
        .label("application", "sidecar")?
        .label("network", network)?
        .extra_field("pid", format!("{}", std::process::id()))?
        .build_url(
            tracing_loki::url::Url::parse(config.loki_endpoint.clone().unwrap().as_str()).unwrap(),
        )
        .unwrap();

    tokio::spawn(loki_task);

    Ok(Some(loki_layer))
}

#[cfg(feature = "otel")]
fn init_tracer(
    config: &GlobalConfig,
) -> Result<Option<opentelemetry_sdk::trace::Tracer>, opentelemetry::trace::TraceError> {
    if config.otlp_endpoint.is_none() || config.otlp_endpoint.clone().unwrap() == "" {
        warn!("Not enabling OpenTelemetry because it was not configured");
        return Ok(None);
    }

    use opentelemetry_otlp::WithExportConfig;
    use opentelemetry_sdk::runtime;

    info!("Enabling OpenTelemetry");

    opentelemetry::global::set_text_map_propagator(
        opentelemetry_sdk::propagation::TraceContextPropagator::new(),
    );

    let tracer = opentelemetry_otlp::new_pipeline()
        .tracing()
        .with_trace_config(opentelemetry_sdk::trace::Config::default().with_resource(
            opentelemetry_sdk::Resource::new(vec![
                opentelemetry::KeyValue::new(
                    opentelemetry_semantic_conventions::resource::SERVICE_NAME,
                    crate::utils::get_name(&crate::utils::get_network(&config.network)),
                ),
                opentelemetry::KeyValue::new(
                    opentelemetry_semantic_conventions::resource::SERVICE_VERSION,
                    built_info::PKG_VERSION,
                ),
                opentelemetry::KeyValue::new(
                    opentelemetry_semantic_conventions::resource::PROCESS_PID,
                    std::process::id().to_string(),
                ),
            ]),
        ))
        .with_batch_config(opentelemetry_sdk::trace::BatchConfig::default())
        .with_exporter(
            opentelemetry_otlp::new_exporter()
                .tonic()
                .with_endpoint("http://10.0.0.9:4317/v1/traces"),
        )
        .install_batch(runtime::Tokio)?;

    Ok(Some(tracer.tracer(built_info::PKG_NAME)))
}

fn get_filter(log_level: String, is_otel: bool) -> EnvFilter {
    EnvFilter::try_from_default_env().unwrap_or_else(|_| {
        format!(
            "{}={}{}",
            built_info::PKG_NAME,
            log_level,
            if is_otel {
                format!(",diesel_tracing::pg={}", log_level)
            } else {
                "".to_string()
            }
        )
        .into()
    })
}

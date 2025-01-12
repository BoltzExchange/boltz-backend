use crate::config::GlobalConfig;
use crate::utils::built_info;
use std::fs;
use std::fs::OpenOptions;
use std::path::Path;
use tracing::{debug, error, info, warn, Subscriber};
use tracing_subscriber::layer::SubscriberExt;
use tracing_subscriber::reload::Handle;
use tracing_subscriber::{fmt, reload, EnvFilter, Layer, Registry};

#[cfg(feature = "otel")]
use opentelemetry::trace::TracerProvider;
use opentelemetry_otlp::WithExportConfig;

#[derive(Clone)]
pub struct ReloadHandler {
    handles: Vec<(Handle<EnvFilter, Registry>, bool)>,
}

impl ReloadHandler {
    pub fn new() -> Self {
        Self {
            handles: Vec::new(),
        }
    }

    pub fn modify(&self, level: &str) -> anyhow::Result<()> {
        info!("Setting log level to: {}", level);
        for (handle, is_otel) in &self.handles {
            handle.modify(|filter| *filter = env_filter(level.to_string(), *is_otel))?;
        }

        Ok(())
    }

    fn add(&mut self, handle: Handle<EnvFilter, Registry>, is_otel: bool) {
        self.handles.push((handle, is_otel));
    }
}

macro_rules! stdout_tracing {
    ($level: expr) => {{
        let (filter, reload) = get_filter($level, false);
        let layer = fmt::layer()
            .compact()
            .with_file(true)
            .with_line_number(true)
            .with_filter(filter);

        (layer, reload)
    }};
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
        let (filter, reload) = get_filter($level, false);
        let layer = fmt::layer().with_writer(file).with_filter(filter);

        (layer, reload)
    }};
}

pub fn setup_startup_tracing(log_level: String) -> impl Subscriber {
    // No need to reload the setup logger
    let (layer, _) = stdout_tracing!(log_level.clone());
    Registry::default().with(layer)
}

pub fn setup_global_tracing(log_level: String, config: &GlobalConfig) -> ReloadHandler {
    let mut reloader = ReloadHandler::new();

    let (stdout_log, reload) = stdout_tracing!(log_level.clone());
    reloader.add(reload, false);

    let log_file_path = config.sidecar.log_file.clone().unwrap();
    let (file_log, reload) = file_tracing!(log_level.clone(), log_file_path);
    reloader.add(reload, false);

    let layers: Box<dyn Layer<_> + Send + Sync + 'static> = Box::new(stdout_log.and_then(file_log));

    #[cfg(feature = "otel")]
    let layers: Box<dyn Layer<_> + Send + Sync + 'static> = {
        let tracer = init_tracer(config).unwrap_or_else(|err| {
            error!("Could not create OpenTelemetry: {}", err);
            None
        });
        if let Some(tracer) = tracer {
            let (filter, reload) = get_filter(log_level.clone(), true);
            reloader.add(reload, true);

            Box::new(
                layers.and_then(
                    tracing_opentelemetry::layer()
                        .with_tracer(tracer)
                        .with_filter(filter),
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
            let (filter, reload) = get_filter(log_level, false);
            reloader.add(reload, false);

            Box::new(layers.and_then(loki_log.with_filter(filter)))
        } else {
            Box::new(layers)
        }
    };

    tracing::subscriber::set_global_default(Registry::default().with(layers))
        .unwrap_or_else(|e| panic!("Could not set tracing subscriber: {}", e));

    reloader
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
    let endpoint = config.otlp_endpoint.clone();

    if endpoint.is_none() || endpoint.clone().unwrap() == "" {
        warn!("Not enabling OpenTelemetry because it was not configured");
        return Ok(None);
    }

    info!("Enabling OpenTelemetry");

    opentelemetry::global::set_text_map_propagator(
        opentelemetry_sdk::propagation::TraceContextPropagator::new(),
    );

    let exporter = opentelemetry_otlp::SpanExporter::builder()
        .with_tonic()
        .with_endpoint(endpoint.unwrap())
        .build()?;

    let tracer = opentelemetry_sdk::trace::TracerProvider::builder()
        .with_resource(opentelemetry_sdk::Resource::new(vec![
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
        ]))
        .with_batch_exporter(exporter, opentelemetry_sdk::runtime::Tokio)
        .build();

    Ok(Some(tracer.tracer(built_info::PKG_NAME)))
}

fn get_filter<S>(
    log_level: String,
    is_otel: bool,
) -> (reload::Layer<EnvFilter, S>, Handle<EnvFilter, S>) {
    reload::Layer::<EnvFilter, S>::new(env_filter(log_level, is_otel))
}

fn env_filter(log_level: String, is_otel: bool) -> EnvFilter {
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

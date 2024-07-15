use crate::config::GlobalConfig;
use crate::utils::built_info;
use std::fs;
use std::fs::OpenOptions;
use std::path::Path;
use tracing::{debug, warn, Subscriber};
use tracing_subscriber::layer::SubscriberExt;
use tracing_subscriber::{fmt, EnvFilter, Layer, Registry};

macro_rules! stdout_tracing {
    ($level: expr) => {
        fmt::layer()
            .compact()
            .with_file(true)
            .with_line_number(true)
            .with_filter(get_filter($level))
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
            .with_filter(get_filter($level))
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

    #[cfg(feature = "loki")]
    {
        let loki_log = setup_loki(config).unwrap_or_else(|err| {
            panic!("Could not create loki: {}", err);
        });
        let layers = stdout_log.and_then(file_log);
        (if let Some(loki_log) = loki_log {
            tracing::subscriber::set_global_default(
                Registry::default()
                    .with(layers.and_then(loki_log).with_filter(get_filter(log_level))),
            )
        } else {
            tracing::subscriber::set_global_default(Registry::default().with(layers))
        })
        .unwrap_or_else(|e| panic!("Could not set tracing subscriber: {}", e));
    }

    #[cfg(not(feature = "loki"))]
    {
        let subscriber = Registry::default().with(stdout_log.and_then(file_log));
        tracing::subscriber::set_global_default(subscriber)
            .unwrap_or_else(|e| panic!("Could not set tracing subscriber: {}", e));
    }
}

#[cfg(feature = "loki")]
fn setup_loki(
    config: &GlobalConfig,
) -> Result<Option<tracing_loki::Layer>, Box<dyn std::error::Error>> {
    if config.loki_host.is_none() || config.loki_host.clone().unwrap() == "" {
        warn!("Not enabling loki because it was not configured");
        return Ok(None);
    }

    tracing::info!("Enabling loki");
    let (loki_layer, loki_task) = tracing_loki::builder()
        .label("job", "boltz-backend")?
        .label("application", "sidecar")?
        .label(
            "network",
            config.loki_network.clone().unwrap_or("regtest".to_string()),
        )?
        .extra_field("pid", format!("{}", std::process::id()))?
        .build_url(
            tracing_loki::url::Url::parse(config.loki_host.clone().unwrap().as_str()).unwrap(),
        )
        .unwrap();

    tokio::spawn(loki_task);

    Ok(Some(loki_layer))
}

fn get_filter(log_level: String) -> EnvFilter {
    EnvFilter::try_from_default_env()
        .unwrap_or_else(|_| format!("{}={}", built_info::PKG_NAME, log_level).into())
}

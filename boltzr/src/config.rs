use serde::{Deserialize, Serialize};
use std::error::Error;
use std::fs;
use std::path::Path;
use tracing::{debug, info, trace};

#[derive(Deserialize, Serialize, PartialEq, Clone, Debug)]
pub struct Config {
    #[serde(rename = "dataDir")]
    pub data_dir: Option<String>,

    #[serde(rename = "logFile")]
    pub log_file: Option<String>,

    pub grpc: crate::grpc::server::Config,
    pub webhook: crate::webhook::caller::Config,

    #[cfg(feature = "metrics")]
    pub metrics: Option<crate::metrics::server::Config>,
}

#[derive(Deserialize, Serialize, Clone)]
pub struct GlobalConfig {
    #[cfg(any(feature = "loki", feature = "otel"))]
    #[serde(rename = "network")]
    pub network: Option<String>,

    #[cfg(feature = "loki")]
    #[serde(rename = "lokiEndpoint")]
    pub loki_endpoint: Option<String>,

    #[cfg(feature = "otel")]
    #[serde(rename = "otlpEndoint")]
    pub otlp_endoint: Option<String>,

    pub postgres: crate::db::Config,

    pub sidecar: Config,
}

pub fn parse_config(path: &str) -> Result<GlobalConfig, Box<dyn Error>> {
    debug!("Reading config: {}", path);
    let mut config = toml::from_str::<GlobalConfig>(fs::read_to_string(path)?.as_ref())?;
    trace!("Read config: {:#}", serde_json::to_string_pretty(&config)?);

    let data_dir = config.clone().sidecar.data_dir.unwrap_or(
        Path::new(path)
            .parent()
            .unwrap()
            .join("sidecar")
            .to_str()
            .unwrap()
            .to_string(),
    );
    config.sidecar.data_dir = Some(data_dir.clone());
    info!("Using data dir: {}", data_dir.clone());

    if !Path::new(&data_dir.clone()).exists() {
        fs::create_dir_all(data_dir.clone())?;
    }

    if config.sidecar.log_file.is_none() {
        config.sidecar.log_file = Some(
            Path::new(&data_dir)
                .join("sidecar.log")
                .to_str()
                .unwrap()
                .to_string(),
        );
    }

    if config.sidecar.grpc.certificates.is_none() {
        config.sidecar.grpc.certificates = Some(
            Path::new(&data_dir)
                .join("certificates")
                .to_str()
                .unwrap()
                .to_string(),
        );
    }

    trace!(
        "Sanitized config: {:#}",
        serde_json::to_string_pretty(&config)?
    );
    Ok(config)
}

#[cfg(test)]
mod test_config {
    use crate::config::{parse_config, Config};
    use std::fs;
    use std::path::Path;

    #[test]
    fn test_file_non_existent() {
        let path = Path::new(env!("CARGO_MANIFEST_DIR")).join("does-not-exist");
        assert_eq!(
            parse_config(path.to_str().unwrap())
                .err()
                .unwrap()
                .to_string(),
            "No such file or directory (os error 2)"
        );
    }

    #[test]
    fn test_parsing_failed() {
        let path = Path::new(env!("CARGO_MANIFEST_DIR")).join("invalid-config-test");
        fs::create_dir(path.clone()).unwrap();

        let config_file_path = path.clone().join("config.toml");
        fs::write(
            config_file_path.clone(),
            r#"
[sidecar]
irrelevant = "values"
        "#,
        )
        .unwrap();

        assert!(parse_config(config_file_path.to_str().unwrap())
            .err()
            .unwrap()
            .to_string()
            .starts_with("TOML parse error"),);

        fs::remove_dir_all(path).unwrap();
    }

    #[test]
    fn test_parsing() {
        let path = Path::new(env!("CARGO_MANIFEST_DIR")).join("config-test");
        fs::create_dir(path.clone()).unwrap();

        let config_file_path = path.clone().join("config.toml");
        fs::write(
            config_file_path.clone(),
            r#"
network = "someNetwork"

lokiEndpoint = "http://127.0.0.1:3100"

otlpEndoint = "http://127.0.0.1:4317/v1/traces"

[postgres]
host = "127.0.0.1"
port = 5432
database = "boltzDatabase"
username = "boltzUsername"
password = "boltzPassword"

lokiHost = "http://127.0.0.1:3100"
lokiNetwork = "someNetwork"

[sidecar]
  [sidecar.grpc]
  host = "127.0.0.1"
  port = 9003

  [sidecar.webhook]
  retryInterval = 60

  [sidecar.metrics]
  host = "127.0.0.1"
  port = 9093
        "#,
        )
        .unwrap();

        let config = parse_config(config_file_path.to_str().unwrap()).unwrap();
        assert_eq!(config.network.unwrap(), "someNetwork");
        assert_eq!(config.loki_endpoint.unwrap(), "http://127.0.0.1:3100");
        assert_eq!(
            config.otlp_endoint.unwrap(),
            "http://127.0.0.1:4317/v1/traces"
        );

        assert_eq!(
            config.postgres,
            crate::db::Config {
                host: "127.0.0.1".to_string(),
                port: 5432,
                database: "boltzDatabase".to_string(),
                username: "boltzUsername".to_string(),
                password: "boltzPassword".to_string(),
            },
        );

        assert_eq!(
            config.sidecar,
            Config {
                data_dir: Some(path.clone().join("sidecar").to_str().unwrap().to_string()),
                log_file: Some(
                    path.clone()
                        .join("sidecar")
                        .join("sidecar.log")
                        .clone()
                        .to_str()
                        .unwrap()
                        .to_string()
                ),
                grpc: crate::grpc::server::Config {
                    host: "127.0.0.1".to_string(),
                    port: 9003,
                    disable_ssl: None,
                    certificates: Some(
                        path.clone()
                            .join("sidecar")
                            .join("certificates")
                            .to_str()
                            .unwrap()
                            .to_string()
                    ),
                },
                webhook: crate::webhook::caller::Config {
                    retry_interval: Some(60),
                    request_timeout: None,
                    max_retries: None,
                },
                metrics: Some(crate::metrics::server::Config {
                    host: "127.0.0.1".to_string(),
                    port: 9093,
                    disable_server_metrics: None,
                    disable_process_metrics: None,
                }),
            }
        );

        fs::remove_dir_all(path).unwrap();
    }
}

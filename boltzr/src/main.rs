use clap::Parser;
use serde::Serialize;
use std::sync::Arc;
use tracing::{debug, error, info, trace, warn};

use crate::config::parse_config;

mod config;
mod db;
mod evm;
mod grpc;
mod tracing_setup;
mod utils;
mod webhook;

#[cfg(feature = "metrics")]
mod metrics;

#[derive(Parser, Serialize, Debug, Clone)]
#[command(author = "Boltz", about = "Boltz Backend sidecar", version, about, long_about = None)]
struct Args {
    /// Path to the config file
    #[arg(short, long, default_value_t = String::from(format!("{}/.boltz/boltz.conf", dirs::home_dir().unwrap_or_else(|| "".into()).display())))]
    config: String,

    /// Log level of the application
    /// Possible values: error, warn, info, debug, trace
    #[arg(short, long, default_value_t = String::from("debug"))]
    log_level: String,
}

#[tokio::main]
async fn main() {
    let args = Args::parse();

    let config = tracing::subscriber::with_default(
        tracing_setup::setup_startup_tracing(args.log_level.clone()),
        || {
            trace!(
                "Parsed CLI arguments: {:#}",
                serde_json::to_string_pretty(&args).unwrap()
            );
            let config = match parse_config(args.config.as_str()) {
                Ok(config) => config,
                Err(e) => {
                    error!("Could not read config: {}", e);
                    std::process::exit(1);
                }
            };
            tracing_setup::setup_global_tracing(args.log_level, &config);
            config
        },
    );

    info!(
        "Starting {} v{}",
        utils::built_info::PKG_NAME,
        utils::get_version(),
    );
    info!(
        "Compiled {} with features: [{}]",
        utils::built_info::PROFILE,
        utils::built_info::FEATURES_STR,
    );
    debug!(
        "Compiled with {} for {}",
        utils::built_info::RUSTC_VERSION,
        utils::built_info::TARGET
    );

    let db_pool = db::connect(config.postgres).unwrap_or_else(|err| {
        error!("Could not connect to database: {}", err);
        std::process::exit(1);
    });
    let refund_signer = if let Some(rsk_config) = config.rsk {
        Some(
            evm::refund_signer::LocalRefundSigner::new_mnemonic_file(
                config.mnemonic_path.unwrap(),
                &rsk_config,
            )
            .await
            .unwrap_or_else(|e| {
                error!("Could not initialize EVM refund signer: {}", e);
                std::process::exit(1);
            }),
        )
    } else {
        warn!("Not creating refund signer because RSK was not configured");
        None
    };

    let cancellation_token = tokio_util::sync::CancellationToken::new();

    #[cfg(feature = "metrics")]
    let mut metrics_server =
        metrics::server::Server::new(cancellation_token.clone(), config.sidecar.metrics);
    #[cfg(feature = "metrics")]
    let metrics_handle = tokio::spawn(async move {
        match metrics_server.start().await {
            Ok(_) => {}
            Err(err) => {
                error!("Could not start metrics server: {}", err);
            }
        };
    });

    let web_hook_caller = webhook::caller::Caller::new(
        cancellation_token.clone(),
        config.sidecar.webhook.unwrap_or(webhook::caller::Config {
            request_timeout: None,
            max_retries: None,
            retry_interval: None,
        }),
        Box::new(db::helpers::web_hook::WebHookHelperDatabase::new(
            db_pool.clone(),
        )),
    );
    let mut grpc_server = grpc::server::Server::new(
        cancellation_token.clone(),
        config.sidecar.grpc,
        Box::new(db::helpers::web_hook::WebHookHelperDatabase::new(db_pool)),
        web_hook_caller,
        if let Some(refund_signer) = refund_signer {
            Some(Arc::new(refund_signer))
        } else {
            None
        },
    );

    let grpc_handle = tokio::spawn(async move {
        match grpc_server.start().await {
            Ok(_) => {}
            Err(err) => {
                error!("Could not start gRPC server: {}", err);
            }
        };
    });

    ctrlc::set_handler(move || {
        info!("Got shutdown signal");
        cancellation_token.cancel();
    })
    .unwrap_or_else(|e| error!("Could not register exist handler: {}", e));

    grpc_handle.await.unwrap();

    #[cfg(feature = "metrics")]
    metrics_handle.await.unwrap();

    info!("Exiting");
}

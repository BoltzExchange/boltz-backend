use std::sync::Arc;

use clap::Parser;
use serde::Serialize;
use tracing::{debug, error, info, trace, warn};

use crate::config::parse_config;

mod config;
mod db;
mod evm;
mod grpc;
mod notifications;
mod tracing_setup;
mod utils;
mod webhook;
mod ws;

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

    let notification_client = if let Some(config) = config.notification {
        match notifications::mattermost::Client::new(cancellation_token.clone(), config).await {
            Ok(c) => Some(c),
            Err(err) => {
                error!("Could not create notification client: {}", err);
                None
            }
        }
    } else {
        warn!("Notification client not configured");
        None
    };

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

    let (swap_status_update_tx, _swap_status_update_rx) =
        tokio::sync::broadcast::channel::<Vec<ws::types::SwapStatus>>(128);

    let mut grpc_server = grpc::server::Server::new(
        cancellation_token.clone(),
        config.sidecar.grpc,
        swap_status_update_tx.clone(),
        Box::new(db::helpers::web_hook::WebHookHelperDatabase::new(db_pool)),
        web_hook_caller,
        match refund_signer {
            Some(signer) => Some(Arc::new(signer)),
            None => None,
        },
        notification_client.clone().map(Arc::new),
    );

    let status_ws = ws::status::Status::new(
        cancellation_token.clone(),
        config.sidecar.ws,
        grpc_server.status_fetcher(),
        swap_status_update_tx,
    );

    let grpc_handle = tokio::spawn(async move {
        match grpc_server.start().await {
            Ok(_) => {}
            Err(err) => {
                error!("Could not start gRPC server: {}", err);
            }
        };
    });

    let notification_listener_handle = tokio::spawn(async move {
        if let Some(client) = notification_client {
            client.listen().await;
        }
    });

    let status_ws_handler = tokio::spawn(async move {
        if let Err(err) = status_ws.start().await {
            error!("Could not start status WebSocket: {}", err);
        }
    });

    ctrlc::set_handler(move || {
        info!("Got shutdown signal");
        cancellation_token.cancel();
    })
    .unwrap_or_else(|e| {
        error!("Could not register exit handler: {}", e);
        std::process::exit(1);
    });

    status_ws_handler.await.unwrap();
    grpc_handle.await.unwrap();
    notification_listener_handle.await.unwrap();

    #[cfg(feature = "metrics")]
    metrics_handle.await.unwrap();

    info!("Exiting");
}

use crate::config::parse_config;
use crate::currencies::connect_nodes;
use crate::swap::manager::Manager;
use api::ws;
use clap::Parser;
use serde::Serialize;
use std::sync::Arc;
use tokio::task;
use tracing::{debug, error, info, trace, warn};

mod api;
mod backup;
mod chain;
mod config;
mod currencies;
mod db;
mod evm;
mod grpc;
mod lightning;
mod notifications;
mod swap;
mod tracing_setup;
mod utils;
mod wallet;
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

    let (config, log_reload_handler) = tracing::subscriber::with_default(
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
            (
                config.clone(),
                tracing_setup::setup_global_tracing(args.log_level, &config),
            )
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

    let db_pool = db::connect(config.postgres.clone()).unwrap_or_else(|err| {
        error!("Could not connect to database: {}", err);
        std::process::exit(1);
    });

    // TODO: move to currencies
    let refund_signer = if let Some(rsk_config) = config.rsk {
        Some(
            evm::manager::Manager::from_mnemonic_file(
                config.mnemonic_path_evm.unwrap(),
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
    let api_metrics_layer = metrics_server.api_metrics_layer();
    #[cfg(feature = "metrics")]
    let metrics_handle = tokio::spawn(async move {
        if let Err(err) = metrics_server.start().await {
            error!("Could not start metrics server: {}", err);
        }
    });

    let currencies = match connect_nodes(
        cancellation_token.clone(),
        config.network,
        config.currencies,
        config.liquid,
    )
    .await
    {
        Ok(currencies) => currencies,
        Err(err) => {
            error!("Could not initialize currencies: {}", err);
            std::process::exit(1);
        }
    };

    let backup_client = if let Some(backup_config) = config.backup {
        match backup::Backup::new(
            cancellation_token.clone(),
            backup_config,
            config.postgres,
            currencies.clone(),
        )
        .await
        {
            Ok(b) => Some(b),
            Err(err) => {
                error!("Could not create backup client: {}", err);
                None
            }
        }
    } else {
        warn!("Backup config is missing");
        None
    };

    let notification_client = if let Some(config) = config.notification {
        match notifications::mattermost::Client::<notifications::commands::Commands>::new(
            cancellation_token.clone(),
            config,
            notifications::commands::Commands::new(backup_client.clone()),
        )
        .await
        {
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

    let backup_handle = backup_client.map(|b| {
        task::spawn(async move {
            if let Err(err) = b.start().await {
                error!("Backup scheduler failed: {}", err);
            };
        })
    });

    let (swap_status_update_tx, _swap_status_update_rx) =
        tokio::sync::broadcast::channel::<Vec<ws::types::SwapStatus>>(128);

    let swap_manager = Arc::new(Manager::new(
        cancellation_token.clone(),
        currencies,
        db_pool.clone(),
    ));

    let mut grpc_server = grpc::server::Server::new(
        cancellation_token.clone(),
        config.sidecar.grpc,
        log_reload_handler,
        swap_manager.clone(),
        swap_status_update_tx.clone(),
        Box::new(db::helpers::web_hook::WebHookHelperDatabase::new(db_pool)),
        web_hook_caller,
        match refund_signer {
            Some(signer) => Some(Arc::new(signer)),
            None => None,
        },
        notification_client.clone().map(Arc::new),
    );

    let api_server = api::Server::new(
        config.sidecar.api,
        cancellation_token.clone(),
        grpc_server.status_fetcher(),
        swap_status_update_tx.clone(),
    );
    let api_handle = tokio::spawn(async move {
        #[cfg(feature = "metrics")]
        let res = api_server.start(api_metrics_layer);

        #[cfg(not(feature = "metrics"))]
        let res = api_server.start();

        if let Err(err) = res.await {
            error!("Could not start API server: {}", err);
        }
    });

    let status_ws = ws::status::Status::new(
        cancellation_token.clone(),
        config.sidecar.ws,
        grpc_server.status_fetcher(),
        swap_status_update_tx,
    );

    let grpc_handle = tokio::spawn(async move {
        if let Err(err) = grpc_server.start().await {
            error!("Could not start gRPC server: {}", err);
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

    let swap_manager_handler = tokio::spawn(async move {
        swap_manager.start().await;
    });

    ctrlc::set_handler(move || {
        info!("Got shutdown signal");
        cancellation_token.cancel();
    })
    .unwrap_or_else(|e| {
        error!("Could not register exit handler: {}", e);
        std::process::exit(1);
    });

    if let Some(backup_handle) = backup_handle {
        backup_handle.await.unwrap();
    }

    api_handle.await.unwrap();
    grpc_handle.await.unwrap();
    status_ws_handler.await.unwrap();
    swap_manager_handler.await.unwrap();
    notification_listener_handle.await.unwrap();

    #[cfg(feature = "metrics")]
    metrics_handle.await.unwrap();

    info!("Exiting");
}

use crate::chain::BaseClient;
use anyhow::anyhow;
use async_trait::async_trait;
use fedimint_tonic_lnd::lnrpc::{
    ChanBackupExportRequest, ChannelBackupSubscription, GetInfoRequest,
};
use serde::{Deserialize, Serialize};
use std::time::Duration;
use tokio_util::sync::CancellationToken;
use tracing::{debug, error, info, instrument, warn};

const RECONNECT_INTERVAL: Duration = Duration::from_secs(5);

#[derive(Deserialize, Serialize, PartialEq, Clone, Debug)]
pub struct Config {
    pub host: String,
    pub port: u16,

    pub certpath: String,
    pub macaroonpath: String,
}

#[derive(Clone)]
pub struct Lnd {
    cancellation_token: CancellationToken,

    symbol: String,
    lnd: fedimint_tonic_lnd::Client,

    scb_backup_tx: tokio::sync::broadcast::Sender<Vec<u8>>,
}

impl Lnd {
    #[instrument(name = "Lnd::new", skip(config))]
    pub async fn new(
        cancellation_token: CancellationToken,
        symbol: &str,
        config: Config,
    ) -> anyhow::Result<Self> {
        let (scb_backup_tx, _) = tokio::sync::broadcast::channel::<Vec<u8>>(16);

        Ok(Lnd {
            scb_backup_tx,
            cancellation_token,
            symbol: symbol.to_string(),
            lnd: fedimint_tonic_lnd::connect(
                format!("https://{}:{}", config.host, config.port),
                config.certpath,
                config.macaroonpath,
            )
            .await?,
        })
    }

    pub async fn channel_backup(&mut self) -> anyhow::Result<Option<Vec<u8>>> {
        let res = self
            .lnd
            .lightning()
            .export_all_channel_backups(ChanBackupExportRequest {})
            .await?
            .into_inner();

        Ok(Some(match res.multi_chan_backup {
            Some(backup) => backup.multi_chan_backup,
            None => Vec::default(),
        }))
    }

    pub fn subscribe_channel_backups(&self) -> tokio::sync::broadcast::Receiver<Vec<u8>> {
        self.scb_backup_tx.subscribe()
    }

    async fn start_listeners(&mut self) -> anyhow::Result<()> {
        let mut backup_stream = self
            .lnd
            .lightning()
            .subscribe_channel_backups(ChannelBackupSubscription {})
            .await?
            .into_inner();

        loop {
            tokio::select! {
                message = backup_stream.message() => {
                    match message {
                        Ok(message) => {
                            if let Some(backup) = message {
                                if let Some(backup) = backup.multi_chan_backup {
                                    if let Err(err) = self.scb_backup_tx.send(backup.multi_chan_backup) {
                                        error!("Could not broadcast LND backup: {}", err);
                                    };
                                }
                            }
                        },
                        Err(err) => return Err(anyhow!("{}", err)),
                    }
                },
                _ = self.cancellation_token.cancelled() => {
                    debug!("Stopping LND subscriptions");
                    return Ok(());
                }
            }
        }
    }
}

#[async_trait]
impl BaseClient for Lnd {
    fn kind(&self) -> String {
        "LND".to_string()
    }

    fn symbol(&self) -> String {
        self.symbol.clone()
    }

    async fn connect(&mut self) -> anyhow::Result<()> {
        let info = self
            .lnd
            .lightning()
            .get_info(GetInfoRequest {})
            .await?
            .into_inner();
        info!(
            "Connected to {} LND {} ({})",
            self.symbol,
            info.version,
            if !info.alias.is_empty() {
                info.alias
            } else {
                info.identity_pubkey
            }
        );

        let mut self_sub = self.clone();
        tokio::spawn(async move {
            loop {
                match self_sub.start_listeners().await {
                    Ok(_) => break,
                    Err(err) => {
                        error!("LND subscriptions failed: {}", err);
                        warn!(
                            "Reconnecting to LND subscriptions in : {:?}",
                            RECONNECT_INTERVAL
                        );
                        tokio::time::sleep(RECONNECT_INTERVAL).await;
                    }
                }
            }
        });

        Ok(())
    }
}

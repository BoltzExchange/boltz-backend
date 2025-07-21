use crate::backup::providers::BackupProvider;
use crate::currencies::Currencies;
use crate::lightning::lnd::Lnd;
use alloy::hex;
use chrono::{Datelike, Timelike, Utc};
use dashmap::DashSet;
use flate2::write::GzEncoder;
use serde::{Deserialize, Serialize};
use std::io::Write;
use std::ops::Sub;
use std::process::Stdio;
use std::str::FromStr;
use std::sync::Arc;
use std::time::Duration;
use tokio::io::BufReader;
use tokio::process::ChildStdout;
use tokio_util::sync::CancellationToken;
use tracing::{debug, error, info, instrument, trace};

mod providers;

const DEFAULT_INTERVAL: &str = "0 0 0 * * *";
const SCB_RETRY_INTERVAL_SECONDS: u64 = 60;

#[derive(Serialize, Deserialize, PartialEq, Clone, Debug)]
pub struct Config {
    pub interval: Option<String>,

    #[serde(rename = "simpleStorage")]
    pub simple_storage: Vec<providers::s3::Config>,
}

#[derive(Clone)]
pub struct Backup {
    cancellation_token: CancellationToken,

    interval: String,
    db_config: crate::db::Config,

    provider: Arc<providers::multi::MultiProvider>,

    currencies: Currencies,
    to_retry: Arc<DashSet<String>>,
}

impl Backup {
    pub async fn new(
        cancellation_token: CancellationToken,
        config: Config,
        db_config: crate::db::Config,
        currencies: Currencies,
    ) -> anyhow::Result<Self> {
        let mut s3_providers: Vec<Box<dyn BackupProvider + Send + Sync>> = Vec::new();

        for (index, provider_config) in config.simple_storage.into_iter().enumerate() {
            match providers::s3::S3::new(&provider_config).await {
                Ok(provider) => s3_providers.push(Box::new(provider)),
                Err(e) => {
                    error!("Failed to initialize S3 provider {}: {}", index, e);
                }
            }
        }

        Ok(Backup {
            db_config,
            currencies,
            cancellation_token,
            to_retry: Arc::new(DashSet::new()),
            interval: config.interval.unwrap_or(DEFAULT_INTERVAL.to_string()),
            provider: Arc::new(providers::multi::MultiProvider::new(s3_providers).await?),
        })
    }

    pub async fn start(&self) -> anyhow::Result<()> {
        for (symbol, cur) in self.currencies.iter() {
            if let Some(mut lnd) = cur.lnd.clone() {
                let self_cp = self.clone();
                let mut backup_stream = lnd.subscribe_channel_backups();

                let symbol = symbol.clone();
                tokio::spawn(async move {
                    if let Err(err) = self_cp.lnd_backup(&symbol, &mut lnd).await {
                        error!("LND backup failed: {}", err);
                    }

                    loop {
                        while let Ok(backup) = backup_stream.recv().await {
                            if let Err(err) = self_cp.upload_lnd_backup(&symbol, &backup).await {
                                error!("LND backup stream upload failed: {}", err);
                                self_cp.to_retry.insert(symbol.to_string());
                            }
                        }
                    }
                });
            }
        }

        self.database_backup().await?;

        {
            let self_cp = self.clone();
            tokio::spawn(async move {
                self_cp.retry_loop().await;
            });
        }

        info!("Running database backup on interval: {}", self.interval);
        let schedule = cron::Schedule::from_str(&self.interval)?;

        for time in schedule.upcoming(Utc) {
            let now = Utc::now();

            tokio::select! {
                _ = tokio::time::sleep(Duration::from_secs(time.sub(now).num_seconds() as u64)) => {},
                _ = self.cancellation_token.cancelled() => {
                    debug!("Stopping backup scheduler");
                    break;
                }
            }

            if let Err(err) = self.database_backup().await {
                error!("Database backup failed: {}", err);
            }
        }

        Ok(())
    }

    #[instrument(name = "Backup::database_backup", skip_all)]
    pub async fn database_backup(&self) -> anyhow::Result<()> {
        info!("Uploading database backup");

        let path = format!("backend/database-{}.sql.zst", Self::format_date());
        let mut stdout = self.database_backup_stream()?;
        self.provider.put_stream(&path, &mut stdout).await?;

        trace!("Uploaded database backup");

        Ok(())
    }

    async fn retry_loop(self) {
        let dur = Duration::from_secs(SCB_RETRY_INTERVAL_SECONDS);
        debug!("Retrying failed backups every {:#?}", dur);
        let mut interval = tokio::time::interval(dur);

        loop {
            tokio::select! {
                _ = interval.tick() => {},
                _ = self.cancellation_token.cancelled() => {
                    break;
                }
            }

            for symbol in self
                .to_retry
                .iter()
                .map(|s| s.key().clone())
                .collect::<Vec<_>>()
            {
                debug!("Retrying SCB backup for LND {}", symbol);
                let cur = match self.currencies.get(&symbol) {
                    Some(c) => c,
                    None => continue,
                };
                let mut lnd = match &cur.lnd {
                    Some(lnd) => lnd.clone(),
                    None => continue,
                };

                match self.lnd_backup(&symbol, &mut lnd).await {
                    Ok(_) => {
                        debug!("Retry of SCB backup for LND {} succeeded", symbol);
                        self.to_retry.remove(&symbol);
                    }
                    Err(err) => {
                        error!("LND {} backup retry failed: {}", symbol, err);
                        continue;
                    }
                };
            }
        }
    }

    #[instrument(name = "Backup::lnd_backup", skip(self, lnd))]
    async fn lnd_backup(&self, symbol: &str, lnd: &mut Lnd) -> anyhow::Result<()> {
        let backup = lnd.channel_backup().await?;
        if let Some(backup) = backup {
            self.upload_lnd_backup(symbol, &backup).await?;
        }

        Ok(())
    }

    async fn upload_lnd_backup(&self, symbol: &str, backup: &[u8]) -> anyhow::Result<()> {
        info!("Uploading LND {} channel backup", symbol);

        let mut encoder = GzEncoder::new(Vec::new(), flate2::Compression::best());
        encoder.write_all(hex::encode(backup).as_bytes())?;
        let data = encoder.finish()?;

        self.provider
            .put(
                &format!(
                    "lnd/{}/multiChannelBackup-{}.txt.gz",
                    symbol,
                    Self::format_date()
                ),
                &data,
            )
            .await?;

        Ok(())
    }

    fn database_backup_stream(&self) -> anyhow::Result<BufReader<ChildStdout>> {
        let mut dump_cmd = tokio::process::Command::new("pg_dump")
            .env("PGPASSWORD", self.db_config.password.clone())
            .arg("-U")
            .arg(self.db_config.username.clone())
            .arg("-h")
            .arg(self.db_config.host.clone())
            .arg("-p")
            .arg(format!("{}", self.db_config.port))
            .arg("-d")
            .arg(self.db_config.database.clone())
            .stdout(Stdio::piped())
            .spawn()?;

        let pipe: Stdio = dump_cmd.stdout.take().unwrap().try_into()?;

        let mut data_cmd = tokio::process::Command::new("zstd")
            .stdin(pipe)
            .stdout(Stdio::piped())
            .spawn()?;

        Ok(BufReader::new(data_cmd.stdout.take().unwrap()))
    }

    fn format_date() -> String {
        let now = Utc::now();
        format!(
            "{}{:0>2}{:0>2}-{:0>2}{:0>2}",
            now.year(),
            now.month(),
            now.day(),
            now.hour(),
            now.minute()
        )
    }
}

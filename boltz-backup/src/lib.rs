use crate::providers::BackupProvider;
use bytes::Bytes;
use chrono::{Datelike, Timelike, Utc};
use dashmap::DashSet;
use flate2::write::GzEncoder;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::future::Future;
use std::io::Write;
use std::pin::Pin;
use std::process::Stdio;
use std::str::FromStr;
use std::sync::Arc;
use std::time::Duration;
use tokio::process::{Child, ChildStdout};
use tokio_util::sync::CancellationToken;
use tracing::{debug, error, info, instrument};

pub mod providers;

const DEFAULT_INTERVAL: &str = "0 0 0 * * *";
const SCB_RETRY_INTERVAL_SECONDS: u64 = 60;

pub type ChannelBackupFuture<'a, T> = Pin<Box<dyn Future<Output = T> + Send + 'a>>;

pub trait ChannelBackupSource {
    fn symbol(&self) -> &str;
    fn channel_backup_path(&self, date: &str) -> String;

    fn channel_backup<'a>(&'a self) -> ChannelBackupFuture<'a, anyhow::Result<Option<Vec<u8>>>>;

    fn subscribe_channel_backups<'a>(
        &'a self,
    ) -> ChannelBackupFuture<'a, tokio::sync::broadcast::Receiver<Vec<u8>>>;
}

#[derive(Serialize, Deserialize, PartialEq, Clone)]
pub struct DatabaseConfig {
    pub host: String,
    pub port: u16,
    pub database: String,
    pub username: String,
    pub password: String,
}

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
    db_config: DatabaseConfig,

    provider: Arc<providers::multi::MultiProvider>,

    channel_backup_sources: Arc<HashMap<String, Arc<dyn ChannelBackupSource + Send + Sync>>>,
    to_retry: Arc<DashSet<String>>,
}

impl Backup {
    pub async fn new(
        cancellation_token: CancellationToken,
        config: Config,
        db_config: DatabaseConfig,
        channel_backup_sources: Vec<Arc<dyn ChannelBackupSource + Send + Sync>>,
    ) -> anyhow::Result<Self> {
        let mut s3_providers: Vec<Box<dyn BackupProvider>> = Vec::new();

        for provider_config in config.simple_storage.into_iter() {
            match providers::s3::S3::new(&provider_config).await {
                Ok(provider) => s3_providers.push(Box::new(provider)),
                Err(e) => {
                    error!(
                        "Failed to initialize S3 provider {}: {}",
                        providers::s3::S3::name(&provider_config),
                        e
                    );
                }
            }
        }

        if s3_providers.is_empty() {
            return Err(anyhow::anyhow!(
                "failed to initialize backup: no storage providers are available"
            ));
        }

        Ok(Self::with_provider(
            cancellation_token,
            config.interval.unwrap_or(DEFAULT_INTERVAL.to_string()),
            db_config,
            Arc::new(providers::multi::MultiProvider::new(s3_providers)?),
            channel_backup_sources,
        ))
    }

    pub fn with_provider(
        cancellation_token: CancellationToken,
        interval: String,
        db_config: DatabaseConfig,
        provider: Arc<providers::multi::MultiProvider>,
        channel_backup_sources: Vec<Arc<dyn ChannelBackupSource + Send + Sync>>,
    ) -> Self {
        let sources = channel_backup_sources
            .into_iter()
            .map(|source| (source.symbol().to_string(), source))
            .collect();

        Backup {
            cancellation_token,
            interval,
            db_config,
            provider,
            channel_backup_sources: Arc::new(sources),
            to_retry: Arc::new(DashSet::new()),
        }
    }

    pub async fn start(&self) -> anyhow::Result<()> {
        for source in self.channel_backup_sources.values() {
            let self_cp = self.clone();
            let source = source.clone();
            let symbol = source.symbol().to_string();

            tokio::spawn(async move {
                if let Err(err) = self_cp.source_backup(&source).await {
                    error!("Channel backup failed for {}: {}", symbol, err);
                }

                let mut backup_stream = source.subscribe_channel_backups().await;
                loop {
                    tokio::select! {
                        _ = self_cp.cancellation_token.cancelled() => {
                            debug!("Stopping channel backup stream for {}", symbol);
                            break;
                        }
                        backup_res = backup_stream.recv() => {
                            match backup_res {
                                Ok(backup) => {
                                    if let Err(err) = self_cp
                                        .upload_channel_backup(source.as_ref(), &backup)
                                        .await
                                    {
                                        error!(
                                            "Channel backup stream upload failed for {}: {}",
                                            symbol, err
                                        );
                                        self_cp.to_retry.insert(symbol.to_string());
                                    }
                                }
                                Err(tokio::sync::broadcast::error::RecvError::Lagged(skipped)) => {
                                    tracing::warn!(
                                        "Channel backup stream lagged for {} (skipped {} messages)",
                                        symbol, skipped
                                    );
                                }
                                Err(tokio::sync::broadcast::error::RecvError::Closed) => {
                                    debug!("Channel backup stream closed for {}", symbol);
                                    break;
                                }
                            }
                        }
                    }
                }
            });
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
            let sleep_duration = time.signed_duration_since(now).to_std().unwrap_or_default();

            tokio::select! {
                _ = tokio::time::sleep(sleep_duration) => {},
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
        let (mut stdout, mut dump_proc) = self.database_backup_stream()?;

        let result = self.provider.put_stream(&path, &mut stdout).await;

        drop(stdout);
        let _ = dump_proc.wait().await;

        result?;
        debug!("Uploaded database backup");

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
                debug!("Retrying channel backup for {}", symbol);
                let source = match self.channel_backup_sources.get(&symbol) {
                    Some(source) => source.clone(),
                    None => continue,
                };

                match self.source_backup(&source).await {
                    Ok(_) => {
                        debug!("Retry of channel backup for {} succeeded", symbol);
                        self.to_retry.remove(&symbol);
                    }
                    Err(err) => {
                        error!("Channel backup retry failed for {}: {}", symbol, err);
                        continue;
                    }
                };
            }
        }
    }

    #[instrument(name = "Backup::source_backup", skip(self, source))]
    async fn source_backup(
        &self,
        source: &Arc<dyn ChannelBackupSource + Send + Sync>,
    ) -> anyhow::Result<()> {
        let backup = source.channel_backup().await?;
        if let Some(backup) = backup {
            self.upload_channel_backup(source.as_ref(), &backup).await?;
        }

        Ok(())
    }

    async fn upload_channel_backup(
        &self,
        source: &(dyn ChannelBackupSource + Send + Sync),
        backup: &[u8],
    ) -> anyhow::Result<()> {
        info!("Uploading {} channel backup", source.symbol());

        let mut encoder = GzEncoder::new(Vec::new(), flate2::Compression::best());
        encoder.write_all(hex::encode(backup).as_bytes())?;
        let data = encoder.finish()?;
        let path = source.channel_backup_path(&Self::format_date());

        self.provider.put(&path, Bytes::from(data)).await?;

        debug!("Uploaded {} channel backup", source.symbol());

        Ok(())
    }

    fn database_backup_stream(&self) -> anyhow::Result<(ChildStdout, Child)> {
        let mut dump_cmd = tokio::process::Command::new("pg_dump")
            .env("PGPASSWORD", self.db_config.password.clone())
            .arg("--compress=zstd:level=15")
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

        let stdout = dump_cmd
            .stdout
            .take()
            .ok_or(anyhow::anyhow!("failed to take stdout"))?;

        Ok((stdout, dump_cmd))
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

#[cfg(test)]
mod tests {
    use super::*;
    use anyhow::anyhow;
    use bytes::Bytes;
    use std::sync::Arc;
    use std::sync::atomic::{AtomicBool, Ordering};
    use tokio::io::AsyncRead;

    #[derive(Debug)]
    struct TestProvider {
        fail_put: AtomicBool,
        fail_put_stream: AtomicBool,
    }

    impl TestProvider {
        fn new() -> Self {
            Self {
                fail_put: AtomicBool::new(false),
                fail_put_stream: AtomicBool::new(false),
            }
        }
    }

    impl BackupProvider for TestProvider {
        fn name(&self) -> String {
            "test".to_string()
        }

        fn put<'a>(
            &'a self,
            _path: &'a str,
            _data: Bytes,
        ) -> crate::providers::BackupFuture<'a, anyhow::Result<()>> {
            Box::pin(async move {
                if self.fail_put.load(Ordering::SeqCst) {
                    Err(anyhow!("put failed"))
                } else {
                    Ok(())
                }
            })
        }

        fn put_stream<'a>(
            &'a self,
            _path: &'a str,
            _reader: &'a mut (dyn AsyncRead + Unpin + Send),
        ) -> crate::providers::BackupFuture<'a, anyhow::Result<()>> {
            Box::pin(async move {
                if self.fail_put_stream.load(Ordering::SeqCst) {
                    Err(anyhow!("put_stream failed"))
                } else {
                    Ok(())
                }
            })
        }
    }

    #[derive(Debug)]
    struct TestBackupSource {
        symbol: String,
        initial_backup: Option<Vec<u8>>,
        tx: tokio::sync::broadcast::Sender<Vec<u8>>,
    }

    impl TestBackupSource {
        fn new(symbol: &str, initial_backup: Option<Vec<u8>>) -> Self {
            let (tx, _) = tokio::sync::broadcast::channel(8);
            Self {
                symbol: symbol.to_string(),
                initial_backup,
                tx,
            }
        }
    }

    impl ChannelBackupSource for TestBackupSource {
        fn symbol(&self) -> &str {
            &self.symbol
        }

        fn channel_backup_path(&self, date: &str) -> String {
            format!("test/{}/channel-backup-{}.txt.gz", self.symbol, date)
        }

        fn channel_backup<'a>(
            &'a self,
        ) -> ChannelBackupFuture<'a, anyhow::Result<Option<Vec<u8>>>> {
            Box::pin(async move { Ok(self.initial_backup.clone()) })
        }

        fn subscribe_channel_backups<'a>(
            &'a self,
        ) -> ChannelBackupFuture<'a, tokio::sync::broadcast::Receiver<Vec<u8>>> {
            Box::pin(async move { self.tx.subscribe() })
        }
    }

    fn dummy_db_config() -> DatabaseConfig {
        DatabaseConfig {
            host: "127.0.0.1".to_string(),
            port: 5432,
            database: "db".to_string(),
            username: "user".to_string(),
            password: "pass".to_string(),
        }
    }

    #[tokio::test]
    async fn test_with_provider_includes_channel_sources() {
        let provider: Vec<Box<dyn BackupProvider>> = vec![Box::new(TestProvider::new())];
        let multi = providers::multi::MultiProvider::new(provider).unwrap();
        let source: Arc<dyn ChannelBackupSource + Send + Sync> =
            Arc::new(TestBackupSource::new("BTC", Some(vec![1, 2, 3])));

        let backup = Backup::with_provider(
            CancellationToken::new(),
            DEFAULT_INTERVAL.to_string(),
            dummy_db_config(),
            Arc::new(multi),
            vec![source],
        );

        assert!(backup.channel_backup_sources.contains_key("BTC"));
    }
}

use crate::currencies::Currencies;
use crate::lightning::lnd::Lnd;
use std::future::Future;
use std::pin::Pin;
use std::sync::Arc;

type ChannelBackupClientFuture<'a, T> = Pin<Box<dyn Future<Output = T> + Send + 'a>>;

impl From<crate::db::Config> for boltz_backup::DatabaseConfig {
    fn from(config: crate::db::Config) -> Self {
        Self {
            host: config.host,
            port: config.port,
            database: config.database,
            username: config.username,
            password: config.password,
        }
    }
}

trait ChannelBackupClient {
    fn channel_backup<'a>(
        &'a self,
    ) -> ChannelBackupClientFuture<'a, anyhow::Result<Option<Vec<u8>>>>;

    fn subscribe_channel_backups<'a>(
        &'a self,
    ) -> ChannelBackupClientFuture<'a, tokio::sync::broadcast::Receiver<Vec<u8>>>;
}

struct LndChannelBackupClient {
    lnd: tokio::sync::Mutex<Lnd>,
}

impl LndChannelBackupClient {
    fn new(lnd: Lnd) -> Self {
        Self {
            lnd: tokio::sync::Mutex::new(lnd),
        }
    }
}

impl ChannelBackupClient for LndChannelBackupClient {
    fn channel_backup<'a>(
        &'a self,
    ) -> ChannelBackupClientFuture<'a, anyhow::Result<Option<Vec<u8>>>> {
        Box::pin(async move {
            let mut lnd = self.lnd.lock().await;
            lnd.channel_backup().await
        })
    }

    fn subscribe_channel_backups<'a>(
        &'a self,
    ) -> ChannelBackupClientFuture<'a, tokio::sync::broadcast::Receiver<Vec<u8>>> {
        Box::pin(async move {
            let lnd = self.lnd.lock().await;
            lnd.subscribe_channel_backups()
        })
    }
}

struct LndChannelBackupSource {
    symbol: String,
    client: Arc<dyn ChannelBackupClient + Send + Sync>,
}

impl LndChannelBackupSource {
    fn new(symbol: String, client: Arc<dyn ChannelBackupClient + Send + Sync>) -> Self {
        Self { symbol, client }
    }
}

impl boltz_backup::ChannelBackupSource for LndChannelBackupSource {
    fn symbol(&self) -> &str {
        &self.symbol
    }

    fn channel_backup_path(&self, date: &str) -> String {
        format!("lnd/{}/multiChannelBackup-{}.txt.gz", self.symbol, date)
    }

    fn channel_backup<'a>(
        &'a self,
    ) -> boltz_backup::ChannelBackupFuture<'a, anyhow::Result<Option<Vec<u8>>>> {
        self.client.channel_backup()
    }

    fn subscribe_channel_backups<'a>(
        &'a self,
    ) -> boltz_backup::ChannelBackupFuture<'a, tokio::sync::broadcast::Receiver<Vec<u8>>> {
        self.client.subscribe_channel_backups()
    }
}

pub fn from_currencies(
    currencies: &Currencies,
) -> Vec<Arc<dyn boltz_backup::ChannelBackupSource + Send + Sync>> {
    let mut sources = Vec::new();

    for (symbol, currency) in currencies.iter() {
        if let Some(lnd) = currency.lnd.clone() {
            let source: Arc<dyn boltz_backup::ChannelBackupSource + Send + Sync> =
                Arc::new(LndChannelBackupSource::new(
                    symbol.clone(),
                    Arc::new(LndChannelBackupClient::new(lnd)),
                ));
            sources.push(source);
        }
    }

    sources
}

#[cfg(test)]
mod tests {
    use super::*;
    use boltz_backup::ChannelBackupSource;

    #[derive(Debug)]
    struct FakeChannelBackupClient {
        backup: Option<Vec<u8>>,
        tx: tokio::sync::broadcast::Sender<Vec<u8>>,
    }

    impl FakeChannelBackupClient {
        fn new(backup: Option<Vec<u8>>) -> Self {
            let (tx, _) = tokio::sync::broadcast::channel(8);
            Self { backup, tx }
        }
    }

    impl ChannelBackupClient for FakeChannelBackupClient {
        fn channel_backup<'a>(
            &'a self,
        ) -> ChannelBackupClientFuture<'a, anyhow::Result<Option<Vec<u8>>>> {
            Box::pin(async move { Ok(self.backup.clone()) })
        }

        fn subscribe_channel_backups<'a>(
            &'a self,
        ) -> ChannelBackupClientFuture<'a, tokio::sync::broadcast::Receiver<Vec<u8>>> {
            Box::pin(async move { self.tx.subscribe() })
        }
    }

    #[tokio::test]
    async fn test_lnd_channel_backup_source_forwards_backup_and_stream() {
        let fake_client = Arc::new(FakeChannelBackupClient::new(Some(vec![1, 2, 3])));
        let tx = fake_client.tx.clone();
        let source = LndChannelBackupSource::new("BTC".to_string(), fake_client);

        let backup = source.channel_backup().await.unwrap();
        assert_eq!(backup, Some(vec![1, 2, 3]));

        let mut stream = source.subscribe_channel_backups().await;
        tx.send(vec![4, 5, 6]).unwrap();
        assert_eq!(stream.recv().await.unwrap(), vec![4, 5, 6]);
    }
}

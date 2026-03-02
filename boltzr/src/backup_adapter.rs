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
    node_id: String,
    client: Arc<dyn ChannelBackupClient + Send + Sync>,
}

impl LndChannelBackupSource {
    fn new(
        symbol: String,
        node_id: String,
        client: Arc<dyn ChannelBackupClient + Send + Sync>,
    ) -> Self {
        Self {
            symbol,
            node_id,
            client,
        }
    }
}

impl boltz_backup::ChannelBackupSource for LndChannelBackupSource {
    fn source_id(&self) -> String {
        format!("{}:{}", self.symbol, self.node_id)
    }

    fn channel_backup_path(&self, date: &str) -> String {
        format!(
            "lnd/{}/{}/multiChannelBackup-{}.txt.gz",
            self.symbol, self.node_id, date
        )
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
        for (node_id, lnd) in currency.iter_lnds() {
            let source: Arc<dyn boltz_backup::ChannelBackupSource + Send + Sync> =
                Arc::new(LndChannelBackupSource::new(
                    symbol.clone(),
                    node_id.clone(),
                    Arc::new(LndChannelBackupClient::new(lnd.clone())),
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
        let source = LndChannelBackupSource::new("BTC".to_string(), "abc".to_string(), fake_client);

        let backup = source.channel_backup().await.unwrap();
        assert_eq!(backup, Some(vec![1, 2, 3]));

        let mut stream = source.subscribe_channel_backups().await;
        tx.send(vec![4, 5, 6]).unwrap();
        assert_eq!(stream.recv().await.unwrap(), vec![4, 5, 6]);
    }

    #[test]
    fn test_backup_path_includes_node_id() {
        let fake_client = Arc::new(FakeChannelBackupClient::new(None));
        let source =
            LndChannelBackupSource::new("BTC".to_string(), "node1".to_string(), fake_client);
        assert_eq!(
            source.channel_backup_path("2026-03-02"),
            "lnd/BTC/node1/multiChannelBackup-2026-03-02.txt.gz"
        );
    }

    #[test]
    fn test_backup_paths_are_unique_per_node() {
        let fake_client_1 = Arc::new(FakeChannelBackupClient::new(None));
        let fake_client_2 = Arc::new(FakeChannelBackupClient::new(None));
        let source_1 =
            LndChannelBackupSource::new("BTC".to_string(), "node1".to_string(), fake_client_1);
        let source_2 =
            LndChannelBackupSource::new("BTC".to_string(), "node2".to_string(), fake_client_2);

        let date = "2026-03-02";
        assert_ne!(
            source_1.channel_backup_path(date),
            source_2.channel_backup_path(date)
        );
    }

    #[test]
    fn test_source_id_is_unique_per_node() {
        let fake_client_1 = Arc::new(FakeChannelBackupClient::new(None));
        let fake_client_2 = Arc::new(FakeChannelBackupClient::new(None));
        let source_1 =
            LndChannelBackupSource::new("BTC".to_string(), "node1".to_string(), fake_client_1);
        let source_2 =
            LndChannelBackupSource::new("BTC".to_string(), "node2".to_string(), fake_client_2);

        assert_eq!(source_1.source_id(), "BTC:node1");
        assert_eq!(source_2.source_id(), "BTC:node2");
        assert_ne!(source_1.source_id(), source_2.source_id());
    }
}

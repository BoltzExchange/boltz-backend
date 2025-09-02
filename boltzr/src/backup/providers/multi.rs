use crate::backup::providers::BackupProvider;
use anyhow::anyhow;
use async_trait::async_trait;
use tracing::error;

const NO_PROVIDERS_ERROR: &str = "no backup providers configured";
const ALL_PROVIDERS_FAILED_ERROR: &str = "all backup providers failed";

#[derive(Debug)]
pub struct MultiProvider {
    providers: Vec<Box<dyn BackupProvider + Send + Sync>>,
}

impl MultiProvider {
    pub async fn new(
        providers: Vec<Box<dyn BackupProvider + Send + Sync>>,
    ) -> anyhow::Result<Self> {
        if providers.is_empty() {
            return Err(anyhow!(NO_PROVIDERS_ERROR));
        }

        Ok(Self { providers })
    }
}

#[async_trait]
impl BackupProvider for MultiProvider {
    fn name(&self) -> String {
        "multi".to_string()
    }

    async fn put(&self, path: &str, data: &[u8]) -> anyhow::Result<()> {
        let results = futures::future::join_all(self.providers.iter().map(|provider| async move {
            match provider.put(path, data).await {
                Ok(_) => (provider, Ok(())),
                Err(e) => (provider, Err(e)),
            }
        }))
        .await;

        let (successes, failures): (Vec<_>, Vec<_>) =
            results.into_iter().partition(|(_, result)| result.is_ok());

        for (provider, result) in failures {
            error!(
                "Backup to provider {} failed: {}",
                provider.name(),
                result.unwrap_err()
            );
        }

        if successes.is_empty() {
            return Err(anyhow!(ALL_PROVIDERS_FAILED_ERROR));
        }

        Ok(())
    }

    async fn put_stream(
        &self,
        path: &str,
        reader: &mut (dyn tokio::io::AsyncRead + Unpin + Send),
    ) -> anyhow::Result<()> {
        let mut data = Vec::new();
        tokio::io::copy(reader, &mut data).await?;

        self.put(path, &data).await
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::Arc;
    use std::sync::atomic::{AtomicBool, Ordering};

    #[derive(Debug, Clone)]
    struct TestBackupProvider {
        should_fail: Arc<AtomicBool>,
    }

    impl TestBackupProvider {
        fn new(should_fail: bool) -> Self {
            Self {
                should_fail: Arc::new(AtomicBool::new(should_fail)),
            }
        }
    }

    #[async_trait]
    impl BackupProvider for TestBackupProvider {
        fn name(&self) -> String {
            "test".to_string()
        }

        async fn put(&self, _path: &str, _data: &[u8]) -> anyhow::Result<()> {
            if self.should_fail.load(Ordering::SeqCst) {
                Err(anyhow!("Test backup provider failure"))
            } else {
                Ok(())
            }
        }

        async fn put_stream(
            &self,
            path: &str,
            reader: &mut (dyn tokio::io::AsyncRead + Unpin + Send),
        ) -> anyhow::Result<()> {
            let mut data = Vec::new();
            tokio::io::copy(reader, &mut data).await?;
            self.put(path, &data).await
        }
    }

    #[tokio::test]
    async fn test_multi_provider_creation_with_empty_providers() {
        let providers: Vec<Box<dyn BackupProvider + Send + Sync>> = vec![];
        let result = MultiProvider::new(providers).await;

        assert!(result.is_err());
        assert_eq!(result.unwrap_err().to_string(), NO_PROVIDERS_ERROR);
    }

    #[tokio::test]
    async fn test_multi_provider_creation_with_single_provider() {
        let test_provider = TestBackupProvider::new(false);
        let providers: Vec<Box<dyn BackupProvider + Send + Sync>> = vec![Box::new(test_provider)];

        let result = MultiProvider::new(providers).await;

        assert!(result.is_ok());
        let multi_provider = result.unwrap();
        assert_eq!(multi_provider.providers.len(), 1);
    }

    #[tokio::test]
    async fn test_multi_provider_creation_with_multiple_providers() {
        let test_provider1 = TestBackupProvider::new(false);
        let test_provider2 = TestBackupProvider::new(false);
        let providers: Vec<Box<dyn BackupProvider + Send + Sync>> =
            vec![Box::new(test_provider1), Box::new(test_provider2)];

        let result = MultiProvider::new(providers).await;

        assert!(result.is_ok());
        let multi_provider = result.unwrap();
        assert_eq!(multi_provider.providers.len(), 2);
    }

    #[tokio::test]
    async fn test_multi_provider_put_all_succeed() {
        let test_provider1 = TestBackupProvider::new(false);
        let test_provider2 = TestBackupProvider::new(false);

        let providers: Vec<Box<dyn BackupProvider + Send + Sync>> =
            vec![Box::new(test_provider1), Box::new(test_provider2)];
        let multi_provider = MultiProvider::new(providers).await.unwrap();

        let result = multi_provider.put("test-path", b"test-data").await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_multi_provider_put_some_fail() {
        let test_provider1 = TestBackupProvider::new(false);
        let test_provider2 = TestBackupProvider::new(true);

        let providers: Vec<Box<dyn BackupProvider + Send + Sync>> =
            vec![Box::new(test_provider1), Box::new(test_provider2)];
        let multi_provider = MultiProvider::new(providers).await.unwrap();

        let result = multi_provider.put("test-path", b"test-data").await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_multi_provider_put_all_fail() {
        let test_provider1 = TestBackupProvider::new(true);
        let test_provider2 = TestBackupProvider::new(true);

        let providers: Vec<Box<dyn BackupProvider + Send + Sync>> =
            vec![Box::new(test_provider1), Box::new(test_provider2)];
        let multi_provider = MultiProvider::new(providers).await.unwrap();

        let result = multi_provider.put("test-path", b"test-data").await;
        assert!(result.is_err());
        assert_eq!(result.unwrap_err().to_string(), ALL_PROVIDERS_FAILED_ERROR);
    }
}

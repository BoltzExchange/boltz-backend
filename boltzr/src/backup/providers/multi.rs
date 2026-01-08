use crate::backup::providers::BackupProvider;
use anyhow::anyhow;
use async_trait::async_trait;
use bytes::Bytes;
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tracing::error;

const STREAM_BUFFER_SIZE: usize = 16 * 1024 * 1024;

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

    fn handle_results(
        results: Vec<(&(dyn BackupProvider + Send + Sync), anyhow::Result<()>)>,
    ) -> anyhow::Result<()> {
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
}

#[async_trait]
impl BackupProvider for MultiProvider {
    fn name(&self) -> String {
        "multi".to_string()
    }

    async fn put(&self, path: &str, data: Bytes) -> anyhow::Result<()> {
        let results = futures::future::join_all(self.providers.iter().map(|provider| {
            let data = data.clone();
            async move {
                match provider.put(path, data).await {
                    Ok(_) => (provider.as_ref(), Ok(())),
                    Err(e) => (provider.as_ref(), Err(e)),
                }
            }
        }))
        .await;

        Self::handle_results(results)
    }

    async fn put_stream(
        &self,
        path: &str,
        reader: &mut (dyn tokio::io::AsyncRead + Unpin + Send),
    ) -> anyhow::Result<()> {
        let mut writers = Vec::new();
        let mut upload_futures = Vec::new();

        for provider in &self.providers {
            let (mut duplex_read, duplex_write) = tokio::io::duplex(STREAM_BUFFER_SIZE * 2);
            writers.push(duplex_write);

            upload_futures.push(async move {
                match provider.put_stream(path, &mut duplex_read).await {
                    Ok(_) => (provider.as_ref(), Ok(())),
                    Err(e) => (provider.as_ref(), Err(e)),
                }
            });
        }

        let copy_task = async move {
            let mut buf = vec![0u8; STREAM_BUFFER_SIZE];
            let mut active_writers = writers;

            loop {
                let n = reader.read(&mut buf).await?;
                if n == 0 {
                    break;
                }

                let mut failed_indices = Vec::new();
                for (i, writer) in active_writers.iter_mut().enumerate() {
                    if let Err(e) = writer.write_all(&buf[..n]).await {
                        error!("Failed to write to backup provider: {}", e);
                        failed_indices.push(i);
                    }
                }

                for i in failed_indices.iter().rev() {
                    let writer = active_writers.remove(*i);
                    drop(writer);
                }

                if active_writers.is_empty() {
                    return Err(anyhow!("All backup providers failed during streaming"));
                }
            }

            for mut writer in active_writers.into_iter() {
                writer.shutdown().await?;
            }

            Ok::<(), anyhow::Error>(())
        };

        let (copy_res, results) =
            tokio::join!(copy_task, futures::future::join_all(upload_futures));

        if let Err(e) = copy_res {
            return Err(anyhow!("Failed to copy data to providers: {}", e));
        }

        Self::handle_results(results)
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
        stored_data: Arc<tokio::sync::Mutex<Bytes>>,
    }

    impl TestBackupProvider {
        fn new(should_fail: bool) -> Self {
            Self {
                should_fail: Arc::new(AtomicBool::new(should_fail)),
                stored_data: Arc::new(tokio::sync::Mutex::new(Bytes::new())),
            }
        }

        async fn get_stored_data(&self) -> Bytes {
            self.stored_data.lock().await.clone()
        }
    }

    #[async_trait]
    impl BackupProvider for TestBackupProvider {
        fn name(&self) -> String {
            "test".to_string()
        }

        async fn put(&self, _path: &str, data: Bytes) -> anyhow::Result<()> {
            if self.should_fail.load(Ordering::SeqCst) {
                Err(anyhow!("Test backup provider failure"))
            } else {
                let mut stored = self.stored_data.lock().await;
                *stored = data;
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
            self.put(path, Bytes::from(data)).await
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
        let prov1 = TestBackupProvider::new(false);
        let prov2 = TestBackupProvider::new(false);

        let providers: Vec<Box<dyn BackupProvider + Send + Sync>> =
            vec![Box::new(prov1.clone()), Box::new(prov2.clone())];
        let multi_provider = MultiProvider::new(providers).await.unwrap();

        let data = Bytes::from_static(b"test-data");

        let result = multi_provider.put("test-path", data.clone()).await;
        assert!(result.is_ok());

        assert_eq!(prov1.get_stored_data().await, data);
        assert_eq!(prov2.get_stored_data().await, data);
    }

    #[tokio::test]
    async fn test_multi_provider_put_some_fail() {
        let prov1 = TestBackupProvider::new(false);
        let prov2 = TestBackupProvider::new(true);

        let providers: Vec<Box<dyn BackupProvider + Send + Sync>> =
            vec![Box::new(prov1.clone()), Box::new(prov2.clone())];
        let multi_provider = MultiProvider::new(providers).await.unwrap();

        let data = Bytes::from_static(b"test-data");

        let result = multi_provider.put("test-path", data.clone()).await;
        assert!(result.is_ok());

        assert_eq!(prov1.get_stored_data().await, data);
        assert!(prov2.get_stored_data().await.is_empty());
    }

    #[tokio::test]
    async fn test_multi_provider_put_all_fail() {
        let test_provider1 = TestBackupProvider::new(true);
        let test_provider2 = TestBackupProvider::new(true);

        let providers: Vec<Box<dyn BackupProvider + Send + Sync>> =
            vec![Box::new(test_provider1), Box::new(test_provider2)];
        let multi_provider = MultiProvider::new(providers).await.unwrap();

        let data = Bytes::from_static(b"test-data");

        let result = multi_provider.put("test-path", data).await;
        assert!(result.is_err());
        assert_eq!(result.unwrap_err().to_string(), ALL_PROVIDERS_FAILED_ERROR);
    }

    #[tokio::test]
    async fn test_multi_provider_put_stream_all_succeed() {
        let prov1 = TestBackupProvider::new(false);
        let prov2 = TestBackupProvider::new(false);

        let providers: Vec<Box<dyn BackupProvider + Send + Sync>> =
            vec![Box::new(prov1.clone()), Box::new(prov2.clone())];
        let multi_provider = MultiProvider::new(providers).await.unwrap();

        let data = Bytes::from_static(b"test-stream-data");
        let mut reader = &data[..];

        let result = multi_provider.put_stream("test-path", &mut reader).await;
        assert!(result.is_ok());

        assert_eq!(prov1.get_stored_data().await, data);
        assert_eq!(prov2.get_stored_data().await, data);
    }

    #[tokio::test]
    async fn test_multi_provider_put_stream_some_fail() {
        let prov1 = TestBackupProvider::new(false);
        let prov2 = TestBackupProvider::new(true);

        let providers: Vec<Box<dyn BackupProvider + Send + Sync>> =
            vec![Box::new(prov1.clone()), Box::new(prov2.clone())];
        let multi_provider = MultiProvider::new(providers).await.unwrap();

        let data = Bytes::from_static(b"test-stream-data");
        let mut reader = &data[..];

        let result = multi_provider.put_stream("test-path", &mut reader).await;
        assert!(result.is_ok());

        assert_eq!(prov1.get_stored_data().await, data);
        assert!(prov2.get_stored_data().await.is_empty());
    }

    #[tokio::test]
    async fn test_multi_provider_put_stream_all_fail() {
        let prov1 = TestBackupProvider::new(true);
        let prov2 = TestBackupProvider::new(true);

        let providers: Vec<Box<dyn BackupProvider + Send + Sync>> =
            vec![Box::new(prov1.clone()), Box::new(prov2.clone())];
        let multi_provider = MultiProvider::new(providers).await.unwrap();

        let data = b"test-stream-data";
        let mut reader = &data[..];

        let result = multi_provider.put_stream("test-path", &mut reader).await;
        assert!(result.is_err());
        assert_eq!(result.unwrap_err().to_string(), ALL_PROVIDERS_FAILED_ERROR);

        assert!(prov1.get_stored_data().await.is_empty());
        assert!(prov2.get_stored_data().await.is_empty());
    }

    #[tokio::test]
    async fn test_multi_provider_put_stream_large_file() {
        let prov1 = TestBackupProvider::new(false);
        let prov2 = TestBackupProvider::new(false);

        let providers: Vec<Box<dyn BackupProvider + Send + Sync>> =
            vec![Box::new(prov1.clone()), Box::new(prov2.clone())];
        let multi_provider = MultiProvider::new(providers).await.unwrap();

        const TOTAL_SIZE: usize = 32 * 1024 * 1024;
        const PATTERN_SIZE: usize = 4096;

        let mut pattern = Vec::with_capacity(PATTERN_SIZE);
        for i in 0..PATTERN_SIZE {
            pattern.push((i % 256) as u8);
        }

        struct LargeDataReader {
            remaining_bytes: usize,
            pattern: Vec<u8>,
            pattern_offset: usize,
        }

        impl tokio::io::AsyncRead for LargeDataReader {
            fn poll_read(
                mut self: std::pin::Pin<&mut Self>,
                _cx: &mut std::task::Context<'_>,
                buf: &mut tokio::io::ReadBuf<'_>,
            ) -> std::task::Poll<std::io::Result<()>> {
                if self.remaining_bytes == 0 {
                    return std::task::Poll::Ready(Ok(()));
                }

                let to_write = std::cmp::min(buf.remaining(), self.remaining_bytes);
                let mut written = 0;

                while written < to_write {
                    let chunk_size =
                        std::cmp::min(to_write - written, self.pattern.len() - self.pattern_offset);
                    buf.put_slice(
                        &self.pattern[self.pattern_offset..self.pattern_offset + chunk_size],
                    );
                    written += chunk_size;
                    self.pattern_offset = (self.pattern_offset + chunk_size) % self.pattern.len();
                }

                self.remaining_bytes -= written;
                std::task::Poll::Ready(Ok(()))
            }
        }

        let mut reader = LargeDataReader {
            remaining_bytes: TOTAL_SIZE,
            pattern,
            pattern_offset: 0,
        };

        let result = multi_provider
            .put_stream("large-test-path", &mut reader)
            .await;
        assert!(result.is_ok());

        let data1 = prov1.get_stored_data().await;
        let data2 = prov2.get_stored_data().await;

        assert_eq!(data1.len(), TOTAL_SIZE);
        assert_eq!(data2.len(), TOTAL_SIZE);
        assert_eq!(data1, data2);

        for i in 0..256 {
            assert_eq!(data1[i], (i % 256) as u8, "Pattern mismatch at beginning");
            let mid = TOTAL_SIZE / 2 + i;
            assert_eq!(data1[mid], (mid % 256) as u8, "Pattern mismatch at middle");
            let end = TOTAL_SIZE - 256 + i;
            assert_eq!(data1[end], (end % 256) as u8, "Pattern mismatch at end");
        }
    }
}

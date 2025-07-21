use async_trait::async_trait;
use tokio::io::AsyncRead;

pub mod multi;
pub mod s3;

#[async_trait]
pub trait BackupProvider {
    async fn put(&self, path: &str, data: &[u8]) -> anyhow::Result<()>;

    async fn put_stream<R: AsyncRead + Unpin + Send + ?Sized>(
        &self,
        path: &str,
        reader: &mut R,
    ) -> anyhow::Result<()>;
}

use async_trait::async_trait;
use tokio::io::AsyncRead;

pub mod multi;
pub mod s3;

#[async_trait]
pub trait BackupProvider: std::fmt::Debug {
    fn name(&self) -> String;

    async fn put(&self, path: &str, data: &[u8]) -> anyhow::Result<()>;

    async fn put_stream(
        &self,
        path: &str,
        reader: &mut (dyn AsyncRead + Unpin + Send),
    ) -> anyhow::Result<()>;
}

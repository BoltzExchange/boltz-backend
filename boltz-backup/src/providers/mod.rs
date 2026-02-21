use bytes::Bytes;
use std::future::Future;
use std::pin::Pin;
use tokio::io::AsyncRead;

pub mod multi;
pub mod s3;

pub type BackupFuture<'a, T> = Pin<Box<dyn Future<Output = T> + Send + 'a>>;

pub trait BackupProvider: Send + Sync {
    fn name(&self) -> String;

    fn put<'a>(&'a self, path: &'a str, data: Bytes) -> BackupFuture<'a, anyhow::Result<()>>;

    fn put_stream<'a>(
        &'a self,
        path: &'a str,
        reader: &'a mut (dyn AsyncRead + Unpin + Send),
    ) -> BackupFuture<'a, anyhow::Result<()>>;
}

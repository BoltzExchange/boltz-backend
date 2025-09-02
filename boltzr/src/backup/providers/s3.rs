use crate::backup::providers::BackupProvider;
use anyhow::anyhow;
use async_trait::async_trait;
use s3::creds::Credentials;
use s3::{Bucket, Region};
use serde::{Deserialize, Serialize};
use tokio::io::AsyncRead;
use tracing::{debug, instrument};

#[derive(Serialize, Deserialize, PartialEq, Clone, Debug)]
pub struct Config {
    pub bucket: String,

    pub endpoint: String,
    pub port: Option<u16>,

    #[serde(rename = "useSSL")]
    pub use_ssl: Option<bool>,

    #[serde(rename = "accessKey")]
    pub access_key: String,
    #[serde(rename = "secretKey")]
    pub secret_key: String,
}

#[derive(Debug, Clone)]
pub struct S3 {
    bucket: Box<Bucket>,
}

impl S3 {
    #[instrument(name = "S3::new", skip_all)]
    pub async fn new(config: &Config) -> anyhow::Result<Self> {
        let creds = Credentials::new(
            Some(config.access_key.as_str()),
            Some(config.secret_key.as_str()),
            None,
            None,
            None,
        )?;

        let mut endpoint = format!(
            "{}://{}",
            if config.use_ssl.unwrap_or(true) {
                "https"
            } else {
                "http"
            },
            config.endpoint
        );
        if let Some(port) = config.port {
            endpoint += format!(":{port}").as_str();
        }
        debug!("Using bucket {} at {}", config.bucket, endpoint);

        let bucket = Bucket::new(
            config.bucket.as_str(),
            Region::Custom {
                endpoint,
                region: "".to_string(),
            },
            creds,
        )?
        .with_path_style();
        if !bucket.exists().await? {
            return Err(anyhow!("S3 bucket does not exist"));
        }

        Ok(Self { bucket })
    }
}

#[async_trait]
impl BackupProvider for S3 {
    fn name(&self) -> String {
        format!("S3:{}@{}", self.bucket.name, self.bucket.region.endpoint())
    }

    #[instrument(name = "S3::put", skip(self, data))]
    async fn put(&self, path: &str, data: &[u8]) -> anyhow::Result<()> {
        self.bucket.put_object(path, data).await?;
        Ok(())
    }

    #[instrument(name = "S3::put_stream", skip(self, reader))]
    async fn put_stream(
        &self,
        path: &str,
        reader: &mut (dyn AsyncRead + Unpin + Send),
    ) -> anyhow::Result<()> {
        self.bucket.put_object_stream(reader, path).await?;
        Ok(())
    }
}

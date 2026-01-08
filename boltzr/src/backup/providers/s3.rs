use crate::backup::providers::BackupProvider;
use anyhow::anyhow;
use async_trait::async_trait;
use aws_sdk_s3::{
    Client,
    config::{BehaviorVersion, Credentials, Region},
    primitives::ByteStream,
    types::{CompletedMultipartUpload, CompletedPart},
};
use bytes::{Bytes, BytesMut};
use serde::{Deserialize, Serialize};
use tokio::io::{AsyncRead, AsyncReadExt};
use tracing::{debug, instrument, trace};

const PART_SIZE: usize = 16 * 1024 * 1024;

#[derive(Serialize, Deserialize, PartialEq, Clone, Debug)]
pub struct Config {
    pub bucket: String,
    pub region: Option<String>,

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
    client: Client,
    bucket: String,
    endpoint: String,
}

impl S3 {
    #[instrument(name = "S3::new", skip_all)]
    pub async fn new(config: &Config) -> anyhow::Result<Self> {
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

        let credentials =
            Credentials::new(&config.access_key, &config.secret_key, None, None, "boltzr");

        let sdk_config = aws_sdk_s3::config::Builder::new()
            .behavior_version(BehaviorVersion::latest())
            .endpoint_url(&endpoint)
            .region(Region::new(config.region.clone().unwrap_or_default()))
            .credentials_provider(credentials)
            .force_path_style(true)
            .build();

        let client = Client::from_conf(sdk_config);

        // Verify bucket exists
        client
            .head_bucket()
            .bucket(&config.bucket)
            .send()
            .await
            .map_err(|e| anyhow!("S3 bucket does not exist or is not accessible: {}", e))?;

        Ok(Self {
            client,
            bucket: config.bucket.clone(),
            endpoint,
        })
    }

    async fn multipart_upload(
        &self,
        path: &str,
        reader: &mut (dyn AsyncRead + Unpin + Send),
    ) -> anyhow::Result<()> {
        let create_response = self
            .client
            .create_multipart_upload()
            .bucket(&self.bucket)
            .key(path)
            .send()
            .await?;

        let upload_id = create_response
            .upload_id()
            .ok_or_else(|| anyhow!("no upload ID returned"))?;

        let result = self.upload_parts(path, upload_id, reader).await;

        match result {
            Ok(parts) if !parts.is_empty() => {
                let completed_upload = CompletedMultipartUpload::builder()
                    .set_parts(Some(parts))
                    .build();

                self.client
                    .complete_multipart_upload()
                    .bucket(&self.bucket)
                    .key(path)
                    .upload_id(upload_id)
                    .multipart_upload(completed_upload)
                    .send()
                    .await?;

                Ok(())
            }
            Ok(_) => {
                // No parts uploaded (empty file), abort and use simple put
                self.client
                    .abort_multipart_upload()
                    .bucket(&self.bucket)
                    .key(path)
                    .upload_id(upload_id)
                    .send()
                    .await?;

                self.client
                    .put_object()
                    .bucket(&self.bucket)
                    .key(path)
                    .body(ByteStream::from(Bytes::new()))
                    .send()
                    .await?;

                Ok(())
            }
            Err(e) => {
                // Abort on failure
                let _ = self
                    .client
                    .abort_multipart_upload()
                    .bucket(&self.bucket)
                    .key(path)
                    .upload_id(upload_id)
                    .send()
                    .await;

                Err(e)
            }
        }
    }

    async fn upload_parts(
        &self,
        path: &str,
        upload_id: &str,
        reader: &mut (dyn AsyncRead + Unpin + Send),
    ) -> anyhow::Result<Vec<CompletedPart>> {
        let mut parts = Vec::new();
        let mut part_number: i32 = 1;
        let mut buffer = BytesMut::with_capacity(PART_SIZE);

        loop {
            // Ensure we have capacity to read up to PART_SIZE
            let needed = PART_SIZE.saturating_sub(buffer.len());
            if needed > 0 {
                buffer.reserve(needed);
            }

            while buffer.len() < PART_SIZE {
                let n = reader.read_buf(&mut buffer).await?;
                if n == 0 {
                    break;
                }
            }

            if buffer.is_empty() {
                break;
            }

            let body = if buffer.len() >= PART_SIZE {
                ByteStream::from(buffer.split_to(PART_SIZE).freeze())
            } else {
                ByteStream::from(buffer.split().freeze())
            };

            let upload_response = self
                .client
                .upload_part()
                .bucket(&self.bucket)
                .key(path)
                .upload_id(upload_id)
                .part_number(part_number)
                .body(body)
                .send()
                .await?;

            let e_tag = upload_response.e_tag().map(|s| s.to_string());

            parts.push(
                CompletedPart::builder()
                    .part_number(part_number)
                    .set_e_tag(e_tag)
                    .build(),
            );

            trace!("Uploaded part {} for {}", part_number, path);

            part_number += 1;
        }

        Ok(parts)
    }
}

#[async_trait]
impl BackupProvider for S3 {
    fn name(&self) -> String {
        format!("S3:{}@{}", self.bucket, self.endpoint)
    }

    #[instrument(name = "S3::put", skip(self, data))]
    async fn put(&self, path: &str, data: Bytes) -> anyhow::Result<()> {
        self.client
            .put_object()
            .bucket(&self.bucket)
            .key(path)
            .body(ByteStream::from(data))
            .send()
            .await?;
        Ok(())
    }

    #[instrument(name = "S3::put_stream", skip(self, reader))]
    async fn put_stream(
        &self,
        path: &str,
        reader: &mut (dyn AsyncRead + Unpin + Send),
    ) -> anyhow::Result<()> {
        self.multipart_upload(path, reader).await
    }
}

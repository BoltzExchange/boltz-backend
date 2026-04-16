use crate::ark::client::ark_rpc::{GetInfoRequest, GetInfoResponse};
use crate::chain::BaseClient;
use anyhow::{Result, anyhow};
use async_trait::async_trait;
use bitcoin::secp256k1;
use boltz_utils::mb_to_bytes;
use std::path::Path;
use std::str::FromStr;
use std::sync::{Arc, RwLock};
use tonic::metadata::MetadataValue;
use tonic::service::interceptor::InterceptedService;
use tonic::transport::Channel;
use tracing::{info, instrument};

const MAX_MESSAGE_SIZE: usize = mb_to_bytes(16);

#[allow(dead_code)]
#[allow(clippy::enum_variant_names)]
mod ark_rpc {
    tonic::include_proto!("fulmine.v1");
}

#[derive(Clone)]
struct MacaroonInterceptor {
    macaroon: Option<MetadataValue<tonic::metadata::Ascii>>,
}

impl tonic::service::Interceptor for MacaroonInterceptor {
    fn call(
        &mut self,
        request: tonic::Request<()>,
    ) -> std::result::Result<tonic::Request<()>, tonic::Status> {
        let mut request = request;
        if let Some(macaroon) = &self.macaroon {
            request.metadata_mut().insert("macaroon", macaroon.clone());
        }
        Ok(request)
    }
}

type ArkServiceClient =
    ark_rpc::service_client::ServiceClient<InterceptedService<Channel, MacaroonInterceptor>>;

#[derive(Clone)]
pub struct ArkClient {
    symbol: String,
    client: ArkServiceClient,

    pubkey: Arc<RwLock<Option<secp256k1::PublicKey>>>,
}

impl ArkClient {
    #[instrument(name = "ArkClient::new", skip(config))]
    pub async fn new(symbol: String, config: &super::Config) -> Result<Self> {
        let macaroon = match config.macaroonpath.as_ref().filter(|path| !path.is_empty()) {
            Some(path) => {
                let path = Path::new(path);
                if !path.exists() {
                    return Err(anyhow!(
                        "failed to find configured Fulmine macaroon: {}",
                        path.display()
                    ));
                }

                Some(MetadataValue::from_str(&hex::encode(
                    tokio::fs::read(path).await.map_err(|e| {
                        anyhow!(
                            "failed to read Fulmine macaroon from {}: {}",
                            path.display(),
                            e
                        )
                    })?,
                ))?)
            }
            None => None,
        };

        let channel = Channel::from_shared(format!("http://{}:{}", config.host, config.port))?
            .connect()
            .await?;

        Ok(Self {
            symbol,
            client: ark_rpc::service_client::ServiceClient::with_interceptor(
                channel,
                MacaroonInterceptor { macaroon },
            )
            .max_decoding_message_size(MAX_MESSAGE_SIZE),
            pubkey: Arc::new(RwLock::new(None)),
        })
    }

    pub fn pubkey(&self) -> Option<secp256k1::PublicKey> {
        self.pubkey.read().ok().and_then(|v| *v)
    }

    async fn get_info(&mut self) -> anyhow::Result<GetInfoResponse> {
        let info = self.client.get_info(GetInfoRequest {}).await?;
        Ok(info.into_inner())
    }
}

#[async_trait]
impl BaseClient for ArkClient {
    fn kind(&self) -> String {
        "Fulmine".to_string()
    }

    fn symbol(&self) -> String {
        self.symbol.clone()
    }

    #[instrument(name = "ArkClient::connect", skip_all)]
    async fn connect(&mut self) -> anyhow::Result<()> {
        let info = self.get_info().await?;
        let pubkey = secp256k1::PublicKey::from_slice(&hex::decode(&info.pubkey)?)?;
        let mut pubkey_guard = self
            .pubkey
            .write()
            .map_err(|e| anyhow!("failed to acquire pubkey lock: {}", e))?;
        *pubkey_guard = Some(pubkey);

        info!(
            "Connected to {} {} {}: {}@{}",
            self.symbol,
            self.kind(),
            info.build_info
                .map(|info| info.version)
                .unwrap_or("unknown version".to_string()),
            info.pubkey,
            info.server_url,
        );

        Ok(())
    }
}

#[cfg(test)]
pub mod tests {
    use super::*;
    use std::path::PathBuf;

    const HOST: &str = "127.0.0.1";
    const PORT: u16 = 7000;

    fn macaroon_path() -> PathBuf {
        Path::new(env!("CARGO_MANIFEST_DIR"))
            .parent()
            .unwrap()
            .join("regtest/data/fulmine/macaroons/admin.macaroon")
    }

    pub async fn get_client() -> ArkClient {
        ArkClient::new(
            "ARK".to_string(),
            &crate::ark::Config {
                host: HOST.to_string(),
                port: PORT,
                macaroonpath: Some(macaroon_path().to_string_lossy().into_owned()),
            },
        )
        .await
        .unwrap()
    }

    #[tokio::test]
    async fn test_connect_pubkey() {
        let mut client = get_client().await;

        assert!(client.pubkey().is_none());

        client.connect().await.unwrap();

        let pubkey = client.pubkey();
        assert!(pubkey.is_some());
        assert!(!pubkey.unwrap().to_string().is_empty());
    }
}

use crate::chain::BaseClient;
use anyhow::anyhow;
use async_trait::async_trait;
use lnd_rpc::{ChanBackupExportRequest, ChannelBackupSubscription, GetInfoRequest};
use serde::{Deserialize, Serialize};
use std::str::FromStr;
use std::time::Duration;
use tokio_util::sync::CancellationToken;
use tonic::metadata::MetadataValue;
use tonic::service::interceptor::InterceptedService;
use tracing::{debug, error, info, instrument, warn};

const RECONNECT_INTERVAL: Duration = Duration::from_secs(5);

#[allow(
    dead_code,
    clippy::enum_variant_names,
    clippy::large_enum_variant,
    clippy::doc_lazy_continuation
)]
mod lnd_rpc {
    tonic::include_proto!("lnrpc");
}

#[derive(Clone)]
struct MacaroonInterceptor {
    macaroon: MetadataValue<tonic::metadata::Ascii>,
}

impl tonic::service::Interceptor for MacaroonInterceptor {
    fn call(&mut self, request: tonic::Request<()>) -> Result<tonic::Request<()>, tonic::Status> {
        let mut request = request;
        request
            .metadata_mut()
            .insert("macaroon", self.macaroon.clone());
        Ok(request)
    }
}

#[derive(Deserialize, Serialize, PartialEq, Clone, Debug)]
pub struct Config {
    pub host: String,
    pub port: u16,

    pub certpath: String,
    pub macaroonpath: String,
}

type LndClient = lnd_rpc::lightning_client::LightningClient<
    tonic::service::interceptor::InterceptedService<
        hyper_util::client::legacy::Client<
            hyper_rustls::HttpsConnector<hyper_util::client::legacy::connect::HttpConnector>,
            tonic::body::Body,
        >,
        MacaroonInterceptor,
    >,
>;

#[derive(Clone)]
pub struct Lnd {
    cancellation_token: CancellationToken,

    symbol: String,
    lnd: LndClient,

    scb_backup_tx: tokio::sync::broadcast::Sender<Vec<u8>>,
}

impl Lnd {
    #[instrument(name = "Lnd::new", skip(config))]
    pub async fn new(
        cancellation_token: CancellationToken,
        symbol: &str,
        config: Config,
    ) -> anyhow::Result<Self> {
        let (scb_backup_tx, _) = tokio::sync::broadcast::channel::<Vec<u8>>(16);

        let tls_config = tls::config(config.certpath).await?;

        let mut http = hyper_util::client::legacy::connect::HttpConnector::new();
        http.enforce_http(false);

        let address = format!("https://{}:{}", config.host, config.port);

        let connector = tower::ServiceBuilder::new()
            .layer_fn(move |s| {
                let tls_config = tls_config.clone();

                hyper_rustls::HttpsConnectorBuilder::new()
                    .with_tls_config(tls_config)
                    .https_or_http()
                    .enable_http2()
                    .wrap_connector(s)
            })
            .service(http);

        let client =
            hyper_util::client::legacy::Client::builder(hyper_util::rt::TokioExecutor::new())
                .build(connector);

        let intercepted = InterceptedService::new(
            client,
            MacaroonInterceptor {
                macaroon: MetadataValue::from_str(&alloy::hex::encode(
                    tokio::fs::read(&config.macaroonpath).await.map_err(|e| {
                        anyhow::anyhow!(
                            "failed to read macaroon from {}: {}",
                            config.macaroonpath,
                            e
                        )
                    })?,
                ))?,
            },
        );

        let lnd = lnd_rpc::lightning_client::LightningClient::with_origin(
            intercepted,
            tonic::transport::Uri::from_str(&address)?,
        );

        Ok(Lnd {
            cancellation_token,
            symbol: symbol.to_string(),
            lnd,
            scb_backup_tx,
        })
    }

    pub async fn channel_backup(&mut self) -> anyhow::Result<Option<Vec<u8>>> {
        let res = self
            .lnd
            .export_all_channel_backups(ChanBackupExportRequest {})
            .await?
            .into_inner();

        Ok(Some(match res.multi_chan_backup {
            Some(backup) => backup.multi_chan_backup,
            None => Vec::default(),
        }))
    }

    pub fn subscribe_channel_backups(&self) -> tokio::sync::broadcast::Receiver<Vec<u8>> {
        self.scb_backup_tx.subscribe()
    }

    async fn start_listeners(&mut self) -> anyhow::Result<()> {
        let mut backup_stream = self
            .lnd
            .subscribe_channel_backups(ChannelBackupSubscription {})
            .await?
            .into_inner();

        loop {
            tokio::select! {
                message = backup_stream.message() => {
                    match message {
                        Ok(message) => {
                            if let Some(backup) = message
                                && let Some(mcb) = backup.multi_chan_backup
                                && let Err(err) = self.scb_backup_tx.send(mcb.multi_chan_backup)
                            {
                                error!("Could not broadcast LND backup: {}", err);
                            }
                        },
                        Err(err) => return Err(anyhow!("{}", err)),
                    }
                },
                _ = self.cancellation_token.cancelled() => {
                    debug!("Stopping LND subscriptions");
                    return Ok(());
                }
            }
        }
    }
}

#[async_trait]
impl BaseClient for Lnd {
    fn kind(&self) -> String {
        "LND".to_string()
    }

    fn symbol(&self) -> String {
        self.symbol.clone()
    }

    async fn connect(&mut self) -> anyhow::Result<()> {
        let info = self.lnd.get_info(GetInfoRequest {}).await?.into_inner();
        info!(
            "Connected to {} LND {} ({})",
            self.symbol,
            info.version,
            if !info.alias.is_empty() {
                info.alias
            } else {
                info.identity_pubkey
            }
        );

        let mut self_sub = self.clone();
        tokio::spawn(async move {
            loop {
                match self_sub.start_listeners().await {
                    Ok(_) => break,
                    Err(err) => {
                        error!("LND subscriptions failed: {}", err);
                        warn!(
                            "Reconnecting to LND subscriptions in: {:?}",
                            RECONNECT_INTERVAL
                        );
                        tokio::time::sleep(RECONNECT_INTERVAL).await;
                    }
                }
            }
        });

        Ok(())
    }
}

mod tls {
    use anyhow::Result;
    use rustls::client::ClientConfig;
    use rustls::client::danger::{HandshakeSignatureValid, ServerCertVerified, ServerCertVerifier};
    use rustls::crypto::{CryptoProvider, WebPkiSupportedAlgorithms};
    use rustls::pki_types::{CertificateDer, ServerName, UnixTime};
    use rustls::{DigitallySignedStruct, Error as TLSError, SignatureScheme};
    use std::{
        path::{Path, PathBuf},
        sync::Arc,
    };

    pub(crate) async fn config(path: impl AsRef<Path> + Into<PathBuf>) -> Result<ClientConfig> {
        Ok(ClientConfig::builder()
            .dangerous()
            .with_custom_certificate_verifier(Arc::new(CertVerifier::load(path).await?))
            .with_no_client_auth())
    }

    #[derive(Debug)]
    pub(crate) struct CertVerifier {
        certs: Vec<Vec<u8>>,
        supported_algs: WebPkiSupportedAlgorithms,
    }

    impl CertVerifier {
        pub(crate) async fn load(path: impl AsRef<Path> + Into<PathBuf>) -> Result<Self> {
            let contents = tokio::fs::read(&path)
                .await
                .map_err(|e| anyhow::anyhow!("failed to read certificate file: {}", e))?;
            let cert_der_vec =
                rustls_pemfile::certs(&mut &*contents).collect::<Result<Vec<_>, _>>()?;
            let certs: Vec<Vec<u8>> = cert_der_vec
                .into_iter()
                .map(|cert_der| cert_der.to_vec())
                .collect();

            let provider = CryptoProvider::get_default()
                .ok_or_else(|| anyhow::anyhow!("must install default crypto provider"))?;

            Ok(CertVerifier {
                certs,
                supported_algs: provider.signature_verification_algorithms,
            })
        }
    }

    impl ServerCertVerifier for CertVerifier {
        fn verify_server_cert(
            &self,
            end_entity: &CertificateDer,
            intermediates: &[CertificateDer],
            _server_name: &ServerName,
            _ocsp_response: &[u8],
            _now: UnixTime,
        ) -> Result<ServerCertVerified, TLSError> {
            let mut certs = intermediates
                .iter()
                .map(|c| c.as_ref().to_vec())
                .collect::<Vec<Vec<u8>>>();
            certs.push(end_entity.as_ref().to_vec());
            certs.sort();

            if self.certs.len() != certs.len() {
                return Err(TLSError::General(format!(
                    "mismatched number of certificates (expected: {}, presented: {})",
                    self.certs.len(),
                    certs.len()
                )));
            }

            let mut our_certs = self.certs.clone();
            our_certs.sort();

            for (c, p) in our_certs.iter().zip(certs.iter()) {
                if *p != *c {
                    return Err(TLSError::General(
                        "server certificates do not match ours".to_string(),
                    ));
                }
            }
            Ok(ServerCertVerified::assertion())
        }

        fn verify_tls12_signature(
            &self,
            message: &[u8],
            cert: &CertificateDer,
            dss: &DigitallySignedStruct,
        ) -> Result<HandshakeSignatureValid, TLSError> {
            rustls::crypto::verify_tls12_signature(message, cert, dss, &self.supported_algs)
        }

        fn verify_tls13_signature(
            &self,
            message: &[u8],
            cert: &CertificateDer,
            dss: &DigitallySignedStruct,
        ) -> Result<HandshakeSignatureValid, TLSError> {
            rustls::crypto::verify_tls13_signature(message, cert, dss, &self.supported_algs)
        }

        fn supported_verify_schemes(&self) -> Vec<SignatureScheme> {
            self.supported_algs.supported_schemes()
        }
    }
}

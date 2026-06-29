use anyhow::Result;
use boltz_utils::mb_to_bytes;
use std::fs;
use std::path::PathBuf;
use tonic::metadata::MetadataValue;
use tonic::transport::{Certificate, Channel, ClientTlsConfig, Identity};

pub use boltz_rpc::PendingSweep;

mod boltzr {
    tonic::include_proto!("boltzr");
}

#[allow(clippy::enum_variant_names)]
mod boltz_rpc {
    tonic::include_proto!("boltzrpc");
}

const MAX_DECODING_MESSAGE_SIZE: usize = mb_to_bytes(32);

const CA_FILE_NAME: &str = "ca.pem";
const CERT_FILE_NAME: &str = "client.pem";
const KEY_FILE_NAME: &str = "client-key.pem";

impl From<crate::parsers::Signer> for i32 {
    fn from(signer: crate::parsers::Signer) -> Self {
        match signer {
            crate::parsers::Signer::SubmarineRefundCoop => {
                boltz_rpc::Signer::SubmarineRefundCooperative
            }
            crate::parsers::Signer::ReverseClaimCoop => boltz_rpc::Signer::ReverseClaimCooperative,
            crate::parsers::Signer::ChainRefundCoop => boltz_rpc::Signer::ChainRefundCooperative,
            crate::parsers::Signer::ChainClaimCoop => boltz_rpc::Signer::ChainClaimCooperative,
            crate::parsers::Signer::DeferredClaimCoop => {
                boltz_rpc::Signer::DeferredClaimCooperative
            }
            crate::parsers::Signer::EvmRefundCoop => boltz_rpc::Signer::EvmRefundCooperative,
            crate::parsers::Signer::EvmCommitmentRefundCoop => {
                boltz_rpc::Signer::EvmCommitmentRefundCooperative
            }
            crate::parsers::Signer::ReverseLockup => boltz_rpc::Signer::ReverseLockup,
            crate::parsers::Signer::ChainLockup => boltz_rpc::Signer::ChainLockup,
            crate::parsers::Signer::SubmarineInvoicePayment => {
                boltz_rpc::Signer::SubmarineInvoicePayment
            }
        }
        .into()
    }
}

pub fn signer_name(signer: i32) -> String {
    match boltz_rpc::Signer::try_from(signer) {
        Ok(signer) => signer.as_str_name().to_string(),
        Err(_) => format!("UNKNOWN({signer})"),
    }
}

#[derive(Debug, Clone)]
pub struct BoltzClient {
    client: boltz_rpc::boltz_client::BoltzClient<Channel>,
    bearer: Option<MetadataValue<tonic::metadata::Ascii>>,
}

impl BoltzClient {
    pub async fn new(
        host: &str,
        port: u16,
        certificates_path: Option<PathBuf>,
        jwt: Option<String>,
    ) -> Result<Self> {
        let bearer = jwt
            .map(|token| -> Result<_> {
                let value: MetadataValue<_> = format!("Bearer {}", token).parse()?;
                Ok(value)
            })
            .transpose()?;

        let channel = match certificates_path {
            Some(certificates_path) => {
                let certificates_path = crate::utils::resolve_home(certificates_path)?;

                let tls = ClientTlsConfig::new()
                    .domain_name("boltz")
                    .ca_certificate(Certificate::from_pem(fs::read_to_string(
                        certificates_path.join(CA_FILE_NAME),
                    )?))
                    .identity(Identity::from_pem(
                        fs::read_to_string(certificates_path.join(CERT_FILE_NAME))?,
                        fs::read_to_string(certificates_path.join(KEY_FILE_NAME))?,
                    ));

                Channel::from_shared(format!("https://{}:{}", host, port))?.tls_config(tls)?
            }
            None => Channel::from_shared(format!("http://{}:{}", host, port))?,
        };

        let client = boltz_rpc::boltz_client::BoltzClient::new(channel.connect().await?)
            .max_decoding_message_size(MAX_DECODING_MESSAGE_SIZE);

        Ok(Self { client, bearer })
    }

    fn req<T>(&self, msg: T) -> tonic::Request<T> {
        let mut req = tonic::Request::new(msg);
        if let Some(bearer) = &self.bearer {
            req.metadata_mut().insert("authorization", bearer.clone());
        }
        req
    }

    pub async fn get_info(&mut self) -> Result<boltz_rpc::GetInfoResponse> {
        let response = self
            .client
            .get_info(self.req(boltz_rpc::GetInfoRequest {}))
            .await?;
        Ok(response.into_inner())
    }

    pub async fn add_referral(
        &mut self,
        id: String,
        fee_share: u32,
        routing_node: Option<String>,
    ) -> Result<boltz_rpc::AddReferralResponse> {
        let response = self
            .client
            .add_referral(self.req(boltz_rpc::AddReferralRequest {
                id,
                fee_share,
                routing_node,
            }))
            .await?;
        Ok(response.into_inner())
    }

    pub async fn rotate_referral_keys(
        &mut self,
        id: String,
    ) -> Result<boltz_rpc::RotateReferralKeysResponse> {
        let response = self
            .client
            .rotate_referral_keys(self.req(boltz_rpc::RotateReferralKeysRequest { id }))
            .await?;
        Ok(response.into_inner())
    }

    pub async fn allow_refund(&mut self, id: String) -> Result<boltz_rpc::AllowRefundResponse> {
        let response = self
            .client
            .allow_refund(self.req(boltz_rpc::AllowRefundRequest { id }))
            .await?;
        Ok(response.into_inner())
    }

    pub async fn disable_signers(
        &mut self,
        signers: Vec<crate::parsers::Signer>,
    ) -> Result<boltz_rpc::DisableSignersResponse> {
        let response = self
            .client
            .disable_signers(self.req(boltz_rpc::DisableSignersRequest {
                signers: signers.into_iter().map(Into::into).collect(),
            }))
            .await?;
        Ok(response.into_inner())
    }

    pub async fn enable_signers(
        &mut self,
        signers: Vec<crate::parsers::Signer>,
    ) -> Result<boltz_rpc::EnableSignersResponse> {
        let response = self
            .client
            .enable_signers(self.req(boltz_rpc::EnableSignersRequest {
                signers: signers.into_iter().map(Into::into).collect(),
            }))
            .await?;
        Ok(response.into_inner())
    }

    pub async fn get_disabled_signers(&mut self) -> Result<boltz_rpc::GetDisabledSignersResponse> {
        let response = self
            .client
            .get_disabled_signers(self.req(boltz_rpc::GetDisabledSignersRequest {}))
            .await?;
        Ok(response.into_inner())
    }

    pub async fn calculate_transaction_fee(
        &mut self,
        symbol: String,
        transaction_id: String,
    ) -> Result<boltz_rpc::CalculateTransactionFeeResponse> {
        let response = self
            .client
            .calculate_transaction_fee(self.req(boltz_rpc::CalculateTransactionFeeRequest {
                symbol,
                transaction_id,
            }))
            .await?;
        Ok(response.into_inner())
    }

    pub async fn check_transaction(
        &mut self,
        symbol: String,
        id: String,
    ) -> Result<boltz_rpc::CheckTransactionResponse> {
        let response = self
            .client
            .check_transaction(self.req(boltz_rpc::CheckTransactionRequest { symbol, id }))
            .await?;
        Ok(response.into_inner())
    }

    pub async fn cln_threshold(
        &mut self,
        swap_type: crate::parsers::SwapType,
        threshold: u64,
    ) -> Result<boltz_rpc::InvoiceClnThresholdResponse> {
        let response = self
            .client
            .invoice_cln_threshold(self.req(boltz_rpc::InvoiceClnThresholdRequest {
                thresholds: vec![boltz_rpc::invoice_cln_threshold_request::Threshold {
                    r#type: match swap_type {
                        crate::parsers::SwapType::Submarine => boltz_rpc::SwapType::Submarine,
                        crate::parsers::SwapType::Reverse => boltz_rpc::SwapType::Reverse,
                    }
                    .into(),
                    threshold,
                }],
            }))
            .await?;
        Ok(response.into_inner())
    }

    pub async fn derive_blinding_keys(
        &mut self,
        address: String,
    ) -> Result<boltz_rpc::DeriveBlindingKeyResponse> {
        let response = self
            .client
            .derive_blinding_keys(self.req(boltz_rpc::DeriveBlindingKeyRequest { address }))
            .await?;
        Ok(response.into_inner())
    }

    pub async fn derive_keys(
        &mut self,
        symbol: String,
        index: u32,
    ) -> Result<boltz_rpc::DeriveKeysResponse> {
        let response = self
            .client
            .derive_keys(self.req(boltz_rpc::DeriveKeysRequest { symbol, index }))
            .await?;
        Ok(response.into_inner())
    }

    pub async fn get_address(
        &mut self,
        symbol: String,
        label: String,
    ) -> Result<boltz_rpc::GetAddressResponse> {
        let response = self
            .client
            .get_address(self.req(boltz_rpc::GetAddressRequest { symbol, label }))
            .await?;
        Ok(response.into_inner())
    }

    pub async fn get_balance(&mut self) -> Result<boltz_rpc::GetBalanceResponse> {
        let response = self
            .client
            .get_balance(self.req(boltz_rpc::GetBalanceRequest {}))
            .await?;
        Ok(response.into_inner())
    }

    pub async fn get_label(&mut self, id: String) -> Result<boltz_rpc::GetLabelResponse> {
        let response = self
            .client
            .get_label(self.req(boltz_rpc::GetLabelRequest { tx_id: id }))
            .await?;
        Ok(response.into_inner())
    }

    pub async fn get_pending_evm_transactions(
        &mut self,
    ) -> Result<boltz_rpc::GetPendingEvmTransactionsResponse> {
        let response = self
            .client
            .get_pending_evm_transactions(self.req(boltz_rpc::GetPendingEvmTransactionsRequest {}))
            .await?;
        Ok(response.into_inner())
    }

    pub async fn set_referral(
        &mut self,
        id: String,
        config: Option<String>,
    ) -> Result<boltz_rpc::SetReferralResponse> {
        let response = self
            .client
            .set_referral(self.req(boltz_rpc::SetReferralRequest { id, config }))
            .await?;
        Ok(response.into_inner())
    }

    pub async fn get_referrals(
        &mut self,
        id: Option<String>,
    ) -> Result<boltz_rpc::GetReferralsResponse> {
        let response = self
            .client
            .get_referrals(self.req(boltz_rpc::GetReferralsRequest { id }))
            .await?;
        Ok(response.into_inner())
    }

    pub async fn get_pending_sweeps(&mut self) -> Result<boltz_rpc::GetPendingSweepsResponse> {
        let response = self
            .client
            .get_pending_sweeps(self.req(boltz_rpc::GetPendingSweepsRequest {}))
            .await?;
        Ok(response.into_inner())
    }

    pub async fn rescan(
        &mut self,
        symbol: String,
        start_height: u64,
        include_mempool: bool,
    ) -> Result<boltz_rpc::RescanResponse> {
        let response = self
            .client
            .rescan(self.req(boltz_rpc::RescanRequest {
                symbol,
                start_height,
                include_mempool: Some(include_mempool),
            }))
            .await?;
        Ok(response.into_inner())
    }

    pub async fn send_coins(
        &mut self,
        symbol: String,
        address: String,
        amount: crate::parsers::AmountOrAll,
        label: String,
        fee: Option<u32>,
    ) -> Result<boltz_rpc::SendCoinsResponse> {
        let response = self
            .client
            .send_coins(self.req(boltz_rpc::SendCoinsRequest {
                symbol,
                address,
                amount: match amount {
                    crate::parsers::AmountOrAll::Amount(amount) => amount.0,
                    crate::parsers::AmountOrAll::All => 0,
                },
                label,
                fee,
                send_all: matches!(amount, crate::parsers::AmountOrAll::All),
            }))
            .await?;
        Ok(response.into_inner())
    }

    pub async fn set_log_level(
        &mut self,
        level: crate::parsers::LogLevel,
    ) -> Result<boltz_rpc::SetLogLevelResponse> {
        let response = self
            .client
            .set_log_level(
                self.req(boltz_rpc::SetLogLevelRequest {
                    level: match level {
                        crate::parsers::LogLevel::Error => boltz_rpc::LogLevel::Error,
                        crate::parsers::LogLevel::Warn => boltz_rpc::LogLevel::Warn,
                        crate::parsers::LogLevel::Info => boltz_rpc::LogLevel::Info,
                        crate::parsers::LogLevel::Verbose => boltz_rpc::LogLevel::Verbose,
                        crate::parsers::LogLevel::Debug => boltz_rpc::LogLevel::Debug,
                        crate::parsers::LogLevel::Silly => boltz_rpc::LogLevel::Silly,
                    }
                    .into(),
                }),
            )
            .await?;
        Ok(response.into_inner())
    }

    pub async fn set_swap_status(
        &mut self,
        id: String,
        status: String,
    ) -> Result<boltz_rpc::SetSwapStatusResponse> {
        let response = self
            .client
            .set_swap_status(self.req(boltz_rpc::SetSwapStatusRequest { id, status }))
            .await?;
        Ok(response.into_inner())
    }

    pub async fn stop(&mut self) -> Result<boltz_rpc::StopResponse> {
        let response = self
            .client
            .stop(self.req(boltz_rpc::StopRequest {}))
            .await?;
        Ok(response.into_inner())
    }

    pub async fn sweep_swaps(
        &mut self,
        symbol: Option<String>,
    ) -> Result<boltz_rpc::SweepSwapsResponse> {
        let response = self
            .client
            .sweep_swaps(self.req(boltz_rpc::SweepSwapsRequest { symbol }))
            .await?;
        Ok(response.into_inner())
    }

    pub async fn unblind_outputs(
        &mut self,
        id: Option<String>,
        hex: Option<String>,
    ) -> Result<boltz_rpc::UnblindOutputsResponse> {
        let response = self
            .client
            .unblind_outputs(self.req(boltz_rpc::UnblindOutputsRequest {
                transaction: if let Some(id) = id {
                    Some(boltz_rpc::unblind_outputs_request::Transaction::Id(id))
                } else {
                    Some(boltz_rpc::unblind_outputs_request::Transaction::Hex(
                        hex.ok_or_else(|| {
                            anyhow::anyhow!("hex is required when id is not provided")
                        })?,
                    ))
                },
            }))
            .await?;
        Ok(response.into_inner())
    }

    pub async fn dev_clear_swap_update_cache(
        &mut self,
        id: Option<String>,
    ) -> Result<boltz_rpc::DevClearSwapUpdateCacheResponse> {
        let response = self
            .client
            .dev_clear_swap_update_cache(self.req(boltz_rpc::DevClearSwapUpdateCacheRequest { id }))
            .await?;
        Ok(response.into_inner())
    }

    pub async fn dev_heap_dump(
        &mut self,
        path: Option<String>,
    ) -> Result<boltz_rpc::DevHeapDumpResponse> {
        let response = self
            .client
            .dev_heap_dump(self.req(boltz_rpc::DevHeapDumpRequest { path }))
            .await?;
        Ok(response.into_inner())
    }

    pub async fn dev_refresh_balance_cache(
        &mut self,
        symbol: Option<String>,
    ) -> Result<boltz_rpc::DevRefreshBalanceCacheResponse> {
        let response = self
            .client
            .dev_refresh_balance_cache(
                self.req(boltz_rpc::DevRefreshBalanceCacheRequest { symbol }),
            )
            .await?;
        Ok(response.into_inner())
    }

    pub async fn issue_jwt(
        &mut self,
        label: String,
        allowed_methods: Vec<String>,
        expires_in_seconds: Option<u64>,
    ) -> Result<boltz_rpc::IssueJwtResponse> {
        let response = self
            .client
            .issue_jwt(self.req(boltz_rpc::IssueJwtRequest {
                label,
                allowed_methods,
                expires_in_seconds,
            }))
            .await?;
        Ok(response.into_inner())
    }

    pub async fn revoke_jwt(&mut self, id: String) -> Result<boltz_rpc::RevokeJwtResponse> {
        let response = self
            .client
            .revoke_jwt(self.req(boltz_rpc::RevokeJwtRequest { id }))
            .await?;
        Ok(response.into_inner())
    }

    pub async fn list_jwts(&mut self) -> Result<boltz_rpc::ListJwtsResponse> {
        let response = self
            .client
            .list_jwts(self.req(boltz_rpc::ListJwtsRequest {}))
            .await?;
        Ok(response.into_inner())
    }

    pub async fn list_methods(&mut self) -> Result<boltz_rpc::ListMethodsResponse> {
        let response = self
            .client
            .list_methods(self.req(boltz_rpc::ListMethodsRequest {}))
            .await?;
        Ok(response.into_inner())
    }
}

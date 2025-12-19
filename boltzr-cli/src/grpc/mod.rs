use anyhow::Result;
use std::fs;
use std::path::PathBuf;
use tonic::transport::{Certificate, Channel, ClientTlsConfig, Identity};

mod boltzr {
    tonic::include_proto!("boltzr");
}

mod boltz_rpc {
    tonic::include_proto!("boltzrpc");
}

const fn mb_to_bytes(mb: usize) -> usize {
    mb * 1024 * 1024
}

const MAX_DECODING_MESSAGE_SIZE: usize = mb_to_bytes(32);

const CA_FILE_NAME: &str = "ca.pem";
const CERT_FILE_NAME: &str = "client.pem";
const KEY_FILE_NAME: &str = "client-key.pem";

#[derive(Debug, Clone)]
pub struct BoltzClient {
    client: boltz_rpc::boltz_client::BoltzClient<Channel>,
}

impl BoltzClient {
    pub async fn new(host: &str, port: u16, certificates_path: Option<PathBuf>) -> Result<Self> {
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
        Ok(Self { client })
    }

    pub async fn get_info(&mut self) -> Result<boltz_rpc::GetInfoResponse> {
        let response = self.client.get_info(boltz_rpc::GetInfoRequest {}).await?;
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
            .add_referral(boltz_rpc::AddReferralRequest {
                id,
                fee_share,
                routing_node,
            })
            .await?;
        Ok(response.into_inner())
    }

    pub async fn allow_refund(&mut self, id: String) -> Result<boltz_rpc::AllowRefundResponse> {
        let response = self
            .client
            .allow_refund(boltz_rpc::AllowRefundRequest { id })
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
            .calculate_transaction_fee(boltz_rpc::CalculateTransactionFeeRequest {
                symbol,
                transaction_id,
            })
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
            .check_transaction(boltz_rpc::CheckTransactionRequest { symbol, id })
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
            .invoice_cln_threshold(boltz_rpc::InvoiceClnThresholdRequest {
                thresholds: vec![boltz_rpc::invoice_cln_threshold_request::Threshold {
                    r#type: match swap_type {
                        crate::parsers::SwapType::Submarine => boltz_rpc::SwapType::Submarine,
                        crate::parsers::SwapType::Reverse => boltz_rpc::SwapType::Reverse,
                    }
                    .into(),
                    threshold,
                }],
            })
            .await?;
        Ok(response.into_inner())
    }

    pub async fn derive_blinding_keys(
        &mut self,
        address: String,
    ) -> Result<boltz_rpc::DeriveBlindingKeyResponse> {
        let response = self
            .client
            .derive_blinding_keys(boltz_rpc::DeriveBlindingKeyRequest { address })
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
            .derive_keys(boltz_rpc::DeriveKeysRequest { symbol, index })
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
            .get_address(boltz_rpc::GetAddressRequest { symbol, label })
            .await?;
        Ok(response.into_inner())
    }

    pub async fn get_balance(&mut self) -> Result<boltz_rpc::GetBalanceResponse> {
        let response = self
            .client
            .get_balance(boltz_rpc::GetBalanceRequest {})
            .await?;
        Ok(response.into_inner())
    }

    pub async fn get_label(&mut self, id: String) -> Result<boltz_rpc::GetLabelResponse> {
        let response = self
            .client
            .get_label(boltz_rpc::GetLabelRequest { tx_id: id })
            .await?;
        Ok(response.into_inner())
    }

    pub async fn get_pending_evm_transactions(
        &mut self,
    ) -> Result<boltz_rpc::GetPendingEvmTransactionsResponse> {
        let response = self
            .client
            .get_pending_evm_transactions(boltz_rpc::GetPendingEvmTransactionsRequest {})
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
            .set_referral(boltz_rpc::SetReferralRequest { id, config })
            .await?;
        Ok(response.into_inner())
    }

    pub async fn get_referrals(
        &mut self,
        id: Option<String>,
    ) -> Result<boltz_rpc::GetReferralsResponse> {
        let response = self
            .client
            .get_referrals(boltz_rpc::GetReferralsRequest { id })
            .await?;
        Ok(response.into_inner())
    }

    pub async fn get_pending_sweeps(&mut self) -> Result<boltz_rpc::GetPendingSweepsResponse> {
        let response = self
            .client
            .get_pending_sweeps(boltz_rpc::GetPendingSweepsRequest {})
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
            .rescan(boltz_rpc::RescanRequest {
                symbol,
                start_height,
                include_mempool: Some(include_mempool),
            })
            .await?;
        Ok(response.into_inner())
    }

    pub async fn send_coins(
        &mut self,
        symbol: String,
        address: String,
        amount: crate::parsers::AmountOrAll,
        label: String,
        fee: u32,
    ) -> Result<boltz_rpc::SendCoinsResponse> {
        let response = self
            .client
            .send_coins(boltz_rpc::SendCoinsRequest {
                symbol,
                address,
                amount: match amount {
                    crate::parsers::AmountOrAll::Amount(amount) => amount.0,
                    crate::parsers::AmountOrAll::All => 0,
                },
                label,
                fee,
                send_all: matches!(amount, crate::parsers::AmountOrAll::All),
            })
            .await?;
        Ok(response.into_inner())
    }

    pub async fn set_log_level(
        &mut self,
        level: crate::parsers::LogLevel,
    ) -> Result<boltz_rpc::SetLogLevelResponse> {
        let response = self
            .client
            .set_log_level(boltz_rpc::SetLogLevelRequest {
                level: match level {
                    crate::parsers::LogLevel::Error => boltz_rpc::LogLevel::Error,
                    crate::parsers::LogLevel::Warn => boltz_rpc::LogLevel::Warn,
                    crate::parsers::LogLevel::Info => boltz_rpc::LogLevel::Info,
                    crate::parsers::LogLevel::Verbose => boltz_rpc::LogLevel::Verbose,
                    crate::parsers::LogLevel::Debug => boltz_rpc::LogLevel::Debug,
                    crate::parsers::LogLevel::Silly => boltz_rpc::LogLevel::Silly,
                }
                .into(),
            })
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
            .set_swap_status(boltz_rpc::SetSwapStatusRequest { id, status })
            .await?;
        Ok(response.into_inner())
    }

    pub async fn stop(&mut self) -> Result<boltz_rpc::StopResponse> {
        let response = self.client.stop(boltz_rpc::StopRequest {}).await?;
        Ok(response.into_inner())
    }

    pub async fn sweep_swaps(
        &mut self,
        symbol: Option<String>,
    ) -> Result<boltz_rpc::SweepSwapsResponse> {
        let response = self
            .client
            .sweep_swaps(boltz_rpc::SweepSwapsRequest { symbol })
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
            .unblind_outputs(boltz_rpc::UnblindOutputsRequest {
                transaction: if let Some(id) = id {
                    Some(boltz_rpc::unblind_outputs_request::Transaction::Id(id))
                } else {
                    Some(boltz_rpc::unblind_outputs_request::Transaction::Hex(
                        hex.ok_or_else(|| {
                            anyhow::anyhow!("hex is required when id is not provided")
                        })?,
                    ))
                },
            })
            .await?;
        Ok(response.into_inner())
    }

    pub async fn dev_clear_swap_update_cache(
        &mut self,
        id: Option<String>,
    ) -> Result<boltz_rpc::DevClearSwapUpdateCacheResponse> {
        let response = self
            .client
            .dev_clear_swap_update_cache(boltz_rpc::DevClearSwapUpdateCacheRequest { id })
            .await?;
        Ok(response.into_inner())
    }

    pub async fn dev_disable_cooperative(
        &mut self,
        disabled: bool,
    ) -> Result<boltz_rpc::DevDisableCooperativeResponse> {
        let response = self
            .client
            .dev_disable_cooperative(boltz_rpc::DevDisableCooperativeRequest { disabled })
            .await?;
        Ok(response.into_inner())
    }

    pub async fn dev_heap_dump(
        &mut self,
        path: Option<String>,
    ) -> Result<boltz_rpc::DevHeapDumpResponse> {
        let response = self
            .client
            .dev_heap_dump(boltz_rpc::DevHeapDumpRequest { path })
            .await?;
        Ok(response.into_inner())
    }
}

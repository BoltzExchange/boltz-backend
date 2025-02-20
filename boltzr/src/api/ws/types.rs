use crate::grpc::service::boltzr::{SwapUpdate, swap_update};
use serde::{Deserialize, Serialize};

#[derive(Deserialize, Serialize, Debug, Clone, PartialEq)]
pub struct TransactionInfo {
    pub id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub hex: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub eta: Option<u64>,
}

#[derive(Deserialize, Serialize, Debug, Clone, PartialEq)]
pub struct FailureReasonIncorrectAmounts {
    pub expected: u64,
    pub actual: u64,
}

#[derive(Deserialize, Serialize, Debug, Clone, PartialEq)]
pub struct ChannelInfo {
    #[serde(rename = "fundingTransactionId")]
    pub funding_transaction_id: String,
    #[serde(rename = "fundingTransactionVout")]
    pub funding_transaction_vout: u64,
}

#[derive(Deserialize, Serialize, Default, Debug, Clone, PartialEq)]
pub struct SwapStatus {
    pub id: String,
    pub status: String,

    #[serde(rename = "zeroConfRejected", skip_serializing_if = "Option::is_none")]
    pub zero_conf_rejected: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub transaction: Option<TransactionInfo>,

    #[serde(rename = "failureReason", skip_serializing_if = "Option::is_none")]
    pub failure_reason: Option<String>,
    #[serde(rename = "failureDetails", skip_serializing_if = "Option::is_none")]
    pub failure_details: Option<FailureReasonIncorrectAmounts>,

    #[serde(rename = "channel", skip_serializing_if = "Option::is_none")]
    pub channel_info: Option<ChannelInfo>,
}

impl From<swap_update::TransactionInfo> for TransactionInfo {
    fn from(value: swap_update::TransactionInfo) -> Self {
        TransactionInfo {
            id: value.id,
            hex: value.hex,
            eta: value.eta,
        }
    }
}

impl From<swap_update::FailureDetails> for FailureReasonIncorrectAmounts {
    fn from(value: swap_update::FailureDetails) -> Self {
        FailureReasonIncorrectAmounts {
            expected: value.expected,
            actual: value.actual,
        }
    }
}

impl From<swap_update::ChannelInfo> for ChannelInfo {
    fn from(value: swap_update::ChannelInfo) -> Self {
        ChannelInfo {
            funding_transaction_id: value.funding_transaction_id,
            funding_transaction_vout: value.funding_transaction_vout,
        }
    }
}

impl From<&SwapUpdate> for SwapStatus {
    fn from(value: &SwapUpdate) -> Self {
        SwapStatus {
            id: value.id.clone(),
            status: value.status.clone(),
            zero_conf_rejected: value.zero_conf_rejected,
            transaction: value.transaction_info.clone().map(|info| info.into()),
            failure_reason: value.failure_reason.clone(),
            failure_details: value.failure_details.map(|details| details.into()),
            channel_info: value.channel_info.clone().map(|info| info.into()),
        }
    }
}

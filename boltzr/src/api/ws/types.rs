use crate::grpc::service::boltzr::{SwapUpdate, swap_update};
use serde::{Deserialize, Serialize};
use tokio::sync::broadcast;

pub trait SubscriptionUpdate: Clone + Send + Sync + 'static {
    fn id(&self) -> &str;
}

/// Type alias for broadcast senders that send updates with an optional connection ID filter.
/// The `Option<u64>` is the connection ID - when `Some`, updates are only sent to that connection.
pub type UpdateSender<T> = broadcast::Sender<(Option<u64>, Vec<T>)>;

/// Type alias for broadcast receivers that receive updates with an optional connection ID filter.
pub type UpdateReceiver<T> = broadcast::Receiver<(Option<u64>, Vec<T>)>;

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

#[derive(Deserialize, Serialize, Default, Debug, Clone, PartialEq)]
pub struct SwapStatus {
    pub id: String,
    #[serde(flatten)]
    pub base: SwapStatusNoId,
}

#[derive(Deserialize, Serialize, Default, Debug, Clone, PartialEq)]
pub struct SwapStatusNoId {
    pub status: String,

    #[serde(rename = "zeroConfRejected", skip_serializing_if = "Option::is_none")]
    pub zero_conf_rejected: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub transaction: Option<TransactionInfo>,

    #[serde(rename = "failureReason", skip_serializing_if = "Option::is_none")]
    pub failure_reason: Option<String>,
    #[serde(rename = "failureDetails", skip_serializing_if = "Option::is_none")]
    pub failure_details: Option<FailureReasonIncorrectAmounts>,
}

#[derive(Deserialize, Serialize, Default, Debug, Clone, PartialEq)]
pub struct FundingAddressUpdate {
    pub id: String,
    pub status: String,
    #[serde(rename = "transaction", skip_serializing_if = "Option::is_none")]
    pub transaction: Option<TransactionInfo>,
    #[serde(rename = "swapId", skip_serializing_if = "Option::is_none")]
    pub swap_id: Option<String>,
}

impl SubscriptionUpdate for SwapStatus {
    fn id(&self) -> &str {
        &self.id
    }
}

impl SubscriptionUpdate for FundingAddressUpdate {
    fn id(&self) -> &str {
        &self.id
    }
}

/// Enum representing the different types of update data that can be sent via WebSocket.
/// The `channel` field in `UpdateResponse` indicates which variant is contained.
#[derive(Deserialize, Serialize, Debug, Clone, PartialEq)]
#[serde(untagged)]
pub enum StatusUpdate {
    Swap(SwapStatus),
    FundingAddress(FundingAddressUpdate),
}

impl From<SwapStatus> for StatusUpdate {
    fn from(status: SwapStatus) -> Self {
        StatusUpdate::Swap(status)
    }
}

impl From<FundingAddressUpdate> for StatusUpdate {
    fn from(update: FundingAddressUpdate) -> Self {
        StatusUpdate::FundingAddress(update)
    }
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

impl From<&SwapUpdate> for SwapStatus {
    fn from(value: &SwapUpdate) -> Self {
        SwapStatus {
            id: value.id.clone(),
            base: SwapStatusNoId {
                status: value.status.clone(),
                zero_conf_rejected: value.zero_conf_rejected,
                transaction: value.transaction_info.clone().map(|info| info.into()),
                failure_reason: value.failure_reason.clone(),
                failure_details: value.failure_details.map(|details| details.into()),
            },
        }
    }
}

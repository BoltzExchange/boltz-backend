use crate::grpc::service::boltzr::{SwapUpdate, swap_update};
pub use boltz_utils::ws::{
    ErrorResponse, FailureReasonIncorrectAmounts, SubscribeResponse, SubscriptionChannel,
    SwapStatus, SwapStatusNoId, SwapUpdateSubscriptionRequest, TransactionInfo, UnsubscribeRequest,
    UnsubscribeResponse, UpdateResponse,
};

impl From<swap_update::TransactionInfo> for TransactionInfo {
    fn from(value: swap_update::TransactionInfo) -> Self {
        TransactionInfo {
            id: value.id,
            hex: value.hex,
            eta: value.eta,
            confirmed: value.confirmed,
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

use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, PartialEq, Debug, Clone)]
pub struct ErrorResponse {
    pub error: String,
}

#[derive(Serialize, Deserialize, Debug, PartialEq, Clone)]
pub enum SubscriptionChannel {
    #[serde(rename = "swap.update")]
    SwapUpdate,
    #[serde(rename = "invoice.request")]
    InvoiceRequest,
}

#[derive(Serialize, Deserialize, Debug, PartialEq, Clone)]
pub struct SwapUpdateSubscriptionRequest {
    pub args: Vec<String>,
}

#[derive(Serialize, Deserialize, Debug, PartialEq, Clone)]
#[serde(tag = "channel")]
pub enum SwapUpdateSubscribeRequest {
    #[serde(rename = "swap.update")]
    SwapUpdate(SwapUpdateSubscriptionRequest),
}

#[derive(Deserialize, Serialize, Debug, PartialEq, Clone)]
pub struct UnsubscribeRequest {
    pub channel: SubscriptionChannel,
    pub args: Vec<String>,
}

#[derive(Deserialize, Serialize, Debug, PartialEq, Clone)]
pub struct SubscribeResponse {
    pub channel: SubscriptionChannel,
    pub args: Vec<String>,
    pub timestamp: String,
}

#[derive(Deserialize, Serialize, Debug, PartialEq, Clone)]
pub struct UnsubscribeResponse {
    pub channel: SubscriptionChannel,
    pub args: Vec<String>,
    pub timestamp: String,
}

#[derive(Deserialize, Serialize, Debug, PartialEq, Clone)]
pub struct UpdateResponse<T> {
    pub channel: SubscriptionChannel,
    pub args: Vec<T>,
    pub timestamp: String,
}

#[derive(Serialize, Deserialize, Debug, PartialEq, Clone)]
#[serde(tag = "op")]
pub enum SwapUpdateWsRequest {
    #[serde(rename = "subscribe")]
    Subscribe(SwapUpdateSubscribeRequest),
}

#[derive(Deserialize, Serialize, Debug, Clone, PartialEq)]
pub struct TransactionInfo {
    pub id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub hex: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub eta: Option<u64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub confirmed: Option<bool>,
}

#[derive(Deserialize, Serialize, Debug, Clone, PartialEq, Default)]
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

impl SwapStatus {
    pub fn new(id: String, status: String) -> Self {
        SwapStatus {
            id,
            base: SwapStatusNoId {
                status,
                ..Default::default()
            },
        }
    }
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

#[derive(Deserialize, Serialize, Debug, PartialEq, Clone)]
#[serde(tag = "event")]
pub enum SwapUpdateWsResponse {
    #[serde(rename = "subscribe")]
    Subscribe(SubscribeResponse),
    #[serde(rename = "unsubscribe")]
    Unsubscribe(UnsubscribeResponse),
    #[serde(rename = "update")]
    Update(UpdateResponse<SwapStatus>),
    #[serde(rename = "error")]
    Error(ErrorResponse),
    #[serde(rename = "pong")]
    Pong,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn serializes_swap_update_subscription_request() {
        let request = SwapUpdateWsRequest::Subscribe(SwapUpdateSubscribeRequest::SwapUpdate(
            SwapUpdateSubscriptionRequest {
                args: vec!["swap1".to_string(), "swap2".to_string()],
            },
        ));

        assert_eq!(
            serde_json::to_value(request).unwrap(),
            serde_json::json!({
                "op": "subscribe",
                "channel": "swap.update",
                "args": ["swap1", "swap2"],
            }),
        );
    }

    #[test]
    fn deserializes_swap_update_response() {
        let response = serde_json::from_value::<SwapUpdateWsResponse>(serde_json::json!({
            "event": "update",
            "channel": "swap.update",
            "args": [
                {
                    "id": "swap1",
                    "status": "invoice.set",
                    "transaction": {
                        "id": "tx1",
                        "hex": "deadbeef",
                    }
                }
            ],
            "timestamp": "123",
        }))
        .unwrap();

        assert_eq!(
            response,
            SwapUpdateWsResponse::Update(UpdateResponse {
                channel: SubscriptionChannel::SwapUpdate,
                args: vec![SwapStatus {
                    id: "swap1".to_string(),
                    base: SwapStatusNoId {
                        status: "invoice.set".to_string(),
                        zero_conf_rejected: None,
                        transaction: Some(TransactionInfo {
                            id: "tx1".to_string(),
                            hex: Some("deadbeef".to_string()),
                            eta: None,
                            confirmed: None,
                        }),
                        failure_reason: None,
                        failure_details: None,
                    },
                }],
                timestamp: "123".to_string(),
            }),
        );
    }
}

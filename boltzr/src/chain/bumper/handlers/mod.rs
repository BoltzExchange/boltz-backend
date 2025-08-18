use anyhow::Result;
use async_trait::async_trait;

pub mod refund;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum HandlerType {
    Refund,
}

impl std::fmt::Display for HandlerType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            HandlerType::Refund => write!(f, "refund"),
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct PendingTransaction {
    pub swap_id: String,
    pub transaction_id: String,
}

#[async_trait]
pub trait TransactionHandler {
    fn handler_type(&self) -> HandlerType;
    fn fetch_pending(&self) -> Result<Vec<PendingTransaction>>;
    async fn bump_fee(&self, tx: &PendingTransaction, fee_target: f64) -> Result<String>;
}

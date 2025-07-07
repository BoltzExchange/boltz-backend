use crate::db::helpers::refund_transaction::{RefundStatus, RefundTransactionHelper};
use anyhow::Result;
use diesel::{BoolExpressionMethods, ExpressionMethods};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum FetcherType {
    Refund,
}

impl std::fmt::Display for FetcherType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            FetcherType::Refund => write!(f, "Refund"),
        }
    }
}

#[derive(Debug, Clone)]
pub struct PendingTransaction {
    pub swap_id: String,
    pub transaction_id: String,
}

pub trait TransactionFetcher {
    fn fetcher_type(&self) -> FetcherType;
    fn fetch_pending(&self) -> Result<Vec<PendingTransaction>>;
}

pub struct RefundTransactionFetcher<H>
where
    H: RefundTransactionHelper,
{
    symbol: String,
    helper: H,
}

impl<H> RefundTransactionFetcher<H>
where
    H: RefundTransactionHelper,
{
    pub fn new(symbol: String, helper: H) -> Self {
        Self { symbol, helper }
    }
}

impl<H> TransactionFetcher for RefundTransactionFetcher<H>
where
    H: RefundTransactionHelper,
{
    fn fetcher_type(&self) -> FetcherType {
        FetcherType::Refund
    }

    fn fetch_pending(&self) -> Result<Vec<PendingTransaction>> {
        let transactions = self.helper.get_all(Box::new(
            crate::db::schema::refund_transactions::dsl::status
                .eq(RefundStatus::Pending.to_string())
                .and(crate::db::schema::refund_transactions::dsl::symbol.eq(self.symbol.clone())),
        ))?;

        Ok(transactions
            .into_iter()
            .map(|t| PendingTransaction {
                swap_id: t.swapId,
                transaction_id: t.id,
            })
            .collect())
    }
}

use crate::db::Pool;
use crate::db::helpers::{BoxedCondition, QueryResponse};
use crate::db::models::RefundTransaction;
use crate::db::schema::refund_transactions;
use diesel::{ExpressionMethods, QueryDsl, RunQueryDsl, SelectableHelper, update};
use serde::{Deserialize, Serialize};

pub type RefundTransactionCondition = BoxedCondition<refund_transactions::table>;

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum RefundStatus {
    #[serde(rename = "pending")]
    Pending,
    #[serde(rename = "confirmed")]
    Confirmed,
    #[serde(rename = "failed")]
    Failed,
}

impl std::fmt::Display for RefundStatus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            RefundStatus::Pending => write!(f, "pending"),
            RefundStatus::Confirmed => write!(f, "confirmed"),
            RefundStatus::Failed => write!(f, "failed"),
        }
    }
}

impl TryFrom<String> for RefundStatus {
    type Error = String;

    fn try_from(s: String) -> Result<Self, Self::Error> {
        match s.as_str() {
            "pending" => Ok(RefundStatus::Pending),
            "confirmed" => Ok(RefundStatus::Confirmed),
            "failed" => Ok(RefundStatus::Failed),
            _ => Err(format!("unknown refund status: '{s}'")),
        }
    }
}

impl From<RefundStatus> for String {
    fn from(status: RefundStatus) -> Self {
        status.to_string()
    }
}

pub trait RefundTransactionHelper {
    fn get_all(
        &self,
        condition: RefundTransactionCondition,
    ) -> QueryResponse<Vec<RefundTransaction>>;

    fn update_transaction_id(
        &self,
        swap_id: &str,
        transaction_id: &str,
        vin: Option<i32>,
    ) -> QueryResponse<usize>;
}

#[derive(Clone, Debug)]
pub struct RefundTransactionHelperDatabase {
    pool: Pool,
}

impl RefundTransactionHelperDatabase {
    pub fn new(pool: Pool) -> Self {
        Self { pool }
    }
}

impl RefundTransactionHelper for RefundTransactionHelperDatabase {
    fn get_all(
        &self,
        condition: RefundTransactionCondition,
    ) -> QueryResponse<Vec<RefundTransaction>> {
        Ok(refund_transactions::dsl::refund_transactions
            .select(RefundTransaction::as_select())
            .filter(condition)
            .load(&mut self.pool.get()?)?)
    }

    fn update_transaction_id(
        &self,
        swap_id: &str,
        transaction_id: &str,
        vin: Option<i32>,
    ) -> QueryResponse<usize> {
        Ok(update(refund_transactions::dsl::refund_transactions)
            .filter(refund_transactions::dsl::swapId.eq(swap_id))
            .set((
                refund_transactions::dsl::id.eq(transaction_id),
                refund_transactions::dsl::vin.eq(vin),
            ))
            .execute(&mut self.pool.get()?)?)
    }
}

#[cfg(test)]
pub mod test {
    use super::*;
    use mockall::mock;
    use rstest::rstest;

    mock! {
        pub RefundTransactionHelper {}

        impl Clone for RefundTransactionHelper {
            fn clone(&self) -> Self;
        }

        impl RefundTransactionHelper for RefundTransactionHelper {
            fn get_all(&self, condition: RefundTransactionCondition) -> QueryResponse<Vec<RefundTransaction>>;
            fn update_transaction_id(&self, swap_id: &str, transaction_id: &str, vin: Option<i32>) -> QueryResponse<usize>;
        }
    }

    #[rstest]
    fn refund_status_serialization() {
        assert_eq!(RefundStatus::Pending.to_string(), "pending");
        assert_eq!(RefundStatus::Confirmed.to_string(), "confirmed");
        assert_eq!(RefundStatus::Failed.to_string(), "failed");

        assert_eq!(
            RefundStatus::try_from("pending".to_string()).unwrap(),
            RefundStatus::Pending
        );
        assert_eq!(
            RefundStatus::try_from("confirmed".to_string()).unwrap(),
            RefundStatus::Confirmed
        );
        assert_eq!(
            RefundStatus::try_from("failed".to_string()).unwrap(),
            RefundStatus::Failed
        );

        assert_eq!(
            RefundStatus::try_from("unknown".to_string()).unwrap_err(),
            "unknown refund status: 'unknown'"
        );
    }
}

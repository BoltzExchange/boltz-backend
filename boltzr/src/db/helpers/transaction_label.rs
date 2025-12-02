use crate::db::Pool;
use crate::db::helpers::QueryResponse;
use crate::db::models::TransactionLabel;
use crate::db::schema::transaction_labels;
use diesel::result::Error as DieselError;
use diesel::{
    ExpressionMethods, QueryDsl, RunQueryDsl, SelectableHelper, dsl::update, insert_into,
};
use tracing::warn;

pub trait TransactionLabelHelper {
    fn add_label(&self, id: &str, symbol: &str, label: &str) -> QueryResponse<TransactionLabel>;
    fn get_label(&self, id: &str) -> QueryResponse<Option<TransactionLabel>>;
}

#[derive(Clone, Debug)]
pub struct TransactionLabelHelperDatabase {
    pool: Pool,
}

impl TransactionLabelHelperDatabase {
    pub fn new(pool: Pool) -> Self {
        Self { pool }
    }
}

impl TransactionLabelHelper for TransactionLabelHelperDatabase {
    fn add_label(&self, id: &str, symbol: &str, label: &str) -> QueryResponse<TransactionLabel> {
        let new_label = TransactionLabel {
            id: id.to_string(),
            symbol: symbol.to_string(),
            label: label.to_string(),
        };

        match insert_into(transaction_labels::dsl::transaction_labels)
            .values(&new_label)
            .get_result::<TransactionLabel>(&mut self.pool.get()?)
        {
            Ok(label) => Ok(label),
            Err(DieselError::DatabaseError(
                diesel::result::DatabaseErrorKind::UniqueViolation,
                _,
            )) => {
                // Unique constraint violation - update existing label
                let existing_label = self.get_label(id)?;
                if let Some(existing) = existing_label {
                    warn!(
                        "Updating existing label for {} from \"{}\" to \"{}\"",
                        id, existing.label, label
                    );
                    Ok(update(transaction_labels::dsl::transaction_labels)
                        .filter(transaction_labels::dsl::id.eq(id))
                        .set(transaction_labels::dsl::label.eq(label))
                        .get_result(&mut self.pool.get()?)?)
                } else {
                    // This shouldn't happen, but handle it gracefully
                    Err(anyhow::anyhow!(
                        "Unique constraint violation but label not found"
                    ))
                }
            }
            Err(e) => Err(anyhow::anyhow!("Failed to add label: {}", e)),
        }
    }

    fn get_label(&self, id: &str) -> QueryResponse<Option<TransactionLabel>> {
        let res = transaction_labels::dsl::transaction_labels
            .select(TransactionLabel::as_select())
            .filter(transaction_labels::dsl::id.eq(id))
            .limit(1)
            .load(&mut self.pool.get()?)?;

        if res.is_empty() {
            return Ok(None);
        }

        Ok(Some(res[0].clone()))
    }
}

// Label generation functions
impl TransactionLabelHelperDatabase {
    pub fn claim_batch_label(ids: &[String]) -> String {
        format!("Batch claim of Swaps {}", ids.join(", "))
    }
}

#[cfg(test)]
pub mod test {
    use super::*;
    use mockall::mock;

    mock! {
        pub TransactionLabelHelper {}

        impl TransactionLabelHelper for TransactionLabelHelper {
            fn add_label(
                &self,
                id: &str,
                symbol: &str,
                label: &str,
            ) -> QueryResponse<TransactionLabel>;
            fn get_label(&self, id: &str) -> QueryResponse<Option<TransactionLabel>>;
        }
    }
}

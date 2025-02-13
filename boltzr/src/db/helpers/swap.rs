use crate::db::Pool;
use crate::db::helpers::{BoxedCondition, BoxedNullableCondition, QueryResponse};
use crate::db::models::Swap;
use crate::db::schema::swaps;
use crate::swap::SwapUpdate;
use diesel::prelude::*;
use diesel::{QueryDsl, RunQueryDsl, SelectableHelper, update};

pub type SwapCondition = BoxedCondition<swaps::table>;
pub type SwapNullableCondition = BoxedNullableCondition<swaps::table>;

pub trait SwapHelper {
    fn get_all(&self, condition: SwapCondition) -> QueryResponse<Vec<Swap>>;
    fn get_all_nullable(&self, condition: SwapNullableCondition) -> QueryResponse<Vec<Swap>>;
    fn update_status(
        &self,
        id: &str,
        status: SwapUpdate,
        failure_reason: Option<String>,
    ) -> QueryResponse<usize>;
}

#[derive(Clone, Debug)]
pub struct SwapHelperDatabase {
    pool: Pool,
}

impl SwapHelperDatabase {
    pub fn new(pool: Pool) -> Self {
        Self { pool }
    }
}

impl SwapHelper for SwapHelperDatabase {
    fn get_all(&self, condition: SwapCondition) -> QueryResponse<Vec<Swap>> {
        Ok(swaps::dsl::swaps
            .select(Swap::as_select())
            .filter(condition)
            .load(&mut self.pool.get()?)?)
    }

    fn get_all_nullable(&self, condition: SwapNullableCondition) -> QueryResponse<Vec<Swap>> {
        Ok(swaps::dsl::swaps
            .select(Swap::as_select())
            .filter(condition)
            .load(&mut self.pool.get()?)?)
    }

    fn update_status(
        &self,
        id: &str,
        status: SwapUpdate,
        failure_reason: Option<String>,
    ) -> QueryResponse<usize> {
        if let Some(failure_reason) = failure_reason {
            Ok(update(swaps::dsl::swaps)
                .filter(swaps::dsl::id.eq(id))
                .set((
                    swaps::dsl::status.eq(status.to_string()),
                    swaps::dsl::failureReason.eq(failure_reason),
                ))
                .execute(&mut self.pool.get()?)?)
        } else {
            Ok(update(swaps::dsl::swaps)
                .filter(swaps::dsl::id.eq(id))
                .set(swaps::dsl::status.eq(status.to_string()))
                .execute(&mut self.pool.get()?)?)
        }
    }
}

#[cfg(test)]
pub mod test {
    use super::*;
    use mockall::mock;

    mock!(
        pub SwapHelper {}

        impl Clone for SwapHelper {
            fn clone(&self) -> Self;
        }

        impl SwapHelper for SwapHelper {
            fn get_all(&self, condition: SwapCondition) -> QueryResponse<Vec<Swap>>;
            fn get_all_nullable(&self, condition: SwapNullableCondition) -> QueryResponse<Vec<Swap>>;
            fn update_status(
                &self,
                id: &str,
                status: SwapUpdate,
                failure_reason: Option<String>,
            ) -> QueryResponse<usize>;
        }
    );
}

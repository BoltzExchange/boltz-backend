use crate::db::helpers::{BoxedCondition, QueryResponse};
use crate::db::models::Swap;
use crate::db::schema::swaps;
use crate::db::Pool;
use crate::swap::SwapUpdate;
use diesel::prelude::*;
use diesel::{update, QueryDsl, RunQueryDsl, SelectableHelper};

pub type SwapCondition = BoxedCondition<swaps::table>;

pub trait SwapHelper {
    fn get_all(&self, condition: SwapCondition) -> QueryResponse<Vec<Swap>>;
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
    fn get_all(&self, condition: BoxedCondition<swaps::dsl::swaps>) -> QueryResponse<Vec<Swap>> {
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

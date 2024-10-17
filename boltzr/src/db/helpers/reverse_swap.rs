use crate::db::helpers::{BoxedCondition, QueryResponse};
use crate::db::models::ReverseSwap;
use crate::db::schema::reverseSwaps;
use crate::db::Pool;
use diesel::{QueryDsl, RunQueryDsl, SelectableHelper};

pub type ReverseSwapCondition = BoxedCondition<reverseSwaps::table>;

pub trait ReverseSwapHelper {
    fn get_all(&self, condition: ReverseSwapCondition) -> QueryResponse<Vec<ReverseSwap>>;
}

#[derive(Clone, Debug)]
pub struct ReverseSwapHelperDatabase {
    pool: Pool,
}

impl ReverseSwapHelperDatabase {
    pub fn new(pool: Pool) -> Self {
        ReverseSwapHelperDatabase { pool }
    }
}

impl ReverseSwapHelper for ReverseSwapHelperDatabase {
    fn get_all(&self, condition: ReverseSwapCondition) -> QueryResponse<Vec<ReverseSwap>> {
        Ok(reverseSwaps::dsl::reverseSwaps
            .select(ReverseSwap::as_select())
            .filter(condition)
            .load(&mut self.pool.get()?)?)
    }
}

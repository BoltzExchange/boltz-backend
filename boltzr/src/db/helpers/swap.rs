use crate::db::helpers::{BoxedCondition, QueryResponse};
use crate::db::models::Swap;
use crate::db::schema::swaps;
use crate::db::Pool;
use diesel::{QueryDsl, RunQueryDsl, SelectableHelper};

pub type SwapCondition = BoxedCondition<swaps::table>;

pub trait SwapHelper {
    fn get_all(&self, condition: SwapCondition) -> QueryResponse<Vec<Swap>>;
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
}

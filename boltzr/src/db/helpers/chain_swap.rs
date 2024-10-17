use crate::db::helpers::{BoxedCondition, QueryResponse};
use crate::db::models::{ChainSwap, ChainSwapData, ChainSwapInfo};
use crate::db::schema::chainSwaps;
use crate::db::Pool;
use diesel::{BelongingToDsl, GroupedBy, QueryDsl, RunQueryDsl, SelectableHelper};

pub type ChainSwapCondition = BoxedCondition<chainSwaps::dsl::chainSwaps>;

pub trait ChainSwapHelper {
    fn get_all(&self, condition: ChainSwapCondition) -> QueryResponse<Vec<ChainSwapInfo>>;
}

#[derive(Clone, Debug)]
pub struct ChainSwapHelperDatabase {
    pool: Pool,
}

impl ChainSwapHelperDatabase {
    pub fn new(pool: Pool) -> Self {
        Self { pool }
    }
}

impl ChainSwapHelper for ChainSwapHelperDatabase {
    fn get_all(&self, condition: ChainSwapCondition) -> QueryResponse<Vec<ChainSwapInfo>> {
        let chain_swaps = chainSwaps::dsl::chainSwaps
            .select(ChainSwap::as_select())
            .filter(condition)
            .load(&mut self.pool.get()?)?;

        let data = ChainSwapData::belonging_to(&chain_swaps)
            .select(ChainSwapData::as_select())
            .load(&mut self.pool.get()?)?;

        let data_per_swap = data
            .grouped_by(&chain_swaps)
            .into_iter()
            .zip(chain_swaps)
            .map(|(data, swap)| (swap, data))
            .collect::<Vec<(ChainSwap, Vec<ChainSwapData>)>>();

        let mut infos = Vec::with_capacity(data_per_swap.len());
        for (swap, data) in data_per_swap.into_iter() {
            infos.push(ChainSwapInfo::new(swap, data)?);
        }

        Ok(infos)
    }
}

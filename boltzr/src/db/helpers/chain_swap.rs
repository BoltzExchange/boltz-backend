use crate::db::Pool;
use crate::db::helpers::{BoxedCondition, BoxedNullableCondition, QueryResponse};
use crate::db::models::{ChainSwap, ChainSwapData, ChainSwapInfo};
use crate::db::schema::{chainSwapData, chainSwaps};
use diesel::{
    BelongingToDsl, ExpressionMethods, GroupedBy, QueryDsl, RunQueryDsl, SelectableHelper,
};
use tracing::instrument;

pub type ChainSwapCondition = BoxedCondition<chainSwaps::dsl::chainSwaps>;

pub type ChainSwapDataNullableCondition = BoxedNullableCondition<chainSwapData::dsl::chainSwapData>;

pub trait ChainSwapHelper {
    fn get_by_id(&self, id: &str) -> QueryResponse<ChainSwapInfo>;
    fn get_all(&self, condition: ChainSwapCondition) -> QueryResponse<Vec<ChainSwapInfo>>;
    fn get_by_data_nullable(
        &self,
        condition: ChainSwapDataNullableCondition,
    ) -> QueryResponse<Vec<ChainSwapInfo>>;
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
    #[instrument(
        name = "db::ChainSwapHelperDatabase::get_by_id",
        skip_all,
        fields(chain_swap_id = %id)
    )]
    fn get_by_id(&self, id: &str) -> QueryResponse<ChainSwapInfo> {
        self.get_all(Box::new(chainSwaps::dsl::id.eq(id.to_string())))?
            .into_iter()
            .next()
            .ok_or(anyhow::anyhow!("swap not found"))
    }

    #[instrument(name = "db::ChainSwapHelperDatabase::get_all", skip_all)]
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

    #[instrument(name = "db::ChainSwapHelperDatabase::get_by_data_nullable", skip_all)]
    fn get_by_data_nullable(
        &self,
        condition: ChainSwapDataNullableCondition,
    ) -> QueryResponse<Vec<ChainSwapInfo>> {
        let data = chainSwapData::dsl::chainSwapData
            .select(ChainSwapData::as_select())
            .filter(condition)
            .load(&mut self.pool.get()?)?;

        self.get_all(Box::new(
            chainSwaps::dsl::id.eq_any(data.into_iter().map(|d| d.swapId).collect::<Vec<_>>()),
        ))
    }
}

#[cfg(test)]
pub mod test {
    use super::*;
    use mockall::mock;

    mock! {
        pub ChainSwapHelper {}

        impl Clone for ChainSwapHelper {
            fn clone(&self) -> Self;
        }

        impl ChainSwapHelper for ChainSwapHelper {
            fn get_by_id(&self, id: &str) -> QueryResponse<ChainSwapInfo>;
            fn get_all(
                &self,
                condition: ChainSwapCondition,
            ) -> QueryResponse<Vec<ChainSwapInfo>>;
            fn get_by_data_nullable(
                &self,
                condition: ChainSwapDataNullableCondition,
            ) -> QueryResponse<Vec<ChainSwapInfo>>;
        }
    }
}

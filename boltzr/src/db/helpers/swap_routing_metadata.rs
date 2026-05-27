use crate::db::Pool;
use crate::db::helpers::QueryResponse;
use crate::db::schema::swap_routing_metadata;
use diesel::{ExpressionMethods, QueryDsl, RunQueryDsl};
use tracing::instrument;

pub trait SwapRoutingMetadataHelper {
    fn get_all(&self, swap_ids: Vec<String>) -> QueryResponse<Vec<(String, Vec<u8>)>>;
}

#[derive(Clone, Debug)]
pub struct SwapRoutingMetadataHelperDatabase {
    pool: Pool,
}

impl SwapRoutingMetadataHelperDatabase {
    pub fn new(pool: Pool) -> Self {
        Self { pool }
    }
}

impl SwapRoutingMetadataHelper for SwapRoutingMetadataHelperDatabase {
    #[instrument(
        name = "db::SwapRoutingMetadataHelperDatabase::get_all",
        skip_all,
        fields(swap_count = %swap_ids.len())
    )]
    fn get_all(&self, swap_ids: Vec<String>) -> QueryResponse<Vec<(String, Vec<u8>)>> {
        if swap_ids.is_empty() {
            return Ok(vec![]);
        }

        Ok(swap_routing_metadata::dsl::swap_routing_metadata
            .select((
                swap_routing_metadata::dsl::swapId,
                swap_routing_metadata::dsl::data,
            ))
            .filter(swap_routing_metadata::dsl::swapId.eq_any(swap_ids))
            .load(&mut self.pool.get()?)?)
    }
}

#[cfg(test)]
pub mod test {
    use super::*;
    use mockall::mock;

    mock! {
        pub SwapRoutingMetadataHelper {}

        impl Clone for SwapRoutingMetadataHelper {
            fn clone(&self) -> Self;
        }

        impl SwapRoutingMetadataHelper for SwapRoutingMetadataHelper {
            fn get_all(&self, swap_ids: Vec<String>) -> QueryResponse<Vec<(String, Vec<u8>)>>;
        }
    }
}

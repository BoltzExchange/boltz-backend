use crate::db::Pool;
use crate::db::helpers::QueryResponse;
use crate::db::schema::swap_metadata;
use diesel::{ExpressionMethods, QueryDsl, RunQueryDsl};
use tracing::instrument;

pub trait SwapMetadataHelper {
    fn get_all(&self, swap_ids: Vec<String>) -> QueryResponse<Vec<(String, String)>>;
}

#[derive(Clone, Debug)]
pub struct SwapMetadataHelperDatabase {
    pool: Pool,
}

impl SwapMetadataHelperDatabase {
    pub fn new(pool: Pool) -> Self {
        Self { pool }
    }
}

impl SwapMetadataHelper for SwapMetadataHelperDatabase {
    #[instrument(
        name = "db::SwapMetadataHelperDatabase::get_all",
        skip_all,
        fields(swap_count = %swap_ids.len())
    )]
    fn get_all(&self, swap_ids: Vec<String>) -> QueryResponse<Vec<(String, String)>> {
        if swap_ids.is_empty() {
            return Ok(vec![]);
        }

        Ok(swap_metadata::dsl::swap_metadata
            .select((swap_metadata::dsl::swap_id, swap_metadata::dsl::data))
            .filter(swap_metadata::dsl::swap_id.eq_any(swap_ids))
            .load(&mut self.pool.get()?)?)
    }
}

#[cfg(test)]
pub mod test {
    use super::*;
    use mockall::mock;

    mock! {
        pub SwapMetadataHelper {}

        impl Clone for SwapMetadataHelper {
            fn clone(&self) -> Self;
        }

        impl SwapMetadataHelper for SwapMetadataHelper {
            fn get_all(&self, swap_ids: Vec<String>) -> QueryResponse<Vec<(String, String)>>;
        }
    }
}

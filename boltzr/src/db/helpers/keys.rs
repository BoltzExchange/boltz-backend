use crate::db::Pool;
use crate::db::helpers::QueryResponse;
use crate::db::models::Keys;
use crate::db::schema::keys;
use anyhow::anyhow;
use diesel::{ExpressionMethods, QueryDsl, RunQueryDsl, SelectableHelper, update};
use tracing::instrument;

pub trait KeysHelper {
    fn get_for_symbol(&self, symbol: &str) -> QueryResponse<Keys>;
    fn increment_highest_used_index(&self, symbol: &str) -> QueryResponse<i32>;
}

#[derive(Clone, Debug)]
pub struct KeysHelperDatabase {
    pool: Pool,
}

impl KeysHelperDatabase {
    pub fn new(pool: Pool) -> Self {
        Self { pool }
    }
}

impl KeysHelper for KeysHelperDatabase {
    #[instrument(
        name = "db::KeysHelperDatabase::get_for_symbol",
        skip_all,
        fields(symbol = %symbol)
    )]
    fn get_for_symbol(&self, symbol: &str) -> QueryResponse<Keys> {
        let keys = keys::dsl::keys
            .select(Keys::as_select())
            .filter(keys::symbol.eq(symbol))
            .load(&mut self.pool.get()?)?;
        if keys.is_empty() {
            return Err(anyhow!("no key derivation path for {}", symbol));
        }

        Ok(keys[0].to_owned())
    }

    fn increment_highest_used_index(&self, symbol: &str) -> QueryResponse<i32> {
        let results: Vec<i32> = update(keys::dsl::keys)
            .filter(keys::symbol.eq(symbol))
            .set(keys::highestUsedIndex.eq(keys::highestUsedIndex + 1))
            .returning(keys::highestUsedIndex)
            .get_results(&mut self.pool.get()?)
            .map_err(|e| anyhow!("failed to increment highest used index: {}", e))?;

        Ok(results.first().ok_or(anyhow!("no result"))?.to_owned())
    }
}

#[cfg(test)]
pub mod test {
    use super::*;
    use mockall::mock;

    mock! {
        pub KeysHelper {}

        impl KeysHelper for KeysHelper {
            fn get_for_symbol(&self, symbol: &str) -> QueryResponse<Keys>;
            fn increment_highest_used_index(&self, symbol: &str) -> QueryResponse<i32>;
        }
    }
}

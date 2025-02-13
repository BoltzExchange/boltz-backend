use crate::db::Pool;
use crate::db::helpers::QueryResponse;
use crate::db::models::Keys;
use crate::db::schema::keys;
use anyhow::anyhow;
use diesel::{ExpressionMethods, QueryDsl, RunQueryDsl, SelectableHelper};

pub trait KeysHelper {
    fn get_for_symbol(&self, symbol: &str) -> QueryResponse<Keys>;
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
}

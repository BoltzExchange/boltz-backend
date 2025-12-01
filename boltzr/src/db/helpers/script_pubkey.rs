use crate::db::Pool;
use crate::db::helpers::QueryResponse;
use crate::db::models::ScriptPubKey;
use crate::db::schema::script_pubkeys;
use diesel::prelude::*;

pub trait ScriptPubKeyHelper {
    fn get_by_scripts(
        &self,
        symbol: &str,
        script_pubkeys: &[Vec<u8>],
    ) -> QueryResponse<Vec<ScriptPubKey>>;
}

#[derive(Clone, Debug)]
pub struct ScriptPubKeyHelperDatabase {
    pool: Pool,
}

impl ScriptPubKeyHelperDatabase {
    pub fn new(pool: Pool) -> Self {
        Self { pool }
    }
}

impl ScriptPubKeyHelper for ScriptPubKeyHelperDatabase {
    fn get_by_scripts(
        &self,
        symbol: &str,
        script_pubkeys: &[Vec<u8>],
    ) -> QueryResponse<Vec<ScriptPubKey>> {
        Ok(script_pubkeys::dsl::script_pubkeys
            .select(ScriptPubKey::as_select())
            .filter(script_pubkeys::symbol.eq(symbol))
            .filter(script_pubkeys::script_pubkey.eq_any(script_pubkeys))
            .load(&mut self.pool.get()?)?)
    }
}

use crate::db::Pool;
use crate::db::helpers::QueryResponse;
use crate::db::models::ScriptPubKey;
use crate::db::schema::script_pubkeys;
use diesel::insert_into;
use diesel::prelude::*;
use tracing::instrument;

#[allow(dead_code)]
pub trait ScriptPubKeyHelper {
    fn get_by_scripts(&self, symbol: &str, scripts: &[Vec<u8>])
    -> QueryResponse<Vec<ScriptPubKey>>;

    fn add(&self, script_pubkey: &ScriptPubKey) -> QueryResponse<usize>;
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
    #[instrument(
        name = "db::ScriptPubKeyHelperDatabase::get_by_scripts",
        skip_all,
        fields(symbol = %symbol, script_count = %scripts.len())
    )]
    fn get_by_scripts(
        &self,
        symbol: &str,
        scripts: &[Vec<u8>],
    ) -> QueryResponse<Vec<ScriptPubKey>> {
        Ok(script_pubkeys::dsl::script_pubkeys
            .select(ScriptPubKey::as_select())
            .filter(script_pubkeys::symbol.eq(symbol))
            .filter(script_pubkeys::script_pubkey.eq_any(scripts))
            .load(&mut self.pool.get()?)?)
    }

    fn add(&self, script_pubkey: &ScriptPubKey) -> QueryResponse<usize> {
        Ok(insert_into(script_pubkeys::dsl::script_pubkeys)
            .values(script_pubkey)
            .execute(&mut self.pool.get()?)?)
    }
}

#[cfg(test)]
pub mod test {
    use super::*;
    use mockall::mock;
    use std::sync::OnceLock;

    pub fn create_script_pubkeys_table(pool: &Pool) {
        let mut conn = pool.get().unwrap();

        static INIT: OnceLock<()> = OnceLock::new();

        INIT.get_or_init(|| {
            diesel::sql_query(r#"DROP TABLE IF EXISTS script_pubkeys;"#)
                .execute(&mut conn)
                .unwrap();
            diesel::sql_query(
                r#"
                CREATE TABLE script_pubkeys (
                    symbol VARCHAR(255) NOT NULL,
                    script_pubkey BYTEA NOT NULL,
                    swap_id VARCHAR(255),
                    funding_address_id VARCHAR(255),
                    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                    PRIMARY KEY (symbol, script_pubkey)
                );"#,
            )
            .execute(&mut conn)
            .unwrap();
        });
    }

    mock! {
        pub ScriptPubKeyHelper {}

        impl ScriptPubKeyHelper for ScriptPubKeyHelper {
            fn get_by_scripts(
                &self,
                symbol: &str,
                script_pubkeys: &[Vec<u8>],
            ) -> QueryResponse<Vec<ScriptPubKey>>;
            fn add(&self, script_pubkey: &ScriptPubKey) -> QueryResponse<usize>;
        }
    }
}

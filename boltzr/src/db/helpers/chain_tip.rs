use crate::db::Pool;
use crate::db::helpers::QueryResponse;
use crate::db::models::ChainTip;
use crate::db::schema::chainTips;
use diesel::prelude::*;
use tracing::instrument;

pub trait ChainTipHelper {
    fn get_all(&self) -> QueryResponse<Vec<ChainTip>>;
    fn set_height(&self, symbol: &str, height: i32) -> QueryResponse<usize>;
}

#[derive(Clone, Debug)]
pub struct ChainTipHelperDatabase {
    pool: Pool,
}

impl ChainTipHelperDatabase {
    pub fn new(pool: Pool) -> Self {
        Self { pool }
    }
}

impl ChainTipHelper for ChainTipHelperDatabase {
    #[instrument(name = "db::ChainTipHelperDatabase::get_all", skip_all)]
    fn get_all(&self) -> QueryResponse<Vec<ChainTip>> {
        Ok(chainTips::dsl::chainTips
            .select(ChainTip::as_select())
            .load(&mut self.pool.get()?)?)
    }

    #[instrument(
        name = "db::ChainTipHelperDatabase::set_height",
        skip_all,
        fields(symbol = %symbol, height)
    )]
    fn set_height(&self, symbol: &str, height: i32) -> QueryResponse<usize> {
        Ok(diesel::insert_into(chainTips::dsl::chainTips)
            .values(ChainTip {
                symbol: symbol.to_string(),
                height,
            })
            .on_conflict(chainTips::symbol)
            .do_update()
            .set(chainTips::height.eq(height))
            .execute(&mut self.pool.get()?)?)
    }
}

#[cfg(test)]
pub mod test {
    use super::*;
    use crate::db::helpers::web_hook::test::get_pool;
    use rand::distributions::{Alphanumeric, DistString};
    use std::sync::OnceLock;

    fn create() -> Pool {
        let pool = get_pool();
        let mut conn = pool.get().unwrap();

        static INIT: OnceLock<()> = OnceLock::new();

        INIT.get_or_init(|| {
            diesel::sql_query(r#"DROP TABLE IF EXISTS "chainTips";"#)
                .execute(&mut conn)
                .unwrap();
            diesel::sql_query(
                r#"
CREATE TABLE "chainTips" (
    symbol VARCHAR(255) NOT NULL PRIMARY KEY,
    height INTEGER NOT NULL
);"#,
            )
            .execute(&mut conn)
            .unwrap();
        });

        pool.clone()
    }

    fn random_symbol() -> String {
        Alphanumeric.sample_string(&mut rand::thread_rng(), 8)
    }

    #[test]
    fn test_set_height_new_symbol() {
        let helper = ChainTipHelperDatabase::new(create());
        let symbol = random_symbol();

        let result = helper.set_height(&symbol, 100);
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), 1);

        let all = helper.get_all().unwrap();
        let chain_tip = all.iter().find(|ct| ct.symbol == symbol);
        assert!(chain_tip.is_some());
        let chain_tip = chain_tip.unwrap();
        assert_eq!(chain_tip.height, 100);
    }

    #[test]
    fn test_set_height_update_higher() {
        let helper = ChainTipHelperDatabase::new(create());
        let symbol = random_symbol();

        helper.set_height(&symbol, 100).unwrap();

        let result = helper.set_height(&symbol, 200);
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), 1);

        let all = helper.get_all().unwrap();
        let chain_tip = all.iter().find(|ct| ct.symbol == symbol).unwrap();
        assert_eq!(chain_tip.height, 200);
    }

    #[test]
    fn test_get_all() {
        let helper = ChainTipHelperDatabase::new(create());
        let symbol1 = random_symbol();
        let symbol2 = random_symbol();

        helper.set_height(&symbol1, 100).unwrap();
        helper.set_height(&symbol2, 200).unwrap();

        let all = helper.get_all().unwrap();

        let has_symbol1 = all
            .iter()
            .any(|ct| ct.symbol == symbol1 && ct.height == 100);
        let has_symbol2 = all
            .iter()
            .any(|ct| ct.symbol == symbol2 && ct.height == 200);

        assert!(has_symbol1);
        assert!(has_symbol2);
    }
}

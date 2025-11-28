use crate::db::Pool;
use crate::db::helpers::QueryResponse;
use crate::db::models::ChainTip;
use crate::db::schema::chainTips;
use diesel::prelude::*;
use diesel::update;

pub trait ChainTipHelper {
    fn get_all(&self) -> QueryResponse<Vec<ChainTip>>;
    fn get_by_symbol(&self, symbol: &str) -> QueryResponse<Option<ChainTip>>;
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
    fn get_all(&self) -> QueryResponse<Vec<ChainTip>> {
        Ok(chainTips::dsl::chainTips
            .select(ChainTip::as_select())
            .load(&mut self.pool.get()?)?)
    }

    fn get_by_symbol(&self, symbol: &str) -> QueryResponse<Option<ChainTip>> {
        Ok(chainTips::dsl::chainTips
            .select(ChainTip::as_select())
            .filter(chainTips::symbol.eq(symbol))
            .first(&mut self.pool.get()?)
            .optional()?)
    }

    fn set_height(&self, symbol: &str, height: i32) -> QueryResponse<usize> {
        match self.get_by_symbol(symbol)? {
            Some(chain_tip) => {
                if height < chain_tip.height {
                    tracing::warn!(
                        "Tried to set height of {} to {} which is less than the current height of {}",
                        symbol,
                        height,
                        chain_tip.height
                    );
                    return Ok(0);
                }

                Ok(update(chainTips::dsl::chainTips)
                    .filter(chainTips::symbol.eq(symbol))
                    .set(chainTips::height.eq(height))
                    .execute(&mut self.pool.get()?)?)
            }
            None => Ok(diesel::insert_into(chainTips::dsl::chainTips)
                .values(ChainTip {
                    symbol: symbol.to_string(),
                    height,
                })
                .execute(&mut self.pool.get()?)?),
        }
    }
}

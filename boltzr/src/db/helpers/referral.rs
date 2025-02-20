use crate::db::Pool;
use crate::db::helpers::{BoxedCondition, QueryResponse};
use crate::db::models::Referral;
use crate::db::schema::referrals;
use diesel::{QueryDsl, RunQueryDsl, SelectableHelper};

pub type ReferralCondition = BoxedCondition<referrals::table>;

pub trait ReferralHelper {
    fn get_all(&self, condition: ReferralCondition) -> QueryResponse<Vec<Referral>>;
}

#[derive(Clone, Debug)]
pub struct ReferralHelperDatabase {
    pool: Pool,
}

impl ReferralHelperDatabase {
    pub fn new(pool: Pool) -> Self {
        Self { pool }
    }
}

impl ReferralHelper for ReferralHelperDatabase {
    fn get_all(&self, condition: ReferralCondition) -> QueryResponse<Vec<Referral>> {
        Ok(referrals::dsl::referrals
            .select(Referral::as_select())
            .filter(condition)
            .load(&mut self.pool.get()?)?)
    }
}

use crate::db::Pool;
use crate::db::helpers::QueryResponse;
use crate::db::models::Offer;
use crate::db::schema::offers;
use diesel::{ExpressionMethods, QueryDsl, RunQueryDsl, SelectableHelper, insert_into};
use tracing::instrument;

pub trait OfferHelper {
    fn insert(&self, offer: &Offer) -> QueryResponse<usize>;
    fn get_by_signer(&self, signer: &[u8]) -> QueryResponse<Option<Offer>>;
}

#[derive(Clone, Debug)]
pub struct OfferHelperDatabase {
    pool: Pool,
}

impl OfferHelperDatabase {
    pub fn new(pool: Pool) -> Self {
        Self { pool }
    }
}

impl OfferHelper for OfferHelperDatabase {
    fn insert(&self, offer: &Offer) -> QueryResponse<usize> {
        Ok(insert_into(offers::dsl::offers)
            .values(offer)
            .execute(&mut self.pool.get()?)?)
    }

    #[instrument(skip_all)]
    fn get_by_signer(&self, signer: &[u8]) -> QueryResponse<Option<Offer>> {
        let res = offers::dsl::offers
            .select(Offer::as_select())
            .filter(offers::dsl::signer.eq(signer))
            .limit(1)
            .load(&mut self.pool.get()?)?;

        if res.is_empty() {
            return Ok(None);
        }

        Ok(Some(res[0].clone()))
    }
}

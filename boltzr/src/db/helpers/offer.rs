use crate::db::Pool;
use crate::db::helpers::QueryResponse;
use crate::db::models::Offer;
use crate::db::schema::offers;
use diesel::{
    ExpressionMethods, QueryDsl, RunQueryDsl, SelectableHelper, delete, insert_into, update,
};
use tracing::instrument;

pub trait OfferHelper {
    fn insert(&self, offer: &Offer) -> QueryResponse<usize>;
    fn update(&self, signer: &[u8], url: &Option<String>) -> QueryResponse<usize>;
    fn delete(&self, signer: &[u8]) -> QueryResponse<usize>;
    fn get_by_signer(&self, signer: &[u8]) -> QueryResponse<Option<Offer>>;
    fn get_offer(&self, offer: &str) -> QueryResponse<Option<Offer>>;
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
    #[instrument(name = "db::OfferHelperDatabase::insert", skip_all)]
    fn insert(&self, offer: &Offer) -> QueryResponse<usize> {
        Ok(insert_into(offers::dsl::offers)
            .values(offer)
            .execute(&mut self.pool.get()?)?)
    }

    #[instrument(name = "db::OfferHelperDatabase::update", skip_all)]
    fn update(&self, signer: &[u8], url: &Option<String>) -> QueryResponse<usize> {
        Ok(update(offers::dsl::offers)
            .filter(offers::dsl::signer.eq(signer))
            .set(offers::dsl::url.eq(url))
            .execute(&mut self.pool.get()?)?)
    }

    #[instrument(name = "db::OfferHelperDatabase::delete", skip_all)]
    fn delete(&self, signer: &[u8]) -> QueryResponse<usize> {
        Ok(delete(offers::dsl::offers)
            .filter(offers::dsl::signer.eq(signer))
            .execute(&mut self.pool.get()?)?)
    }

    #[instrument(name = "db::OfferHelperDatabase::get_by_signer", skip_all)]
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

    #[instrument(name = "db::OfferHelperDatabase::get_offer", skip_all)]
    fn get_offer(&self, offer: &str) -> QueryResponse<Option<Offer>> {
        let res = offers::dsl::offers
            .select(Offer::as_select())
            .filter(offers::dsl::offer.eq(offer.to_lowercase()))
            .limit(1)
            .load(&mut self.pool.get()?)?;

        if res.is_empty() {
            return Ok(None);
        }

        Ok(Some(res[0].clone()))
    }
}

#[cfg(test)]
pub mod test {
    use super::*;
    use mockall::mock;

    mock! {
        pub OfferHelper {}

        impl OfferHelper for OfferHelper {
            fn insert(&self, offer: &Offer) -> QueryResponse<usize>;
            fn update(&self, signer: &[u8], url: &Option<String>) -> QueryResponse<usize>;
            fn delete(&self, signer: &[u8]) -> QueryResponse<usize>;
            fn get_by_signer(&self, signer: &[u8]) -> QueryResponse<Option<Offer>>;
            fn get_offer(&self, offer: &str) -> QueryResponse<Option<Offer>>;
        }
    }
}

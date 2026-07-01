use crate::db::Pool;
use crate::db::helpers::QueryResponse;
use crate::db::models::{
    NewPayjoinReceiverSeenInput, NewPayjoinReceiverSession, NewPayjoinReceiverSessionEvent,
    PayjoinReceiverSession, PayjoinReceiverSessionEvent,
};
use crate::db::schema::{
    payjoinReceiverSeenInputs, payjoinReceiverSessionEvents, payjoinReceiverSessions,
};
use chrono::Utc;
use diesel::{
    ExpressionMethods, OptionalExtension, QueryDsl, RunQueryDsl, SelectableHelper, insert_into,
    update,
};
use tracing::instrument;

pub trait PayjoinReceiverSessionHelper {
    fn create_receiver_session(
        &self,
        session: &NewPayjoinReceiverSession,
    ) -> QueryResponse<PayjoinReceiverSession>;
    fn get_by_swap_id(&self, swap_id: &str) -> QueryResponse<Option<PayjoinReceiverSession>>;
    fn get_active_by_swap_id(&self, swap_id: &str)
    -> QueryResponse<Option<PayjoinReceiverSession>>;
    fn insert_receiver_session_event(
        &self,
        event: &NewPayjoinReceiverSessionEvent,
    ) -> QueryResponse<usize>;
    fn get_receiver_session_events(
        &self,
        session_id: i64,
    ) -> QueryResponse<Vec<PayjoinReceiverSessionEvent>>;
    fn close_receiver_session(&self, session_id: i64) -> QueryResponse<usize>;
    fn mark_completed(&self, session_id: i64) -> QueryResponse<usize>;
    fn insert_seen_input(&self, outpoint: &str) -> QueryResponse<bool>;
}

#[derive(Clone, Debug)]
pub struct PayjoinReceiverSessionHelperDatabase {
    pool: Pool,
}

impl PayjoinReceiverSessionHelperDatabase {
    pub fn new(pool: Pool) -> Self {
        Self { pool }
    }
}

impl PayjoinReceiverSessionHelper for PayjoinReceiverSessionHelperDatabase {
    #[instrument(
        name = "db::PayjoinReceiverSessionHelperDatabase::create_receiver_session",
        skip_all
    )]
    fn create_receiver_session(
        &self,
        session: &NewPayjoinReceiverSession,
    ) -> QueryResponse<PayjoinReceiverSession> {
        Ok(
            insert_into(payjoinReceiverSessions::dsl::payjoinReceiverSessions)
                .values(session)
                .returning(PayjoinReceiverSession::as_returning())
                .get_result(&mut self.pool.get()?)?,
        )
    }

    #[instrument(
        name = "db::PayjoinReceiverSessionHelperDatabase::get_by_swap_id",
        skip_all,
        fields(swap_id = %swap_id)
    )]
    fn get_by_swap_id(&self, swap_id: &str) -> QueryResponse<Option<PayjoinReceiverSession>> {
        Ok(payjoinReceiverSessions::dsl::payjoinReceiverSessions
            .select(PayjoinReceiverSession::as_select())
            .filter(payjoinReceiverSessions::swapId.eq(swap_id))
            .first(&mut self.pool.get()?)
            .optional()?)
    }

    #[instrument(
        name = "db::PayjoinReceiverSessionHelperDatabase::get_active_by_swap_id",
        skip_all,
        fields(swap_id = %swap_id)
    )]
    fn get_active_by_swap_id(
        &self,
        swap_id: &str,
    ) -> QueryResponse<Option<PayjoinReceiverSession>> {
        Ok(payjoinReceiverSessions::dsl::payjoinReceiverSessions
            .select(PayjoinReceiverSession::as_select())
            .filter(payjoinReceiverSessions::swapId.eq(swap_id))
            .filter(payjoinReceiverSessions::completedAt.is_null())
            .first(&mut self.pool.get()?)
            .optional()?)
    }

    #[instrument(
        name = "db::PayjoinReceiverSessionHelperDatabase::insert_receiver_session_event",
        skip_all,
        fields(session_id = %event.sessionId)
    )]
    fn insert_receiver_session_event(
        &self,
        event: &NewPayjoinReceiverSessionEvent,
    ) -> QueryResponse<usize> {
        Ok(
            insert_into(payjoinReceiverSessionEvents::dsl::payjoinReceiverSessionEvents)
                .values(event)
                .execute(&mut self.pool.get()?)?,
        )
    }

    #[instrument(
        name = "db::PayjoinReceiverSessionHelperDatabase::get_receiver_session_events",
        skip_all,
        fields(session_id = %session_id)
    )]
    fn get_receiver_session_events(
        &self,
        session_id: i64,
    ) -> QueryResponse<Vec<PayjoinReceiverSessionEvent>> {
        Ok(
            payjoinReceiverSessionEvents::dsl::payjoinReceiverSessionEvents
                .select(PayjoinReceiverSessionEvent::as_select())
                .filter(payjoinReceiverSessionEvents::sessionId.eq(session_id))
                .order(payjoinReceiverSessionEvents::id.asc())
                .load(&mut self.pool.get()?)?,
        )
    }

    #[instrument(
        name = "db::PayjoinReceiverSessionHelperDatabase::close_receiver_session",
        skip_all,
        fields(session_id = %session_id)
    )]
    fn close_receiver_session(&self, session_id: i64) -> QueryResponse<usize> {
        self.mark_completed(session_id)
    }

    #[instrument(
        name = "db::PayjoinReceiverSessionHelperDatabase::mark_completed",
        skip_all,
        fields(session_id = %session_id)
    )]
    fn mark_completed(&self, session_id: i64) -> QueryResponse<usize> {
        Ok(update(
            payjoinReceiverSessions::dsl::payjoinReceiverSessions
                .filter(payjoinReceiverSessions::id.eq(session_id)),
        )
        .set(payjoinReceiverSessions::completedAt.eq(Utc::now()))
        .execute(&mut self.pool.get()?)?)
    }

    #[instrument(
        name = "db::PayjoinReceiverSessionHelperDatabase::insert_seen_input",
        skip_all,
        fields(outpoint = %outpoint)
    )]
    fn insert_seen_input(&self, outpoint: &str) -> QueryResponse<bool> {
        let inserted = insert_into(payjoinReceiverSeenInputs::dsl::payjoinReceiverSeenInputs)
            .values(&NewPayjoinReceiverSeenInput {
                outpoint: outpoint.to_string(),
            })
            .on_conflict(payjoinReceiverSeenInputs::outpoint)
            .do_nothing()
            .execute(&mut self.pool.get()?)?;

        Ok(inserted == 0)
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use crate::db::helpers::web_hook::test::get_pool;
    use rand::distributions::{Alphanumeric, DistString};

    fn random_id() -> String {
        Alphanumeric.sample_string(&mut rand::thread_rng(), 12)
    }

    #[test]
    fn test_create_receiver_session_with_swap_id() {
        let helper = PayjoinReceiverSessionHelperDatabase::new(get_pool());
        let swap_id = random_id();

        let session = helper
            .create_receiver_session(&NewPayjoinReceiverSession {
                swapId: Some(swap_id.clone()),
                address: "bcrt1qksk3802sudjavl8y4mdsyfzknzcdcmv7a2xvf2".to_string(),
                amountSats: Some(50_201),
                label: Some("pj-test".to_string()),
            })
            .unwrap();

        assert_eq!(session.swapId, Some(swap_id.clone()));
        assert_eq!(session.completedAt, None);

        let by_swap_id = helper.get_by_swap_id(&swap_id).unwrap().unwrap();
        assert_eq!(by_swap_id.id, session.id);
        assert_eq!(by_swap_id.swapId, Some(swap_id));

        helper.mark_completed(session.id).unwrap();

        let completed = helper
            .get_by_swap_id(by_swap_id.swapId.as_ref().unwrap())
            .unwrap()
            .unwrap();
        assert!(completed.completedAt.is_some());
    }

    #[test]
    fn test_insert_seen_input_reports_duplicates() {
        let helper = PayjoinReceiverSessionHelperDatabase::new(get_pool());
        let outpoint = format!("{}:{}", random_id(), 0);

        assert!(!helper.insert_seen_input(&outpoint).unwrap());
        assert!(helper.insert_seen_input(&outpoint).unwrap());
    }
}

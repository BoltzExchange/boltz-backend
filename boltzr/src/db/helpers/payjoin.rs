use crate::db::Pool;
use crate::db::helpers::QueryResponse;
use crate::db::models::{
    NewPayjoinReceiverSession, NewPayjoinReceiverSessionEvent, PayjoinReceiverSession,
    PayjoinReceiverSessionEvent,
};
use crate::db::schema::{payjoinReceiverSessionEvents, payjoinReceiverSessions};
use chrono::Utc;
use diesel::{ExpressionMethods, QueryDsl, RunQueryDsl, SelectableHelper, insert_into, update};
use tracing::instrument;

pub trait PayjoinReceiverSessionHelper {
    fn create_receiver_session(
        &self,
        session: &NewPayjoinReceiverSession,
    ) -> QueryResponse<PayjoinReceiverSession>;
    fn insert_receiver_session_event(
        &self,
        event: &NewPayjoinReceiverSessionEvent,
    ) -> QueryResponse<usize>;
    fn get_receiver_session_events(
        &self,
        session_id: i64,
    ) -> QueryResponse<Vec<PayjoinReceiverSessionEvent>>;
    fn close_receiver_session(&self, session_id: i64) -> QueryResponse<usize>;
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
        Ok(update(
            payjoinReceiverSessions::dsl::payjoinReceiverSessions
                .filter(payjoinReceiverSessions::id.eq(session_id)),
        )
        .set(payjoinReceiverSessions::completedAt.eq(Utc::now()))
        .execute(&mut self.pool.get()?)?)
    }
}

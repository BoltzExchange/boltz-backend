use crate::db::Pool;
use crate::db::helpers::QueryResponse;
use crate::db::models::PayjoinSession;
use crate::db::schema::payjoinSessions;
use anyhow::anyhow;
use diesel::{ExpressionMethods, QueryDsl, RunQueryDsl, SelectableHelper, insert_into};
use payjoin::receive::v2::Receiver;

pub trait PayjoinSessionHelper {
    fn insert(&self, payjoin_session: &PayjoinSession) -> QueryResponse<usize>;
    fn get_by_id(&self, id: &str) -> QueryResponse<PayjoinSession>;
    fn get_by_swap_id(&self, swap_id: &str) -> QueryResponse<PayjoinSession>;
}

#[derive(Clone, Debug)]
pub struct PayjoinSessionHelperDatabase {
    pool: Pool,
}

impl PayjoinSessionHelperDatabase {
    pub fn new(pool: Pool) -> Self {
        Self { pool }
    }
}

impl PayjoinSessionHelper for PayjoinSessionHelperDatabase {
    fn insert(&self, payjoin_session: &PayjoinSession) -> QueryResponse<usize> {
        Ok(insert_into(payjoinSessions::dsl::payjoinSessions)
            .values(payjoin_session)
            .execute(&mut self.pool.get()?)?)
    }

    fn get_by_id(&self, id: &str) -> QueryResponse<PayjoinSession> {
        let sessions = payjoinSessions::dsl::payjoinSessions
            .select(PayjoinSession::as_select())
            .filter(payjoinSessions::id.eq(id))
            .load(&mut self.pool.get()?)?;
        if sessions.is_empty() {
            return Err(anyhow!("no payjoin sessions with id {}", id));
        }

        Ok(sessions[0].to_owned())
    }

    fn get_by_swap_id(&self, swap_id: &str) -> QueryResponse<PayjoinSession> {
        let sessions = payjoinSessions::dsl::payjoinSessions
            .select(PayjoinSession::as_select())
            .filter(payjoinSessions::swapId.eq(swap_id))
            .load(&mut self.pool.get()?)?;
        if sessions.is_empty() {
            return Err(anyhow!("no payjoin sessions for swap {}", swap_id));
        }

        Ok(sessions[0].to_owned())
    }
}

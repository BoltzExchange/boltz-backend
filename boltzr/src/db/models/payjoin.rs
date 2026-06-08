use chrono::{DateTime, Utc};
use diesel::{AsChangeset, Associations, Insertable, Queryable, Selectable};

#[derive(Queryable, Selectable, AsChangeset, PartialEq, Clone, Debug)]
#[diesel(table_name = crate::db::schema::payjoinReceiverSessions)]
#[allow(non_snake_case)]
pub struct PayjoinReceiverSession {
    pub id: i64,
    pub swapId: Option<String>,
    pub address: String,
    pub amountSats: Option<i64>,
    pub label: Option<String>,
    pub payjoinTxId: Option<String>,
    pub createdAt: DateTime<Utc>,
    pub completedAt: Option<DateTime<Utc>>,
}

#[derive(Insertable, PartialEq, Clone, Debug)]
#[diesel(table_name = crate::db::schema::payjoinReceiverSessions)]
#[allow(non_snake_case)]
pub struct NewPayjoinReceiverSession {
    pub swapId: Option<String>,
    pub address: String,
    pub amountSats: Option<i64>,
    pub label: Option<String>,
}

#[derive(Queryable, Selectable, Associations, PartialEq, Clone, Debug)]
#[diesel(belongs_to(PayjoinReceiverSession, foreign_key = sessionId))]
#[diesel(table_name = crate::db::schema::payjoinReceiverSessionEvents)]
#[allow(non_snake_case)]
pub struct PayjoinReceiverSessionEvent {
    pub id: i64,
    pub sessionId: i64,
    pub eventData: String,
    pub createdAt: DateTime<Utc>,
}

#[derive(Insertable, PartialEq, Clone, Debug)]
#[diesel(table_name = crate::db::schema::payjoinReceiverSessionEvents)]
#[allow(non_snake_case)]
pub struct NewPayjoinReceiverSessionEvent {
    pub sessionId: i64,
    pub eventData: String,
}

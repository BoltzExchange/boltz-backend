use crate::db::models::Swap;
use diesel::{AsChangeset, Associations, Insertable, Queryable, Selectable};

#[derive(
    Queryable, Selectable, Insertable, AsChangeset, Associations, PartialEq, Default, Clone, Debug,
)]
#[diesel(belongs_to(Swap, foreign_key = swapId))]
#[diesel(table_name = crate::db::schema::payjoinSessions)]
#[allow(non_snake_case)]
pub struct PayjoinSession {
    pub id: String,
    pub swapId: String,
    pub json: String,
}

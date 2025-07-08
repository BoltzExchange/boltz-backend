use diesel::{AsChangeset, Insertable, Queryable, Selectable};

#[derive(Queryable, Selectable, Insertable, AsChangeset, PartialEq, Default, Clone, Debug)]
#[diesel(table_name = crate::db::schema::refund_transactions)]
#[allow(non_snake_case)]
pub struct RefundTransaction {
    pub swapId: String,
    pub symbol: String,
    pub id: String,
    pub vin: Option<i32>,
    pub status: String,
}

use diesel::{AsChangeset, Identifiable, Insertable, Queryable, Selectable};

#[derive(Queryable, Selectable, Insertable, Identifiable, AsChangeset, PartialEq, Clone, Debug)]
#[diesel(table_name = crate::db::schema::transaction_labels)]
pub struct TransactionLabel {
    pub id: String,
    pub symbol: String,
    pub label: String,
}

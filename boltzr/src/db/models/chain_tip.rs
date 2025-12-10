use diesel::{AsChangeset, Insertable, Queryable, Selectable};

#[derive(Queryable, Selectable, Insertable, AsChangeset, PartialEq, Clone, Default, Debug)]
#[diesel(table_name = crate::db::schema::chainTips)]
pub struct ChainTip {
    pub symbol: String,
    pub height: i32,
}

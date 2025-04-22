use diesel::{AsChangeset, Insertable, Queryable, Selectable};

#[derive(Queryable, Selectable, Insertable, AsChangeset, PartialEq, Clone, Default, Debug)]
#[diesel(table_name = crate::db::schema::offers)]
pub struct Offer {
    pub signer: Vec<u8>,
    pub offer: String,
    pub url: Option<String>,
}

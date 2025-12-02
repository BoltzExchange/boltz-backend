use diesel::{AsChangeset, Insertable, Queryable, Selectable};

#[derive(Queryable, Selectable, Insertable, AsChangeset, PartialEq, Default, Clone, Debug)]
#[diesel(table_name = crate::db::schema::script_pubkeys)]
pub struct ScriptPubKey {
    pub symbol: String,
    pub script_pubkey: Vec<u8>,
    pub swap_id: Option<String>,
    pub funding_address_id: Option<String>,
}

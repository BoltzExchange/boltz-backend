use diesel::{AsChangeset, Insertable, Queryable, Selectable};

#[derive(Queryable, Selectable, Insertable, AsChangeset, PartialEq, Default, Clone, Debug)]
#[diesel(table_name = crate::db::schema::keys)]
#[allow(non_snake_case)]
pub struct Keys {
    pub derivationPath: String,
}

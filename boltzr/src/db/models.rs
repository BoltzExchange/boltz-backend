use diesel::*;
use strum_macros::{AsRefStr, EnumString};

#[derive(EnumString, AsRefStr, Debug, PartialEq, Clone, Copy)]
pub enum WebHookState {
    #[strum(serialize = "none")]
    None = 0,
    #[strum(serialize = "ok")]
    Ok = 1,
    #[strum(serialize = "failed")]
    Failed = 3,
    #[strum(serialize = "abandoned")]
    Abandoned = 4,
}

impl From<WebHookState> for String {
    fn from(value: WebHookState) -> Self {
        String::from(value.as_ref())
    }
}

#[derive(Queryable, Selectable, Insertable, AsChangeset, Clone, Debug)]
#[diesel(table_name = crate::db::schema::web_hooks)]
pub struct WebHook {
    pub id: String,
    pub state: String,
    pub url: String,
    pub hash_swap_id: bool,
}

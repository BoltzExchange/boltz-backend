use diesel::{AsChangeset, Insertable, Queryable, Selectable};
use strum_macros::{AsRefStr, EnumString};

use crate::webhook::caller::Hook;

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

#[derive(Queryable, Selectable, Insertable, AsChangeset, PartialEq, Clone, Default, Debug)]
#[diesel(table_name = crate::db::schema::web_hooks)]
pub struct WebHook {
    pub id: String,
    pub state: String,
    pub url: String,
    pub hash_swap_id: bool,
    pub status: Option<Vec<String>>,
}

impl Hook for WebHook {
    type Id = String;

    fn id(&self) -> Self::Id {
        self.id.clone()
    }

    fn url(&self) -> String {
        self.url.clone()
    }
}

#[cfg(test)]
mod test {
    use crate::db::models::web_hook::WebHookState;

    #[test]
    fn test_web_hook_state_serialize() {
        assert_eq!(WebHookState::None.as_ref(), "none");
        assert_eq!(WebHookState::Ok.as_ref(), "ok");
        assert_eq!(WebHookState::Failed.as_ref(), "failed");
        assert_eq!(WebHookState::Abandoned.as_ref(), "abandoned");
    }
}

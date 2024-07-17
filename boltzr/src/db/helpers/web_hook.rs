use std::error::Error;

use diesel::prelude::*;
use diesel::r2d2::ConnectionManager;
use diesel::{insert_into, update};
use r2d2::Pool;
use tracing::trace;

use crate::db::models::{WebHook, WebHookState};
use crate::db::schema::{chainSwaps, reverseSwaps, swaps, web_hooks};

pub type QueryResponse<T> = Result<T, Box<dyn Error>>;

pub trait WebHookHelper: dyn_clone::DynClone {
    fn insert_web_hook(&self, hook: &WebHook) -> QueryResponse<usize>;
    fn set_state(&self, id: &str, state: WebHookState) -> QueryResponse<usize>;
    fn get_by_id(&self, id: &str) -> QueryResponse<Option<WebHook>>;
    fn get_by_state(&self, state: WebHookState) -> QueryResponse<Vec<WebHook>>;
    fn get_swap_status(&self, id: &str) -> QueryResponse<Option<String>>;
}

dyn_clone::clone_trait_object!(WebHookHelper);

#[derive(Clone, Debug)]
pub struct WebHookHelperDatabase {
    pool: Pool<ConnectionManager<PgConnection>>,
}

impl WebHookHelperDatabase {
    pub fn new(pool: Pool<ConnectionManager<PgConnection>>) -> Self {
        WebHookHelperDatabase { pool }
    }
}

impl WebHookHelper for WebHookHelperDatabase {
    fn insert_web_hook(&self, hook: &WebHook) -> QueryResponse<usize> {
        trace!("Inserting WebHook: {:#?}", hook);
        Ok(insert_into(web_hooks::dsl::web_hooks)
            .values(hook)
            .execute(&mut self.pool.get()?)?)
    }

    fn set_state(&self, id: &str, state: WebHookState) -> QueryResponse<usize> {
        trace!(
            "Setting WebHook state of swap {} to: {}",
            id,
            state.as_ref()
        );
        Ok(update(web_hooks::dsl::web_hooks)
            .filter(web_hooks::dsl::id.eq(id))
            .set(web_hooks::dsl::state.eq(state.as_ref()))
            .execute(&mut self.pool.get()?)?)
    }

    fn get_by_id(&self, id: &str) -> QueryResponse<Option<WebHook>> {
        trace!("Fetching WebHooks by id: {}", id);
        let res = web_hooks::dsl::web_hooks
            .select(WebHook::as_select())
            .filter(web_hooks::dsl::id.eq(id))
            .limit(1)
            .load(&mut self.pool.get()?)?;

        if res.is_empty() {
            return Ok(None);
        }

        Ok(Some(res[0].clone()))
    }

    fn get_by_state(&self, state: WebHookState) -> QueryResponse<Vec<WebHook>> {
        trace!("Fetching WebHooks for state: {}", state.as_ref());
        Ok(web_hooks::dsl::web_hooks
            .select(WebHook::as_select())
            .filter(web_hooks::dsl::state.eq(state.as_ref()))
            .load(&mut self.pool.get()?)?)
    }

    fn get_swap_status(&self, id: &str) -> QueryResponse<Option<String>> {
        trace!("Fetching swap status by id: {}", id);
        let mut con = self.pool.get()?;
        let results = [
            swaps::dsl::swaps
                .select(swaps::dsl::status)
                .filter(swaps::dsl::id.eq(id))
                .limit(1)
                .load::<String>(&mut con)?,
            reverseSwaps::dsl::reverseSwaps
                .select(reverseSwaps::dsl::status)
                .filter(reverseSwaps::dsl::id.eq(id))
                .limit(1)
                .load::<String>(&mut con)?,
            chainSwaps::dsl::chainSwaps
                .select(chainSwaps::dsl::status)
                .filter(chainSwaps::dsl::id.eq(id))
                .limit(1)
                .load::<String>(&mut con)?,
        ];

        Ok(results
            .iter()
            .find(|elem| !elem.is_empty())
            .map(|res| res[0].clone()))
    }
}

#[cfg(test)]
mod test {
    use crate::db::helpers::web_hook::{WebHookHelper, WebHookHelperDatabase};
    use crate::db::models::{WebHook, WebHookState};
    use crate::db::{connect, Config};
    use diesel::r2d2::ConnectionManager;
    use diesel::PgConnection;
    use r2d2::Pool;
    use rand::distributions::{Alphanumeric, DistString};
    use std::sync::{Mutex, OnceLock};

    #[test]
    fn test_insert_web_hook() {
        let helper = WebHookHelperDatabase::new(get_pool());

        let hook = WebHook {
            id: Alphanumeric.sample_string(&mut rand::thread_rng(), 8),
            state: WebHookState::Ok.into(),
            url: "https://some.thing".to_string(),
            hash_swap_id: true,
        };
        assert_eq!(helper.insert_web_hook(&hook).unwrap(), 1);
        assert_eq!(helper.get_by_id(&hook.id).unwrap().unwrap(), hook);
    }

    #[test]
    fn test_insert_web_hook_duplicate() {
        let helper = WebHookHelperDatabase::new(get_pool());

        let hook = WebHook {
            id: Alphanumeric.sample_string(&mut rand::thread_rng(), 8),
            state: WebHookState::Ok.into(),
            url: "https://some.thing".to_string(),
            hash_swap_id: true,
        };
        assert_eq!(helper.insert_web_hook(&hook).unwrap(), 1);
        assert!(helper.insert_web_hook(&hook).err().is_some());
    }

    #[test]
    fn test_set_state() {
        let helper = WebHookHelperDatabase::new(get_pool());

        let mut hook = WebHook {
            id: Alphanumeric.sample_string(&mut rand::thread_rng(), 8),
            state: WebHookState::Ok.into(),
            url: "https://some.thing".to_string(),
            hash_swap_id: true,
        };
        assert_eq!(helper.insert_web_hook(&hook).unwrap(), 1);
        assert_eq!(helper.set_state(&hook.id, WebHookState::Failed).unwrap(), 1);

        hook.state = WebHookState::Failed.into();
        let failed_states = helper.get_by_state(WebHookState::Failed).unwrap();
        assert_eq!(
            failed_states.iter().find(|elem| elem.id == hook.id),
            Some(hook).as_ref()
        );
    }

    fn get_pool() -> Pool<ConnectionManager<PgConnection>> {
        static POOL: OnceLock<Mutex<Pool<ConnectionManager<PgConnection>>>> = OnceLock::new();
        POOL.get_or_init(|| {
            Mutex::new(
                connect(Config {
                    host: "127.0.0.2".to_string(),
                    port: 5432,
                    database: "boltz_test".to_string(),
                    username: "boltz".to_string(),
                    password: "boltz".to_string(),
                })
                .unwrap(),
            )
        })
        .lock()
        .unwrap()
        .clone()
    }
}

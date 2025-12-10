use diesel::BoxableExpression;
use diesel::pg::Pg;
use diesel::sql_types::{Bool, Nullable};

pub mod chain_swap;
pub mod chain_tip;
pub mod keys;
pub mod offer;
pub mod preimage_hash_triggers;
pub mod referral;
pub mod refund_transaction;
pub mod reverse_swap;
pub mod script_pubkey;
pub mod swap;
pub mod swap_update_trigger;
pub mod web_hook;

pub type BoxedCondition<T> = Box<dyn BoxableExpression<T, Pg, SqlType = Bool>>;
pub type BoxedNullableCondition<T> = Box<dyn BoxableExpression<T, Pg, SqlType = Nullable<Bool>>>;

pub type QueryResponse<T> = anyhow::Result<T>;

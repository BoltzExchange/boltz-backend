use diesel::BoxableExpression;
use diesel::pg::Pg;
use diesel::sql_types::{Bool, Nullable};

pub mod chain_swap;
pub mod keys;
pub mod offer;
pub mod referral;
pub mod reverse_swap;
pub mod swap;
pub mod web_hook;

pub type BoxedCondition<T> = Box<dyn BoxableExpression<T, Pg, SqlType = Bool>>;
pub type BoxedNullableCondition<T> = Box<dyn BoxableExpression<T, Pg, SqlType = Nullable<Bool>>>;

pub type QueryResponse<T> = anyhow::Result<T>;

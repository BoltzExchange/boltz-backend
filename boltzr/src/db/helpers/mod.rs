use diesel::BoxableExpression;
use diesel::pg::Pg;
use diesel::sql_types::Bool;

pub mod chain_swap;
pub mod referral;
pub mod reverse_swap;
pub mod swap;
pub mod web_hook;

pub type BoxedCondition<T> = Box<dyn BoxableExpression<T, Pg, SqlType = Bool>>;

pub type QueryResponse<T> = anyhow::Result<T>;

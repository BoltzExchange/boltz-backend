use diesel::pg::Pg;
use diesel::sql_types::Bool;
use diesel::BoxableExpression;

pub mod chain_swap;
pub mod reverse_swap;
pub mod swap;
pub mod web_hook;

pub type BoxedCondition<T> = Box<dyn BoxableExpression<T, Pg, SqlType = Bool>>;

pub type QueryResponse<T> = anyhow::Result<T>;

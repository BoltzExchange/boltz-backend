use std::time::Duration;

mod custom_expiry;
mod invoice_expiry;
mod scheduler;

pub use custom_expiry::*;
pub use invoice_expiry::*;
pub use scheduler::*;

pub trait ExpirationChecker {
    fn name(&self) -> &'static str;
    fn interval(&self) -> Duration;
    fn check(&self) -> anyhow::Result<()>;
}

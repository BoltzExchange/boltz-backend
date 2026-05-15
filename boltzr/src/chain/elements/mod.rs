use crate::chain::utils::Transaction;
use tokio::sync::oneshot;

pub use zero_conf_tool::ZeroConfToolConfig;

pub mod zero_conf_tool;

pub trait ZeroConfCheck {
    fn check_transaction(&self, transaction: &Transaction) -> oneshot::Receiver<bool>;
}

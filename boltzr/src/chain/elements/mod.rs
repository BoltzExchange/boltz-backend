use crate::chain::utils::Transaction;
use tokio::sync::oneshot;

mod zero_conf_tool;

pub use zero_conf_tool::{ZeroConfTool, ZeroConfToolConfig};

pub trait ZeroConfCheck {
    fn check_transaction(&self, transaction: &Transaction) -> oneshot::Receiver<bool>;
}

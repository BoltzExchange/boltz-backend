use serde::{Deserialize, Serialize};

mod message_limit;
mod offer_subscriptions;
pub mod status;
mod status_subscriptions;
pub mod types;

pub use message_limit::MessageLimitConfig;
pub use offer_subscriptions::OfferSubscriptions;

#[derive(Deserialize, Serialize, PartialEq, Clone, Debug)]
pub struct Config {
    pub host: String,
    pub port: u16,
    #[serde(rename = "messageLimit")]
    pub message_limit: Option<MessageLimitConfig>,
}

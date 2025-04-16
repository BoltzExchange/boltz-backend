use serde::{Deserialize, Serialize};

mod offer_subscriptions;
pub mod status;
pub mod types;

pub use offer_subscriptions::OfferSubscriptions;

#[derive(Deserialize, Serialize, PartialEq, Clone, Debug)]
pub struct Config {
    pub host: String,
    pub port: u16,
}

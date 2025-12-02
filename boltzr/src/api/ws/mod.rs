use serde::{Deserialize, Serialize};

mod offer_subscriptions;
pub mod status;
mod subscriptions;
pub mod types;
mod utils;

pub use offer_subscriptions::OfferSubscriptions;
pub use subscriptions::{FundingAddressSubscriptions, StatusSubscriptions};

#[derive(Deserialize, Serialize, PartialEq, Clone, Debug)]
pub struct Config {
    pub host: String,
    pub port: u16,
}

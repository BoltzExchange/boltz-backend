use serde::{Deserialize, Serialize};

mod funding_address_subscriptions;
mod offer_subscriptions;
pub mod status;
mod status_subscriptions;
pub mod types;
mod utils;

pub use funding_address_subscriptions::FundingAddressSubscriptions;
pub use offer_subscriptions::OfferSubscriptions;

#[derive(Deserialize, Serialize, PartialEq, Clone, Debug)]
pub struct Config {
    pub host: String,
    pub port: u16,
}

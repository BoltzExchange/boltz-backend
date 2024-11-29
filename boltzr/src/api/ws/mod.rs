use serde::{Deserialize, Serialize};

pub mod status;
pub mod types;

#[derive(Deserialize, Serialize, PartialEq, Clone, Debug)]
pub struct Config {
    pub host: String,
    pub port: u16,
}

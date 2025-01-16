use anyhow::Result;
pub use country_codes::MarkingsConfig;

mod country_codes;

use crate::service::country_codes::CountryCodes;

#[derive(Debug)]
pub struct Service {
    pub country_codes: CountryCodes,
}

impl Service {
    pub fn new(markings_config: Option<MarkingsConfig>) -> Self {
        Self {
            country_codes: CountryCodes::new(markings_config),
        }
    }

    pub async fn start(&self) -> Result<()> {
        self.country_codes.update().await?;
        Ok(())
    }
}

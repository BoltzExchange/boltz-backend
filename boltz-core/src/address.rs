use std::str::FromStr;

use anyhow::Result;
use bitcoin::Address as BitcoinAddress;
use elements::Address as ElementsAddress;

pub enum Address {
    Bitcoin(BitcoinAddress),
    Elements(ElementsAddress),
}

impl TryFrom<&str> for Address {
    type Error = anyhow::Error;

    fn try_from(value: &str) -> Result<Self> {
        Ok(BitcoinAddress::from_str(value)
            .map(|a| Address::Bitcoin(a.assume_checked()))
            .or_else(|_| ElementsAddress::from_str(value).map(Address::Elements))?)
    }
}

impl TryInto<BitcoinAddress> for Address {
    type Error = anyhow::Error;

    fn try_into(self) -> Result<BitcoinAddress> {
        match self {
            Address::Bitcoin(a) => Ok(a),
            Address::Elements(_) => Err(anyhow::anyhow!(
                "cannot convert Elements address to Bitcoin address"
            )),
        }
    }
}

impl TryInto<ElementsAddress> for Address {
    type Error = anyhow::Error;

    fn try_into(self) -> Result<ElementsAddress> {
        match self {
            Address::Bitcoin(_) => Err(anyhow::anyhow!(
                "cannot convert Bitcoin address to Elements address"
            )),
            Address::Elements(a) => Ok(a),
        }
    }
}

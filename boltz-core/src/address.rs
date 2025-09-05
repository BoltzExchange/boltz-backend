use anyhow::Result;
use bitcoin::Address as BitcoinAddress;
use elements::Address as ElementsAddress;
use std::str::FromStr;

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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_bitcoin() {
        let address = "bcrt1qycl82qgp7gu9rtyueydt6valr8jzcq644xdgpq";
        let parsed = Address::try_from(address).unwrap();
        assert!(matches!(parsed, Address::Bitcoin(_)));

        let bitcoin_address: BitcoinAddress = parsed.try_into().unwrap();
        assert_eq!(bitcoin_address.to_string(), address);
    }

    #[test]
    fn test_elements() {
        let address = "el1qq0lvfvk5qcz472vtprc925yyvq7gd93a8w3zwqrnh5xzznh65lpp2estxkekxddcxwapgxpnylvcmhlvfskuuzfvdqapkasp9";
        let parsed = Address::try_from(address).unwrap();
        assert!(matches!(parsed, Address::Elements(_)));

        let elements_address: ElementsAddress = parsed.try_into().unwrap();
        assert_eq!(elements_address.to_string(), address);
    }
}

use alloy::primitives::U256;
use alloy::primitives::utils::parse_units;
use std::error::Error;
use std::fmt::{Display, Formatter};

#[derive(Debug)]
enum ParseError {
    NegativeEtherAmount,
}

impl Display for ParseError {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        match *self {
            ParseError::NegativeEtherAmount => write!(f, "could not parse negative Ether amount"),
        }
    }
}

impl Error for ParseError {}

pub fn parse_wei(amount: &str) -> Result<U256, Box<dyn Error>> {
    let parsed = parse_units(amount, "wei")?;
    if parsed.is_negative() {
        return Err(Box::new(ParseError::NegativeEtherAmount));
    }

    Ok(parsed.get_absolute())
}

#[cfg(test)]
mod test {
    use crate::evm::utils::{ParseError, parse_wei};
    use alloy::primitives::U256;

    #[test]
    fn test_parse_wei() {
        assert_eq!(parse_wei("1").unwrap(), U256::from(1));
        assert_eq!(parse_wei("23123123").unwrap(), U256::from(23123123));
    }

    #[test]
    fn test_parse_wei_negative() {
        assert_eq!(
            parse_wei("-1").err().unwrap().to_string(),
            ParseError::NegativeEtherAmount.to_string()
        );
    }
}

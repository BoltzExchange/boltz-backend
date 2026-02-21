use alloy::network::Network;
use alloy::primitives::Address;
use alloy::primitives::U256;
use alloy::primitives::utils::parse_units;
use alloy::providers::Provider;
use anyhow::Result;
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

pub async fn check_contract_exists<P, N>(provider: &P, address: Address) -> Result<()>
where
    P: Provider<N> + Clone + 'static,
    N: Network,
{
    let code = provider.get_code_at(address).await?;
    if code.is_empty() {
        return Err(anyhow::anyhow!("no contract at address: {}", address));
    }
    Ok(())
}

#[cfg(test)]
mod test {
    use crate::utils::{ParseError, parse_wei};
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

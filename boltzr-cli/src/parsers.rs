use boltz_core::Network;
use clap::ValueEnum;
use std::str::FromStr;

// Wrapper type for Vec<u8> because Vec's confuse clap
#[derive(Debug, Clone)]
pub struct HexBytes(pub Vec<u8>);

#[derive(Debug, Clone, Copy, ValueEnum)]
pub enum SwapType {
    Submarine,
    Reverse,
}

#[derive(Debug, Clone, Copy)]
pub struct Amount(pub u64);

#[derive(Debug, Clone, Copy)]
pub enum AmountOrAll {
    Amount(Amount),
    All,
}

#[derive(Debug, Clone, Copy, ValueEnum)]
pub enum LogLevel {
    Error,
    Warn,
    Info,
    Verbose,
    Debug,
    Silly,
}

impl FromStr for Amount {
    type Err = anyhow::Error;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        // Try parsing as u64 first (for satoshi amounts)
        if let Ok(int_val) = s.parse::<u64>() {
            return Ok(Amount(int_val));
        }

        // Fall back to parsing as f64 (for decimal amounts like BTC)
        let float_val = s
            .parse::<f64>()
            .map_err(|e| anyhow::anyhow!("failed to parse amount: {}", e))?;

        if float_val < 0.0 {
            return Err(anyhow::anyhow!("amount cannot be negative"));
        }

        let amount = (float_val * 10_f64.powi(8)).round() as u64;
        Ok(Amount(amount))
    }
}

impl FromStr for AmountOrAll {
    type Err = anyhow::Error;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        if s == "all" {
            return Ok(AmountOrAll::All);
        }

        let amount = Amount::from_str(s)?;
        Ok(AmountOrAll::Amount(amount))
    }
}

pub fn parse_network(network: &str) -> Result<Network, String> {
    Network::try_from(network).map_err(|e| e.to_string())
}

pub fn parse_hex(hex: &str) -> Result<HexBytes, String> {
    let bytes = alloy::hex::decode(hex).map_err(|e| format!("invalid hex: {e}"))?;
    Ok(HexBytes(bytes))
}

#[cfg(test)]
mod tests {
    use super::*;
    use rstest::rstest;

    #[rstest]
    #[case("1000", 1000)]
    #[case("0", 0)]
    #[case("100000000", 100000000)]
    fn test_amount_from_str_valid_satoshi(#[case] input: &str, #[case] expected: u64) {
        let amount = Amount::from_str(input).unwrap();
        assert_eq!(amount.0, expected);
    }

    #[rstest]
    #[case("1.0", 100_000_000)]
    #[case("0.5", 50_000_000)]
    #[case("0.00000001", 1)]
    #[case("1.23456789", 123_456_789)]
    fn test_amount_from_str_valid_decimal(#[case] input: &str, #[case] expected: u64) {
        let amount = Amount::from_str(input).unwrap();
        assert_eq!(amount.0, expected);
    }

    #[rstest]
    #[case("")]
    #[case("abc")]
    #[case("-1")]
    #[case("1.2.3")]
    fn test_amount_from_str_invalid(#[case] input: &str) {
        assert!(Amount::from_str(input).is_err());
    }

    #[rstest]
    #[case("all")]
    #[case("1000")]
    fn test_amount_or_all_from_str(#[case] input: &str) {
        let result = AmountOrAll::from_str(input).unwrap();
        if input == "all" {
            assert!(matches!(result, AmountOrAll::All));
        } else {
            assert!(matches!(result, AmountOrAll::Amount(_)));
        }
    }

    #[rstest]
    #[case("mainnet", Network::Mainnet)]
    #[case("testnet", Network::Testnet)]
    #[case("signet", Network::Signet)]
    #[case("regtest", Network::Regtest)]
    fn test_parse_network_valid(#[case] input: &str, #[case] expected: Network) {
        assert_eq!(parse_network(input).unwrap(), expected);
    }

    #[test]
    fn test_parse_network_invalid() {
        assert!(parse_network("invalid").is_err());
    }

    #[rstest]
    #[case("deadbeef", vec![0xde, 0xad, 0xbe, 0xef])]
    #[case("001122", vec![0x00, 0x11, 0x22])]
    #[case("", vec![])]
    fn test_parse_hex_valid(#[case] input: &str, #[case] expected: Vec<u8>) {
        let hex = parse_hex(input).unwrap();
        assert_eq!(hex.0, expected);
    }

    #[rstest]
    #[case("nothex")]
    #[case("0g")]
    #[case("1")]
    fn test_parse_hex_invalid(#[case] input: &str) {
        assert!(parse_hex(input).is_err());
    }
}

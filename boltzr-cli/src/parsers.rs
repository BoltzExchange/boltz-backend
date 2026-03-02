use alloy::primitives::{Address, FixedBytes, U256};
use bitcoin::secp256k1::PublicKey;
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

#[derive(Debug, Clone, Copy, ValueEnum)]
pub enum Network {
    Mainnet,
    Testnet,
    Signet,
    Regtest,
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

impl TryFrom<Amount> for U256 {
    type Error = anyhow::Error;

    fn try_from(amount: Amount) -> Result<Self, Self::Error> {
        U256::from(amount.0)
            .checked_mul(U256::from(10_u128.pow(10)))
            .ok_or(anyhow::anyhow!("amount overflow"))
    }
}

impl From<&Network> for boltz_core::Network {
    fn from(network: &Network) -> Self {
        match network {
            Network::Mainnet => boltz_core::Network::Mainnet,
            Network::Testnet => boltz_core::Network::Testnet,
            Network::Signet => boltz_core::Network::Signet,
            Network::Regtest => boltz_core::Network::Regtest,
        }
    }
}

pub fn parse_hex(hex: &str) -> Result<HexBytes, String> {
    let bytes = alloy::hex::decode(hex).map_err(|e| format!("invalid hex: {e}"))?;
    Ok(HexBytes(bytes))
}

pub fn parse_hex_fixed_bytes(hex: &str) -> Result<FixedBytes<32>, String> {
    let bytes = alloy::hex::decode(hex).map_err(|e| format!("invalid hex: {e}"))?;
    FixedBytes::<32>::try_from(bytes.as_slice()).map_err(|e| format!("invalid hex: {e}"))
}

pub fn parse_alloy_address(address: &str) -> Result<Address, String> {
    Address::from_str(address).map_err(|e| e.to_string())
}

pub fn parse_public_key(public_key: &str) -> Result<PublicKey, String> {
    let bytes = alloy::hex::decode(public_key).map_err(|e| format!("invalid hex: {e}"))?;
    PublicKey::from_slice(&bytes).map_err(|e| format!("invalid public key: {e}"))
}

pub fn parse_signature(signature: &str) -> Result<alloy::signers::Signature, String> {
    signature
        .parse::<alloy::signers::Signature>()
        .map_err(|e| format!("invalid signature: {e}"))
}

pub fn parse_json_object(json: &str) -> Result<serde_json::Value, String> {
    let value = serde_json::from_str(json).map_err(|e| format!("invalid json: {e}"))?;
    match value {
        serde_json::Value::Object(_) => Ok(value),
        _ => Err("json is not an object".to_string()),
    }
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
    #[case(1, U256::from(10_000_000_000u128))]
    #[case(100, U256::from(1_000_000_000_000u128))]
    #[case(0, U256::from(0))]
    fn test_amount_to_u256_conversion(#[case] satoshis: u64, #[case] expected: U256) {
        let amount = Amount(satoshis);
        let u256: U256 = amount.try_into().unwrap();
        assert_eq!(u256, expected);
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

    #[rstest]
    #[case("0000000000000000000000000000000000000000000000000000000000000000", [0u8; 32])]
    #[case("deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef", [0xde, 0xad, 0xbe, 0xef, 0xde, 0xad, 0xbe, 0xef, 0xde, 0xad, 0xbe, 0xef, 0xde, 0xad, 0xbe, 0xef, 0xde, 0xad, 0xbe, 0xef, 0xde, 0xad, 0xbe, 0xef, 0xde, 0xad, 0xbe, 0xef, 0xde, 0xad, 0xbe, 0xef])]
    fn test_parse_hex_fixed_bytes_valid(#[case] input: &str, #[case] expected: [u8; 32]) {
        let bytes = parse_hex_fixed_bytes(input).unwrap();
        assert_eq!(bytes, FixedBytes::from(expected));
    }

    #[rstest]
    #[case("deadbeef")] // Too short
    #[case("deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef")]
    #[case("nothexdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef")]
    fn test_parse_hex_fixed_bytes_invalid(#[case] input: &str) {
        assert!(parse_hex_fixed_bytes(input).is_err());
    }

    #[rstest]
    #[case("0x0000000000000000000000000000000000000000")]
    #[case("0xDeaDbeefdEAdbeEfdEAdbeefdEAdbeefdEAdbeEf")]
    #[case("DeaDbeefdEAdbeEfdEAdbeefdEAdbeefdEAdbeEf")]
    fn test_parse_alloy_address_valid(#[case] input: &str) {
        assert!(parse_alloy_address(input).is_ok());
    }

    #[rstest]
    #[case("0x00")] // Too short
    #[case("0x000000000000000000000000000000000000000000")] // Too long
    #[case("notanaddress")]
    fn test_parse_alloy_address_invalid(#[case] input: &str) {
        assert!(parse_alloy_address(input).is_err());
    }

    #[rstest]
    #[case(r#"{}"#)]
    #[case(r#"{"key": "value"}"#)]
    #[case(r#"{"number": 42}"#)]
    #[case(r#"{"nested": {"obj": true}}"#)]
    #[case(r#"{"array": [1, 2, 3], "string": "test"}"#)]
    fn test_parse_json_object_valid(#[case] input: &str) {
        let result = parse_json_object(input);
        assert!(result.is_ok());
        assert!(result.unwrap().is_object());
    }

    #[rstest]
    #[case(r#"[]"#, "json is not an object")]
    #[case(r#"[1, 2, 3]"#, "json is not an object")]
    #[case(r#""string""#, "json is not an object")]
    #[case(r#"42"#, "json is not an object")]
    #[case(r#"true"#, "json is not an object")]
    #[case(r#"null"#, "json is not an object")]
    fn test_parse_json_object_wrong_type(#[case] input: &str, #[case] expected_err: &str) {
        let result = parse_json_object(input);
        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), expected_err);
    }

    #[rstest]
    #[case("not json")]
    #[case("{invalid}")]
    #[case(r#"{"unclosed": "#)]
    #[case(r#"{"key": }"#)]
    fn test_parse_json_object_invalid_json(#[case] input: &str) {
        let result = parse_json_object(input);
        assert!(result.is_err());
        assert!(result.unwrap_err().starts_with("invalid json:"));
    }

    #[rstest]
    #[case("02c6047f9441ed7d6d3045406e95c07cd85c778e4b8cef3ca7abac09b95c709ee5")]
    #[case("03c6047f9441ed7d6d3045406e95c07cd85c778e4b8cef3ca7abac09b95c709ee5")]
    #[case(
        "04c6047f9441ed7d6d3045406e95c07cd85c778e4b8cef3ca7abac09b95c709ee5e51e970159c23cc65c3a7be6b99315110809cd9acd992f1edc9bce55af301705"
    )]
    fn test_parse_public_key_valid(#[case] input: &str) {
        let result = parse_public_key(input);
        let pubkey = result.unwrap();
        assert!(!pubkey.serialize().is_empty());
    }

    #[rstest]
    #[case("nothex")]
    #[case("0g1122")]
    #[case("deadbeef")]
    #[case("02c6047f9441ed7d6d3045406e95c07cd85c778e4b8cef3ca7abac09b95c709e")]
    #[case("02c6047f9441ed7d6d3045406e95c07cd85c778e4b8cef3ca7abac09b95c709ee500")]
    #[case("00c6047f9441ed7d6d3045406e95c07cd85c778e4b8cef3ca7abac09b95c709ee5")]
    #[case("05c6047f9441ed7d6d3045406e95c07cd85c778e4b8cef3ca7abac09b95c709ee5")]
    fn test_parse_public_key_invalid(#[case] input: &str) {
        let result = parse_public_key(input);
        assert!(result.is_err());
    }

    #[rstest]
    #[case("", "invalid public key")]
    #[case("xyz", "invalid hex")]
    fn test_parse_public_key_error_messages(#[case] input: &str, #[case] expected_prefix: &str) {
        let result = parse_public_key(input);
        assert!(result.is_err());
        let err = result.unwrap_err();
        assert!(
            err.starts_with(expected_prefix),
            "Expected error to start with '{}', got: {}",
            expected_prefix,
            err
        );
    }

    #[rstest]
    #[case(
        "0xd8b4ed2186a0eb3c1dcff031a4753ef1813264b3e7f3df4ce915f2e09ebb93055e36dfc5f01fb7dcd43b209770f6c497ac6869dffaf51431c3e1ad92129a0be01c"
    )]
    #[case(
        "d8b4ed2186a0eb3c1dcff031a4753ef1813264b3e7f3df4ce915f2e09ebb93055e36dfc5f01fb7dcd43b209770f6c497ac6869dffaf51431c3e1ad92129a0be01c"
    )]
    fn test_parse_signature_valid(#[case] input: &str) {
        let signature = parse_signature(input).unwrap();
        assert_eq!(signature.as_bytes().len(), 65);
    }

    #[rstest]
    #[case("invalid")]
    #[case("0x1234")]
    #[case(
        "0x50f29beaafa5f4e6780b4e477335dca0bfee4079cfa90fca991e4448230d171973de798da616df06125d2c570f3fc70647dfa3d06f5029907141b626372b0abf"
    )]
    fn test_parse_signature_invalid(#[case] input: &str) {
        let result = parse_signature(input);
        assert!(result.is_err());
        assert!(result.unwrap_err().starts_with("invalid signature:"));
    }
}

use reqwest::Url;
use std::str::FromStr;

use alloy::primitives::Address;

pub fn address_valid(address: &str) -> Result<String, String> {
    let address = Address::from_str(address).map_err(|e| e.to_string())?;
    Ok(address.to_string())
}

pub fn url_valid(url: &str) -> Result<String, String> {
    let url = Url::from_str(url).map_err(|e| e.to_string())?;
    Ok(url.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;
    use rstest::rstest;

    #[rstest]
    #[case("0x0000000000000000000000000000000000000000")]
    #[case("0x1234567890123456789012345678901234567890")]
    #[case("0xabcdefABCDEF1234567890123456789012345678")]
    #[case("0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045")]
    #[case("0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed")]
    fn test_address_valid_with_valid_addresses(#[case] address: &str) {
        let result = address_valid(address);
        assert!(result.is_ok(), "Expected valid address: {address}");
    }

    #[rstest]
    #[case("")]
    #[case("not_an_address")]
    #[case("0x123")]
    #[case("0x12345678901234567890123456789012345678901")]
    #[case("0xGHIJKLMNOPQRSTUVWXYZ1234567890123456789")]
    #[case("0x")]
    #[case("0x123456789012345678901234567890123456789G")]
    fn test_address_valid_with_invalid_addresses(#[case] address: &str) {
        let result = address_valid(address);
        assert!(result.is_err(), "Expected invalid address: {address}");
    }

    #[rstest]
    #[case("0xd8da6bf26964af9d7eed9e03e53415d37aa96045")]
    #[case("0xD8DA6BF26964AF9D7EED9E03E53415D37AA96045")]
    #[case("0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045")]
    fn test_address_valid_case_insensitive(#[case] address: &str) {
        assert!(address_valid(address).is_ok());
    }

    #[rstest]
    #[case("https://example.com")]
    #[case("http://example.com")]
    #[case("https://api.example.com/v1/endpoint")]
    #[case("http://localhost:8080")]
    #[case("https://subdomain.example.com:443/path?query=value")]
    #[case("ftp://ftp.example.com")]
    #[case("file:///path/to/file")]
    #[case("https://user:pass@example.com/path")]
    fn test_url_valid_with_valid_urls(#[case] url: &str) {
        let result = url_valid(url);
        assert!(result.is_ok(), "Expected valid URL: {url}");
    }

    #[rstest]
    #[case("")]
    #[case("not_a_url")]
    #[case("http://")]
    #[case("://example.com")]
    #[case("http://example .com")]
    #[case("http://[::1")]
    #[case("http://999.999.999.999")]
    fn test_url_valid_with_invalid_urls(#[case] url: &str) {
        let result = url_valid(url);
        assert!(result.is_err(), "Expected invalid URL: {url}");
    }
}

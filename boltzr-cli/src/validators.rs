use reqwest::Url;
use std::str::FromStr;

pub fn url_valid(url: &str) -> Result<String, String> {
    let url = Url::from_str(url).map_err(|e| e.to_string())?;
    Ok(url.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;
    use rstest::rstest;

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

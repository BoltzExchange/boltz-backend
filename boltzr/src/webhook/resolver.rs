use std::error::Error;
use std::fmt;
use std::net::{IpAddr, SocketAddr};
use std::str::FromStr;

use reqwest::Url;
use reqwest::dns::{Addrs, Name, Resolve, Resolving};
use reqwest::redirect::Policy;

use crate::webhook::caller::UrlError;

/// Maximum number of redirects to follow, matching reqwest's default limit
const MAX_REDIRECTS: usize = 10;

pub(crate) fn is_blocked_ip(ip: &IpAddr) -> bool {
    match ip {
        IpAddr::V4(ip) => {
            let octets = ip.octets();
            // Ipv4Addr::is_shared and is_reserved are nightly-only
            let is_shared = octets[0] == 100 && (octets[1] & 0b1100_0000) == 0b0100_0000;
            let is_reserved = (octets[0] & 0b1111_0000) == 0b1111_0000;

            ip.is_loopback()
                || ip.is_link_local()
                || ip.is_multicast()
                || ip.is_broadcast()
                || ip.is_private()
                || ip.is_unspecified()
                || is_shared
                || is_reserved
        }
        IpAddr::V6(ip) => {
            if let Some(mapped) = ip.to_ipv4_mapped() {
                return is_blocked_ip(&IpAddr::V4(mapped));
            }

            ip.is_loopback()
                || ip.is_multicast()
                || ip.is_unicast_link_local()
                || ip.is_unique_local()
                || ip.is_unspecified()
        }
    }
}

#[derive(Debug)]
struct TooManyRedirects;

impl fmt::Display for TooManyRedirects {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str("too many redirects")
    }
}

impl Error for TooManyRedirects {}

pub(crate) struct SsrfGuardResolver {
    allow_insecure: bool,
}

impl SsrfGuardResolver {
    pub(crate) fn new(allow_insecure: bool) -> Self {
        Self { allow_insecure }
    }
}

impl Resolve for SsrfGuardResolver {
    fn resolve(&self, name: Name) -> Resolving {
        let allow_insecure = self.allow_insecure;
        let host = name.as_str().to_owned();

        Box::pin(async move {
            let addrs: Vec<SocketAddr> = tokio::net::lookup_host(format!("{host}:0"))
                .await?
                .collect();

            if !allow_insecure && addrs.iter().any(|addr| is_blocked_ip(&addr.ip())) {
                return Err(
                    Box::new(UrlError::InvalidHost) as Box<dyn std::error::Error + Send + Sync>
                );
            }

            Ok(Box::new(addrs.into_iter()) as Addrs)
        })
    }
}

pub(crate) fn build_redirect_policy(allow_insecure: bool, block_list: Vec<String>) -> Policy {
    Policy::custom(move |attempt| {
        if is_blocked_redirect(attempt.url(), allow_insecure, &block_list) {
            attempt.error(UrlError::Blocked)
        } else if attempt.previous().len() > MAX_REDIRECTS {
            attempt.error(TooManyRedirects)
        } else {
            attempt.follow()
        }
    })
}

fn is_blocked_redirect(url: &Url, allow_insecure: bool, block_list: &[String]) -> bool {
    if let Some(host) = url.host_str()
        && block_list.iter().any(|blocked| host.contains(blocked))
    {
        return true;
    }

    if allow_insecure {
        return false;
    }

    if url.scheme() != "https" {
        return true;
    }

    matches!(host_as_ip(url), Some(ip) if is_blocked_ip(&ip))
}

fn host_as_ip(url: &Url) -> Option<IpAddr> {
    let host = url.host_str()?;
    let host = host.strip_prefix('[').unwrap_or(host);
    let host = host.strip_suffix(']').unwrap_or(host);
    IpAddr::from_str(host).ok()
}

#[cfg(test)]
mod resolver_test {
    use super::*;
    use reqwest::dns::Name;
    use rstest::rstest;

    #[rstest]
    #[case("8.8.8.8", false)]
    #[case("1.1.1.1", false)]
    #[case("127.0.0.1", true)]
    #[case("10.0.0.1", true)]
    #[case("192.168.1.1", true)]
    #[case("172.16.0.1", true)]
    #[case("169.254.1.1", true)]
    #[case("224.0.0.1", true)]
    #[case("255.255.255.255", true)]
    #[case("0.0.0.0", true)]
    #[case("100.64.0.1", true)]
    #[case("100.127.255.255", true)]
    #[case("100.63.255.255", false)]
    #[case("100.128.0.0", false)]
    #[case("240.0.0.1", true)]
    #[case("250.1.2.3", true)]
    #[case("239.255.255.255", true)]
    #[case("2001:4860:4860::8888", false)]
    #[case("::1", true)]
    #[case("fe80::1", true)]
    #[case("ff00::1", true)]
    #[case("fc00::1", true)]
    #[case("::", true)]
    #[case("::ffff:8.8.8.8", false)]
    #[case("::ffff:127.0.0.1", true)]
    #[case("::ffff:10.0.0.1", true)]
    #[case("::ffff:169.254.1.1", true)]
    #[case("::ffff:100.64.0.1", true)]
    #[case("::ffff:240.0.0.1", true)]
    fn test_is_blocked_ip(#[case] ip: &str, #[case] blocked: bool) {
        assert_eq!(is_blocked_ip(&IpAddr::from_str(ip).unwrap()), blocked);
    }

    #[rstest]
    // configured block list applies to every hop, even in insecure mode
    #[case("https://api.bol.tz/v2", false, Some("bol.tz"), true)]
    #[case("https://api.bol.tz/v2", true, Some("bol.tz"), true)]
    #[case("https://example.com/", false, Some("bol.tz"), false)]
    // scheme downgrade to plain HTTP is blocked unless insecure
    #[case("http://example.com/", false, None, true)]
    #[case("http://example.com/", true, None, false)]
    #[case("https://10.0.0.1/path", false, None, true)] // literal private IPv4
    #[case("https://127.0.0.1/", false, None, true)] // loopback IPv4
    #[case("https://169.254.169.254/", false, None, true)] // link-local (metadata)
    #[case("https://[::1]/", false, None, true)] // loopback IPv6
    #[case("https://[fc00::1]/", false, None, true)] // unique-local IPv6
    #[case("https://[::ffff:127.0.0.1]/", false, None, true)] // IPv4-mapped loopback
    #[case("https://[::ffff:10.0.0.1]/", false, None, true)] // IPv4-mapped private
    #[case("https://8.8.8.8/", false, None, false)] // literal public IPv4
    #[case("https://[::ffff:8.8.8.8]/", false, None, false)] // IPv4-mapped public
    #[case("https://[2001:4860:4860::8888]/", false, None, false)] // literal public IPv6
    #[case("https://example.com/", false, None, false)] // hostname -> deferred to resolver
    #[case("https://10.0.0.1/", true, None, false)] // allow_insecure bypasses the check
    #[case("http://127.0.0.1/", true, None, false)] // allow_insecure bypasses the check
    fn test_is_blocked_redirect(
        #[case] url: &str,
        #[case] allow_insecure: bool,
        #[case] block: Option<&str>,
        #[case] blocked: bool,
    ) {
        let url = Url::parse(url).unwrap();
        let block_list: Vec<String> = block.into_iter().map(String::from).collect();
        assert_eq!(
            is_blocked_redirect(&url, allow_insecure, &block_list),
            blocked
        );
    }

    #[tokio::test]
    async fn test_resolver_blocks_private_hostname() {
        let resolver = SsrfGuardResolver::new(false);
        let res = resolver.resolve(Name::from_str("localhost").unwrap()).await;
        assert!(res.is_err());
    }

    #[tokio::test]
    async fn test_resolver_allows_private_when_insecure() {
        let resolver = SsrfGuardResolver::new(true);
        let res = resolver.resolve(Name::from_str("localhost").unwrap()).await;
        assert!(res.is_ok());
    }
}

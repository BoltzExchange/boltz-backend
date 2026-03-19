use crate::wallet::Network;
use anyhow::{Result, anyhow};

fn get_prefix(network: Network, symbol: &str) -> Result<&'static str> {
    match symbol {
        "BTC" | "ARK" => Ok("bitcoin"),
        "L-BTC" => match network {
            Network::Testnet => Ok("liquidtestnet"),
            _ => Ok("liquidnetwork"),
        },
        _ => Err(anyhow!("unknown payment uri symbol {symbol}")),
    }
}

pub fn encode(
    network: Network,
    symbol: &str,
    address: Option<&str>,
    params: Option<&str>,
) -> Result<String> {
    let prefix = get_prefix(network, symbol)?;
    let params = params.filter(|params| !params.is_empty());

    if symbol == "ARK" {
        let address = address.ok_or(anyhow!("missing ark payment instruction address"))?;
        let query = match params {
            Some(params) => format!("ark={address}&{params}"),
            None => format!("ark={address}"),
        };
        return Ok(format!("{prefix}:?{query}"));
    }

    match (address, params) {
        (Some(address), Some(params)) => Ok(format!("{prefix}:{address}?{params}")),
        (Some(address), None) => Ok(format!("{prefix}:{address}")),
        (None, Some(params)) => Ok(format!("{prefix}:?{params}")),
        (None, None) => Ok(format!("{prefix}:")),
    }
}

#[cfg(test)]
mod test {
    use super::*;

    #[test]
    fn test_get_prefix() {
        assert_eq!(
            get_prefix(Network::Testnet, "L-BTC").unwrap(),
            "liquidtestnet"
        );
        assert_eq!(
            get_prefix(Network::Mainnet, "L-BTC").unwrap(),
            "liquidnetwork"
        );
        assert_eq!(get_prefix(Network::Mainnet, "BTC").unwrap(), "bitcoin");
        assert_eq!(get_prefix(Network::Mainnet, "ARK").unwrap(), "bitcoin");
    }

    #[test]
    fn test_encode() {
        assert_eq!(
            encode(Network::Mainnet, "BTC", Some("address"), Some("params=1")).unwrap(),
            "bitcoin:address?params=1"
        );
        assert_eq!(
            encode(Network::Mainnet, "BTC", Some("address"), None).unwrap(),
            "bitcoin:address"
        );
        assert_eq!(
            encode(
                Network::Mainnet,
                "ARK",
                Some("ark1address"),
                Some("amount=1")
            )
            .unwrap(),
            "bitcoin:?ark=ark1address&amount=1"
        );
        assert_eq!(
            encode(Network::Mainnet, "ARK", Some("ark1address"), None).unwrap(),
            "bitcoin:?ark=ark1address"
        );
        assert_eq!(
            encode(
                Network::Testnet,
                "L-BTC",
                Some("tex1qqtestnetaddress"),
                Some("amount=1")
            )
            .unwrap(),
            "liquidtestnet:tex1qqtestnetaddress?amount=1"
        );
        assert_eq!(
            encode(
                Network::Testnet,
                "L-BTC",
                Some("tex1qqtestnetaddress"),
                None
            )
            .unwrap(),
            "liquidtestnet:tex1qqtestnetaddress"
        );
        assert_eq!(
            encode(
                Network::Mainnet,
                "L-BTC",
                Some("ex1qqmainnetaddress"),
                Some("amount=1")
            )
            .unwrap(),
            "liquidnetwork:ex1qqmainnetaddress?amount=1"
        );
        assert_eq!(
            encode(Network::Mainnet, "L-BTC", Some("ex1qqmainnetaddress"), None).unwrap(),
            "liquidnetwork:ex1qqmainnetaddress"
        );
    }
}

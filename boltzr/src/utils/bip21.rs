use crate::{chain::types::Type, wallet::Network};

fn get_prefix(network: Network, address_type: Type) -> &'static str {
    match (network, address_type) {
        (Network::Testnet, Type::Elements) => "liquidtestnet",
        (_, Type::Elements) => "liquidnetwork",
        _ => "bitcoin",
    }
}

pub fn encode(
    network: Network,
    address_type: Type,
    address: &str,
    params: Option<String>,
) -> String {
    let prefix = get_prefix(network, address_type);
    match params {
        Some(p) => format!("{}:{}?{}", prefix, address, p),
        None => format!("{}:{}", prefix, address),
    }
}

#[cfg(test)]
mod test {
    use super::*;

    #[test]
    fn test_get_prefix() {
        assert_eq!(
            get_prefix(Network::Testnet, Type::Elements),
            "liquidtestnet"
        );
        assert_eq!(
            get_prefix(Network::Mainnet, Type::Elements),
            "liquidnetwork"
        );
        assert_eq!(get_prefix(Network::Mainnet, Type::Bitcoin), "bitcoin");
    }

    #[test]
    fn test_encode() {
        assert_eq!(
            encode(
                Network::Mainnet,
                Type::Bitcoin,
                "address",
                Some("params=1".to_string())
            ),
            "bitcoin:address?params=1"
        );
        assert_eq!(
            encode(Network::Mainnet, Type::Bitcoin, "address", None),
            "bitcoin:address"
        );
    }
}

use crate::wallet::Network;

fn get_prefix(network: Network, symbol: &str) -> &'static str {
    match (network, symbol) {
        (Network::Testnet, "L-BTC") => "liquidtestnet",
        (_, "L-BTC") => "liquidbitcoin",
        _ => "bitcoin",
    }
}

pub fn encode(network: Network, symbol: &str, address: &str, params: &str) -> String {
    format!("{}:{}?{}", get_prefix(network, symbol), address, params)
}

mod test {
    use super::*;

    #[test]
    fn test_get_prefix() {
        assert_eq!(get_prefix(Network::Testnet, "L-BTC"), "liquidtestnet");
        assert_eq!(get_prefix(Network::Mainnet, "L-BTC"), "liquidbitcoin");
        assert_eq!(get_prefix(Network::Mainnet, "BTC"), "bitcoin");
    }

    #[test]
    fn test_encode() {
        assert_eq!(
            encode(Network::Mainnet, "BTC", "address", "params=1"),
            "bitcoin:address?params=1"
        );
    }
}

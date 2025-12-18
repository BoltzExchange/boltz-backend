use boltz_core::Network;

// Wrapper type for Vec<u8> because Vec's confuse clap
#[derive(Debug, Clone)]
pub struct HexBytes(pub Vec<u8>);

pub fn parse_network(network: &str) -> Result<Network, String> {
    Network::try_from(network).map_err(|e| e.to_string())
}

pub fn parse_hex(hex: &str) -> Result<HexBytes, String> {
    let bytes = alloy::hex::decode(hex).map_err(|e| format!("invalid hex: {e}"))?;
    Ok(HexBytes(bytes))
}

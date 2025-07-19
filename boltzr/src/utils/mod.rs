pub mod bip21;
mod drop_guard;
pub mod pair;
pub mod serde;
mod timeout_map;
pub mod xpub;
pub mod built_info {
    include!(concat!(env!("OUT_DIR"), "/built.rs"));
}

pub use drop_guard::defer;
pub use timeout_map::TimeoutMap;

pub fn get_version() -> String {
    format!(
        "{}-{}{}",
        built_info::PKG_VERSION,
        built_info::GIT_COMMIT_HASH
            .unwrap_or("")
            .to_string()
            .chars()
            .take(8)
            .collect::<String>(),
        if built_info::GIT_DIRTY.unwrap_or(false) {
            "-dirty"
        } else {
            ""
        }
    )
}

#[cfg(any(feature = "loki", feature = "otel"))]
pub fn get_name(network: &str) -> String {
    format!("boltz-backend-{}-{}", network, built_info::PKG_NAME)
}

#[cfg(any(feature = "loki", feature = "otel"))]
pub fn get_network(network: &Option<String>) -> String {
    network.clone().unwrap_or("regtest".to_string())
}

#[cfg(test)]
mod utils_test {
    use crate::utils::*;

    #[test]
    fn test_get_version() {
        let version = get_version();
        let split: Vec<&str> = version.split('-').collect();
        // For compatibility with the backend
        assert_eq!(split[1].to_string().len(), 8);
    }

    #[test]
    fn test_get_name() {
        assert_eq!(get_name("regtest"), "boltz-backend-regtest-boltzr");
    }

    #[test]
    fn test_get_network() {
        assert_eq!(
            get_network(&Some("mainnet".to_string())),
            "mainnet".to_string()
        );
        assert_eq!(
            get_network(&Some("testnet".to_string())),
            "testnet".to_string()
        );
        assert_eq!(get_network(&None), "regtest".to_string());
    }
}

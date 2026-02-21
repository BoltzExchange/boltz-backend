use crate::{Config, ContractAddresses, Manager};
use crate::{English, MnemonicBuilder};
use boltz_cache::{Cache, MemCache};

pub const MNEMONIC: &str = "test test test test test test test test test test test junk";
pub const PROVIDER: &str = "http://127.0.0.1:8545";

pub const ETHER_SWAP_ADDRESS: &str = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
pub const ERC20_SWAP_ADDRESS: &str = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

pub async fn new_manager() -> Manager {
    Manager::new(
        "RBTC".to_string(),
        Cache::Memory(MemCache::new()),
        MnemonicBuilder::<English>::default()
            .phrase(MNEMONIC)
            .index(0)
            .unwrap()
            .build()
            .unwrap(),
        &Config {
            provider_endpoint: Some(PROVIDER.to_string()),
            providers: None,
            contracts: vec![ContractAddresses {
                ether_swap: ETHER_SWAP_ADDRESS.to_string(),
                erc20_swap: ERC20_SWAP_ADDRESS.to_string(),
            }],
            tokens: None,
            quoters: None,
        },
    )
    .await
    .unwrap()
}

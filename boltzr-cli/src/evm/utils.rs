use alloy::{
    network::AnyNetwork,
    primitives::{Address, FixedBytes, U256},
    providers::{DynProvider, ProviderBuilder, network::EthereumWallet},
    signers::local::{MnemonicBuilder, PrivateKeySigner, coins_bip39::English},
    sol,
};
use anyhow::{Result, anyhow, bail};
use std::fs;
use std::path::PathBuf;

pub enum Keys {
    SeedPath(PathBuf),
    PrivateKey(FixedBytes<32>),
    Signer(PrivateKeySigner),
}

sol!(
    #[allow(clippy::too_many_arguments)]
    #[sol(rpc)]
    EtherSwap,
    "../node_modules/boltz-core/dist/out/EtherSwap.sol/EtherSwap.json"
);

sol!(
    #[allow(clippy::too_many_arguments)]
    #[sol(rpc)]
    ERC20Swap,
    "../node_modules/boltz-core/dist/out/ERC20Swap.sol/ERC20Swap.json"
);

sol!(
    #[allow(clippy::too_many_arguments)]
    #[sol(rpc)]
    IERC20,
    "../node_modules/boltz-core/dist/out/ERC20.sol/ERC20.json"
);

pub async fn token_decimals(provider: &DynProvider<AnyNetwork>, token: Address) -> u8 {
    let contract = IERC20::new(token, provider);
    contract.decimals().call().await.unwrap_or(18)
}

pub fn amount_to_token_units(amount: crate::parsers::Amount, decimals: u8) -> Result<U256> {
    let base = U256::from(amount.0);
    let scale = decimals as i32 - 8;

    if scale == 0 {
        return Ok(base);
    }

    if scale > 0 {
        let factor = ten_pow(scale as u32)?;
        return base
            .checked_mul(factor)
            .ok_or_else(|| anyhow!("amount overflow"));
    }

    let factor = ten_pow((-scale) as u32)?;
    if base % factor != U256::from(0u8) {
        bail!("amount precision exceeds token decimals");
    }
    Ok(base / factor)
}

pub fn get_provider(
    rpc_url: &str,
    keys: Keys,
) -> Result<(DynProvider<AnyNetwork>, PrivateKeySigner)> {
    let signer = match keys {
        Keys::SeedPath(path) => {
            let mnemonic = read_mnemonic(path)?;
            MnemonicBuilder::<English>::default()
                .phrase(mnemonic.trim())
                .index(0)?
                .build()?
        }
        Keys::PrivateKey(private_key) => PrivateKeySigner::from_bytes(&private_key)?,
        Keys::Signer(signer) => signer,
    };

    let provider = ProviderBuilder::new()
        .network::<AnyNetwork>()
        .wallet(EthereumWallet::from(signer.clone()))
        .connect_http(rpc_url.parse()?);

    Ok((DynProvider::new(provider), signer))
}

fn ten_pow(exp: u32) -> Result<U256> {
    U256::from(10u8)
        .checked_pow(U256::from(exp))
        .ok_or_else(|| anyhow!("amount overflow"))
}

fn read_mnemonic(seed_folder: PathBuf) -> Result<String> {
    let seed_folder = crate::utils::resolve_home(seed_folder)?;

    for file in ["seedEvm.dat", "seed.dat"] {
        let file_path = seed_folder.join(file);
        if file_path.exists() {
            return Ok(fs::read_to_string(file_path)?.trim().to_string());
        }
    }

    anyhow::bail!("no Boltz wallet found")
}

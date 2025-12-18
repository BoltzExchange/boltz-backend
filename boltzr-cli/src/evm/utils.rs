use alloy::{
    network::AnyNetwork,
    primitives::FixedBytes,
    providers::{
        ProviderBuilder, RootProvider,
        fillers::{
            BlobGasFiller, ChainIdFiller, FillProvider, GasFiller, JoinFill, NonceFiller,
            WalletFiller,
        },
        network::EthereumWallet,
    },
    signers::local::{MnemonicBuilder, PrivateKeySigner, coins_bip39::English},
    sol,
};
use anyhow::Result;
use std::fs;
use std::path::PathBuf;

pub type AlloyProvider = FillProvider<
    JoinFill<
        JoinFill<
            alloy::providers::Identity,
            JoinFill<GasFiller, JoinFill<BlobGasFiller, JoinFill<NonceFiller, ChainIdFiller>>>,
        >,
        WalletFiller<EthereumWallet>,
    >,
    RootProvider<AnyNetwork>,
    AnyNetwork,
>;

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

pub fn get_provider(rpc_url: &str, keys: Keys) -> Result<(AlloyProvider, PrivateKeySigner)> {
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

    Ok((provider, signer))
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

use crate::evm::{Keys, utils::get_provider};
use alloy::{
    primitives::{Address, B256, U256},
    providers::Provider,
    signers::local::PrivateKeySigner,
};
use anyhow::Result;
use boltz_evm::contracts::ether_swap::EtherSwapContract;
use futures::stream::{StreamExt, TryStreamExt};
use indicatif::ProgressBar;
use serde::Serialize;

#[derive(Serialize, Debug, Clone)]
struct LockedFunds {
    transaction_hash: B256,
    #[serde(serialize_with = "crate::serde::hex::serialize")]
    preimage_hash: Vec<u8>,
    refund_address: Address,
    #[serde(serialize_with = "crate::serde::u256::serialize_sats")]
    amount: U256,
}

// TODO: erc20 swap compatibility
pub async fn scan_locked_in_contract(
    rpc_url: &str,
    address: Address,
    start_height: u64,
    scan_interval: u64,
) -> Result<()> {
    // Random keys because we are just scanning the chain here
    let (provider, _) = get_provider(rpc_url, Keys::Signer(PrivateKeySigner::random()))?;
    let latest_block = provider.get_block_number().await?;
    let pb = ProgressBar::new(latest_block - start_height);

    let contract = EtherSwapContract::new(address, provider.clone()).await?;

    let mut locked_swaps = Vec::new();

    let mut current_block = start_height;
    while current_block < latest_block {
        let to = std::cmp::min(current_block + scan_interval, latest_block);

        let logs = contract.lockups_in_range(current_block, to).await?;

        let contract_ref = &contract;
        let active_lockups = futures::stream::iter(logs)
            .map(|lockup| async move {
                let is_active = contract_ref.is_lockup_active(lockup.lockup).await?;
                Ok::<_, anyhow::Error>((lockup, is_active))
            })
            .buffered(16)
            .try_filter_map(|(lockup, is_active)| async move {
                Ok::<_, anyhow::Error>(is_active.then_some(lockup))
            })
            .try_collect::<Vec<_>>()
            .await?;

        for lockup in active_lockups {
            locked_swaps.push(LockedFunds {
                transaction_hash: lockup
                    .transaction_hash
                    .ok_or(anyhow::anyhow!("No transaction hash"))?,
                preimage_hash: lockup.lockup.preimage_hash.to_vec(),
                refund_address: lockup.lockup.refund_address,
                amount: lockup.lockup.amount,
            });
        }

        pb.inc(to - current_block);
        current_block = to;
    }

    pb.finish_and_clear();

    println!(
        "Scanned {} blocks from {} to {}",
        latest_block - start_height,
        start_height,
        latest_block
    );
    println!(
        "Total amount: {}",
        locked_swaps
            .iter()
            .map(|s| s.amount)
            .sum::<U256>()
            .div_ceil(U256::from(10u128.pow(10)))
    );
    println!("Locked swaps: {}", locked_swaps.len());
    println!("{}", serde_json::to_string_pretty(&locked_swaps)?);

    Ok(())
}

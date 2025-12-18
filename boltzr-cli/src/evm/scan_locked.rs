use crate::evm::{
    Keys,
    utils::{EtherSwap, get_provider},
};
use alloy::{
    primitives::{Address, FixedBytes, U256},
    providers::Provider,
    signers::local::PrivateKeySigner,
    sol_types::SolValue,
};
use anyhow::Result;
use indicatif::ProgressBar;
use serde::Serialize;

#[derive(Serialize, Debug, Clone)]
struct LockedFunds {
    transaction_hash: FixedBytes<32>,
    #[serde(serialize_with = "crate::serde::hex::serialize")]
    preimage_hash: Vec<u8>,
    refund_address: Address,
    #[serde(serialize_with = "crate::serde::u256::serialize_sats")]
    amount: U256,
}

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

    let contract = EtherSwap::new(address, provider);

    let mut locked_swaps = Vec::new();

    let mut current_block = start_height;
    while current_block < latest_block {
        let to = std::cmp::min(current_block + scan_interval, latest_block);

        let logs = contract
            .Lockup_filter()
            .from_block(current_block)
            .to_block(to)
            .query()
            .await?;

        for (event, log) in logs {
            let params = (
                event.preimageHash,
                event.amount,
                event.claimAddress,
                event.refundAddress,
                event.timelock,
            );
            let swap_hash = alloy::primitives::keccak256(SolValue::abi_encode(&params));

            if contract.swaps(swap_hash).call().await? {
                locked_swaps.push(LockedFunds {
                    transaction_hash: log
                        .transaction_hash
                        .ok_or(anyhow::anyhow!("No transaction hash"))?,
                    preimage_hash: event.preimageHash.to_vec(),
                    refund_address: event.refundAddress,
                    amount: event.amount,
                });
            }
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

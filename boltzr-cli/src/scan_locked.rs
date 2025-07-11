use alloy::network::AnyNetwork;
use alloy::primitives::{Address, FixedBytes, U256};
use alloy::providers::{Provider, ProviderBuilder};
use alloy::sol;
use anyhow::Result;
use indicatif::ProgressBar;
use serde::Serialize;

sol!(
    #[allow(clippy::too_many_arguments)]
    #[sol(rpc)]
    EtherSwap,
    "../node_modules/boltz-core/dist/out/EtherSwap.sol/EtherSwap.json"
);

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
    address: &str,
    start_height: &u64,
    scan_interval: &u64,
) -> Result<()> {
    let provider = ProviderBuilder::new()
        .network::<AnyNetwork>()
        .connect_http(rpc_url.parse()?);

    let latest_block = provider.get_block_number().await?;
    let pb = ProgressBar::new(latest_block - start_height);

    let contract = EtherSwap::new(address.parse()?, provider);

    let mut locked_swaps = Vec::new();

    let mut current_block = *start_height;
    while current_block < latest_block {
        let to = std::cmp::min(current_block + *scan_interval, latest_block);

        let logs = contract
            .Lockup_filter()
            .from_block(current_block)
            .to_block(to)
            .query()
            .await?;

        for (event, log) in logs {
            let swap_hash = contract
                .hashValues(
                    event.preimageHash,
                    event.amount,
                    event.claimAddress,
                    event.refundAddress,
                    event.timelock,
                )
                .call()
                .await?;

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

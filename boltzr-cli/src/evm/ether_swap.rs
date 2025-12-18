use crate::evm::{
    Keys, get_provider,
    utils::{AlloyProvider, EtherSwap},
};
use alloy::{
    network::AnyNetwork,
    primitives::{Address, FixedBytes, U256},
};
use anyhow::Result;

pub async fn lock_ether(
    rpc_url: &str,
    keys: Keys,
    contract: Address,
    preimage_hash: FixedBytes<32>,
    amount: crate::parsers::Amount,
    claim_address: Address,
    timelock: u64,
) -> Result<String> {
    let (provider, _) = get_provider(rpc_url, keys)?;
    let contract = EtherSwap::new(contract, provider);

    let tx = contract
        .lock_0(preimage_hash, claim_address, U256::from(timelock))
        .value(amount.try_into()?)
        .send()
        .await?
        .with_required_confirmations(1)
        .watch()
        .await?;

    Ok(format!("0x{}", alloy::hex::encode(tx)))
}

pub async fn claim_ether(
    rpc_url: &str,
    keys: Keys,
    contract: Address,
    preimage: FixedBytes<32>,
    query_start_height: u64,
) -> Result<String> {
    let (provider, _) = get_provider(rpc_url, keys)?;
    let contract = EtherSwap::new(contract, provider);

    let preimage_hash =
        FixedBytes::<32>::from(bitcoin_hashes::Sha256::hash(preimage.as_slice()).as_byte_array());

    let lockup = scan_swap_data(&contract, preimage_hash, query_start_height).await?;

    let tx = contract
        .claim_2(
            preimage,
            lockup.amount,
            lockup.refundAddress,
            lockup.timelock,
        )
        .send()
        .await?
        .with_required_confirmations(1)
        .watch()
        .await?;

    Ok(format!("0x{}", alloy::hex::encode(tx)))
}

pub async fn refund_ether(
    rpc_url: &str,
    keys: Keys,
    contract: Address,
    preimage_hash: FixedBytes<32>,
    query_start_height: u64,
) -> Result<String> {
    let (provider, _) = get_provider(rpc_url, keys)?;
    let contract = EtherSwap::new(contract, provider);

    let lockup = scan_swap_data(&contract, preimage_hash, query_start_height).await?;

    let tx = contract
        .refund_0(
            preimage_hash,
            lockup.amount,
            lockup.claimAddress,
            lockup.timelock,
        )
        .send()
        .await?
        .with_required_confirmations(1)
        .watch()
        .await?;

    Ok(format!("0x{}", alloy::hex::encode(tx)))
}

async fn scan_swap_data(
    contract: &EtherSwap::EtherSwapInstance<AlloyProvider, AnyNetwork>,
    preimage_hash: FixedBytes<32>,
    query_start_height: u64,
) -> Result<EtherSwap::Lockup> {
    let logs = contract
        .Lockup_filter()
        .topic1(preimage_hash)
        .from_block(query_start_height)
        .query()
        .await?;

    let lockup = logs
        .into_iter()
        .next()
        .ok_or(anyhow::anyhow!("no lockup found"))?;
    Ok(lockup.0)
}

use crate::evm::{Keys, get_provider};
use alloy::primitives::{Address, FixedBytes, U256};
use anyhow::Result;
use boltz_evm::contracts::ether_swap::EtherSwapContract;

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
    let contract = EtherSwapContract::new(contract, provider.clone()).await?;

    let tx = contract
        .lock_funds(
            preimage_hash,
            claim_address,
            U256::from(timelock),
            amount.try_into()?,
        )
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
    let contract = EtherSwapContract::new(contract, provider.clone()).await?;

    let preimage_hash =
        FixedBytes::<32>::from(bitcoin_hashes::Sha256::hash(preimage.as_slice()).as_byte_array());

    let lockup = contract
        .find_lockup(preimage_hash, query_start_height)
        .await?;

    let tx = contract
        .claim(
            preimage,
            lockup.amount,
            lockup.refund_address,
            lockup.timelock,
        )
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
    let contract = EtherSwapContract::new(contract, provider.clone()).await?;

    let lockup = contract
        .find_lockup(preimage_hash, query_start_height)
        .await?;

    let tx = contract
        .refund(
            preimage_hash,
            lockup.amount,
            lockup.claim_address,
            lockup.timelock,
        )
        .await?;

    Ok(format!("0x{}", alloy::hex::encode(tx)))
}

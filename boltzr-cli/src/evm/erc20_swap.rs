use crate::evm::{
    Keys, get_provider,
    utils::{amount_to_token_units, token_decimals},
};
use alloy::primitives::{Address, FixedBytes, U256};
use anyhow::Result;
use boltz_evm::contracts::erc20_swap::ERC20SwapContract;

#[allow(clippy::too_many_arguments)]
pub async fn lock_erc20(
    rpc_url: &str,
    keys: Keys,
    contract: Address,
    token: Address,
    preimage_hash: FixedBytes<32>,
    amount: crate::parsers::Amount,
    claim_address: Address,
    timelock: u64,
) -> Result<String> {
    let (provider, _) = get_provider(rpc_url, keys)?;

    let decimals = token_decimals(&provider, token).await;
    let token_amount = amount_to_token_units(amount, decimals)?;

    let contract = ERC20SwapContract::new(contract, provider.clone()).await?;

    let tx = contract
        .lock_funds(
            preimage_hash,
            token_amount,
            token,
            claim_address,
            U256::from(timelock),
        )
        .await?;

    Ok(format!("0x{}", alloy::hex::encode(tx)))
}

pub async fn claim_erc20(
    rpc_url: &str,
    keys: Keys,
    contract: Address,
    token: Address,
    preimage: FixedBytes<32>,
    query_start_height: u64,
) -> Result<String> {
    let (provider, _) = get_provider(rpc_url, keys)?;
    let contract = ERC20SwapContract::new(contract, provider.clone()).await?;

    let preimage_hash =
        FixedBytes::<32>::from(bitcoin_hashes::Sha256::hash(preimage.as_slice()).as_byte_array());

    let lockup = contract
        .find_lockup(preimage_hash, token, query_start_height)
        .await?;

    let tx = contract
        .claim(
            preimage,
            lockup.amount,
            lockup.token_address,
            lockup.refund_address,
            lockup.timelock,
        )
        .await?;

    Ok(format!("0x{}", alloy::hex::encode(tx)))
}

pub async fn refund_erc20(
    rpc_url: &str,
    keys: Keys,
    contract: Address,
    token: Address,
    preimage_hash: FixedBytes<32>,
    query_start_height: u64,
) -> Result<String> {
    let (provider, _) = get_provider(rpc_url, keys)?;
    let contract = ERC20SwapContract::new(contract, provider.clone()).await?;

    let lockup = contract
        .find_lockup(preimage_hash, token, query_start_height)
        .await?;

    let tx = contract
        .refund(
            preimage_hash,
            lockup.amount,
            lockup.token_address,
            lockup.claim_address,
            lockup.timelock,
        )
        .await?;

    Ok(format!("0x{}", alloy::hex::encode(tx)))
}

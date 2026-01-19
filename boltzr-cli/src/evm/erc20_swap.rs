use crate::evm::{
    Keys, get_provider,
    utils::{ERC20Swap, amount_to_token_units, token_decimals},
};
use alloy::{
    network::AnyNetwork,
    primitives::{Address, FixedBytes, U256},
    providers::DynProvider,
};
use anyhow::Result;

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

    let contract = ERC20Swap::new(contract, provider);

    let tx = contract
        .lock_0(
            preimage_hash,
            token_amount,
            token,
            claim_address,
            U256::from(timelock),
        )
        .send()
        .await?
        .with_required_confirmations(1)
        .watch()
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
    let contract = ERC20Swap::new(contract, provider);

    let preimage_hash =
        FixedBytes::<32>::from(bitcoin_hashes::Sha256::hash(preimage.as_slice()).as_byte_array());

    let lockup = scan_swap_data(&contract, preimage_hash, token, query_start_height).await?;

    let tx = contract
        .claim_3(
            preimage,
            lockup.amount,
            lockup.tokenAddress,
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

pub async fn refund_erc20(
    rpc_url: &str,
    keys: Keys,
    contract: Address,
    token: Address,
    preimage_hash: FixedBytes<32>,
    query_start_height: u64,
) -> Result<String> {
    let (provider, _) = get_provider(rpc_url, keys)?;
    let contract = ERC20Swap::new(contract, provider);

    let lockup = scan_swap_data(&contract, preimage_hash, token, query_start_height).await?;

    let tx = contract
        .refund_1(
            preimage_hash,
            lockup.amount,
            lockup.tokenAddress,
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
    contract: &ERC20Swap::ERC20SwapInstance<DynProvider<AnyNetwork>, AnyNetwork>,
    preimage_hash: FixedBytes<32>,
    token: Address,
    query_start_height: u64,
) -> Result<ERC20Swap::Lockup> {
    let logs = contract
        .Lockup_filter()
        .topic1(preimage_hash)
        .from_block(query_start_height)
        .query()
        .await?;

    let lockup = logs
        .into_iter()
        .find(|log| log.0.tokenAddress == token)
        .ok_or(anyhow::anyhow!("no lockup found"))?;

    Ok(lockup.0)
}

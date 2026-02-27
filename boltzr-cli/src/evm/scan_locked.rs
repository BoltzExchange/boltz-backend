use crate::evm::{
    Keys,
    utils::{get_provider, token_decimals_or},
};
use alloy::{
    primitives::{Address, B256, U256},
    providers::Provider,
    signers::local::PrivateKeySigner,
};
use anyhow::{Result, anyhow};
use boltz_evm::contracts::erc20_swap::ERC20SwapContract;
use boltz_evm::contracts::ether_swap::EtherSwapContract;
use indicatif::ProgressBar;
use serde::Serialize;
use std::collections::BTreeMap;

#[derive(Serialize, Debug, Clone)]
struct LockedFunds {
    transaction_hash: B256,
    #[serde(serialize_with = "crate::serde::hex::serialize")]
    preimage_hash: Vec<u8>,
    claim_address: Address,
    refund_address: Address,
    #[serde(skip_serializing_if = "Option::is_none")]
    token_address: Option<Address>,
    #[serde(serialize_with = "crate::serde::u256::serialize_base10")]
    timelock: U256,
    #[serde(serialize_with = "crate::serde::u256::serialize_base10")]
    amount: U256,
}

macro_rules! collect_active_lockups {
    ($contract:expr, $from_block:expr, $to_block:expr, $token_mapper:expr) => {{
        let logs = $contract.lockups_in_range($from_block, $to_block).await?;
        let contract_ref = $contract;
        let token_mapper = $token_mapper;

        let lockup_values = logs.iter().map(|lockup| lockup.lockup).collect::<Vec<_>>();
        let active_flags = contract_ref.are_lockups_active(&lockup_values).await?;
        if active_flags.len() != logs.len() {
            return Err(anyhow::anyhow!("multicall result length mismatch"));
        }

        logs.into_iter()
            .zip(active_flags.into_iter())
            .filter_map(|(lockup, is_active)| is_active.then_some(lockup))
            .into_iter()
            .map(|lockup| {
                Ok(LockedFunds {
                    transaction_hash: lockup
                        .transaction_hash
                        .ok_or(anyhow::anyhow!("No transaction hash"))?,
                    preimage_hash: lockup.lockup.preimage_hash.to_vec(),
                    claim_address: lockup.lockup.claim_address,
                    refund_address: lockup.lockup.refund_address,
                    token_address: token_mapper(&lockup.lockup),
                    timelock: lockup.lockup.timelock,
                    amount: lockup.lockup.amount,
                })
            })
            .collect::<Result<Vec<_>>>()
    }};
}

fn ten_pow(exp: u8) -> Result<U256> {
    U256::from(10u8)
        .checked_pow(U256::from(exp))
        .ok_or_else(|| anyhow!("amount overflow"))
}

fn normalize_to_8_decimals(amount: U256, decimals: u8) -> Result<U256> {
    match decimals.cmp(&8) {
        std::cmp::Ordering::Equal => Ok(amount),
        std::cmp::Ordering::Greater => {
            let divisor = ten_pow(decimals - 8)?;
            Ok(amount.div_ceil(divisor))
        }
        std::cmp::Ordering::Less => {
            let multiplier = ten_pow(8 - decimals)?;
            amount
                .checked_mul(multiplier)
                .ok_or_else(|| anyhow!("amount overflow"))
        }
    }
}

pub async fn scan_locked_in_contract(
    rpc_url: &str,
    address: Address,
    start_height: u64,
    scan_interval: u64,
    erc20: bool,
) -> Result<()> {
    // Random keys because we are just scanning the chain here
    let (provider, _) = get_provider(rpc_url, Keys::Signer(PrivateKeySigner::random()))?;
    let latest_block = provider.get_block_number().await?;
    let total_blocks =
        latest_block.saturating_sub(start_height) + u64::from(start_height <= latest_block);
    let pb = ProgressBar::new(total_blocks);

    let mut locked_swaps = Vec::new();
    let erc20_contract = if erc20 {
        Some(ERC20SwapContract::new(address, provider.clone()).await?)
    } else {
        None
    };
    let ether_contract = if erc20 {
        None
    } else {
        Some(EtherSwapContract::new(address, provider.clone()).await?)
    };

    let mut current_block = start_height;
    while current_block <= latest_block {
        let to = std::cmp::min(
            current_block.saturating_add(scan_interval.saturating_sub(1)),
            latest_block,
        );

        let mut range_lockups = if let Some(contract) = erc20_contract.as_ref() {
            collect_active_lockups!(
                contract,
                current_block,
                to,
                |lockup: &boltz_evm::contracts::erc20_swap::ERC20SwapLockup| {
                    Some(lockup.token_address)
                }
            )?
        } else {
            collect_active_lockups!(
                ether_contract
                    .as_ref()
                    .ok_or(anyhow::anyhow!("No contract available for scan mode"))?,
                current_block,
                to,
                |_lockup: &boltz_evm::contracts::ether_swap::EtherSwapLockup| None
            )?
        };
        locked_swaps.append(&mut range_lockups);

        pb.inc(to.saturating_sub(current_block) + 1);
        if to == latest_block {
            break;
        }
        current_block = to.saturating_add(1);
    }

    pb.finish_and_clear();

    println!(
        "Scanned {} blocks from {} to {}",
        total_blocks, start_height, latest_block
    );
    println!("Locked swaps: {}", locked_swaps.len());

    let mut token_decimals = BTreeMap::<Address, u8>::new();
    for swap in &locked_swaps {
        let token = swap.token_address.unwrap_or(Address::ZERO);
        if token_decimals.contains_key(&token) {
            continue;
        }

        let decimals = if token == Address::ZERO {
            18
        } else {
            token_decimals_or(&provider, token, 18).await
        };
        token_decimals.insert(token, decimals);
    }

    for swap in &mut locked_swaps {
        let token = swap.token_address.unwrap_or(Address::ZERO);
        let decimals = *token_decimals
            .get(&token)
            .ok_or(anyhow!("missing decimals for token {}", token))?;
        swap.amount = normalize_to_8_decimals(swap.amount, decimals)?;
    }

    let mut totals_by_token = BTreeMap::<Address, U256>::new();
    for swap in &locked_swaps {
        let token = swap.token_address.unwrap_or(Address::ZERO);
        let entry = totals_by_token.entry(token).or_insert(U256::ZERO);
        *entry += swap.amount;
    }

    let mut totals_by_token_normalized = BTreeMap::<String, String>::new();
    for (token, amount) in totals_by_token {
        totals_by_token_normalized.insert(token.to_string(), amount.to_string());
    }
    println!(
        "Total amount by token: {}",
        serde_json::to_string_pretty(&totals_by_token_normalized)?
    );
    println!();

    println!("{}", serde_json::to_string_pretty(&locked_swaps)?);

    Ok(())
}

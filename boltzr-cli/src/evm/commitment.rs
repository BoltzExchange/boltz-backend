use crate::evm::{Keys, get_provider, utils::ERC20Swap, utils::EtherSwap};
use alloy::{
    network::AnyNetwork,
    primitives::{Address, B256, FixedBytes, U256},
    providers::{DynProvider, Provider},
    rpc::types::Log,
    signers::Signer,
    sol_types::{Eip712Domain, SolStruct},
};
use anyhow::{Result, anyhow, bail};

mod ether_swap_commit {
    use alloy::sol;

    sol! {
        struct Commit {
            bytes32 preimageHash;
            uint256 amount;
            address claimAddress;
            address refundAddress;
            uint256 timelock;
        }
    }
}

mod erc20_swap_commit {
    use alloy::sol;

    sol! {
        struct Commit {
            bytes32 preimageHash;
            uint256 amount;
            address tokenAddress;
            address claimAddress;
            address refundAddress;
            uint256 timelock;
        }
    }
}

struct LockupEvent {
    amount: U256,
    claim_address: Address,
    timelock: U256,
    token_address: Option<Address>,
}

pub async fn sign_commitment_from_tx(
    rpc_url: &str,
    keys: Keys,
    contract: Address,
    preimage_hash: FixedBytes<32>,
    lockup_tx_hash: FixedBytes<32>,
) -> Result<String> {
    let (provider, signer) = get_provider(rpc_url, keys)?;

    let receipt = provider
        .get_transaction_receipt(B256::from(lockup_tx_hash.0))
        .await?
        .ok_or_else(|| anyhow!("transaction receipt not found"))?;

    let lockup = parse_lockup_from_receipt(contract, receipt.inner.logs())?;

    let refund_address = signer.address();
    let chain_id = provider.get_chain_id().await?;

    let signature = match lockup.token_address {
        Some(token_address) => {
            sign_erc20_commitment(
                &provider,
                &signer,
                contract,
                chain_id,
                preimage_hash,
                lockup.amount,
                token_address,
                lockup.claim_address,
                refund_address,
                lockup.timelock,
            )
            .await?
        }
        None => {
            sign_ether_commitment(
                &provider,
                &signer,
                contract,
                chain_id,
                preimage_hash,
                lockup.amount,
                lockup.claim_address,
                refund_address,
                lockup.timelock,
            )
            .await?
        }
    };

    Ok(format!("0x{}", alloy::hex::encode(signature.as_bytes())))
}

fn parse_lockup_from_receipt(contract: Address, logs: &[Log]) -> Result<LockupEvent> {
    for log in logs {
        if log.address() != contract {
            continue;
        }

        if let Ok(event) = log.log_decode::<EtherSwap::Lockup>() {
            return Ok(LockupEvent {
                amount: event.inner.amount,
                claim_address: event.inner.claimAddress,
                timelock: event.inner.timelock,
                token_address: None,
            });
        }

        if let Ok(event) = log.log_decode::<ERC20Swap::Lockup>() {
            return Ok(LockupEvent {
                amount: event.inner.amount,
                claim_address: event.inner.claimAddress,
                timelock: event.inner.timelock,
                token_address: Some(event.inner.tokenAddress),
            });
        }
    }

    bail!("no lockup event found in transaction")
}

#[allow(clippy::too_many_arguments)]
async fn sign_ether_commitment(
    provider: &DynProvider<AnyNetwork>,
    signer: &impl Signer,
    contract: Address,
    chain_id: u64,
    preimage_hash: FixedBytes<32>,
    amount: U256,
    claim_address: Address,
    refund_address: Address,
    timelock: U256,
) -> Result<alloy::signers::Signature> {
    let ether_swap = EtherSwap::new(contract, provider);
    let version = ether_swap.version().call().await?;

    let domain = Eip712Domain::new(
        Some("EtherSwap".into()),
        Some(version.to_string().into()),
        Some(U256::from(chain_id)),
        Some(contract),
        None,
    );

    let commit = ether_swap_commit::Commit {
        preimageHash: preimage_hash,
        amount,
        claimAddress: claim_address,
        refundAddress: refund_address,
        timelock,
    };

    let digest = commit.eip712_signing_hash(&domain);
    let signature = signer.sign_hash(&digest).await?;
    Ok(signature)
}

#[allow(clippy::too_many_arguments)]
async fn sign_erc20_commitment(
    provider: &DynProvider<AnyNetwork>,
    signer: &impl Signer,
    contract: Address,
    chain_id: u64,
    preimage_hash: FixedBytes<32>,
    amount: U256,
    token_address: Address,
    claim_address: Address,
    refund_address: Address,
    timelock: U256,
) -> Result<alloy::signers::Signature> {
    let erc20_swap = ERC20Swap::new(contract, provider);
    let version = erc20_swap.version().call().await?;

    let domain = Eip712Domain::new(
        Some("ERC20Swap".into()),
        Some(version.to_string().into()),
        Some(U256::from(chain_id)),
        Some(contract),
        None,
    );

    let commit = erc20_swap_commit::Commit {
        preimageHash: preimage_hash,
        amount,
        tokenAddress: token_address,
        claimAddress: claim_address,
        refundAddress: refund_address,
        timelock,
    };

    let digest = commit.eip712_signing_hash(&domain);
    let signature = signer.sign_hash(&digest).await?;
    Ok(signature)
}

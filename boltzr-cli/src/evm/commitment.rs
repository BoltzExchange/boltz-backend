use crate::evm::{Keys, get_provider, lockup::parse_lockup_from_receipt};
use alloy::{
    primitives::{Address, B256, FixedBytes},
    providers::Provider,
};
use anyhow::{Result, anyhow};
use boltz_evm::contracts::erc20_swap::ERC20SwapContract;
use boltz_evm::contracts::ether_swap::EtherSwapContract;
use boltz_evm::{SwapType, SwapValues};

pub async fn sign_commitment_from_tx(
    rpc_url: &str,
    keys: Keys,
    contract: Address,
    preimage_hash: FixedBytes<32>,
    lockup_tx_hash: FixedBytes<32>,
) -> Result<alloy::signers::Signature> {
    let (provider, signer) = get_provider(rpc_url, keys)?;

    let receipt = provider
        .get_transaction_receipt(B256::from(lockup_tx_hash.0))
        .await?
        .ok_or_else(|| anyhow!("transaction receipt not found"))?;

    let lockup = parse_lockup_from_receipt(contract, receipt.inner.logs())?;
    let refund_address = signer.address();

    let (swap_type, token_address, domain) = match lockup.token_address {
        Some(token_address) => {
            let erc20_swap = ERC20SwapContract::new(contract, provider.clone()).await?;
            (
                SwapType::ERC20,
                Some(token_address),
                erc20_swap.eip712_domain().clone(),
            )
        }
        None => {
            let ether_swap = EtherSwapContract::new(contract, provider.clone()).await?;
            (SwapType::Ether, None, ether_swap.eip712_domain().clone())
        }
    };

    let values = SwapValues {
        swap_type,
        preimage_hash,
        amount: lockup.amount,
        token_address,
        claim_address: lockup.claim_address,
        timelock: lockup.timelock,
    };

    let signature = boltz_evm::commitment::sign(&signer, &domain, &values, refund_address).await?;

    Ok(signature)
}

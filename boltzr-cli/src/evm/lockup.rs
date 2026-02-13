use crate::evm::utils::{ERC20Swap, EtherSwap};
use alloy::{
    primitives::{Address, U256},
    rpc::types::Log,
};
use anyhow::{Result, bail};

pub(crate) struct LockupEvent {
    pub(crate) amount: U256,
    pub(crate) claim_address: Address,
    pub(crate) timelock: U256,
    pub(crate) token_address: Option<Address>,
}

pub(crate) fn parse_lockup_from_receipt(contract: Address, logs: &[Log]) -> Result<LockupEvent> {
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

use alloy::{
    primitives::{Address, U256},
    rpc::types::Log,
};
use anyhow::{Result, bail};
use boltz_evm::contracts::erc20_swap::ERC20SwapContract;
use boltz_evm::contracts::ether_swap::EtherSwapContract;

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

        if let Some(event) = EtherSwapContract::decode_lockup_log(log) {
            return Ok(LockupEvent {
                amount: event.amount,
                claim_address: event.claim_address,
                timelock: event.timelock,
                token_address: None,
            });
        }

        if let Some(event) = ERC20SwapContract::decode_lockup_log(log) {
            return Ok(LockupEvent {
                amount: event.amount,
                claim_address: event.claim_address,
                timelock: event.timelock,
                token_address: Some(event.token_address),
            });
        }
    }

    bail!("no lockup event found in transaction")
}

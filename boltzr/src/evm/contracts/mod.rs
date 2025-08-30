use alloy::dyn_abi::Eip712Domain;
use alloy::primitives::{Address, FixedBytes, U256};

pub mod erc20_swap;
pub mod ether_swap;

pub trait SwapContract {
    fn address(&self) -> &Address;
    fn version(&self) -> u8;

    fn refund_hash(
        &self,
        domain: &Eip712Domain,
        preimage_hash: FixedBytes<32>,
        amount: U256,
        token_address: Address,
        claim_address: Address,
        timelock: U256,
    ) -> FixedBytes<32>;
    fn eip712_domain(&self) -> &Eip712Domain;
}

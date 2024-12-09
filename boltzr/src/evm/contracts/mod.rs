use alloy::dyn_abi::Eip712Domain;
use alloy::primitives::Address;

pub mod erc20_swap;
pub mod ether_swap;

pub trait SwapContract {
    fn address(&self) -> &Address;
    fn version(&self) -> u8;

    fn eip712_domain(&self) -> &Eip712Domain;
}

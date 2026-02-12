use alloy::dyn_abi::Eip712Domain;
use alloy::primitives::{Address, FixedBytes, U256};
use anyhow::{Result, bail};

pub mod commitment;
pub mod refund;

pub const MIN_CONTRACT_VERSION: u8 = 3;
pub const MAX_CONTRACT_VERSION: u8 = 5;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum SwapType {
    Ether,
    ERC20,
}

impl SwapType {
    pub(crate) fn domain_name(self) -> &'static str {
        match self {
            SwapType::Ether => "EtherSwap",
            SwapType::ERC20 => "ERC20Swap",
        }
    }
}

/// Common parameters that describe a swap lockup.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct SwapValues {
    pub swap_type: SwapType,
    pub preimage_hash: FixedBytes<32>,
    pub amount: U256,
    pub token_address: Option<Address>,
    pub claim_address: Address,
    pub timelock: U256,
}

pub(crate) fn ensure_supported_version(version: u8) -> Result<()> {
    if !(MIN_CONTRACT_VERSION..=MAX_CONTRACT_VERSION).contains(&version) {
        bail!("unsupported contract version {}", version);
    }

    Ok(())
}

pub fn eip712_domain(
    swap_type: SwapType,
    contract_version: u8,
    chain_id: u64,
    contract_address: Address,
) -> Result<Eip712Domain> {
    ensure_supported_version(contract_version)?;

    Ok(Eip712Domain::new(
        Some(swap_type.domain_name().into()),
        Some(contract_version.to_string().into()),
        Some(U256::from(chain_id)),
        Some(contract_address),
        None,
    ))
}

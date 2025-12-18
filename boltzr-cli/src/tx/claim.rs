use crate::tx::utils::construct_transaction;
use anyhow::Result;
use boltz_core::{Network, Transaction, utils::InputType};

#[allow(clippy::too_many_arguments)]
pub fn claim_utxo(
    network: Network,
    preimage: Vec<u8>,
    private_key: Vec<u8>,
    swap_tree_or_redeem_script: &str,
    raw_transaction: Vec<u8>,
    destination_address: &str,
    fee_per_vbyte: f64,
    blinding_key: Option<Vec<u8>>,
) -> Result<Transaction> {
    let preimage: [u8; 32] = preimage.try_into().map_err(|v: Vec<u8>| {
        anyhow::anyhow!("preimage must be exactly 32 bytes, got {}", v.len())
    })?;

    construct_transaction(
        network,
        InputType::Claim(preimage),
        private_key,
        swap_tree_or_redeem_script,
        raw_transaction,
        destination_address,
        fee_per_vbyte,
        blinding_key,
    )
}

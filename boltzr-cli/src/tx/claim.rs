use crate::tx::utils::construct_transaction;
use anyhow::Result;
use boltz_core::{Network, Transaction, utils::InputType};

#[allow(clippy::too_many_arguments)]
pub fn claim_utxo(
    network: Network,
    preimage: [u8; 32],
    private_key: [u8; 32],
    swap_tree_or_redeem_script: &str,
    raw_transaction: Vec<u8>,
    destination_address: &str,
    fee_per_vbyte: f64,
    blinding_key: Option<[u8; 32]>,
) -> Result<Transaction> {
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

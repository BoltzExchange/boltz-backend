use crate::utils::{OutputType, Transaction as TTransaction};
use bitcoin::{
    Amount, OutPoint, ScriptBuf, TxOut, XOnlyPublicKey, key::Keypair, transaction::Transaction,
};

mod claim;
mod scripts;

pub use claim::claim;
pub use scripts::*;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct UncooperativeDetails {
    tree: Tree,
    internal_key: XOnlyPublicKey,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ClaimDetail {
    output_type: OutputType,
    outpoint: OutPoint,
    tx_out: TxOut,
    amount: Amount,
    preimage: [u8; 32],
    keys: Keypair,

    witness_script: Option<ScriptBuf>,
    uncooperative: Option<UncooperativeDetails>,
}

impl TTransaction for Transaction {
    fn vsize(&self) -> usize {
        self.vsize()
    }

    fn input_len(&self) -> usize {
        self.input.len()
    }
}

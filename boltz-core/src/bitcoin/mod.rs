use crate::utils::{OutputType, Transaction as TTransaction, TxIn as TTxIn};
use bitcoin::{
    OutPoint, ScriptBuf, TxOut, XOnlyPublicKey,
    key::Keypair,
    script::Instruction,
    transaction::{Transaction, TxIn},
};

mod scripts;
mod tx;

pub use scripts::*;
pub use tx::construct_tx;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct UncooperativeDetails {
    tree: Tree,
    internal_key: XOnlyPublicKey,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct InputDetail {
    output_type: OutputType,
    outpoint: OutPoint,
    tx_out: TxOut,
    keys: Keypair,
    preimage: Option<[u8; 32]>,
    timeout_block_height: Option<u32>,

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

impl TTxIn for TxIn {
    fn witness(&self) -> Vec<Vec<u8>> {
        self.witness.to_vec()
    }

    fn script_sig_pushed_bytes(&self) -> Vec<Vec<u8>> {
        self.script_sig
            .instructions()
            .flatten()
            .filter_map(|inst| {
                if let Instruction::PushBytes(bytes) = inst {
                    Some(bytes.as_bytes().to_vec())
                } else {
                    None
                }
            })
            .collect()
    }
}

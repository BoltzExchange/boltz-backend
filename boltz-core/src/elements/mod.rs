use crate::utils::{InputType, OutputType, Transaction as TTransaction, TxIn as TTxIn};
use elements::{
    OutPoint, Script, Transaction, TxIn, TxOut,
    script::Instruction,
    secp256k1_zkp::{Keypair, XOnlyPublicKey},
};

mod scripts;
mod tx;

pub use scripts::*;
pub use tx::construct_tx;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct UncooperativeDetails {
    pub tree: Tree,
    pub internal_key: XOnlyPublicKey,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct InputDetail {
    pub input_type: InputType,
    pub output_type: OutputType<Option<UncooperativeDetails>, Script>,
    pub outpoint: OutPoint,
    pub tx_out: TxOut,
    pub blinding_key: Option<Keypair>,
    pub keys: Keypair,
}

impl TTransaction for Transaction {
    fn vsize(&self) -> usize {
        self.discount_vsize()
    }

    fn input_len(&self) -> usize {
        self.input.len()
    }
}

impl TTxIn for TxIn {
    fn witness(&self) -> Vec<Vec<u8>> {
        self.witness.script_witness.to_vec()
    }

    fn script_sig_pushed_bytes(&self) -> Vec<Vec<u8>> {
        self.script_sig
            .instructions()
            .flatten()
            .filter_map(|inst| {
                if let Instruction::PushBytes(bytes) = inst {
                    Some(bytes.to_vec())
                } else {
                    None
                }
            })
            .collect()
    }
}

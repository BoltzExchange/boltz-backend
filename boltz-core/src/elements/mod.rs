use crate::utils::{Transaction as TTransaction, TxIn as TTxIn};
use elements::{Transaction, TxIn, script::Instruction};

mod scripts;

pub use scripts::*;

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

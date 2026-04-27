//! Bitcoin swap scripts and transaction construction.
//!
//! Provides the script and Tapscript builders for submarine and reverse
//! swaps ([`swap_script`], [`swap_tree`], [`reverse_script`],
//! [`reverse_tree`]) plus the [`construct_tx`] entry point that signs and
//! serializes a claim or refund transaction from a slice of [`InputDetail`].

use crate::utils::{InputType, OutputType, Transaction as TTransaction, TxIn as TTxIn};
use bitcoin::{
    OutPoint, ScriptBuf, TxOut, XOnlyPublicKey,
    key::Keypair,
    script::Instruction,
    transaction::{Transaction, TxIn},
};

mod scripts;
mod tx;

pub use scripts::{Tapleaf, Tree, TreeError, reverse_script, reverse_tree, swap_script, swap_tree};
pub use tx::{TxError, construct_tx};

/// Information needed to spend a Taproot swap input via the script-path
/// (uncooperative) leg, when the cooperative MuSig2 key-path is unavailable.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct UncooperativeDetails {
    /// The Taproot script tree of the swap.
    pub tree: Tree,
    /// The Taproot internal key (typically the MuSig2-aggregated key).
    pub internal_key: XOnlyPublicKey,
}

/// One UTXO to spend when constructing a swap claim or refund transaction.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct InputDetail {
    /// Whether this input is being claimed (preimage) or refunded (locktime).
    pub input_type: InputType,
    /// The output script type, with the Taproot variant carrying optional
    /// uncooperative-spend details. `None` selects the key-path spend; `Some`
    /// selects the script-path spend using the supplied tree.
    pub output_type: OutputType<Option<UncooperativeDetails>, ScriptBuf>,
    /// The outpoint of the UTXO being spent.
    pub outpoint: OutPoint,
    /// The previous output (`scriptPubKey` + value) being spent.
    pub tx_out: TxOut,
    /// The keypair authorized to sign for this input.
    pub keys: Keypair,
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

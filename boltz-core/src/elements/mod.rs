//! Elements (Liquid) swap scripts and transaction construction.
//!
//! Mirrors the layout of the `bitcoin` module with Elements-specific
//! support for confidential outputs and asset introspection.
//! [`construct_tx`] handles unblinding inputs, building confidential
//! outputs, and signing; [`construct_asset_rescue`] recovers a non-L-BTC
//! asset accidentally sent to a swap address.

use crate::utils::{InputType, OutputType, Transaction as TTransaction, TxIn as TTxIn};
use elements::{
    OutPoint, Script, Transaction, TxIn, TxOut,
    script::Instruction,
    secp256k1_zkp::{Keypair, XOnlyPublicKey},
};

mod asset_rescue;
mod scripts;
mod tx;

pub use asset_rescue::{AssetPair, AssetRescueError, construct_asset_rescue};
pub use scripts::{
    ClaimCovenantParams, Tapleaf, Tree, TreeError, create_covenant_claim_leaf, reverse_script,
    reverse_tree, swap_script, swap_tree,
};
pub use tx::{TxError, construct_tx};

/// Information needed to spend an Elements Taproot swap input via the
/// script-path (uncooperative) leg, when the cooperative MuSig2 key-path
/// is unavailable.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct UncooperativeDetails {
    /// The Taproot script tree of the swap.
    pub tree: Tree,
    /// The Taproot internal key (typically the MuSig2-aggregated key).
    pub internal_key: XOnlyPublicKey,
}

/// One UTXO to spend when constructing an Elements swap claim or refund
/// transaction.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct InputDetail {
    /// Whether this input is being claimed (preimage) or refunded (locktime).
    pub input_type: InputType,
    /// The output script type, with the Taproot variant carrying optional
    /// uncooperative-spend details. `None` selects the key-path spend; `Some`
    /// selects the script-path spend using the supplied tree.
    pub output_type: OutputType<Option<UncooperativeDetails>, Script>,
    /// The outpoint of the UTXO being spent.
    pub outpoint: OutPoint,
    /// The previous output (`scriptPubKey` + commitments) being spent.
    pub tx_out: TxOut,
    /// Optional blinding key, required to unblind a confidential `tx_out`.
    pub blinding_key: Option<Keypair>,
    /// The keypair authorized to sign for this input.
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

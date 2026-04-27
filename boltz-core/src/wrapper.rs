//! Chain-agnostic facade over [`bitcoin::construct_tx`](crate::bitcoin::construct_tx)
//! and [`elements::construct_tx`](crate::elements::construct_tx).
//!
//! [`construct_tx`] dispatches on a [`Params`] enum and returns a unified
//! [`Transaction`] that can be serialized or queried for its txid without
//! caring which chain produced it.

use crate::{target_fee::FeeTarget, utils::Destination};
use bitcoin::{Address as BitcoinAddress, Transaction as BitcoinTransaction};
use elements::hex::ToHex;
use elements::pset::serialize::Serialize;
use elements::{Address as ElementsAddress, BlockHash, Transaction as ElementsTransaction};

pub use crate::bitcoin::InputDetail as BitcoinInputDetail;
pub use crate::elements::InputDetail as ElementsInputDetail;

/// Errors returned by the chain-agnostic [`construct_tx`].
#[derive(Debug, thiserror::Error)]
#[non_exhaustive]
pub enum WrapperError {
    /// The value held an Elements input detail but a Bitcoin one was requested.
    #[error("cannot convert Elements input detail to Bitcoin input detail")]
    NotBitcoin,
    /// The value held a Bitcoin input detail but an Elements one was requested.
    #[error("cannot convert Bitcoin input detail to Elements input detail")]
    NotElements,
    /// The Bitcoin transaction constructor failed.
    #[error(transparent)]
    Bitcoin(#[from] crate::bitcoin::TxError),
    /// The Elements transaction constructor failed.
    #[error(transparent)]
    Elements(#[from] crate::elements::TxError),
}

/// Chain-agnostic input detail. Boxes the per-chain payloads to keep the
/// enum small (`BitcoinInputDetail` and `ElementsInputDetail` differ
/// significantly in size).
#[derive(Debug, Clone, PartialEq)]
pub enum InputDetail {
    /// A Bitcoin input.
    Bitcoin(Box<BitcoinInputDetail>),
    /// An Elements input.
    Elements(Box<ElementsInputDetail>),
}

impl TryInto<BitcoinInputDetail> for InputDetail {
    type Error = WrapperError;

    fn try_into(self) -> Result<BitcoinInputDetail, Self::Error> {
        match self {
            InputDetail::Bitcoin(input) => Ok(*input),
            InputDetail::Elements(_) => Err(WrapperError::NotBitcoin),
        }
    }
}

impl TryInto<ElementsInputDetail> for InputDetail {
    type Error = WrapperError;

    fn try_into(self) -> Result<ElementsInputDetail, Self::Error> {
        match self {
            InputDetail::Bitcoin(_) => Err(WrapperError::NotElements),
            InputDetail::Elements(input) => Ok(*input),
        }
    }
}

/// Inputs for the Bitcoin branch of [`construct_tx`].
#[derive(Debug, Clone, PartialEq)]
pub struct BitcoinParams<'a> {
    /// UTXOs to spend.
    pub inputs: &'a [BitcoinInputDetail],
    /// Where to send the funds.
    pub destination: &'a Destination<'a, &'a BitcoinAddress>,
    /// Fee selection.
    pub fee: FeeTarget,
}

/// Inputs for the Elements branch of [`construct_tx`].
#[derive(Debug, Clone, PartialEq)]
pub struct ElementsParams<'a> {
    /// Network-specific Liquid genesis block hash (used in sighash domain separation).
    pub genesis_hash: BlockHash,
    /// UTXOs to spend.
    pub inputs: &'a [ElementsInputDetail],
    /// Where to send the funds.
    pub destination: &'a Destination<'a, &'a ElementsAddress>,
    /// Fee selection.
    pub fee: FeeTarget,
}

/// Per-chain parameters dispatched on by [`construct_tx`].
#[derive(Debug, Clone, PartialEq)]
pub enum Params<'a> {
    /// Build a Bitcoin transaction.
    Bitcoin(BitcoinParams<'a>),
    /// Build an Elements transaction.
    Elements(ElementsParams<'a>),
}

/// A constructed transaction on either chain.
#[derive(Debug, Clone, PartialEq)]
pub enum Transaction {
    /// A Bitcoin transaction.
    Bitcoin(BitcoinTransaction),
    /// An Elements transaction.
    Elements(ElementsTransaction),
}

impl Transaction {
    /// Hex-encoded transaction id.
    pub fn txid(&self) -> String {
        match self {
            Transaction::Bitcoin(tx) => tx.compute_txid().to_hex(),
            Transaction::Elements(tx) => tx.txid().to_hex(),
        }
    }

    /// Network-encoded serialized transaction bytes.
    pub fn serialize(&self) -> Vec<u8> {
        match self {
            Transaction::Bitcoin(tx) => tx.serialize(),
            Transaction::Elements(tx) => tx.serialize(),
        }
    }
}

/// Build, sign, and finalize a transaction on either chain, dispatched
/// by [`Params`]. See [`bitcoin::construct_tx`](crate::bitcoin::construct_tx)
/// and [`elements::construct_tx`](crate::elements::construct_tx) for the
/// per-chain semantics.
#[must_use = "ignoring the result discards the constructed transaction"]
pub fn construct_tx(params: &Params) -> Result<(Transaction, u64), WrapperError> {
    match params {
        Params::Bitcoin(params) => {
            let secp = bitcoin::secp256k1::Secp256k1::new();
            let (tx, fee) =
                crate::bitcoin::construct_tx(&secp, params.inputs, params.destination, params.fee)?;
            Ok((Transaction::Bitcoin(tx), fee))
        }
        Params::Elements(params) => {
            let secp = elements::secp256k1_zkp::Secp256k1::new();
            let (tx, fee) = crate::elements::construct_tx(
                &secp,
                params.genesis_hash,
                params.inputs,
                params.destination,
                params.fee,
            )?;
            Ok((Transaction::Elements(tx), fee))
        }
    }
}

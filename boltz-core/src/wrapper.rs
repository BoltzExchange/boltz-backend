use crate::{target_fee::FeeTarget, utils::Destination};
use anyhow::Result;
use bitcoin::{Address as BitcoinAddress, Transaction as BitcoinTransaction};
use elements::hex::ToHex;
use elements::pset::serialize::Serialize;
use elements::{Address as ElementsAddress, BlockHash, Transaction as ElementsTransaction};

pub use crate::bitcoin::InputDetail as BitcoinInputDetail;
pub use crate::elements::InputDetail as ElementsInputDetail;

#[derive(Debug, Clone, PartialEq)]
pub enum InputDetail {
    Bitcoin(Box<BitcoinInputDetail>),
    Elements(Box<ElementsInputDetail>),
}

impl TryInto<BitcoinInputDetail> for InputDetail {
    type Error = anyhow::Error;

    fn try_into(self) -> Result<BitcoinInputDetail> {
        match self {
            InputDetail::Bitcoin(input) => Ok(*input),
            InputDetail::Elements(_) => Err(anyhow::anyhow!(
                "cannot convert Elements input detail to Bitcoin input detail"
            )),
        }
    }
}

impl TryInto<ElementsInputDetail> for InputDetail {
    type Error = anyhow::Error;

    fn try_into(self) -> Result<ElementsInputDetail> {
        match self {
            InputDetail::Bitcoin(_) => Err(anyhow::anyhow!(
                "cannot convert Bitcoin input detail to Elements input detail"
            )),
            InputDetail::Elements(input) => Ok(*input),
        }
    }
}

#[derive(Debug, Clone, PartialEq)]
pub struct BitcoinParams<'a> {
    pub inputs: &'a [&'a BitcoinInputDetail],
    pub destination: &'a Destination<'a, &'a BitcoinAddress>,
    pub fee: FeeTarget,
}

#[derive(Debug, Clone, PartialEq)]
pub struct ElementsParams<'a> {
    pub genesis_hash: BlockHash,
    pub inputs: &'a [&'a ElementsInputDetail],
    pub destination: &'a Destination<'a, &'a ElementsAddress>,
    pub fee: FeeTarget,
}

#[derive(Debug, Clone, PartialEq)]
pub enum Params<'a> {
    Bitcoin(BitcoinParams<'a>),
    Elements(ElementsParams<'a>),
}

#[derive(Debug, Clone, PartialEq)]
pub enum Transaction {
    Bitcoin(BitcoinTransaction),
    Elements(ElementsTransaction),
}

impl Transaction {
    pub fn txid(&self) -> String {
        match self {
            Transaction::Bitcoin(tx) => tx.compute_txid().to_hex(),
            Transaction::Elements(tx) => tx.txid().to_hex(),
        }
    }

    pub fn serialize(&self) -> Vec<u8> {
        match self {
            Transaction::Bitcoin(tx) => tx.serialize(),
            Transaction::Elements(tx) => tx.serialize(),
        }
    }
}

pub fn construct_tx(params: &Params) -> Result<Transaction> {
    match params {
        Params::Bitcoin(params) => {
            let secp = bitcoin::secp256k1::Secp256k1::new();
            Ok(Transaction::Bitcoin(crate::bitcoin::construct_tx(
                &secp,
                params.inputs,
                params.destination,
                params.fee,
            )?))
        }
        Params::Elements(params) => {
            let secp = elements::secp256k1_zkp::Secp256k1::new();
            Ok(Transaction::Elements(crate::elements::construct_tx(
                &secp,
                params.genesis_hash,
                params.inputs,
                params.destination,
                params.fee,
            )?))
        }
    }
}

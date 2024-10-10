use crate::chain::types::Type;
use alloy::hex;
use elements::pset::serialize::Serialize;
use lightning::util::ser::Writeable;

#[derive(Debug, Clone)]
pub enum Transaction {
    Bitcoin(bitcoin::Transaction),
    Elements(elements::Transaction),
}

impl Transaction {
    pub fn serialize(&self) -> Vec<u8> {
        match self {
            Transaction::Bitcoin(tx) => tx.serialize(),
            Transaction::Elements(tx) => tx.serialize(),
        }
    }

    pub fn input_outpoint_ids(&self) -> Vec<Vec<u8>> {
        match self {
            Transaction::Bitcoin(tx) => tx
                .input
                .iter()
                .map(|i| i.previous_output.txid.encode())
                .collect(),
            Transaction::Elements(tx) => tx
                .input
                .iter()
                .map(|i| i.previous_output.txid[..].to_vec())
                .collect(),
        }
    }

    pub fn output_script_pubkeys(&self) -> Vec<Vec<u8>> {
        match self {
            Transaction::Bitcoin(tx) => tx
                .output
                .iter()
                .map(|o| o.script_pubkey.to_bytes())
                .collect(),
            Transaction::Elements(tx) => tx
                .output
                .iter()
                .map(|o| o.script_pubkey.to_bytes())
                .collect(),
        }
    }
}

pub fn parse_transaction(
    transaction_type: &Type,
    transaction: String,
) -> anyhow::Result<Transaction> {
    let hex = hex::decode(transaction)?;

    match transaction_type {
        Type::Bitcoin => {
            let tx = bitcoin::consensus::deserialize(&hex)?;
            Ok(Transaction::Bitcoin(tx))
        }
        Type::Elements => {
            let tx = elements::encode::deserialize(&hex)?;
            Ok(Transaction::Elements(tx))
        }
    }
}


use anyhow::Result;
use payjoin::bitcoin::psbt::Psbt;
use payjoin::bitcoin::{
    Address, Network, Script, Transaction, Txid,
};
use payjoin::receive::InputPair;

/// Implementation of PayjoinWallet for bitcoind
#[derive(Clone, Debug)]
pub struct BitcoindWallet {

}

impl BitcoindWallet {
    pub fn new() -> Result<Self> {
        Ok(Self {})
    }
}

impl BitcoindWallet {
    /// Process a PSBT, validating and signing inputs owned by this wallet
    ///
    /// Does not include bip32 derivations in the PSBT
    pub fn process_psbt(&self, psbt: &Psbt) -> Result<Psbt> {
        let psbt_str = psbt.to_string();
        todo!("wallet process psbt");
    }

    /// Finalize a PSBT and extract the transaction
    pub fn finalize_psbt(&self, psbt: &Psbt) -> Result<Transaction> {
        todo!("wallet finalize psbt");
    }

    /// Check if a transaction can be broadcast
    pub fn can_broadcast(&self, tx: &Transaction) -> Result<bool> {
        // FIXME
        Ok(true)
    }

    /// Broadcast a raw transaction
    pub fn broadcast_tx(&self, tx: &Transaction) -> Result<Txid> {
        todo!("wallet broadcast tx");
    }

    /// Check if a script belongs to this wallet
    pub fn is_mine(&self, script: &Script) -> Result<bool> {
        if let Ok(_address) = Address::from_script(script, self.network()?) {
           // FIXME
           Ok(true)
        } else {
            Ok(false)
        }
    }

    /// Get a new address from the wallet
    pub fn get_new_address(&self) -> Result<Address> {
        todo!("get new address")
    }

    /// List unspent UTXOs
    pub fn list_unspent(&self) -> Result<Vec<InputPair>> {
        // FIXME
        Ok(vec![])
    }

    /// Get the network this wallet is operating on
    pub fn network(&self) -> Result<Network> {
        todo!("get network")
    }
}

pub fn input_pair_from_list_unspent(
    // utxo: bitcoincore_rpc::bitcoincore_rpc_json::ListUnspentResultEntry,
) -> InputPair {
    unimplemented!("input pair from list unspent")
}

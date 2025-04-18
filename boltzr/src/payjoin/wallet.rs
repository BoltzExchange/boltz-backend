use std::str::FromStr;
use std::sync::Arc;

use anyhow::{Context, Result, anyhow};
use bitcoin::consensus::Encodable;
use bitcoin::consensus::encode::{deserialize, serialize_hex};
use bitcoincore_rpc::{Auth, Client, RpcApi};
use payjoin::bitcoin::psbt::Psbt;
use payjoin::bitcoin::{Address, Network, Script, Transaction, Txid};
use payjoin::receive::InputPair;

/// Implementation of PayjoinWallet for bitcoind
#[derive(Clone, Debug)]
pub struct BitcoindWallet {
    pub bitcoind: Arc<Client>,
}

impl BitcoindWallet {
    /// Create a new BitcoindWallet
    ///
    /// FIXME get client from config argument
    pub fn new() -> Result<Self> {
        let client = Client::new(
            "127.0.0.1:18443/wallet/default",
            Auth::CookieFile("docker/regtest/data/core/cookies/.bitcoin-cookie".into()),
        )?;
        Ok(Self {
            bitcoind: Arc::new(client),
        })
    }
}

impl BitcoindWallet {
    /// Process a PSBT, validating and signing inputs owned by this wallet
    ///
    /// Does not include bip32 derivations in the PSBT
    pub fn process_psbt(&self, psbt: &Psbt) -> Result<Psbt> {
        let psbt_str = psbt.to_string();
        let processed = self
            .bitcoind
            .wallet_process_psbt(&psbt_str, None, None, Some(false))
            .context("Failed to process PSBT")?
            .psbt;
        Psbt::from_str(&processed).context("Failed to parse processed PSBT")
    }

    /// Finalize a PSBT and extract the transaction
    pub fn finalize_psbt(&self, psbt: &Psbt) -> Result<Transaction> {
        let result = self
            .bitcoind
            .finalize_psbt(&psbt.to_string(), Some(true))
            .context("Failed to finalize PSBT")?;
        let tx = deserialize(&result.hex.ok_or_else(|| anyhow!("Incomplete PSBT"))?)?;
        Ok(tx)
    }

    /// Check if a transaction can be broadcast
    pub fn can_broadcast(&self, tx: &Transaction) -> Result<bool> {
        let raw_tx = serialize_hex(&tx);
        let mempool_results = self.bitcoind.test_mempool_accept(&[raw_tx])?;
        match mempool_results.first() {
            Some(result) => Ok(result.allowed),
            None => Err(anyhow!("No mempool results returned on broadcast check",)),
        }
    }

    /// Broadcast a raw transaction
    pub fn broadcast_tx(&self, tx: &Transaction) -> Result<Txid> {
        let mut serialized_tx = Vec::new();
        tx.consensus_encode(&mut serialized_tx)?;
        self.bitcoind
            .send_raw_transaction(&serialized_tx)
            .context("Failed to broadcast transaction")
    }

    /// Check if a script belongs to this wallet
    /// HACK: checks directly against receive_address in the BIP21 URI
    pub fn is_mine(&self, script: &Script, receive_address: Address) -> Result<bool> {
        if let Ok(address) = Address::from_script(script, self.network()?) {
            // first check if address matches the receive address
            if address == receive_address {
                return Ok(true);
            }
            // then check bitcoind
            self.bitcoind
                .get_address_info(&address)
                .map(|info| info.is_mine.unwrap_or(false))
                .context("Failed to get address info")
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
        let unspent = self
            .bitcoind
            .list_unspent(None, None, None, None, None)
            .context("Failed to list unspent")?;
        Ok(unspent
            .into_iter()
            .map(input_pair_from_list_unspent)
            .collect())
    }

    /// Get the network this wallet is operating on
    pub fn network(&self) -> Result<Network> {
        self.bitcoind
            .get_blockchain_info()
            .map_err(|_| anyhow!("Failed to get blockchain info"))
            .map(|info| info.chain)
    }
}

pub fn input_pair_from_list_unspent(
    utxo: bitcoincore_rpc::bitcoincore_rpc_json::ListUnspentResultEntry,
) -> InputPair {
    use bitcoin::psbt::Input;
    use bitcoin::{OutPoint, TxIn, TxOut};

    let psbtin = Input {
        // NOTE: non_witness_utxo is not necessary because bitcoin-cli always supplies
        // witness_utxo, even for non-witness inputs
        witness_utxo: Some(TxOut {
            value: utxo.amount,
            script_pubkey: utxo.script_pub_key.clone(),
        }),
        redeem_script: utxo.redeem_script.clone(),
        witness_script: utxo.witness_script.clone(),
        ..Default::default()
    };
    let txin = TxIn {
        previous_output: OutPoint {
            txid: utxo.txid,
            vout: utxo.vout,
        },
        ..Default::default()
    };
    InputPair::new(txin, psbtin).expect("Input pair should be valid")
}

#[cfg(test)]
mod test {
    use super::*;

    /// Not much of a unit test but great for the hackathon
    /// make sure we can create a wallet with static config.
    ///
    /// ENSURE boltz/regtest docker container is running before this test
    #[test]
    fn new_wallet() {
        BitcoindWallet::new().unwrap();
    }
}

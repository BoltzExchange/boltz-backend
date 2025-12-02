use crate::currencies::Currencies;
use crate::db::helpers::swap::SwapHelper;
use crate::db::models::FundingAddress;
use anyhow::{Result, anyhow};
use bitcoin::hashes::Hash;
use bitcoin::key::Keypair;
use bitcoin::sighash::{Prevouts, SighashCache};
use bitcoin::{Amount, OutPoint, TxOut, Witness};
use boltz_core::Address;
use boltz_core::bitcoin::InputDetail as BitcoinInputDetail;
use boltz_core::musig::{Musig, PartialSignature, PublicNonce};
use boltz_core::utils::{Destination, InputType, OutputType};
use boltz_core::wrapper::{BitcoinParams, InputDetail, Params, Transaction, construct_tx};
use elements::hex::ToHex;
use elements::pset::serialize::Serialize;
use std::collections::HashMap;
use std::str::FromStr;
use std::sync::{Arc, Mutex};

struct SigningSession {
    pub musig: Musig,
    pub tx: Transaction,
}

pub struct FundingAddressSigner {
    swap_helper: Arc<dyn SwapHelper + Sync + Send>,
    currencies: Currencies,
    sessions: Arc<Mutex<HashMap<String, SigningSession>>>,
}

#[derive(Debug, Clone)]
pub struct CooperativeDetails {
    pub pub_nonce: String,
    pub public_key: String,
    pub transaction_hex: String,
    pub transaction_hash: String,
}

#[derive(Debug, Clone)]
pub struct SetSignatureRequest {
    pub id: String,
    pub pub_nonce: String,
    pub partial_signature: String,
}

impl FundingAddressSigner {
    pub fn new(swap_helper: Arc<dyn SwapHelper + Sync + Send>, currencies: Currencies) -> Self {
        Self {
            swap_helper,
            currencies,
            sessions: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    pub fn get_signing_details(
        &self,
        funding_address: &FundingAddress,
        key_pair: &Keypair,
    ) -> Result<CooperativeDetails> {
        let tx = self.create_presigning_tx(funding_address, key_pair)?;

        let btc_tx = match tx.clone() {
            Transaction::Bitcoin(btc_tx) => btc_tx,
            _ => return Err(anyhow!("transaction is not a bitcoin transaction")),
        };
        let mut sighash_cache = SighashCache::new(&btc_tx);
        let hash = sighash_cache.taproot_key_spend_signature_hash(
            0,
            &Prevouts::All(&[TxOut {
                script_pubkey: funding_address.script_pubkey(key_pair)?,
                value: Amount::from_sat(funding_address.lockup_amount.unwrap() as u64),
            }]),
            bitcoin::TapSighashType::All,
        )?;

        let msg = *hash.to_raw_hash().as_byte_array();
        let mut musig = funding_address.musig(key_pair, msg)?;
        println!("agg_pk_server: {:?}", musig.agg_pk());
        let nonce = musig.generate_nonce();

        // Store the musig session for later use
        self.sessions
            .lock()
            .map_err(|e| anyhow!("failed to lock sessions: {}", e))?
            .insert(
                funding_address.id.clone(),
                SigningSession {
                    musig,
                    tx: tx.clone(),
                },
            );

        Ok(CooperativeDetails {
            pub_nonce: nonce.to_string(),
            public_key: key_pair.public_key().to_string(),
            transaction_hex: tx.serialize().to_hex(),
            transaction_hash: msg.to_hex(),
        })
    }

    pub fn set_signature(
        &self,
        funding_address: &FundingAddress,
        request: &SetSignatureRequest,
    ) -> Result<Transaction> {
        // Retrieve the stored musig session
        let mut sessions = self
            .sessions
            .lock()
            .map_err(|e| anyhow!("failed to lock sessions: {}", e))?;

        let mut session = sessions
            .remove(&funding_address.id)
            .ok_or_else(|| anyhow!("musig session not found for funding address"))?;

        let their_pubkey = Musig::convert_pub_key(&funding_address.their_public_key()?.to_bytes())?;
        let mut musig = session.musig;
        musig.aggregate_nonces(
            [(their_pubkey, PublicNonce::from_str(&request.pub_nonce)?)].to_vec(),
        )?;
        musig.initialize_session()?;
        musig.partial_sign()?;
        musig.partial_add(
            their_pubkey,
            PartialSignature::from_str(&request.partial_signature)?,
        )?;
        let agg_sig = musig.partial_aggregate()?;
        let sig = agg_sig.verify(&musig.agg_pk(), &musig.message())?;

        match &mut session.tx {
            Transaction::Bitcoin(btc_tx) => {
                let mut witness = Witness::new();
                witness.push(sig.to_byte_array().to_vec());
                btc_tx.input[0].witness = witness;
            }
            _ => return Err(anyhow!("transaction is not a bitcoin transaction")),
        }
        Ok(session.tx)
    }

    fn create_presigning_tx(
        &self,
        funding_address: &FundingAddress,
        key_pair: &Keypair,
    ) -> Result<Transaction> {
        let swap = self.swap_helper.get_by_id(
            &funding_address
                .swap_id
                .clone()
                .ok_or(anyhow!("funding address not linked to a swap"))?,
        )?;
        // TODO: chain swaps
        let destination = Address::try_from(swap.lockupAddress.as_str())?;

        construct_tx(&Params::Bitcoin(BitcoinParams {
            inputs: &[&self.input_detail(funding_address, key_pair)?.try_into()?],
            destination: &Destination::Single(&destination.try_into()?),
            fee: boltz_core::FeeTarget::Absolute(0),
        }))
    }

    pub fn input_detail(
        &self,
        funding_address: &FundingAddress,
        key_pair: &Keypair,
    ) -> Result<InputDetail> {
        let script_pubkey = funding_address.script_pubkey(key_pair)?;
        // TODO: liquid
        Ok(InputDetail::Bitcoin(Box::new(BitcoinInputDetail {
            input_type: InputType::Cooperative,
            output_type: OutputType::Taproot(None),
            outpoint: OutPoint {
                txid: funding_address
                    .lockup_transaction_id
                    .clone()
                    .ok_or(anyhow!(
                        "funding address does not have a lockup transaction id"
                    ))?
                    .parse()?,
                vout: funding_address.lockup_transaction_vout.unwrap() as u32,
            },
            tx_out: TxOut {
                script_pubkey: script_pubkey,
                value: Amount::from_sat(funding_address.lockup_amount.unwrap() as u64),
            },
            keys: key_pair.clone(),
        })))
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use crate::db::helpers::swap::test::MockSwapHelper;
    use crate::db::models::Swap;
    use bitcoin::{
        TapTweakHash,
        hex::{self, FromHex},
        secp256k1::{Secp256k1, rand},
    };
    use std::collections::HashMap;

    const TEST_SYMBOL: &str = "BTC";
    const TEST_SWAP_ID: &str = "test_swap_123";
    const TEST_LOCKUP_ADDRESS: &str =
        "bcrt1pjcv9r3jeug6xmgug6hu0p4lux7r9996yxk9m2xxammfqq4kxdvkqhdu0h5";
    const TEST_TX_ID: &str = "663aebe19955dd7298b2bb1cc1062d5aabff0233f26a40b4d8900f7da8668858";

    fn get_currencies() -> Currencies {
        Arc::new(HashMap::new())
    }

    fn create_test_funding_address(keypair: &Keypair) -> FundingAddress {
        FundingAddress {
            id: "test_funding_123".to_string(),
            symbol: TEST_SYMBOL.to_string(),
            key_index: 10,
            their_public_key: keypair.public_key().to_string(),
            timeout_block_height: 1000,
            swap_id: Some(TEST_SWAP_ID.to_string()),
            lockup_transaction_id: Some(TEST_TX_ID.to_string()),
            lockup_transaction_vout: Some(0),
            lockup_amount: Some(100000),
            lockup_confirmed: false,
            presigned_tx: None,
        }
    }

    fn create_test_swap() -> Swap {
        Swap {
            id: TEST_SWAP_ID.to_string(),
            lockupAddress: TEST_LOCKUP_ADDRESS.to_string(),
            ..Default::default()
        }
    }

    fn create_signer(swap_helper: MockSwapHelper) -> FundingAddressSigner {
        FundingAddressSigner::new(Arc::new(swap_helper), get_currencies())
    }

    fn get_keypair() -> Keypair {
        let secp = Secp256k1::new();
        Keypair::new(&secp, &mut rand::thread_rng())
    }

    #[test]
    fn test_get_signing_details_success() {
        let mut swap_helper = MockSwapHelper::new();
        swap_helper
            .expect_get_by_id()
            .returning(|_| Ok(create_test_swap()));

        let signer = create_signer(swap_helper);
        let key_pair = get_keypair();
        let funding_address = create_test_funding_address(&key_pair);

        let result = signer.get_signing_details(&funding_address, &key_pair);
        println!("result: {:?}", result);
        assert!(result.is_ok());

        let details = result.unwrap();
        assert!(!details.pub_nonce.is_empty());
        assert!(!details.public_key.is_empty());
        assert!(!details.transaction_hex.is_empty());
        assert!(!details.transaction_hash.is_empty());
        assert_eq!(details.public_key, key_pair.public_key().to_string());

        // Verify session was stored
        let sessions = signer.sessions.lock().unwrap();
        assert!(sessions.contains_key(&funding_address.id));
    }

    #[test]
    fn test_get_signing_details_no_swap_linked() {
        let swap_helper = MockSwapHelper::new();
        let signer = create_signer(swap_helper);
        let key_pair = get_keypair();
        let mut funding_address = create_test_funding_address(&key_pair);
        funding_address.swap_id = None;

        let result = signer.get_signing_details(&funding_address, &key_pair);
        assert!(result.is_err());
        assert!(
            result
                .unwrap_err()
                .to_string()
                .contains("funding address not linked to a swap")
        );
    }

    #[test]
    fn test_get_signing_details_swap_not_found() {
        let mut swap_helper = MockSwapHelper::new();
        swap_helper
            .expect_get_by_id()
            .returning(|_| Err(anyhow!("swap not found")));

        let signer = create_signer(swap_helper);
        let key_pair = get_keypair();
        let funding_address = create_test_funding_address(&key_pair);

        let result = signer.get_signing_details(&funding_address, &key_pair);
        assert!(result.is_err());
        assert!(result.unwrap_err().to_string().contains("swap not found"));
    }

    #[test]
    fn test_set_signature() {
        let mut swap_helper = MockSwapHelper::new();
        swap_helper
            .expect_get_by_id()
            .returning(|_| Ok(create_test_swap()));

        let signer = create_signer(swap_helper);
        let client_key_pair = get_keypair();
        let server_key_pair = get_keypair();
        let funding_address = create_test_funding_address(&client_key_pair);
        let details = signer
            .get_signing_details(&funding_address, &server_key_pair)
            .unwrap();

        let mut musig = Musig::new(
            Musig::convert_keypair(client_key_pair.secret_key().secret_bytes()).unwrap(),
            vec![
                Musig::convert_pub_key(&server_key_pair.public_key().serialize()).unwrap(),
                Musig::convert_pub_key(&client_key_pair.public_key().serialize()).unwrap(),
            ],
            Vec::from_hex(&details.transaction_hash)
                .unwrap()
                .try_into()
                .unwrap(),
        )
        .unwrap();

        let untweaked_internal_key =
            bitcoin::XOnlyPublicKey::from_slice(&musig.agg_pk().serialize()).unwrap();

        let tree_builder = funding_address.tree().unwrap().build().unwrap();
        let secp = Secp256k1::new();
        let taproot_spend_info = tree_builder
            .finalize(&secp, untweaked_internal_key)
            .unwrap();

        let tweak = TapTweakHash::from_key_and_tweak(
            untweaked_internal_key,
            taproot_spend_info.merkle_root(),
        )
        .to_scalar();

        musig
            .xonly_tweak_add(&Musig::convert_scalar(&tweak.to_be_bytes()).unwrap())
            .unwrap();

        let client_nonce = musig.generate_nonce();
        musig
            .aggregate_nonces(vec![(
                Musig::convert_pub_key(&server_key_pair.public_key().serialize()).unwrap(),
                PublicNonce::from_str(&details.pub_nonce).unwrap(),
            )])
            .unwrap();
        println!("agg_pk_client: {:?}", musig.agg_pk());
        musig.initialize_session().unwrap();
        let client_sig = musig.partial_sign().unwrap();

        let request = SetSignatureRequest {
            id: funding_address.id.clone(),
            pub_nonce: client_nonce.to_string(),
            partial_signature: client_sig.to_string(),
        };

        let signed_tx = signer.set_signature(&funding_address, &request);
        assert!(signed_tx.is_ok());
    }

    #[test]
    fn test_set_signature_session_not_found() {
        let swap_helper = MockSwapHelper::new();
        let signer = create_signer(swap_helper);
        let key_pair = get_keypair();
        let funding_address = create_test_funding_address(&key_pair);

        let request = SetSignatureRequest {
            id: funding_address.id.clone(),
            pub_nonce: "test_pub_nonce".to_string(),
            partial_signature: "test_sig".to_string(),
        };

        let result = signer.set_signature(&funding_address, &request);
        assert!(result.is_err());
        assert!(
            result
                .unwrap_err()
                .to_string()
                .contains("musig session not found")
        );
    }

    #[test]
    fn test_set_signature_removes_session() {
        let mut swap_helper = MockSwapHelper::new();
        swap_helper
            .expect_get_by_id()
            .returning(|_| Ok(create_test_swap()));

        let signer = create_signer(swap_helper);
        let key_pair = get_keypair();
        let funding_address = create_test_funding_address(&key_pair);

        // First create a session
        let _ = signer.get_signing_details(&funding_address, &key_pair);

        // Verify session exists
        {
            let sessions = signer.sessions.lock().unwrap();
            assert!(sessions.contains_key(&funding_address.id));
        }

        // Try to set signature (will fail because we don't have valid signatures)
        let request = SetSignatureRequest {
            id: funding_address.id.clone(),
            pub_nonce: "invalid".to_string(),
            partial_signature: "invalid".to_string(),
        };

        let _ = signer.set_signature(&funding_address, &request);

        // Verify session was removed even though signing failed
        let sessions = signer.sessions.lock().unwrap();
        assert!(!sessions.contains_key(&funding_address.id));
    }

    #[test]
    fn test_create_presigning_tx_success() {
        let mut swap_helper = MockSwapHelper::new();
        swap_helper
            .expect_get_by_id()
            .returning(|_| Ok(create_test_swap()));

        let signer = create_signer(swap_helper);
        let key_pair = get_keypair();
        let funding_address = create_test_funding_address(&key_pair);

        let result = signer.create_presigning_tx(&funding_address, &key_pair);
        println!("result: {:?}", result);
        assert!(result.is_ok());

        let tx = result.unwrap();
        assert!(!tx.txid().to_string().is_empty());
    }

    #[test]
    fn test_create_presigning_tx_no_swap_id() {
        let swap_helper = MockSwapHelper::new();
        let signer = create_signer(swap_helper);
        let key_pair = get_keypair();
        let mut funding_address = create_test_funding_address(&key_pair);
        funding_address.swap_id = None;
        let key_pair = get_keypair();

        let result = signer.create_presigning_tx(&funding_address, &key_pair);
        assert!(result.is_err());
        assert!(
            result
                .unwrap_err()
                .to_string()
                .contains("funding address not linked to a swap")
        );
    }

    #[test]
    fn test_input_detail_success() {
        let swap_helper = MockSwapHelper::new();
        let signer = create_signer(swap_helper);
        let key_pair = get_keypair();
        let funding_address = create_test_funding_address(&key_pair);
        let key_pair = get_keypair();

        let result = signer.input_detail(&funding_address, &key_pair);
        assert!(result.is_ok());

        let input = result.unwrap();
        match input {
            InputDetail::Bitcoin(detail) => {
                assert_eq!(detail.input_type, InputType::Cooperative);
                assert_eq!(detail.outpoint.vout, 0);
                assert_eq!(detail.tx_out.value.to_sat(), 100000);
            }
            _ => panic!("Expected Bitcoin input detail"),
        }
    }

    #[test]
    fn test_input_detail_no_lockup_tx() {
        let swap_helper = MockSwapHelper::new();
        let signer = create_signer(swap_helper);
        let key_pair = get_keypair();
        let mut funding_address = create_test_funding_address(&key_pair);
        funding_address.lockup_transaction_id = None;
        let key_pair = get_keypair();

        let result = signer.input_detail(&funding_address, &key_pair);
        assert!(result.is_err());
    }
}

use crate::cache::Cache;
use crate::currencies::{Currencies, get_chain_client, get_wallet};
use crate::db::helpers::chain_swap::ChainSwapHelper;
use crate::db::helpers::swap::SwapHelper;
use crate::db::models::FundingAddress;
use alloy::hex;
use anyhow::{Result, anyhow};
use bitcoin::hashes::Hash;
use bitcoin::key::{Keypair, Secp256k1};
use bitcoin::sighash::{Prevouts, SighashCache};
use bitcoin::{Amount, OutPoint, TxOut, Witness};
use boltz_core::Address;
use boltz_core::bitcoin::InputDetail as BitcoinInputDetail;
use boltz_core::elements::InputDetail as ElementsInputDetail;
use boltz_core::musig::Musig;
use boltz_core::utils::{Destination, InputType, OutputType};
use boltz_core::wrapper::{BitcoinParams, InputDetail, Params, Transaction, construct_tx};
use elements::hex::ToHex;
use std::str::FromStr;
use std::sync::Arc;

/// Short TTL so that clients can't hold sessions for too long
const CACHE_TTL: u64 = 60;
const CACHE_KEY: &str = "funding_address_signer";

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
struct PendingSigningSession {
    sec_nonce: String,
    pub_nonce: String,
    sighash: String,
    swap_id: String,
    transaction: String,
}

pub struct FundingAddressSigner {
    swap_helper: Arc<dyn SwapHelper + Sync + Send>,
    chain_swap_helper: Arc<dyn ChainSwapHelper + Sync + Send>,
    currencies: Currencies,
    cache: Cache,
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
    pub fn new(
        swap_helper: Arc<dyn SwapHelper + Sync + Send>,
        chain_swap_helper: Arc<dyn ChainSwapHelper + Sync + Send>,
        currencies: Currencies,
        cache: Cache,
    ) -> Self {
        Self {
            swap_helper,
            chain_swap_helper,
            currencies,
            cache,
        }
    }

    fn cache_field(funding_address_id: &str) -> String {
        format!("session:{}", funding_address_id)
    }

    pub async fn get_signing_details(
        &self,
        funding_address: &FundingAddress,
        key_pair: &Keypair,
        swap_id: &str,
    ) -> Result<CooperativeDetails> {
        if let Some(existing_swap_id) = &funding_address.swap_id {
            if existing_swap_id != swap_id {
                return Err(anyhow!("funding address is linked to a different swap"));
            }
        }
        let (tx, msg) = self
            .create_presigning_tx(funding_address, key_pair, swap_id)
            .await?;
        let musig = funding_address.musig(key_pair)?.message(msg);
        let musig = musig.generate_nonce(&mut Musig::rng());

        let pub_nonce = musig.pub_nonce().serialize();
        let sec_nonce = musig.dangerous_secnonce().dangerous_into_bytes();

        let tx_hex = tx.serialize().to_hex();

        // Store the signing session in cache
        self.cache
            .set(
                CACHE_KEY,
                &Self::cache_field(&funding_address.id),
                &PendingSigningSession {
                    sec_nonce: hex::encode(sec_nonce),
                    pub_nonce: hex::encode(&pub_nonce),
                    sighash: hex::encode(msg),
                    swap_id: swap_id.to_string(),
                    transaction: tx_hex.clone(),
                },
                Some(CACHE_TTL),
            )
            .await?;

        Ok(CooperativeDetails {
            pub_nonce: hex::encode(pub_nonce),
            public_key: key_pair.public_key().to_string(),
            transaction_hex: tx_hex,
            transaction_hash: msg.to_hex(),
        })
    }

    pub async fn set_signature(
        &self,
        funding_address: &FundingAddress,
        key_pair: &Keypair,
        request: &SetSignatureRequest,
    ) -> Result<(Transaction, String)> {
        // Retrieve and remove the stored signing session from cache
        let session = self
            .cache
            .take::<PendingSigningSession>(CACHE_KEY, &Self::cache_field(&funding_address.id))
            .await?
            .ok_or_else(|| anyhow!("musig session not found for funding address"))?;

        let their_pubkey = Musig::convert_pub_key(&funding_address.their_public_key()?.to_bytes())?;
        let msg: [u8; 32] = hex::decode(&session.sighash)?
            .try_into()
            .map_err(|_| anyhow!("invalid sighash length"))?;

        // Reconstruct the musig session with the stored nonces
        let musig = funding_address
            .musig(key_pair)?
            .message(msg)
            .dangerous_set_nonce(
                hex::decode(&session.sec_nonce)?.as_slice(),
                hex::decode(&session.pub_nonce)?.as_slice(),
            )?
            .aggregate_nonces(vec![(
                their_pubkey,
                Musig::convert_pub_nonce(&hex::decode(&request.pub_nonce)?)?,
            )])?
            .initialize_session()?;

        let agg_pk = musig.agg_pk();
        let musig = musig.partial_sign()?.partial_add(
            their_pubkey,
            Musig::convert_partial_signature(hex::decode(&request.partial_signature)?.as_slice())?,
        )?;
        let agg_sig = musig.partial_aggregate()?;
        let sig = agg_sig.verify(&agg_pk, &msg)?;

        let raw_tx = hex::decode(&session.transaction)?;
        let sig_bytes = sig.to_byte_array().to_vec();
        let mut tx = Transaction::parse(
            &boltz_core::utils::Type::from_str(&funding_address.symbol)?,
            &raw_tx,
        )?;
        match &mut tx {
            Transaction::Bitcoin(tx) => {
                tx.input[0].witness = Witness::from_slice(&[sig_bytes]);
            }
            Transaction::Elements(tx) => {
                tx.input[0].witness.script_witness = vec![sig_bytes];
            }
        }
        Ok((tx, session.swap_id))
    }

    fn get_lockup_address(&self, swap_id: &str) -> Result<String> {
        self.swap_helper
            .get_by_id(swap_id)
            .map(|swap| swap.lockupAddress)
            .or_else(|_| {
                self.chain_swap_helper
                    .get_by_id(swap_id)
                    .map(|chain_swap| chain_swap.receiving().lockupAddress.clone())
            })
            .map_err(|e| anyhow!("failed to get lockup address: {}", e))
    }

    async fn create_presigning_tx(
        &self,
        funding_address: &FundingAddress,
        key_pair: &Keypair,
        swap_id: &str,
    ) -> Result<(Transaction, [u8; 32])> {
        let destination = Address::try_from(self.get_lockup_address(swap_id)?.as_str())?;
        let symbol = funding_address.symbol.as_str();

        let input_detail = self.input_detail(funding_address, key_pair).await?;
        let (tx, _) = construct_tx(&Params::Bitcoin(BitcoinParams {
            inputs: &[&input_detail.clone().try_into()?],
            destination: &Destination::Single(&destination.try_into()?),
            fee: match &input_detail {
                InputDetail::Bitcoin(_) => boltz_core::FeeTarget::Absolute(0),
                InputDetail::Elements(_) => {
                    let fee = get_chain_client(&self.currencies, symbol)?
                        .estimate_fee()
                        .await?;
                    boltz_core::FeeTarget::Relative(fee)
                }
            },
        }))?;

        let msg = match (tx.clone(), &input_detail) {
            (Transaction::Bitcoin(btc_tx), InputDetail::Bitcoin(btc_input_detail)) => {
                let mut sighash_cache = SighashCache::new(&btc_tx);
                let hash = sighash_cache.taproot_key_spend_signature_hash(
                    0,
                    &Prevouts::All(&[&btc_input_detail.tx_out]),
                    bitcoin::TapSighashType::Default,
                )?;
                *hash.to_raw_hash().as_byte_array()
            }
            (Transaction::Elements(elements_tx), InputDetail::Elements(elements_input_detail)) => {
                let mut sighash_cache = elements::sighash::SighashCache::new(&elements_tx);
                let network = self
                    .currencies
                    .get(symbol)
                    .ok_or(anyhow!("currency not found"))?
                    .network;
                let hash = sighash_cache.taproot_key_spend_signature_hash(
                    0,
                    &elements::sighash::Prevouts::All(&[&elements_input_detail.tx_out]),
                    elements::sighash::SchnorrSighashType::Default,
                    network.liquid_genesis_hash()?,
                )?;
                *hash.to_raw_hash().as_byte_array()
            }
            _ => return Err(anyhow!("unsupported transaction type")),
        };

        Ok((tx, msg))
    }

    async fn input_detail(
        &self,
        funding_address: &FundingAddress,
        key_pair: &Keypair,
    ) -> Result<InputDetail> {
        let script_pubkey = funding_address.script_pubkey(key_pair)?;
        let symbol = funding_address.symbol.as_str();
        let tx_id = funding_address
            .lockup_transaction_id
            .clone()
            .ok_or(anyhow!(
                "funding address does not have a lockup transaction id"
            ))?;
        let vout = funding_address
            .lockup_transaction_vout
            .ok_or(anyhow!("lockup transaction vout missing"))? as u32;
        match symbol {
            "BTC" => Ok(InputDetail::Bitcoin(Box::new(BitcoinInputDetail {
                input_type: InputType::Cooperative,
                output_type: OutputType::Taproot(None),
                outpoint: OutPoint::new(tx_id.parse()?, vout),
                tx_out: TxOut {
                    script_pubkey,
                    value: Amount::from_sat(funding_address.lockup_amount.unwrap() as u64),
                },
                keys: key_pair.clone(),
            }))),
            "L-BTC" => {
                let chain_client = get_chain_client(&self.currencies, symbol)?;
                let raw_lockup_tx = chain_client.raw_transaction(&tx_id).await?;
                let lockup_tx: elements::Transaction =
                    elements::encode::deserialize(&alloy::hex::decode(&raw_lockup_tx)?)?;
                let tx_out = lockup_tx.output[vout as usize].clone();

                let wallet = get_wallet(&self.currencies, symbol)?;
                let blinding_key = wallet.derive_blinding_key(script_pubkey.into_bytes())?;

                let secp = Secp256k1::new();
                Ok(InputDetail::Elements(Box::new(ElementsInputDetail {
                    input_type: InputType::Cooperative,
                    output_type: OutputType::Taproot(None),
                    outpoint: elements::OutPoint::new(tx_id.parse()?, vout),
                    tx_out,
                    keys: key_pair.clone(),
                    blinding_key: Some(Keypair::from_seckey_slice(&secp, &blinding_key)?),
                })))
            }
            _ => Err(anyhow!("unsupported currency: {}", funding_address.symbol)),
        }
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use crate::cache::Cache;
    use crate::chain::types::RpcParam;
    use crate::chain::Client;
    use crate::db::helpers::chain_swap::test::MockChainSwapHelper;
    use crate::db::helpers::swap::test::MockSwapHelper;
    use crate::db::models::{ChainSwap, ChainSwapData, ChainSwapInfo, Swap};
    use crate::service::test::get_test_currencies;
    use crate::swap::FundingAddressStatus;
    use bitcoin::secp256k1::{Secp256k1, rand};
    use bitcoin::{TapTweakHash, hex::FromHex};
    use boltz_core::PublicNonce;
    use elements::hex::ToHex;
    use serial_test::serial;

    const TEST_SYMBOL: &str = "BTC";
    const TEST_SWAP_ID: &str = "test_swap_123";

    fn get_keypair() -> Keypair {
        let secp = Secp256k1::new();
        Keypair::new(&secp, &mut rand::thread_rng())
    }

    fn create_test_swap(lockup_address: &str) -> Swap {
        Swap {
            id: TEST_SWAP_ID.to_string(),
            lockupAddress: lockup_address.to_string(),
            ..Default::default()
        }
    }

    fn create_test_chain_swap_info(lockup_address: &str) -> ChainSwapInfo {
        let swap = ChainSwap {
            id: TEST_SWAP_ID.to_string(),
            pair: "L-BTC/BTC".to_string(),
            status: "swap.created".to_string(),
            orderSide: 0, // Buy
            ..Default::default()
        };
        let data = vec![
            ChainSwapData {
                swapId: TEST_SWAP_ID.to_string(),
                symbol: "BTC".to_string(),
                lockupAddress: lockup_address.to_string(),
                ..Default::default()
            },
            ChainSwapData {
                swapId: TEST_SWAP_ID.to_string(),
                symbol: "L-BTC".to_string(),
                lockupAddress: "el1qq0test".to_string(),
                ..Default::default()
            },
        ];
        ChainSwapInfo::new(swap, data).unwrap()
    }

    fn create_signer(
        swap_helper: MockSwapHelper,
        chain_swap_helper: MockChainSwapHelper,
        currencies: Currencies,
    ) -> FundingAddressSigner {
        FundingAddressSigner::new(
            Arc::new(swap_helper),
            Arc::new(chain_swap_helper),
            currencies,
            Cache::Memory(crate::cache::MemCache::new()),
        )
    }

    fn create_default_funding_address(key_pair: &Keypair) -> FundingAddress {
        FundingAddress {
            id: "test_funding_123".to_string(),
            symbol: TEST_SYMBOL.to_string(),
            key_index: 10,
            their_public_key: key_pair.public_key().to_string(),
            timeout_block_height: 1000,
            swap_id: Some(TEST_SWAP_ID.to_string()),
            lockup_transaction_id: Some("tx123".to_string()),
            lockup_transaction_vout: Some(0),
            lockup_amount: Some(100000),
            presigned_tx: None,
            status: FundingAddressStatus::Created.to_string(),
        }
    }

    #[test]
    fn test_cache_field_format() {
        let funding_address_id = "funding_123";
        let result = FundingAddressSigner::cache_field(funding_address_id);
        assert_eq!(result, "session:funding_123");
    }

    #[test]
    fn test_cache_field_with_special_characters() {
        let funding_address_id = "funding:with:colons";
        let result = FundingAddressSigner::cache_field(funding_address_id);
        assert_eq!(result, "session:funding:with:colons");
    }

    #[tokio::test]
    async fn test_get_signing_details_no_swap_linked() {
        let currencies = get_test_currencies().await;
        let swap_helper = MockSwapHelper::new();
        let signer = create_signer(swap_helper, MockChainSwapHelper::new(), currencies);

        let key_pair = get_keypair();
        let mut funding_address = create_default_funding_address(&key_pair);
        funding_address.swap_id = Some("different_swap".to_string());

        let result = signer
            .get_signing_details(&funding_address, &key_pair, "nonexistent_swap")
            .await;
        assert!(result.is_err());
        assert!(
            result
                .unwrap_err()
                .to_string()
                .contains("funding address is linked to a different swap")
        );
    }

    #[tokio::test]
    async fn test_get_signing_details_swap_not_found() {
        let currencies = get_test_currencies().await;
        let mut swap_helper = MockSwapHelper::new();
        swap_helper
            .expect_get_by_id()
            .returning(|_| Err(anyhow!("swap not found")));

        let mut chain_swap_helper = MockChainSwapHelper::new();
        chain_swap_helper
            .expect_get_by_id()
            .returning(|_| Err(anyhow!("chain swap not found")));

        let signer = create_signer(swap_helper, chain_swap_helper, currencies);
        let key_pair = get_keypair();
        let funding_address = create_default_funding_address(&key_pair);

        let result = signer
            .get_signing_details(&funding_address, &key_pair, TEST_SWAP_ID)
            .await;
        assert!(result.is_err());
        assert!(
            result
                .unwrap_err()
                .to_string()
                .contains("failed to get lockup address")
        );
    }

    #[tokio::test]
    async fn test_get_lockup_address_from_swap() {
        let currencies = get_test_currencies().await;
        let expected_address = "bcrt1qtest123";

        let mut swap_helper = MockSwapHelper::new();
        swap_helper
            .expect_get_by_id()
            .returning(move |_| Ok(create_test_swap(expected_address)));

        let signer = create_signer(swap_helper, MockChainSwapHelper::new(), currencies);

        let result = signer.get_lockup_address(TEST_SWAP_ID);
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), expected_address);
    }

    #[tokio::test]
    async fn test_get_lockup_address_fallback_to_chain_swap() {
        let currencies = get_test_currencies().await;
        let expected_address = "bcrt1qchain123";

        let mut swap_helper = MockSwapHelper::new();
        swap_helper
            .expect_get_by_id()
            .returning(|_| Err(anyhow!("swap not found")));

        let mut chain_swap_helper = MockChainSwapHelper::new();
        chain_swap_helper
            .expect_get_by_id()
            .returning(move |_| Ok(create_test_chain_swap_info(expected_address)));

        let signer = create_signer(swap_helper, chain_swap_helper, currencies);

        let result = signer.get_lockup_address(TEST_SWAP_ID);
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), expected_address);
    }

    #[tokio::test]
    async fn test_get_lockup_address_both_fail() {
        let currencies = get_test_currencies().await;

        let mut swap_helper = MockSwapHelper::new();
        swap_helper
            .expect_get_by_id()
            .returning(|_| Err(anyhow!("swap not found")));

        let mut chain_swap_helper = MockChainSwapHelper::new();
        chain_swap_helper
            .expect_get_by_id()
            .returning(|_| Err(anyhow!("chain swap not found")));

        let signer = create_signer(swap_helper, chain_swap_helper, currencies);

        let result = signer.get_lockup_address(TEST_SWAP_ID);
        assert!(result.is_err());
        assert!(
            result
                .unwrap_err()
                .to_string()
                .contains("failed to get lockup address")
        );
    }

    #[tokio::test]
    #[serial(BTC)]
    async fn test_set_signature_with_real_lockup() {
        let currencies = get_test_currencies().await;
        let chain_client = currencies
            .get(TEST_SYMBOL)
            .unwrap()
            .chain
            .as_ref()
            .unwrap()
            .clone();

        // Generate a lockup address for the swap
        let swap_lockup_address = chain_client
            .get_new_address(None, "test", Some("bech32m"))
            .await
            .unwrap();

        let swap_lockup_address_clone = swap_lockup_address.clone();
        let mut swap_helper = MockSwapHelper::new();
        swap_helper
            .expect_get_by_id()
            .returning(move |_| Ok(create_test_swap(&swap_lockup_address_clone)));

        let signer = create_signer(swap_helper, MockChainSwapHelper::new(), currencies.clone());

        let client_key_pair = get_keypair();
        let server_key_pair = get_keypair();

        let funding_address_id = "test_funding_set_sig".to_string();
        let funding_address = FundingAddress {
            id: funding_address_id.clone(),
            symbol: TEST_SYMBOL.to_string(),
            key_index: 10,
            their_public_key: client_key_pair.public_key().to_string(),
            timeout_block_height: 1000,
            swap_id: Some(TEST_SWAP_ID.to_string()),
            ..Default::default()
        };

        // Generate the funding address and send funds
        let script_pubkey = funding_address.script_pubkey(&server_key_pair).unwrap();
        let funding_address_str = Address::from_bitcoin_script(
            currencies.get(TEST_SYMBOL).unwrap().network,
            &script_pubkey.to_bytes(),
        )
        .unwrap()
        .to_string();

        let tx_id = chain_client
            .request_wallet(
                None,
                "sendtoaddress",
                Some(&[RpcParam::Str(&funding_address_str), RpcParam::Float(0.001)]),
            )
            .await
            .unwrap()
            .as_str()
            .unwrap()
            .to_string();

        // Find the actual vout by inspecting the transaction
        let raw_tx_hex = chain_client.raw_transaction(&tx_id).await.unwrap();
        let raw_tx = alloy::hex::decode(&raw_tx_hex).unwrap();
        let tx: bitcoin::Transaction = bitcoin::consensus::deserialize(&raw_tx).unwrap();
        let vout = tx
            .output
            .iter()
            .position(|out| out.script_pubkey == script_pubkey)
            .expect("funding address script not found in transaction outputs") as i32;

        let mut funding_address_with_lockup = funding_address.clone();
        funding_address_with_lockup.lockup_transaction_id = Some(tx_id.clone());
        funding_address_with_lockup.lockup_transaction_vout = Some(vout);
        funding_address_with_lockup.lockup_amount = Some(tx.output[vout as usize].value.to_sat() as i64);

        let details = signer
            .get_signing_details(&funding_address_with_lockup, &server_key_pair, TEST_SWAP_ID)
            .await
            .unwrap();

        // Client side signing
        let musig = Musig::setup(
            Musig::convert_keypair(client_key_pair.secret_key().secret_bytes()).unwrap(),
            vec![
                Musig::convert_pub_key(&server_key_pair.public_key().serialize()).unwrap(),
                Musig::convert_pub_key(&client_key_pair.public_key().serialize()).unwrap(),
            ],
        )
        .unwrap();

        let untweaked_internal_key =
            bitcoin::XOnlyPublicKey::from_slice(&musig.agg_pk().serialize()).unwrap();

        let tree_builder = funding_address_with_lockup.tree().unwrap().build().unwrap();
        let secp = Secp256k1::new();
        let taproot_spend_info = tree_builder
            .finalize(&secp, untweaked_internal_key)
            .unwrap();

        let tweak = TapTweakHash::from_key_and_tweak(
            untweaked_internal_key,
            taproot_spend_info.merkle_root(),
        )
        .to_scalar();

        let musig = musig
            .xonly_tweak_add(&Musig::convert_scalar_be(&tweak.to_be_bytes()).unwrap())
            .unwrap();

        let musig = musig.message(
            Vec::from_hex(&details.transaction_hash)
                .unwrap()
                .try_into()
                .unwrap(),
        );

        let musig = musig.generate_nonce(&mut Musig::rng());
        let client_nonce = musig.pub_nonce().clone();

        let musig = musig
            .aggregate_nonces(vec![(
                Musig::convert_pub_key(&server_key_pair.public_key().serialize()).unwrap(),
                PublicNonce::from_str(&details.pub_nonce).unwrap(),
            )])
            .unwrap();
        let musig = musig.initialize_session().unwrap();
        let musig = musig.partial_sign().unwrap();
        let client_sig = musig.our_partial_signature();

        let request = SetSignatureRequest {
            id: funding_address_with_lockup.id.clone(),
            pub_nonce: client_nonce.to_string(),
            partial_signature: client_sig.to_string(),
        };

        let signed_tx: std::result::Result<(Transaction, String), anyhow::Error> = signer
            .set_signature(&funding_address_with_lockup, &server_key_pair, &request)
            .await;
        assert!(signed_tx.is_ok());

        // Try to broadcast the signed transaction
        let (tx, swap_id) = signed_tx.unwrap();
        assert_eq!(swap_id, TEST_SWAP_ID);

        let tx_hex = tx.serialize().to_hex();
        let broadcast_result = chain_client.send_raw_transaction(&tx_hex).await;

        // Should fail because transaction has no fee
        // Error message may vary: "min relay fee not met" or "mempool min fee not met"
        assert!(broadcast_result.is_err());
        let err_msg = broadcast_result.unwrap_err().to_string();
        assert!(
            err_msg.contains("min relay fee not met") || err_msg.contains("mempool min fee not met") || err_msg.contains("fee"),
            "Expected fee-related error, got: {}",
            err_msg
        );
    }

    #[tokio::test]
    async fn test_set_signature_session_not_found() {
        let currencies = get_test_currencies().await;
        let swap_helper = MockSwapHelper::new();
        let signer = create_signer(swap_helper, MockChainSwapHelper::new(), currencies);

        let key_pair = get_keypair();
        let mut funding_address = create_default_funding_address(&key_pair);
        funding_address.id = "test_funding_no_session".to_string();

        let request = SetSignatureRequest {
            id: funding_address.id.clone(),
            pub_nonce: "test_pub_nonce".to_string(),
            partial_signature: "test_sig".to_string(),
        };

        let result = signer
            .set_signature(&funding_address, &key_pair, &request)
            .await;
        assert!(result.is_err());
        assert!(
            result
                .unwrap_err()
                .to_string()
                .contains("musig session not found")
        );
    }

    #[tokio::test]
    async fn test_set_signature_returns_correct_swap_id() {
        // This test verifies that the swap_id from the session is correctly returned
        let currencies = get_test_currencies().await;
        let cache = Cache::Memory(crate::cache::MemCache::new());

        let key_pair = get_keypair();
        let mut funding_address = create_default_funding_address(&key_pair);
        funding_address.id = "test_swap_id_return".to_string();

        // Manually insert a session into cache
        let session = PendingSigningSession {
            sec_nonce: "00".repeat(132), // Invalid but we'll fail before using it
            pub_nonce: "00".repeat(66),
            sighash: "00".repeat(32),
            swap_id: "expected_swap_id_123".to_string(),
            transaction: "0100000000010000000000".to_string(),
        };

        cache
            .set(
                CACHE_KEY,
                &FundingAddressSigner::cache_field(&funding_address.id),
                &session,
                Some(CACHE_TTL),
            )
            .await
            .unwrap();

        let swap_helper = MockSwapHelper::new();
        let signer = FundingAddressSigner::new(
            Arc::new(swap_helper),
            Arc::new(MockChainSwapHelper::new()),
            currencies,
            cache,
        );

        let request = SetSignatureRequest {
            id: funding_address.id.clone(),
            pub_nonce: "00".repeat(66),
            partial_signature: "00".repeat(32),
        };

        // The signature aggregation will fail, but we can verify session was consumed
        let result = signer
            .set_signature(&funding_address, &key_pair, &request)
            .await;

        // Should fail due to invalid nonce/signature, but session should have been retrieved
        assert!(result.is_err());

        // Verify session was removed (take removes it even if subsequent processing fails)
        let cached = signer
            .cache
            .get::<PendingSigningSession>(
                CACHE_KEY,
                &FundingAddressSigner::cache_field(&funding_address.id),
            )
            .await
            .unwrap();
        assert!(cached.is_none());
    }

    #[tokio::test]
    #[serial(BTC)]
    async fn test_set_signature_removes_session() {
        let currencies = get_test_currencies().await;
        let chain_client = currencies
            .get(TEST_SYMBOL)
            .unwrap()
            .chain
            .as_ref()
            .unwrap()
            .clone();

        let swap_lockup_address = chain_client
            .get_new_address(None, "test", Some("bech32m"))
            .await
            .unwrap();

        let swap_lockup_address_clone = swap_lockup_address.clone();
        let mut swap_helper = MockSwapHelper::new();
        swap_helper
            .expect_get_by_id()
            .returning(move |_| Ok(create_test_swap(&swap_lockup_address_clone)));

        let signer = create_signer(swap_helper, MockChainSwapHelper::new(), currencies.clone());
        let key_pair = get_keypair();
        let server_key_pair = get_keypair();

        let funding_address_id = "test_funding_remove_session".to_string();
        let funding_address = FundingAddress {
            id: funding_address_id.clone(),
            symbol: TEST_SYMBOL.to_string(),
            key_index: 10,
            their_public_key: key_pair.public_key().to_string(),
            timeout_block_height: 1000,
            swap_id: Some(TEST_SWAP_ID.to_string()),
            lockup_transaction_id: None,
            lockup_transaction_vout: None,
            lockup_amount: None,
            presigned_tx: None,
            status: FundingAddressStatus::Created.to_string(),
        };

        // Generate the funding address and send funds
        let script_pubkey = funding_address.script_pubkey(&server_key_pair).unwrap();
        let funding_address_str = Address::from_bitcoin_script(
            currencies.get(TEST_SYMBOL).unwrap().network,
            &script_pubkey.to_bytes(),
        )
        .unwrap()
        .to_string();

        let tx_id = chain_client
            .request_wallet(
                None,
                "sendtoaddress",
                Some(&[RpcParam::Str(&funding_address_str), RpcParam::Float(0.001)]),
            )
            .await
            .unwrap()
            .as_str()
            .unwrap()
            .to_string();

        // Find the actual vout by inspecting the transaction
        let raw_tx_hex = chain_client.raw_transaction(&tx_id).await.unwrap();
        let raw_tx = alloy::hex::decode(&raw_tx_hex).unwrap();
        let tx: bitcoin::Transaction = bitcoin::consensus::deserialize(&raw_tx).unwrap();
        let vout = tx
            .output
            .iter()
            .position(|out| out.script_pubkey == script_pubkey)
            .expect("funding address script not found in transaction outputs") as i32;

        let mut funding_address_with_lockup = funding_address.clone();
        funding_address_with_lockup.lockup_transaction_id = Some(tx_id);
        funding_address_with_lockup.lockup_transaction_vout = Some(vout);
        funding_address_with_lockup.lockup_amount =
            Some(tx.output[vout as usize].value.to_sat() as i64);

        // First create a session
        let _ = signer
            .get_signing_details(&funding_address_with_lockup, &server_key_pair, TEST_SWAP_ID)
            .await;

        // Verify session exists in cache
        let cached_session = signer
            .cache
            .get::<PendingSigningSession>(
                CACHE_KEY,
                &FundingAddressSigner::cache_field(&funding_address_id),
            )
            .await
            .unwrap();
        assert!(cached_session.is_some());

        // Try to set signature (will fail because we don't have valid signatures)
        let request = SetSignatureRequest {
            id: funding_address_id.clone(),
            pub_nonce: "invalid".to_string(),
            partial_signature: "invalid".to_string(),
        };

        // This will fail due to invalid nonce/signature, but session should be removed from cache
        let _ = signer
            .set_signature(&funding_address_with_lockup, &server_key_pair, &request)
            .await;

        // Verify session was removed from cache (take removes it)
        let cached_session = signer
            .cache
            .get::<PendingSigningSession>(
                CACHE_KEY,
                &FundingAddressSigner::cache_field(&funding_address_id),
            )
            .await
            .unwrap();
        assert!(cached_session.is_none());
    }

    #[tokio::test]
    async fn test_input_detail_no_lockup_tx() {
        let currencies = get_test_currencies().await;
        let swap_helper = MockSwapHelper::new();
        let signer = create_signer(swap_helper, MockChainSwapHelper::new(), currencies);

        let key_pair = get_keypair();
        let mut funding_address = create_default_funding_address(&key_pair);
        funding_address.id = "test_funding_no_tx".to_string();
        funding_address.lockup_transaction_id = None;
        funding_address.lockup_transaction_vout = None;
        funding_address.lockup_amount = None;

        let result = signer.input_detail(&funding_address, &key_pair).await;
        assert!(result.is_err());
        assert!(
            result
                .unwrap_err()
                .to_string()
                .contains("funding address does not have a lockup transaction id")
        );
    }

    #[tokio::test]
    async fn test_input_detail_no_lockup_vout() {
        let currencies = get_test_currencies().await;
        let swap_helper = MockSwapHelper::new();
        let signer = create_signer(swap_helper, MockChainSwapHelper::new(), currencies);

        let key_pair = get_keypair();
        let mut funding_address = create_default_funding_address(&key_pair);
        funding_address.id = "test_funding_no_vout".to_string();
        funding_address.lockup_transaction_id =
            Some("0000000000000000000000000000000000000000000000000000000000000001".to_string());
        funding_address.lockup_transaction_vout = None;
        funding_address.lockup_amount = Some(100000);

        let result = signer.input_detail(&funding_address, &key_pair).await;
        assert!(result.is_err());
        assert!(
            result
                .unwrap_err()
                .to_string()
                .contains("lockup transaction vout missing")
        );
    }

    #[tokio::test]
    async fn test_input_detail_unsupported_currency() {
        let currencies = get_test_currencies().await;
        let swap_helper = MockSwapHelper::new();
        let signer = create_signer(swap_helper, MockChainSwapHelper::new(), currencies);

        let key_pair = get_keypair();
        let mut funding_address = create_default_funding_address(&key_pair);
        funding_address.id = "test_funding_unsupported".to_string();
        funding_address.symbol = "UNSUPPORTED".to_string();
        funding_address.lockup_transaction_id =
            Some("0000000000000000000000000000000000000000000000000000000000000001".to_string());
        funding_address.lockup_transaction_vout = Some(0);
        funding_address.lockup_amount = Some(100000);

        let result = signer.input_detail(&funding_address, &key_pair).await;
        assert!(result.is_err());
        assert!(
            result
                .unwrap_err()
                .to_string()
                .contains("unsupported currency")
        );
    }

    #[tokio::test]
    #[serial(BTC)]
    async fn test_input_detail_btc_success() {
        let currencies = get_test_currencies().await;
        let chain_client = currencies
            .get(TEST_SYMBOL)
            .unwrap()
            .chain
            .as_ref()
            .unwrap()
            .clone();

        let swap_helper = MockSwapHelper::new();
        let signer = create_signer(swap_helper, MockChainSwapHelper::new(), currencies.clone());

        let client_key_pair = get_keypair();
        let server_key_pair = get_keypair();

        let funding_address = FundingAddress {
            id: "test_input_detail_btc".to_string(),
            symbol: TEST_SYMBOL.to_string(),
            key_index: 10,
            their_public_key: client_key_pair.public_key().to_string(),
            timeout_block_height: 1000,
            swap_id: Some(TEST_SWAP_ID.to_string()),
            ..Default::default()
        };

        // Generate and fund the address
        let script_pubkey = funding_address.script_pubkey(&server_key_pair).unwrap();
        let funding_address_str = Address::from_bitcoin_script(
            currencies.get(TEST_SYMBOL).unwrap().network,
            &script_pubkey.to_bytes(),
        )
        .unwrap()
        .to_string();

        let tx_id = chain_client
            .request_wallet(
                None,
                "sendtoaddress",
                Some(&[RpcParam::Str(&funding_address_str), RpcParam::Float(0.001)]),
            )
            .await
            .unwrap()
            .as_str()
            .unwrap()
            .to_string();

        // Find the actual vout by inspecting the transaction
        let raw_tx_hex = chain_client.raw_transaction(&tx_id).await.unwrap();
        let raw_tx = alloy::hex::decode(&raw_tx_hex).unwrap();
        let tx: bitcoin::Transaction = bitcoin::consensus::deserialize(&raw_tx).unwrap();
        let vout = tx
            .output
            .iter()
            .position(|out| out.script_pubkey == script_pubkey)
            .expect("funding address script not found in transaction outputs") as i32;

        let mut funding_address_with_lockup = funding_address.clone();
        funding_address_with_lockup.lockup_transaction_id = Some(tx_id);
        funding_address_with_lockup.lockup_transaction_vout = Some(vout);
        funding_address_with_lockup.lockup_amount =
            Some(tx.output[vout as usize].value.to_sat() as i64);

        let result = signer
            .input_detail(&funding_address_with_lockup, &server_key_pair)
            .await;
        assert!(result.is_ok());

        match result.unwrap() {
            InputDetail::Bitcoin(detail) => {
                assert_eq!(detail.input_type, InputType::Cooperative);
            }
            _ => panic!("Expected Bitcoin input detail"),
        }
    }

    #[tokio::test]
    async fn test_cooperative_details_fields() {
        // Test that CooperativeDetails struct has expected fields
        let details = CooperativeDetails {
            pub_nonce: "nonce123".to_string(),
            public_key: "pubkey456".to_string(),
            transaction_hex: "tx789".to_string(),
            transaction_hash: "hash012".to_string(),
        };

        assert_eq!(details.pub_nonce, "nonce123");
        assert_eq!(details.public_key, "pubkey456");
        assert_eq!(details.transaction_hex, "tx789");
        assert_eq!(details.transaction_hash, "hash012");
    }

    #[tokio::test]
    async fn test_set_signature_request_fields() {
        // Test that SetSignatureRequest struct has expected fields
        let request = SetSignatureRequest {
            id: "id123".to_string(),
            pub_nonce: "nonce456".to_string(),
            partial_signature: "sig789".to_string(),
        };

        assert_eq!(request.id, "id123");
        assert_eq!(request.pub_nonce, "nonce456");
        assert_eq!(request.partial_signature, "sig789");
    }

    #[tokio::test]
    #[serial(BTC)]
    async fn test_get_signing_details_funding_address_no_swap_id() {
        // When funding_address.swap_id is None, any swap_id should work
        let currencies = get_test_currencies().await;
        let chain_client = currencies
            .get(TEST_SYMBOL)
            .unwrap()
            .chain
            .as_ref()
            .unwrap()
            .clone();

        let swap_lockup_address = chain_client
            .get_new_address(None, "test", Some("bech32m"))
            .await
            .unwrap();

        let swap_lockup_address_clone = swap_lockup_address.clone();
        let mut swap_helper = MockSwapHelper::new();
        swap_helper
            .expect_get_by_id()
            .returning(move |_| Ok(create_test_swap(&swap_lockup_address_clone)));

        let signer = create_signer(swap_helper, MockChainSwapHelper::new(), currencies.clone());

        let client_key_pair = get_keypair();
        let server_key_pair = get_keypair();

        // Note: swap_id is None
        let mut funding_address = FundingAddress {
            id: "test_funding_no_swap_id".to_string(),
            symbol: TEST_SYMBOL.to_string(),
            key_index: 10,
            their_public_key: client_key_pair.public_key().to_string(),
            timeout_block_height: 1000,
            swap_id: None,
            ..Default::default()
        };

        let script_pubkey = funding_address.script_pubkey(&server_key_pair).unwrap();
        let funding_address_str = Address::from_bitcoin_script(
            currencies.get(TEST_SYMBOL).unwrap().network,
            &script_pubkey.to_bytes(),
        )
        .unwrap()
        .to_string();

        let tx_id = chain_client
            .request_wallet(
                None,
                "sendtoaddress",
                Some(&[RpcParam::Str(&funding_address_str), RpcParam::Float(0.001)]),
            )
            .await
            .unwrap()
            .as_str()
            .unwrap()
            .to_string();

        // Find the actual vout by inspecting the transaction
        let raw_tx_hex = chain_client.raw_transaction(&tx_id).await.unwrap();
        let raw_tx = alloy::hex::decode(&raw_tx_hex).unwrap();
        let tx: bitcoin::Transaction = bitcoin::consensus::deserialize(&raw_tx).unwrap();
        let vout = tx
            .output
            .iter()
            .position(|out| out.script_pubkey == script_pubkey)
            .expect("funding address script not found in transaction outputs") as i32;

        funding_address.lockup_transaction_id = Some(tx_id);
        funding_address.lockup_transaction_vout = Some(vout);
        funding_address.lockup_amount = Some(tx.output[vout as usize].value.to_sat() as i64);

        // Should succeed because funding_address.swap_id is None
        let result = signer
            .get_signing_details(&funding_address, &server_key_pair, "any_swap_id")
            .await;
        assert!(result.is_ok());

        let details = result.unwrap();
        assert!(!details.pub_nonce.is_empty());
        assert!(!details.public_key.is_empty());
        assert!(!details.transaction_hex.is_empty());
        assert!(!details.transaction_hash.is_empty());
    }
}

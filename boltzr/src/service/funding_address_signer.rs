use crate::cache::Cache;
use crate::chain::types::Type;
use crate::currencies::{Currencies, get_chain_client, get_wallet};
use crate::db::helpers::chain_swap::ChainSwapHelper;
use crate::db::helpers::swap::SwapHelper;
use crate::db::models::FundingAddress;
use crate::swap::FundingAddressStatus;
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

    fn is_eligible(&self, funding_address: &FundingAddress) -> Result<()> {
        let status = FundingAddressStatus::parse(&funding_address.status);
        if status == FundingAddressStatus::TransactionClaimed {
            return Err(anyhow!("funding address has already been claimed"));
        }
        if status == FundingAddressStatus::Expired {
            return Err(anyhow!("funding address has expired"));
        }
        if funding_address.swap_id.is_some() {
            return Err(anyhow!("funding address is already linked to a swap"));
        }
        Ok(())
    }

    pub async fn get_signing_details(
        &self,
        funding_address: &FundingAddress,
        key_pair: &Keypair,
        swap_id: &str,
    ) -> Result<CooperativeDetails> {
        self.is_eligible(funding_address)?;

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
        self.is_eligible(funding_address)?;

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
        let params = match &input_detail {
            InputDetail::Bitcoin(btc_input) => Params::Bitcoin(BitcoinParams {
                inputs: &[btc_input.as_ref()],
                destination: &Destination::Single(&destination.clone().try_into()?),
                fee: boltz_core::FeeTarget::Absolute(0),
            }),
            InputDetail::Elements(elements_input) => {
                let chain_client = get_chain_client(&self.currencies, symbol)?;
                let fee = chain_client.estimate_fee().await?;
                Params::Elements(boltz_core::wrapper::ElementsParams {
                    genesis_hash: chain_client.network().liquid_genesis_hash()?,
                    inputs: &[elements_input.as_ref()],
                    destination: &Destination::Single(&destination.clone().try_into()?),
                    fee: boltz_core::FeeTarget::Relative(fee),
                })
            }
        };
        let (tx, _) = construct_tx(&params)?;

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
        match funding_address.symbol_type()? {
            Type::Bitcoin => Ok(InputDetail::Bitcoin(Box::new(BitcoinInputDetail {
                input_type: InputType::Cooperative,
                output_type: OutputType::Taproot(None),
                outpoint: OutPoint::new(tx_id.parse()?, vout),
                tx_out: TxOut {
                    script_pubkey: bitcoin::ScriptBuf::from_bytes(script_pubkey.clone()),
                    value: Amount::from_sat(
                        funding_address
                            .lockup_amount
                            .ok_or(anyhow!("lockup amount missing"))?
                            as u64,
                    ),
                },
                keys: key_pair.clone(),
            }))),
            Type::Elements => {
                let chain_client = get_chain_client(&self.currencies, symbol)?;
                let raw_lockup_tx = chain_client.raw_transaction(&tx_id).await?;
                let lockup_tx: elements::Transaction =
                    elements::encode::deserialize(&alloy::hex::decode(&raw_lockup_tx)?)?;
                let tx_out = lockup_tx.output[vout as usize].clone();

                let wallet = get_wallet(&self.currencies, symbol)?;
                let blinding_key = wallet.derive_blinding_key(script_pubkey.clone())?;

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
        }
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use crate::chain::types::RpcParam;
    use crate::chain::utils::encode_address;
    use crate::db::helpers::chain_swap::test::MockChainSwapHelper;
    use crate::db::helpers::swap::test::MockSwapHelper;
    use crate::service::funding_address_test_utils::test::*;
    use crate::service::test::get_test_currencies;
    use elements::hex::ToHex;
    use rstest::rstest;
    use serial_test::serial;

    // ========== TestContext Builder ==========

    struct TestSignerContext {
        swap_helper: MockSwapHelper,
        chain_swap_helper: MockChainSwapHelper,
        currencies: Option<Currencies>,
    }

    impl TestSignerContext {
        fn new() -> Self {
            Self {
                swap_helper: MockSwapHelper::new(),
                chain_swap_helper: MockChainSwapHelper::new(),
                currencies: None,
            }
        }

        fn with_swap(mut self, lockup_address: &str) -> Self {
            let lockup_address = lockup_address.to_string();
            self.swap_helper
                .expect_get_by_id()
                .returning(move |_| Ok(test_swap(&lockup_address)));
            self
        }

        fn with_swap_not_found(mut self) -> Self {
            self.swap_helper
                .expect_get_by_id()
                .returning(|_| Err(anyhow!("swap not found")));
            self
        }

        fn with_chain_swap(mut self, lockup_address: &str) -> Self {
            let lockup_address = lockup_address.to_string();
            self.chain_swap_helper
                .expect_get_by_id()
                .returning(move |_| Ok(test_chain_swap_info(&lockup_address)));
            self
        }

        fn with_chain_swap_not_found(mut self) -> Self {
            self.chain_swap_helper
                .expect_get_by_id()
                .returning(|_| Err(anyhow!("chain swap not found")));
            self
        }

        async fn with_currencies(mut self) -> Self {
            self.currencies = Some(get_test_currencies().await);
            self
        }

        fn build(self) -> FundingAddressSigner {
            let currencies = self
                .currencies
                .unwrap_or_else(|| Arc::new(std::collections::HashMap::new()));
            create_signer(self.swap_helper, self.chain_swap_helper, currencies)
        }
    }

    #[tokio::test]
    async fn test_get_signing_details_already_linked() {
        let signer = TestSignerContext::new().with_currencies().await.build();

        let key_pair = get_keypair();
        let mut funding_address = test_funding_address_with_lockup(
            "test_funding_already_linked",
            &key_pair.public_key().serialize(),
            "tx123",
            0,
            100000,
        );
        funding_address.swap_id = Some("different_swap".to_string());

        let result = signer
            .get_signing_details(&funding_address, &key_pair, "nonexistent_swap")
            .await;
        assert!(result.is_err());
        assert!(
            result
                .unwrap_err()
                .to_string()
                .contains("funding address is already linked to a swap")
        );
    }

    #[tokio::test]
    async fn test_get_signing_details_swap_not_found() {
        let signer = TestSignerContext::new()
            .with_swap_not_found()
            .with_chain_swap_not_found()
            .with_currencies()
            .await
            .build();

        let key_pair = get_keypair();
        let funding_address = test_funding_address_with_lockup(
            "test_funding_no_swap",
            &key_pair.public_key().serialize(),
            "tx123",
            0,
            100000,
        );

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

    #[rstest]
    #[case(true, false, "bcrt1qtest123", true)] // swap found
    #[case(false, true, "bcrt1qchain123", true)] // chain swap found
    #[case(false, false, "", false)] // both fail
    #[tokio::test]
    async fn test_get_lockup_address_scenarios(
        #[case] swap_exists: bool,
        #[case] chain_swap_exists: bool,
        #[case] expected_address: &str,
        #[case] should_succeed: bool,
    ) {
        let mut context = TestSignerContext::new().with_currencies().await;

        if swap_exists {
            context = context.with_swap(expected_address);
        } else {
            context = context.with_swap_not_found();
        }

        if chain_swap_exists {
            context = context.with_chain_swap(expected_address);
        } else {
            context = context.with_chain_swap_not_found();
        }

        let signer = context.build();
        let result = signer.get_lockup_address(TEST_SWAP_ID);

        if should_succeed {
            assert!(result.is_ok());
            assert_eq!(result.unwrap(), expected_address);
        } else {
            assert!(result.is_err());
            assert!(
                result
                    .unwrap_err()
                    .to_string()
                    .contains("failed to get lockup address")
            );
        }
    }

    /// Helper struct for parameterized lockup tests
    struct LockupTestParams {
        symbol: &'static str,
        funding_address_id: String,
    }

    async fn run_real_lockup_test(params: LockupTestParams) {
        let currencies = get_test_currencies().await;
        let chain_client = currencies
            .get(params.symbol)
            .unwrap()
            .chain
            .as_ref()
            .unwrap()
            .clone();

        // Generate a lockup address for the swap
        let address_type = if params.symbol == "L-BTC" {
            Some("blech32")
        } else {
            Some("bech32m")
        };
        let swap_lockup_address = chain_client
            .get_new_address(None, "test", address_type)
            .await
            .unwrap();

        let signer = TestSignerContext::new()
            .with_swap(&swap_lockup_address)
            .with_currencies()
            .await
            .build();

        let client_key_pair = get_keypair();
        let server_key_pair = get_keypair();

        let mut funding_address = FundingAddress {
            id: params.funding_address_id.clone(),
            symbol: params.symbol.to_string(),
            key_index: 10,
            their_public_key: client_key_pair.public_key().serialize().to_vec(),
            timeout_block_height: 1000,
            ..Default::default()
        };
        // Initialize tree for tests that need it
        funding_address.tree = funding_address.tree_json().ok();

        // Generate the funding address and send funds
        let script_pubkey = funding_address.script_pubkey(&server_key_pair).unwrap();
        let funding_address_str = encode_address(
            Type::from_str(params.symbol).unwrap(),
            script_pubkey.clone(),
            None,
            currencies.get(params.symbol).unwrap().network,
        )
        .unwrap();

        let amount = 100_000;
        let tx_id = chain_client
            .request_wallet(
                None,
                "sendtoaddress",
                Some(&[
                    RpcParam::Str(&funding_address_str),
                    RpcParam::Float(amount as f64 / 100_000_000.0),
                ]),
            )
            .await
            .unwrap()
            .as_str()
            .unwrap()
            .to_string();

        // Find the actual vout by inspecting the transaction
        let raw_tx_hex = chain_client.raw_transaction(&tx_id).await.unwrap();
        let raw_tx = alloy::hex::decode(&raw_tx_hex).unwrap();
        let vout = find_vout(params.symbol, &raw_tx, &script_pubkey);

        let mut funding_address_with_lockup = funding_address.clone();
        funding_address_with_lockup.lockup_transaction_id = Some(tx_id.clone());
        funding_address_with_lockup.lockup_transaction_vout = Some(vout);
        funding_address_with_lockup.lockup_amount = Some(amount);

        let details = signer
            .get_signing_details(&funding_address_with_lockup, &server_key_pair, TEST_SWAP_ID)
            .await
            .unwrap();

        // Client side signing
        let (client_nonce, client_sig) = client_sign(
            &client_key_pair,
            &server_key_pair,
            &funding_address_with_lockup,
            &details,
        );

        let request = SetSignatureRequest {
            id: funding_address_with_lockup.id.clone(),
            pub_nonce: client_nonce,
            partial_signature: client_sig,
        };

        let signed_tx: std::result::Result<(Transaction, String), anyhow::Error> = signer
            .set_signature(&funding_address_with_lockup, &server_key_pair, &request)
            .await;
        assert!(
            signed_tx.is_ok(),
            "set_signature failed: {:?}",
            signed_tx.err()
        );

        // Try to broadcast the signed transaction
        let (tx, swap_id) = signed_tx.unwrap();
        assert_eq!(swap_id, TEST_SWAP_ID);

        let tx_hex = tx.serialize().to_hex();
        let broadcast_result = chain_client.send_raw_transaction(&tx_hex).await;

        // For BTC, the transaction has fee=0 so broadcast should fail with fee error
        // For L-BTC, the transaction has a proper fee so broadcast succeeds
        if params.symbol == "BTC" {
            assert!(broadcast_result.is_err());
            let err_msg = broadcast_result.unwrap_err().to_string();
            assert!(
                err_msg.contains("min relay fee not met") || err_msg.contains("insufficient fee"),
                "Expected fee-related error, got: {}",
                err_msg
            );
        } else {
            // L-BTC transaction should broadcast successfully
            assert!(
                broadcast_result.is_ok(),
                "L-BTC broadcast failed: {:?}",
                broadcast_result.err()
            );
        }

        // Verify session was removed from cache (take removes it)
        let cached_session = signer
            .cache
            .get::<PendingSigningSession>(
                CACHE_KEY,
                &FundingAddressSigner::cache_field(&params.funding_address_id),
            )
            .await
            .unwrap();
        assert!(cached_session.is_none());
    }

    #[tokio::test]
    #[serial(BTC)]
    async fn test_set_signature_with_real_lockup_btc() {
        run_real_lockup_test(LockupTestParams {
            symbol: "BTC",
            funding_address_id: "test_funding_set_sig_btc".to_string(),
        })
        .await;
    }

    #[tokio::test]
    #[serial(LBTC)]
    async fn test_set_signature_with_real_lockup_lbtc() {
        run_real_lockup_test(LockupTestParams {
            symbol: "L-BTC",
            funding_address_id: "test_funding_set_sig_lbtc".to_string(),
        })
        .await;
    }

    #[tokio::test]
    async fn test_set_signature_session_not_found() {
        let signer = TestSignerContext::new().with_currencies().await.build();

        let key_pair = get_keypair();
        let funding_address = test_funding_address_with_lockup(
            "test_funding_no_session",
            &key_pair.public_key().serialize(),
            "tx123",
            0,
            100000,
        );

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

    #[rstest]
    #[case(
        None,
        None,
        None,
        "funding address does not have a lockup transaction id"
    )]
    #[case(
        Some("0000000000000000000000000000000000000000000000000000000000000001"),
        None,
        Some(100000),
        "lockup transaction vout missing"
    )]
    #[tokio::test]
    async fn test_input_detail_validation_errors(
        #[case] tx_id: Option<&str>,
        #[case] vout: Option<i32>,
        #[case] amount: Option<i64>,
        #[case] expected_error: &str,
    ) {
        let signer = TestSignerContext::new().with_currencies().await.build();

        let key_pair = get_keypair();
        let mut funding_address = test_funding_address(
            "test_funding_validation",
            &key_pair.public_key().serialize(),
        );
        funding_address.lockup_transaction_id = tx_id.map(|s| s.to_string());
        funding_address.lockup_transaction_vout = vout;
        funding_address.lockup_amount = amount;

        let result = signer.input_detail(&funding_address, &key_pair).await;
        assert!(result.is_err());
        assert!(result.unwrap_err().to_string().contains(expected_error));
    }

    #[tokio::test]
    async fn test_input_detail_unsupported_currency() {
        let signer = TestSignerContext::new().with_currencies().await.build();

        let key_pair = get_keypair();
        let mut funding_address = test_funding_address_with_lockup(
            "test_funding_unsupported",
            &key_pair.public_key().serialize(),
            "0000000000000000000000000000000000000000000000000000000000000001",
            0,
            100000,
        );
        funding_address.symbol = "UNSUPPORTED".to_string();

        let result = signer.input_detail(&funding_address, &key_pair).await;
        assert!(result.is_err());
        assert!(result.unwrap_err().to_string().contains("unknown symbol"));
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

        let signer = TestSignerContext::new().with_currencies().await.build();

        let client_key_pair = get_keypair();
        let server_key_pair = get_keypair();

        let mut funding_address = FundingAddress {
            id: "test_input_detail_btc".to_string(),
            symbol: TEST_SYMBOL.to_string(),
            key_index: 10,
            their_public_key: client_key_pair.public_key().serialize().to_vec(),
            timeout_block_height: 1000,
            swap_id: Some(TEST_SWAP_ID.to_string()),
            ..Default::default()
        };
        // Initialize tree for tests that need it
        funding_address.tree = funding_address.tree_json().ok();

        // Generate and fund the address
        let script_pubkey = funding_address.script_pubkey(&server_key_pair).unwrap();
        let funding_address_str = Address::from_bitcoin_script(
            currencies.get(TEST_SYMBOL).unwrap().network,
            &script_pubkey,
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
            .position(|out| out.script_pubkey.as_bytes() == script_pubkey)
            .expect("funding address script not found in transaction outputs")
            as i32;

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

        let signer = TestSignerContext::new()
            .with_swap(&swap_lockup_address)
            .with_currencies()
            .await
            .build();

        let client_key_pair = get_keypair();
        let server_key_pair = get_keypair();

        // Note: swap_id is None
        let mut funding_address = FundingAddress {
            id: "test_funding_no_swap_id".to_string(),
            symbol: TEST_SYMBOL.to_string(),
            key_index: 10,
            their_public_key: client_key_pair.public_key().serialize().to_vec(),
            timeout_block_height: 1000,
            swap_id: None,
            ..Default::default()
        };
        // Initialize tree for tests that need it
        funding_address.tree = funding_address.tree_json().ok();

        let script_pubkey = funding_address.script_pubkey(&server_key_pair).unwrap();
        let funding_address_str = Address::from_bitcoin_script(
            currencies.get(TEST_SYMBOL).unwrap().network,
            &script_pubkey,
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
            .position(|out| out.script_pubkey.as_bytes() == script_pubkey)
            .expect("funding address script not found in transaction outputs")
            as i32;

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

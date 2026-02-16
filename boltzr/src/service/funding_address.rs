use crate::cache::Cache;
use crate::chain::elements_client::SYMBOL as ELEMENTS_SYMBOL;
use crate::chain::types::Type;
use crate::chain::utils::encode_address;
use crate::currencies::{Currencies, get_chain_client, get_wallet};
use crate::db::helpers::chain_swap::ChainSwapHelper;
use crate::db::helpers::funding_address::{FundingAddressHelper, SwapTxInfo};
use crate::db::helpers::keys::KeysHelper;
use crate::db::helpers::swap::SwapHelper;
use crate::db::models::{FundingAddress, ScriptPubKey};
use crate::service::funding_address_signer::{
    CooperativeDetails, FundingAddressEligibilityError, FundingAddressSigner,
    PartialSignatureResponse, RefundSignatureRequest as SignerRefundSignatureRequest,
    SetSignatureRequest,
};
use crate::swap::{FundingAddressStatus, TimeoutDeltaProvider};
use crate::utils::generate_id;
use alloy::hex;
use anyhow::Result;
use bitcoin::PublicKey;
use bitcoin::key::{Keypair, Secp256k1};
use serde::{Deserialize, Serialize};
use std::fmt::{Display, Formatter};
use std::str::FromStr;
use std::sync::Arc;
use tokio::sync::Mutex;
use tracing::debug;

#[derive(Deserialize, Serialize, PartialEq, Clone, Debug)]
pub struct FundingAddressConfig {
    #[serde(rename = "timeoutDelta")]
    pub timeout_delta: u32,

    #[serde(rename = "swapTimeoutBuffer")]
    pub swap_timeout_buffer: u64,
}

impl Default for FundingAddressConfig {
    fn default() -> Self {
        Self {
            timeout_delta: 60 * 24 * 100, // 100 days
            swap_timeout_buffer: 60 * 3,  // 3 hours
        }
    }
}

#[derive(Debug)]
pub enum FundingAddressError {
    CurrencyNotFound(String),
    NoWallet(String),
    NotFound(String),
    Database(String),
    InvalidRequest(String),
    Internal(String),
}

impl From<anyhow::Error> for FundingAddressError {
    fn from(error: anyhow::Error) -> Self {
        FundingAddressError::Internal(error.to_string())
    }
}

impl Display for FundingAddressError {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        match self {
            FundingAddressError::CurrencyNotFound(symbol) => {
                write!(f, "currency not found: {}", symbol)
            }
            FundingAddressError::NoWallet(symbol) => {
                write!(f, "no wallet for currency: {}", symbol)
            }
            FundingAddressError::NotFound(id) => {
                write!(f, "funding address not found: {}", id)
            }
            FundingAddressError::Database(msg) => write!(f, "database error: {}", msg),
            FundingAddressError::InvalidRequest(msg) => write!(f, "{}", msg),
            FundingAddressError::Internal(msg) => write!(f, "{}", msg),
        }
    }
}

impl std::error::Error for FundingAddressError {}

pub struct FundingAddressService {
    config: FundingAddressConfig,
    funding_address_helper: Arc<dyn FundingAddressHelper + Sync + Send>,
    keys_helper: Arc<dyn KeysHelper + Sync + Send>,
    signer: Mutex<FundingAddressSigner>,
    currencies: Currencies,
}

#[derive(Debug, Clone)]
pub struct CreateFundingAddressRequest {
    pub symbol: String,
    pub refund_public_key: PublicKey,
}

#[derive(Debug, Clone)]
pub struct CreateResponse {
    pub id: String,
    pub address: String,
    pub timeout_block_height: u32,
    pub server_public_key: String,
    pub blinding_key: Option<String>,
    pub tree: String,
}

#[derive(Debug, Clone)]
pub struct RefundSignatureRequest {
    pub id: String,
    pub pub_nonce: String,
    pub transaction_hash: String,
}

impl FundingAddressService {
    pub fn new(
        config: Option<FundingAddressConfig>,
        funding_address_helper: Arc<dyn FundingAddressHelper + Sync + Send>,
        keys_helper: Arc<dyn KeysHelper + Sync + Send>,
        swap_helper: Arc<dyn SwapHelper + Sync + Send>,
        chain_swap_helper: Arc<dyn ChainSwapHelper + Sync + Send>,
        currencies: Currencies,
        cache: Cache,
    ) -> Self {
        let cfg = config.clone().unwrap_or_default();
        let signer = FundingAddressSigner::new(
            swap_helper,
            chain_swap_helper,
            currencies.clone(),
            cache,
            cfg.swap_timeout_buffer,
        );
        Self {
            config: config.unwrap_or_default(),
            funding_address_helper,
            keys_helper,
            signer: Mutex::new(signer),
            currencies,
        }
    }

    fn key_pair(&self, funding_address: &FundingAddress) -> Result<Keypair, FundingAddressError> {
        let secp = Secp256k1::new();

        let currency = self.currencies.get(&funding_address.symbol).ok_or(
            FundingAddressError::CurrencyNotFound(funding_address.symbol.clone()),
        )?;

        let wallet = currency
            .wallet
            .as_ref()
            .ok_or(FundingAddressError::NoWallet(
                funding_address.symbol.clone(),
            ))?;

        let our_key_pair = wallet
            .derive_keys(funding_address.key_index as u64)?
            .to_keypair(&secp);
        Ok(our_key_pair)
    }

    pub async fn create(
        &self,
        request: CreateFundingAddressRequest,
    ) -> Result<CreateResponse, FundingAddressError> {
        debug!("Creating funding address for {}", request.symbol);

        // Validate currency exists and has a wallet before incrementing key index
        let currency =
            self.currencies
                .get(&request.symbol)
                .ok_or(FundingAddressError::CurrencyNotFound(
                    request.symbol.clone(),
                ))?;

        if currency.wallet.is_none() {
            return Err(FundingAddressError::NoWallet(request.symbol.clone()));
        }

        // Get and increment key index
        let key_index =
            self.keys_helper
                .increment_highest_used_index(&request.symbol)
                .map_err(|e| FundingAddressError::Database(e.to_string()))? as u32;

        let timeout_delta = TimeoutDeltaProvider::calculate_blocks(
            &request.symbol,
            self.config.timeout_delta as u64,
        )? as u32;
        let timeout_block_height = get_chain_client(&self.currencies, &request.symbol)?
            .blockchain_info()
            .await?
            .blocks
            + u64::from(timeout_delta);
        let id = generate_id(None);

        let mut funding_address = FundingAddress {
            id: id.clone(),
            symbol: request.symbol.clone(),
            status: FundingAddressStatus::Created.to_string(),
            key_index: key_index as i32,
            their_public_key: request.refund_public_key.to_bytes(),
            timeout_block_height: timeout_block_height as i32,
            ..Default::default()
        };

        // Store the serialized tree JSON
        funding_address.tree = funding_address.tree_json().map_err(|e| {
            FundingAddressError::Internal(format!("failed to serialize tree: {}", e))
        })?;

        let server_key_pair = self.key_pair(&funding_address)?;
        let script_pubkey = ScriptPubKey {
            symbol: request.symbol.clone(),
            script_pubkey: funding_address.script_pubkey(&server_key_pair)?,
            funding_address_id: Some(id.clone()),
            swap_id: None,
        };

        self.funding_address_helper
            .insert(&funding_address, &script_pubkey)
            .map_err(|e| FundingAddressError::Database(e.to_string()))?;

        let currency = self.currencies.get(&funding_address.symbol).ok_or(
            FundingAddressError::CurrencyNotFound(funding_address.symbol.clone()),
        )?;

        let (blinding_key, blinding_pubkey) = if request.symbol == ELEMENTS_SYMBOL {
            let wallet = get_wallet(&self.currencies, &request.symbol)?;
            let blinding_privkey =
                wallet.derive_blinding_key(script_pubkey.script_pubkey.clone())?;

            // Get the public key from the private key
            let secp = Secp256k1::new();
            let keypair = Keypair::from_seckey_slice(&secp, &blinding_privkey)
                .map_err(|e| FundingAddressError::Internal(e.to_string()))?;
            let pubkey = keypair.public_key().serialize().to_vec();

            (Some(hex::encode(&blinding_privkey)), Some(pubkey))
        } else {
            (None, None)
        };

        let address = encode_address(
            Type::from_str(&request.symbol)?,
            script_pubkey.script_pubkey.clone(),
            blinding_pubkey,
            currency.network,
        )?;

        debug!("Created funding address {}", id);

        Ok(CreateResponse {
            id: funding_address.id.clone(),
            address,
            timeout_block_height: funding_address.timeout_block_height as u32,
            server_public_key: server_key_pair.public_key().to_string(),
            blinding_key,
            tree: funding_address.tree.clone(),
        })
    }

    pub fn get_by_id(&self, id: &str) -> Result<FundingAddress, FundingAddressError> {
        self.funding_address_helper
            .get_by_id(id)
            .map_err(|e| FundingAddressError::Database(e.to_string()))?
            .ok_or(FundingAddressError::NotFound(id.to_string()))
    }

    pub async fn get_signing_details(
        &self,
        id: &str,
        swap_id: &str,
    ) -> Result<CooperativeDetails, FundingAddressError> {
        let signer = self.signer.lock().await;
        let funding_address = self.get_by_id(id)?;
        let key_pair = self.key_pair(&funding_address)?;
        signer
            .get_signing_details(&funding_address, &key_pair, swap_id)
            .await
            .map_err(|e| FundingAddressError::Internal(e.to_string()))
    }

    pub async fn set_signature(
        &self,
        request: SetSignatureRequest,
    ) -> Result<FundingAddress, FundingAddressError> {
        let signer = self.signer.lock().await;
        let funding_address = self.get_by_id(&request.id)?;
        if funding_address.status == FundingAddressStatus::TransactionClaimed.to_string()
            || funding_address.status == FundingAddressStatus::TransactionRefunded.to_string()
        {
            return Err(FundingAddressError::Internal(
                "funding address has already been spent".to_string(),
            ));
        }
        let key_pair = self.key_pair(&funding_address)?;
        let (signed_tx, swap_id) = signer
            .set_signature(&funding_address, &key_pair, &request)
            .await
            .map_err(|e| FundingAddressError::Internal(e.to_string()))?;
        self.funding_address_helper
            .set_presigned_tx(
                &funding_address.id,
                Some(SwapTxInfo {
                    swap_id,
                    presigned_tx: signed_tx.serialize().to_vec(),
                }),
            )
            .map_err(|e| FundingAddressError::Database(e.to_string()))?;
        Ok(funding_address)
    }

    pub async fn sign_refund(
        &self,
        request: RefundSignatureRequest,
    ) -> Result<PartialSignatureResponse, FundingAddressError> {
        let signer = self.signer.lock().await;
        let funding_address = self.get_by_id(&request.id)?;
        let key_pair = self.key_pair(&funding_address)?;
        let response = signer
            .sign_refund(
                &funding_address,
                &key_pair,
                &SignerRefundSignatureRequest {
                    pub_nonce: request.pub_nonce,
                    transaction_hash: request.transaction_hash,
                },
            )
            .await
            .map_err(|err| {
                if err
                    .downcast_ref::<FundingAddressEligibilityError>()
                    .is_some()
                {
                    FundingAddressError::InvalidRequest(err.to_string())
                } else {
                    FundingAddressError::Internal(err.to_string())
                }
            })?;

        self.funding_address_helper
            .set_status(
                &funding_address.id,
                &FundingAddressStatus::TransactionRefunded.to_string(),
            )
            .map_err(|e| FundingAddressError::Database(e.to_string()))?;

        Ok(response)
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use crate::currencies::Currency;
    use crate::db::helpers::chain_swap::test::MockChainSwapHelper;
    use crate::db::helpers::funding_address::test::MockFundingAddressHelper;
    use crate::db::helpers::keys::test::MockKeysHelper;
    use crate::db::helpers::swap::test::MockSwapHelper;
    use crate::service::test::get_test_currencies;
    use crate::wallet::Network;
    use anyhow::anyhow;
    use bitcoin::PublicKey;
    use std::collections::HashMap;
    use std::str::FromStr;

    const TEST_PUBKEY: &str = "02a1633cafcc01ebfb6d78e39f687a1f0995c62fc95f51ead10a02ee0be551b5dc";

    /// Test context builder for FundingAddressService tests
    struct TestContext {
        funding_helper: MockFundingAddressHelper,
        keys_helper: MockKeysHelper,
        currencies: Option<Currencies>,
    }

    impl TestContext {
        fn new() -> Self {
            Self {
                funding_helper: MockFundingAddressHelper::new(),
                keys_helper: MockKeysHelper::new(),
                currencies: None,
            }
        }

        fn with_key_index(mut self, index: i32) -> Self {
            self.keys_helper
                .expect_increment_highest_used_index()
                .returning(move |_| Ok(index));
            self
        }

        fn with_key_index_error(mut self, msg: &'static str) -> Self {
            self.keys_helper
                .expect_increment_highest_used_index()
                .returning(move |_| Err(anyhow!(msg)));
            self
        }

        fn with_insert_success(mut self) -> Self {
            self.funding_helper.expect_insert().returning(|__, _| Ok(1));
            self
        }

        fn with_insert_error(mut self, msg: &'static str) -> Self {
            self.funding_helper
                .expect_insert()
                .returning(move |_, _| Err(anyhow!(msg)));
            self
        }

        fn with_insert_validator<F>(mut self, validator: F) -> Self
        where
            F: Fn(&FundingAddress, &ScriptPubKey) -> bool + Send + Sync + 'static,
        {
            self.funding_helper
                .expect_insert()
                .withf(move |funding_address, script_pubkey| {
                    validator(funding_address, script_pubkey)
                })
                .returning(|_, _| Ok(1));
            self
        }

        fn with_get_by_id_result(mut self, result: Option<FundingAddress>) -> Self {
            self.funding_helper
                .expect_get_by_id()
                .returning(move |_| Ok(result.clone()));
            self
        }

        fn with_get_by_id_error(mut self, msg: &'static str) -> Self {
            self.funding_helper
                .expect_get_by_id()
                .returning(move |_| Err(anyhow!(msg)));
            self
        }

        async fn with_currencies(mut self) -> Self {
            self.currencies = Some(get_test_currencies().await);
            self
        }

        fn with_no_wallet(mut self, symbol: &str) -> Self {
            self.currencies = Some(Arc::new(HashMap::from([(
                symbol.to_string(),
                Currency {
                    network: Network::Regtest,
                    wallet: None,
                    chain: None,
                    cln: None,
                    lnd: None,
                    evm_manager: None,
                },
            )])));
            self
        }

        fn build(self) -> FundingAddressService {
            FundingAddressService::new(
                None,
                Arc::new(self.funding_helper),
                Arc::new(self.keys_helper),
                Arc::new(MockSwapHelper::new()),
                Arc::new(MockChainSwapHelper::new()),
                self.currencies.unwrap_or_else(|| Arc::new(HashMap::new())),
                Cache::Memory(crate::cache::MemCache::new()),
            )
        }
    }

    fn request(symbol: &str) -> CreateFundingAddressRequest {
        CreateFundingAddressRequest {
            symbol: symbol.to_string(),
            refund_public_key: PublicKey::from_str(TEST_PUBKEY).unwrap(),
        }
    }

    fn sample_funding_address(id: &str, symbol: &str) -> FundingAddress {
        let mut funding_address = FundingAddress {
            id: id.to_string(),
            symbol: symbol.to_string(),
            key_index: 10,
            their_public_key: alloy::hex::decode(TEST_PUBKEY).unwrap(),
            timeout_block_height: 1000,
            ..Default::default()
        };
        // Add the serialized tree
        funding_address.tree = funding_address.tree_json().unwrap();
        funding_address
    }

    mod create {
        use super::*;

        #[tokio::test]
        async fn liquid_returns_confidential_address_with_blinding_key() {
            let service = TestContext::new()
                .with_key_index(10)
                .with_insert_success()
                .with_currencies()
                .await
                .build();

            let response = service.create(request("L-BTC")).await.unwrap();

            assert!(
                response.address.starts_with("el"),
                "expected confidential address"
            );
            assert!(!response.server_public_key.is_empty());
            assert!(response.blinding_key.is_some_and(|k| !k.is_empty()));
        }

        #[tokio::test]
        async fn btc_returns_address_without_blinding_key() {
            let service = TestContext::new()
                .with_key_index(10)
                .with_insert_success()
                .with_currencies()
                .await
                .build();

            let response = service.create(request("BTC")).await.unwrap();

            assert!(
                response.address.starts_with("bcrt1"),
                "expected regtest address"
            );
            assert!(!response.server_public_key.is_empty());
            assert!(response.blinding_key.is_none());
        }

        #[tokio::test]
        async fn uses_correct_key_index() {
            let expected = 42;
            let service = TestContext::new()
                .with_key_index(expected)
                .with_insert_validator(move |fa, _| fa.key_index == expected)
                .with_currencies()
                .await
                .build();

            assert!(service.create(request("L-BTC")).await.is_ok());
        }

        #[tokio::test]
        async fn fails_for_unknown_currency() {
            let service = TestContext::new().with_currencies().await.build();

            let err = service.create(request("INVALID")).await.unwrap_err();

            assert!(err.to_string().contains("currency not found"));
        }

        #[tokio::test]
        async fn fails_when_no_wallet() {
            let service = TestContext::new().with_no_wallet("L-BTC").build();

            let err = service.create(request("L-BTC")).await.unwrap_err();

            assert!(err.to_string().contains("no wallet"));
        }

        #[tokio::test]
        async fn fails_on_insert_error() {
            let service = TestContext::new()
                .with_key_index(10)
                .with_insert_error("db insert failed")
                .with_currencies()
                .await
                .build();

            let err = service.create(request("L-BTC")).await.unwrap_err();

            assert!(err.to_string().contains("db insert failed"));
        }

        #[tokio::test]
        async fn fails_on_key_increment_error() {
            let service = TestContext::new()
                .with_key_index_error("key error")
                .with_currencies()
                .await
                .build();

            let err = service.create(request("L-BTC")).await.unwrap_err();

            assert!(err.to_string().contains("key error"));
        }
    }

    mod get_by_id {
        use super::*;

        #[tokio::test]
        async fn returns_funding_address() {
            let service = TestContext::new()
                .with_get_by_id_result(Some(sample_funding_address("test123", "L-BTC")))
                .with_currencies()
                .await
                .build();

            let result = service.get_by_id("test123").unwrap();

            assert_eq!(result.id, "test123");
            assert_eq!(result.symbol, "L-BTC");
        }

        #[tokio::test]
        async fn fails_when_not_found() {
            let service = TestContext::new()
                .with_get_by_id_result(None)
                .with_currencies()
                .await
                .build();

            let err = service.get_by_id("nonexistent").unwrap_err();

            assert!(err.to_string().contains("funding address not found"));
        }

        #[tokio::test]
        async fn fails_on_database_error() {
            let service = TestContext::new()
                .with_get_by_id_error("db error")
                .with_currencies()
                .await
                .build();

            let err = service.get_by_id("someid").unwrap_err();

            assert!(err.to_string().contains("db error"));
        }
    }
}

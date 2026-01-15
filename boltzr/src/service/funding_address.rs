use crate::api::ws::types::FundingAddressUpdate;
use crate::currencies::Currencies;
use crate::db::helpers::funding_address::FundingAddressHelper;
use crate::db::helpers::keys::KeysHelper;
use crate::db::helpers::script_pubkey::ScriptPubKeyHelper;
use crate::db::helpers::swap::SwapHelper;
use crate::db::models::{FundingAddress, ScriptPubKey};
use crate::service::funding_address_signer::{
    CooperativeDetails, FundingAddressSigner, SetSignatureRequest,
};
use crate::utils::generate_id;
use anyhow::Result;
use bitcoin::PublicKey;
use bitcoin::key::{Keypair, Secp256k1};
use boltz_core::Address;
use std::fmt::{Display, Formatter};
use std::sync::Arc;
use tokio::sync::broadcast;
use tracing::debug;

#[derive(Debug)]
pub enum FundingAddressError {
    CurrencyNotFound(String),
    NoWallet(String),
    NotFound(String),
    Database(String),
    Internal(String),
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
            FundingAddressError::Internal(msg) => write!(f, "{}", msg),
        }
    }
}

impl std::error::Error for FundingAddressError {}

pub struct FundingAddressService {
    funding_address_helper: Arc<dyn FundingAddressHelper + Sync + Send>,
    keys_helper: Arc<dyn KeysHelper + Sync + Send>,
    script_pubkey_helper: Arc<dyn ScriptPubKeyHelper + Sync + Send>,
    signer: FundingAddressSigner,
    currencies: Currencies,
}

#[derive(Debug, Clone)]
pub struct CreateFundingAddressRequest {
    pub symbol: String,
    pub refund_public_key: PublicKey,
    pub timeout_block_height: Option<u32>,
}

#[derive(Debug, Clone)]
pub struct CreateFundingAddressResponse {
    pub id: String,
    pub address: String,
    pub timeout_block_height: u32,
    pub boltz_public_key: String,
}

#[derive(Debug, Clone)]
pub struct FundingAddressResponse {
    pub id: String,
    pub symbol: String,
    pub status: String,
    pub address: String,
    pub timeout_block_height: u32,
    pub boltz_public_key: String,
    pub lockup_transaction_id: Option<String>,
    pub swap_id: Option<String>,
}

impl FundingAddressService {
    pub fn new(
        funding_address_helper: Arc<dyn FundingAddressHelper + Sync + Send>,
        keys_helper: Arc<dyn KeysHelper + Sync + Send>,
        swap_helper: Arc<dyn SwapHelper + Sync + Send>,
        script_pubkey_helper: Arc<dyn ScriptPubKeyHelper + Sync + Send>,
        currencies: Currencies,
    ) -> Self {
        let signer = FundingAddressSigner::new(swap_helper, currencies.clone());
        Self {
            funding_address_helper,
            keys_helper,
            script_pubkey_helper,
            signer,
            currencies,
        }
    }

    /// Converts a FundingAddress database model to an API response by deriving
    /// the address and public key from the stored data.
    fn to_response(
        &self,
        funding_address: &FundingAddress,
    ) -> Result<FundingAddressResponse, FundingAddressError> {
        let our_key_pair = self.key_pair(funding_address)?;
        let script_pubkey = funding_address
            .script_pubkey(&our_key_pair)
            .map_err(|e| FundingAddressError::Internal(e.to_string()))?;
        let currency = self.currencies.get(&funding_address.symbol).ok_or(
            FundingAddressError::CurrencyNotFound(funding_address.symbol.clone()),
        )?;
        let address = Address::from_bitcoin_script(currency.network, &script_pubkey.to_bytes())
            .map_err(|e| FundingAddressError::Internal(e.to_string()))?;

        Ok(FundingAddressResponse {
            id: funding_address.id.clone(),
            symbol: funding_address.symbol.clone(),
            status: funding_address.status.clone(),
            address: address.to_string(),
            timeout_block_height: funding_address.timeout_block_height as u32,
            boltz_public_key: our_key_pair.public_key().to_string(),
            lockup_transaction_id: funding_address.lockup_transaction_id.clone(),
            swap_id: funding_address.swap_id.clone(),
        })
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
            .derive_keys(funding_address.key_index as u64)
            .map_err(|e| FundingAddressError::Internal(e.to_string()))?
            .to_keypair(&secp);
        Ok(our_key_pair)
    }

    pub fn create(
        &self,
        request: CreateFundingAddressRequest,
    ) -> Result<FundingAddressResponse, FundingAddressError> {
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

        debug!("Using key index {} for funding address", key_index);

        let timeout_block_height = request.timeout_block_height.unwrap_or(0) as u32;
        let id = generate_id(None);

        let funding_address = FundingAddress {
            id: id.clone(),
            symbol: request.symbol.clone(),
            key_index: key_index as i32,
            their_public_key: request.refund_public_key.to_string(),
            timeout_block_height: timeout_block_height as i32,
            ..Default::default()
        };

        // Insert into database
        self.funding_address_helper
            .insert(&funding_address)
            .map_err(|e| FundingAddressError::Database(e.to_string()))?;

        let script_pubkey = ScriptPubKey {
            symbol: request.symbol.clone(),
            script_pubkey: funding_address
                .script_pubkey(&self.key_pair(&funding_address)?)
                .map_err(|e| FundingAddressError::Internal(e.to_string()))?
                .to_bytes(),
            funding_address_id: Some(id.clone()),
            swap_id: None,
        };

        self.script_pubkey_helper
            .add(&script_pubkey)
            .map_err(|e| FundingAddressError::Database(e.to_string()))?;

        debug!("Created funding address {}", id);
        self.to_response(&funding_address)
    }

    fn query_by_id(&self, id: &str) -> Result<FundingAddress, FundingAddressError> {
        self.funding_address_helper
            .get_by_id(id)
            .map_err(|e| FundingAddressError::Database(e.to_string()))?
            .ok_or(FundingAddressError::NotFound(id.to_string()))
    }

    pub fn get_by_id(&self, id: &str) -> Result<FundingAddressResponse, FundingAddressError> {
        let funding_address = self.query_by_id(id)?;
        self.to_response(&funding_address)
    }

    pub fn get_signing_details(&self, id: &str, swap_id: &str) -> Result<CooperativeDetails> {
        let funding_address = self.query_by_id(id)?;
        let key_pair = self.key_pair(&funding_address)?;
        self.signer
            .get_signing_details(&funding_address, &key_pair, swap_id)
    }

    pub fn set_signature(&self, request: SetSignatureRequest) -> Result<FundingAddress> {
        let funding_address = self.query_by_id(&request.id)?;
        let (signed_tx, swap_id) = self.signer.set_signature(&funding_address, &request)?;
        self.funding_address_helper.set_presigned_tx(
            &funding_address.id,
            Some(signed_tx.serialize().to_vec()),
            Some(swap_id),
        )?;
        Ok(funding_address)
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use crate::currencies::Currency;
    use crate::db::helpers::funding_address::test::MockFundingAddressHelper;
    use crate::db::helpers::keys::test::MockKeysHelper;
    use crate::db::helpers::script_pubkey::test::MockScriptPubKeyHelper;
    use crate::db::helpers::swap::test::MockSwapHelper;
    use crate::wallet::{Elements, Network, Wallet};
    use anyhow::anyhow;
    use bitcoin::PublicKey;
    use std::collections::HashMap;
    use std::str::FromStr;
    use tokio;

    const TEST_PUBKEY: &str = "0e5b4f43d66647713102a5e65be6ee689a16b44cfae716c724e319c9023e63452";
    const TEST_SYMBOL: &str = "L-BTC";

    fn get_liquid_wallet() -> Arc<dyn Wallet + Send + Sync> {
        Arc::new(
            Elements::new(
                Network::Regtest,
                &crate::wallet::test::get_seed(),
                "m/0/1".to_string(),
                Arc::new(crate::chain::elements_client::test::get_client().0),
            )
            .unwrap(),
        )
    }

    fn get_currencies() -> Currencies {
        Arc::new(HashMap::from([(
            TEST_SYMBOL.to_string(),
            Currency {
                network: Network::Regtest,
                wallet: Some(get_liquid_wallet()),
                chain: None,
                cln: None,
                lnd: None,
                evm_manager: None,
            },
        )]))
    }

    fn create_keys_helper(key_index: i32) -> MockKeysHelper {
        let mut keys_helper = MockKeysHelper::new();
        keys_helper
            .expect_increment_highest_used_index()
            .returning(move |_| Ok(key_index))
            .times(1);
        keys_helper
    }

    fn create_service(
        funding_address_helper: MockFundingAddressHelper,
        keys_helper: MockKeysHelper,
        swap_helper: MockSwapHelper,
        script_pubkey_helper: MockScriptPubKeyHelper,
        currencies: Option<Currencies>,
    ) -> FundingAddressService {
        FundingAddressService::new(
            Arc::new(funding_address_helper),
            Arc::new(keys_helper),
            Arc::new(swap_helper),
            Arc::new(script_pubkey_helper),
            currencies.unwrap_or_else(get_currencies),
        )
    }

    #[tokio::test]
    async fn test_create_funding_address_success() {
        let mut funding_address_helper = MockFundingAddressHelper::new();
        funding_address_helper
            .expect_insert()
            .returning(|_| Ok(1))
            .times(1);

        let service = create_service(
            funding_address_helper,
            create_keys_helper(10),
            MockSwapHelper::new(),
            MockScriptPubKeyHelper::new(),
            None,
        );

        let refund_pubkey = PublicKey::from_str(TEST_PUBKEY).unwrap();
        let request = CreateFundingAddressRequest {
            symbol: TEST_SYMBOL.to_string(),
            refund_public_key: refund_pubkey,
            timeout_block_height: Some(1000),
        };

        let result = service.create(request);
        assert!(result.is_ok());

        let response = result.unwrap();
        assert!(!response.address.is_empty());
        assert_eq!(response.timeout_block_height, 1000);
        assert!(!response.boltz_public_key.is_empty());
    }

    #[tokio::test]
    async fn test_create_funding_address_default_timeout() {
        let mut funding_address_helper = MockFundingAddressHelper::new();
        funding_address_helper
            .expect_insert()
            .returning(|_| Ok(1))
            .times(1);

        let service = create_service(
            funding_address_helper,
            create_keys_helper(5),
            MockSwapHelper::new(),
            MockScriptPubKeyHelper::new(),
            None,
        );

        let refund_pubkey = PublicKey::from_str(TEST_PUBKEY).unwrap();
        let request = CreateFundingAddressRequest {
            symbol: TEST_SYMBOL.to_string(),
            refund_public_key: refund_pubkey,
            timeout_block_height: None,
        };

        let result = service.create(request);
        assert!(result.is_ok());

        let response = result.unwrap();
        assert_eq!(response.timeout_block_height, 0);
    }

    #[tokio::test]
    async fn test_create_funding_address_currency_not_found() {
        let funding_address_helper = MockFundingAddressHelper::new();
        let keys_helper = MockKeysHelper::new();

        let service = create_service(
            funding_address_helper,
            keys_helper,
            MockSwapHelper::new(),
            MockScriptPubKeyHelper::new(),
            None,
        );

        let refund_pubkey = PublicKey::from_str(TEST_PUBKEY).unwrap();
        let request = CreateFundingAddressRequest {
            symbol: "INVALID".to_string(),
            refund_public_key: refund_pubkey,
            timeout_block_height: Some(1000),
        };

        let result = service.create(request);
        assert!(result.is_err());
        assert!(
            result
                .unwrap_err()
                .to_string()
                .contains("currency not found")
        );
    }

    #[tokio::test]
    async fn test_create_funding_address_no_wallet() {
        let funding_address_helper = MockFundingAddressHelper::new();
        let keys_helper = MockKeysHelper::new();

        let currencies_without_wallet = Arc::new(HashMap::from([(
            TEST_SYMBOL.to_string(),
            Currency {
                network: Network::Regtest,
                wallet: None,
                chain: None,
                cln: None,
                lnd: None,
                evm_manager: None,
            },
        )]));

        let service = create_service(
            funding_address_helper,
            keys_helper,
            MockSwapHelper::new(),
            MockScriptPubKeyHelper::new(),
            Some(currencies_without_wallet),
        );

        let refund_pubkey = PublicKey::from_str(TEST_PUBKEY).unwrap();
        let request = CreateFundingAddressRequest {
            symbol: TEST_SYMBOL.to_string(),
            refund_public_key: refund_pubkey,
            timeout_block_height: Some(1000),
        };

        let result = service.create(request);
        assert!(result.is_err());
        assert!(result.unwrap_err().to_string().contains("no wallet"));
    }

    #[tokio::test]
    async fn test_create_funding_address_insert_failure() {
        let mut funding_address_helper = MockFundingAddressHelper::new();
        funding_address_helper
            .expect_insert()
            .returning(|_| Err(anyhow!("database error")))
            .times(1);

        let service = create_service(
            funding_address_helper,
            create_keys_helper(10),
            MockSwapHelper::new(),
            MockScriptPubKeyHelper::new(),
            None,
        );

        let refund_pubkey = PublicKey::from_str(TEST_PUBKEY).unwrap();
        let request = CreateFundingAddressRequest {
            symbol: TEST_SYMBOL.to_string(),
            refund_public_key: refund_pubkey,
            timeout_block_height: Some(1000),
        };

        let result = service.create(request);
        assert!(result.is_err());
        assert!(result.unwrap_err().to_string().contains("database error"));
    }

    #[tokio::test]
    async fn test_create_funding_address_key_increment_failure() {
        let funding_address_helper = MockFundingAddressHelper::new();

        let mut keys_helper = MockKeysHelper::new();
        keys_helper
            .expect_increment_highest_used_index()
            .returning(|_| Err(anyhow!("key increment error")))
            .times(1);

        let service = create_service(
            funding_address_helper,
            keys_helper,
            MockSwapHelper::new(),
            MockScriptPubKeyHelper::new(),
            None,
        );

        let refund_pubkey = PublicKey::from_str(TEST_PUBKEY).unwrap();
        let request = CreateFundingAddressRequest {
            symbol: TEST_SYMBOL.to_string(),
            refund_public_key: refund_pubkey,
            timeout_block_height: Some(1000),
        };

        let result = service.create(request);
        assert!(result.is_err());
        assert!(
            result
                .unwrap_err()
                .to_string()
                .contains("key increment error")
        );
    }

    #[tokio::test]
    async fn test_create_funding_address_uses_correct_key_index() {
        let mut funding_address_helper = MockFundingAddressHelper::new();
        let expected_key_index = 42;

        funding_address_helper
            .expect_insert()
            .withf(move |fa: &FundingAddress| fa.key_index == expected_key_index)
            .returning(|_| Ok(1))
            .times(1);

        let service = create_service(
            funding_address_helper,
            create_keys_helper(expected_key_index),
            MockSwapHelper::new(),
            MockScriptPubKeyHelper::new(),
            None,
        );

        let refund_pubkey = PublicKey::from_str(TEST_PUBKEY).unwrap();
        let request = CreateFundingAddressRequest {
            symbol: TEST_SYMBOL.to_string(),
            refund_public_key: refund_pubkey,
            timeout_block_height: Some(1000),
        };

        let result = service.create(request);
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_get_by_id_success() {
        let mut funding_address_helper = MockFundingAddressHelper::new();
        let test_id = "testid123456";

        funding_address_helper
            .expect_get_by_id()
            .with(mockall::predicate::eq(test_id))
            .returning(|id| {
                Ok(Some(FundingAddress {
                    id: id.to_string(),
                    symbol: TEST_SYMBOL.to_string(),
                    key_index: 10,
                    their_public_key: TEST_PUBKEY.to_string(),
                    timeout_block_height: 1000,
                    ..Default::default()
                }))
            })
            .times(1);

        let keys_helper = MockKeysHelper::new();

        let service = create_service(
            funding_address_helper,
            keys_helper,
            MockSwapHelper::new(),
            MockScriptPubKeyHelper::new(),
            None,
        );

        let result = service.get_by_id(test_id);
        assert!(result.is_ok());

        let funding_address = result.unwrap();
        assert_eq!(funding_address.id, test_id);
        assert_eq!(funding_address.symbol, TEST_SYMBOL);
    }

    #[tokio::test]
    async fn test_get_by_id_not_found() {
        let mut funding_address_helper = MockFundingAddressHelper::new();

        funding_address_helper
            .expect_get_by_id()
            .returning(|_| Ok(None))
            .times(1);

        let keys_helper = MockKeysHelper::new();

        let service = create_service(
            funding_address_helper,
            keys_helper,
            MockSwapHelper::new(),
            MockScriptPubKeyHelper::new(),
            None,
        );

        let result = service.get_by_id("nonexistent");
        assert!(result.is_err());
        assert!(
            result
                .unwrap_err()
                .to_string()
                .contains("funding address not found")
        );
    }

    #[tokio::test]
    async fn test_get_by_id_error() {
        let mut funding_address_helper = MockFundingAddressHelper::new();

        funding_address_helper
            .expect_get_by_id()
            .returning(|_| Err(anyhow!("database error")))
            .times(1);

        let keys_helper = MockKeysHelper::new();

        let service = create_service(
            funding_address_helper,
            keys_helper,
            MockSwapHelper::new(),
            MockScriptPubKeyHelper::new(),
            None,
        );

        let result = service.get_by_id("someid");
        assert!(result.is_err());
        assert!(result.unwrap_err().to_string().contains("database error"));
    }
}

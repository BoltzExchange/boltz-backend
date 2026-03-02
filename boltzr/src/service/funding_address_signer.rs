use crate::chain::types::Type;
use crate::currencies::{Currencies, get_chain_client, get_wallet};
use crate::db::helpers::chain_swap::ChainSwapHelper;
use crate::db::helpers::swap::SwapHelper;
use crate::db::models::{FundingAddress, LightningSwap, SomeSwap};
use crate::swap::TimeoutDeltaProvider;
use crate::swap::{FundingAddressStatus, SwapUpdate};
use anyhow::{Result, anyhow};
use bitcoin::hashes::Hash;
use bitcoin::key::{Keypair, Secp256k1};
use bitcoin::sighash::{Prevouts, SighashCache};
use bitcoin::{Amount, OutPoint, TxOut, Witness};
use boltz_cache::Cache;
use boltz_core::Address;
use boltz_core::bitcoin::InputDetail as BitcoinInputDetail;
use boltz_core::elements::InputDetail as ElementsInputDetail;
use boltz_core::musig::Musig;
use boltz_core::utils::{Destination, InputType, OutputType};
use boltz_core::wrapper::{BitcoinParams, InputDetail, Params, Transaction, construct_tx};
use elements::hex::ToHex;
use serde::{Deserialize, Serialize};
use std::fmt::{Display, Formatter};
use std::str::FromStr;
use std::sync::Arc;

/// Short TTL so that clients can't hold sessions for too long
const CACHE_TTL: u64 = 60;
const CACHE_KEY: &str = "funding_address_signer";
const MEMPOOL_REJECTED_REASON: &str = "transaction not allowed in mempool";

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
struct PendingSigningSession {
    sec_nonce: String,
    pub_nonce: String,
    sighash: String,
    swap_id: String,
    transaction: String,
}

/// Information about a swap needed for linking to a funding address.
#[derive(Debug, Clone)]
struct SwapInfo {
    status: SwapUpdate,
    currency: String,
    lockup_address: String,
    expected_amount: i64,
    timeout_block_height: u32,
}

#[derive(Debug)]
pub(crate) struct FundingAddressEligibilityError(String);

impl Display for FundingAddressEligibilityError {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.0)
    }
}

impl std::error::Error for FundingAddressEligibilityError {}

pub struct FundingAddressSigner {
    swap_helper: Arc<dyn SwapHelper + Sync + Send>,
    chain_swap_helper: Arc<dyn ChainSwapHelper + Sync + Send>,
    currencies: Currencies,
    cache: Cache,
    /// The minimum time buffer in minutes between the swap timeout and funding address timeout
    timeout_buffer_minutes: u64,
}

#[derive(Debug, Clone)]
pub struct CooperativeDetails {
    pub pub_nonce: String,
    pub public_key: String,
    pub transaction_hex: String,
    pub transaction_hash: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SetSignatureRequest {
    #[serde(rename = "pubNonce")]
    pub pub_nonce: String,
    #[serde(rename = "partialSignature")]
    pub partial_signature: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RefundSignatureRequest {
    #[serde(rename = "pubNonce")]
    pub pub_nonce: String,
    #[serde(rename = "transactionHash")]
    pub transaction_hash: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PartialSignatureResponse {
    #[serde(rename = "pubNonce")]
    pub pub_nonce: String,
    #[serde(rename = "partialSignature")]
    pub partial_signature: String,
}

impl FundingAddressSigner {
    pub fn new(
        swap_helper: Arc<dyn SwapHelper + Sync + Send>,
        chain_swap_helper: Arc<dyn ChainSwapHelper + Sync + Send>,
        currencies: Currencies,
        cache: Cache,
        timeout_buffer_minutes: u64,
    ) -> Self {
        Self {
            swap_helper,
            chain_swap_helper,
            currencies,
            cache,
            timeout_buffer_minutes,
        }
    }

    fn cache_field(funding_address_id: &str) -> String {
        format!("session:{}", funding_address_id)
    }

    fn can_spend(&self, funding_address: &FundingAddress, swap_id: &str) -> Result<SwapInfo> {
        let status = FundingAddressStatus::parse(&funding_address.status);
        if !matches![
            status,
            FundingAddressStatus::TransactionMempool | FundingAddressStatus::TransactionConfirmed
        ] {
            return Err(anyhow!(FundingAddressEligibilityError(
                "funding address is not in a spendable state".to_string(),
            )));
        }
        if funding_address.swap_id.is_some() {
            return Err(anyhow!(FundingAddressEligibilityError(
                "funding address is already linked to a swap".to_string(),
            )));
        }
        let swap_info = self.get_swap_info(swap_id)?;
        if funding_address.symbol != swap_info.currency {
            return Err(anyhow!(FundingAddressEligibilityError(
                "funding address chain does not match swap chain".to_string(),
            )));
        }
        if !matches!(
            swap_info.status,
            SwapUpdate::SwapCreated | SwapUpdate::InvoiceSet | SwapUpdate::TransactionMempool
        ) {
            return Err(anyhow!(FundingAddressEligibilityError(
                "swap is not in an eligible state".to_string(),
            )));
        }
        let funding_address_amount = funding_address.lockup_amount.ok_or_else(|| {
            anyhow!(FundingAddressEligibilityError(
                "funding address lockup amount missing".to_string(),
            ))
        })?;
        if funding_address_amount != swap_info.expected_amount {
            return Err(anyhow!(FundingAddressEligibilityError(
                "funding address amount does not match swaps expected amount".to_string(),
            )));
        }

        Ok(swap_info)
    }

    pub async fn get_signing_details(
        &self,
        funding_address: &FundingAddress,
        key_pair: &Keypair,
        swap_id: &str,
    ) -> Result<CooperativeDetails> {
        let swap_info = self.can_spend(funding_address, swap_id)?;
        self.validate_timeout_buffer(funding_address, swap_info.timeout_block_height)?;

        let (tx, msg) = self
            .create_presigning_tx(funding_address, key_pair, &swap_info)
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
                    pub_nonce: hex::encode(pub_nonce),
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

        self.can_spend(funding_address, &session.swap_id)?;

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
            &boltz_core::utils::Chain::from_str(&funding_address.symbol)?,
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

        self.test_mempool_accept(funding_address, &tx).await?;

        Ok((tx, session.swap_id))
    }

    pub async fn sign_refund(
        &self,
        funding_address: &FundingAddress,
        key_pair: &Keypair,
        request: &RefundSignatureRequest,
    ) -> Result<PartialSignatureResponse> {
        if funding_address.swap_id.is_some() {
            return Err(anyhow!(FundingAddressEligibilityError(
                "funding address is already linked to a swap".to_string(),
            )));
        }
        self.cache
            .delete(CACHE_KEY, &Self::cache_field(&funding_address.id))
            .await?;

        let msg: [u8; 32] = hex::decode(&request.transaction_hash)?
            .try_into()
            .map_err(|_| anyhow!("invalid transaction hash length"))?;
        let their_pubkey = Musig::convert_pub_key(&funding_address.their_public_key()?.to_bytes())?;

        let musig = funding_address
            .musig(key_pair)?
            .message(msg)
            .generate_nonce(&mut Musig::rng());

        let pub_nonce = musig.pub_nonce().serialize();
        let musig = musig
            .aggregate_nonces(vec![(
                their_pubkey,
                Musig::convert_pub_nonce(&hex::decode(&request.pub_nonce)?)?,
            )])?
            .initialize_session()?
            .partial_sign()?;

        Ok(PartialSignatureResponse {
            pub_nonce: hex::encode(pub_nonce),
            partial_signature: hex::encode(musig.our_partial_signature().serialize()),
        })
    }

    fn get_swap_info(&self, swap_id: &str) -> Result<SwapInfo> {
        self.swap_helper
            .get_by_id(swap_id)
            .and_then(|swap| {
                Ok(SwapInfo {
                    status: swap.status(),
                    currency: swap.chain_symbol()?,
                    lockup_address: swap.lockupAddress,
                    expected_amount: swap
                        .expectedAmount
                        .ok_or_else(|| anyhow!("swap lockup amount missing"))?,
                    timeout_block_height: swap.timeoutBlockHeight as u32,
                })
            })
            .or_else(|_| {
                self.chain_swap_helper
                    .get_by_id(swap_id)
                    .and_then(|chain_swap| {
                        let receiving = chain_swap.receiving();
                        Ok(SwapInfo {
                            status: chain_swap.status(),
                            currency: receiving.symbol.clone(),
                            lockup_address: receiving.lockupAddress.clone(),
                            expected_amount: receiving
                                .expectedAmount
                                .ok_or_else(|| anyhow!("swap lockup amount missing"))?,
                            timeout_block_height: receiving.timeoutBlockHeight as u32,
                        })
                    })
            })
            .map_err(|e| anyhow!("failed to get swap info: {}", e))
    }

    fn validate_timeout_buffer(
        &self,
        funding_address: &FundingAddress,
        swap_timeout: u32,
    ) -> Result<()> {
        let funding_timeout = funding_address.timeout_block_height as u32;

        let timeout_buffer_blocks = TimeoutDeltaProvider::calculate_blocks(
            &funding_address.symbol,
            self.timeout_buffer_minutes,
        )? as u32;

        let required_max_swap_timeout = funding_timeout.saturating_sub(timeout_buffer_blocks);

        if swap_timeout > required_max_swap_timeout {
            return Err(anyhow!(FundingAddressEligibilityError(format!(
                "swap timeout too close to funding address timeout: difference must be at least {timeout_buffer_blocks} blocks",
            ))));
        }

        Ok(())
    }

    async fn test_mempool_accept(
        &self,
        funding_address: &FundingAddress,
        tx: &Transaction,
    ) -> Result<()> {
        let tx_hex = tx.serialize().to_hex();
        let response = get_chain_client(&self.currencies, &funding_address.symbol)?
            .test_mempool_accept(&[&tx_hex])
            .await?;
        let result = response
            .first()
            .ok_or_else(|| anyhow!("testmempoolaccept returned no result"))?;

        let invalid_reason = match Type::from_str(&funding_address.symbol)? {
            Type::Bitcoin => match result.reject_reason.as_deref() {
                Some(reason) if reason.contains("min relay fee not met") => None,
                Some(reason) => Some(reason.to_string()),
                None => Some(MEMPOOL_REJECTED_REASON.to_string()),
            },
            Type::Elements => match result.reject_reason.as_deref() {
                Some(reason) if !reason.is_empty() => Some(reason.to_string()),
                _ if result.allowed => None,
                _ => Some(MEMPOOL_REJECTED_REASON.to_string()),
            },
        };
        if let Some(reason) = invalid_reason {
            return Err(anyhow!(
                "presigned tx for funding address {} is not valid: {}",
                funding_address.id,
                reason
            ));
        }

        Ok(())
    }

    async fn create_presigning_tx(
        &self,
        funding_address: &FundingAddress,
        key_pair: &Keypair,
        swap_info: &SwapInfo,
    ) -> Result<(Transaction, [u8; 32])> {
        let destination = Address::try_from(swap_info.lockup_address.as_str())?;
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
                keys: *key_pair,
            }))),
            Type::Elements => {
                let chain_client = get_chain_client(&self.currencies, symbol)?;
                let raw_lockup_tx = chain_client.raw_transaction(&tx_id).await?;
                let lockup_tx: elements::Transaction =
                    elements::encode::deserialize(&hex::decode(&raw_lockup_tx)?)?;
                let tx_out = lockup_tx.output[vout as usize].clone();

                let wallet = get_wallet(&self.currencies, symbol)?;
                let blinding_key = wallet.derive_blinding_key(script_pubkey.clone())?;

                let secp = Secp256k1::new();
                Ok(InputDetail::Elements(Box::new(ElementsInputDetail {
                    input_type: InputType::Cooperative,
                    output_type: OutputType::Taproot(None),
                    outpoint: elements::OutPoint::new(tx_id.parse()?, vout),
                    tx_out,
                    keys: *key_pair,
                    blinding_key: Some(Keypair::from_seckey_slice(&secp, &blinding_key)?),
                })))
            }
        }
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use crate::db::helpers::chain_swap::test::MockChainSwapHelper;
    use crate::db::helpers::swap::test::MockSwapHelper;
    use crate::service::funding_address_test_utils::test::*;
    use crate::service::test::get_test_currencies;
    use bitcoin::TapTweakHash;
    use boltz_core::Address as CoreAddress;
    use boltz_core::FeeTarget;
    use boltz_core::musig::Musig;
    use boltz_core::utils::{Chain, Destination};
    use boltz_core::wrapper::{
        BitcoinParams, ElementsParams, InputDetail, Params, Transaction, construct_tx,
    };
    use elements::hex::ToHex;
    use rstest::rstest;
    use serial_test::serial;

    impl Default for SwapInfo {
        fn default() -> Self {
            Self {
                status: SwapUpdate::SwapCreated,
                currency: TEST_SYMBOL.to_string(),
                lockup_address: String::new(),
                expected_amount: 100000,
                timeout_block_height: 500,
            }
        }
    }

    struct TestSignerContext {
        swap_helper: MockSwapHelper,
        chain_swap_helper: MockChainSwapHelper,
        currencies: Option<Currencies>,
        timeout_buffer_minutes: Option<u64>,
    }

    impl TestSignerContext {
        fn new() -> Self {
            Self {
                swap_helper: MockSwapHelper::new(),
                chain_swap_helper: MockChainSwapHelper::new(),
                currencies: None,
                timeout_buffer_minutes: None,
            }
        }

        fn with_swap(mut self, swap_info: SwapInfo) -> Self {
            let lockup_address = swap_info.lockup_address;
            let chain = swap_info.currency;
            let status = swap_info.status;
            let expected_amount = swap_info.expected_amount;
            let timeout_block_height = swap_info.timeout_block_height as i32;
            self.swap_helper.expect_get_by_id().returning(move |_| {
                let mut swap = test_swap(&lockup_address, &chain);
                swap.timeoutBlockHeight = timeout_block_height;
                swap.status = status.to_string();
                swap.expectedAmount = Some(expected_amount);
                Ok(swap)
            });
            self
        }

        fn with_swap_not_found(mut self) -> Self {
            self.swap_helper
                .expect_get_by_id()
                .returning(|_| Err(anyhow!("swap not found")));
            self
        }

        fn with_chain_swap_timeout(
            mut self,
            lockup_address: &str,
            timeout_block_height: i32,
        ) -> Self {
            let lockup_address = lockup_address.to_string();
            self.chain_swap_helper
                .expect_get_by_id()
                .returning(move |_| {
                    Ok(test_chain_swap_info_with_timeout(
                        &lockup_address,
                        timeout_block_height,
                    ))
                });
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

        fn with_timeout_buffer_minutes(mut self, minutes: u64) -> Self {
            self.timeout_buffer_minutes = Some(minutes);
            self
        }

        fn build(self) -> FundingAddressSigner {
            let currencies = self
                .currencies
                .unwrap_or_else(|| Arc::new(std::collections::HashMap::new()));
            create_signer(
                self.swap_helper,
                self.chain_swap_helper,
                currencies,
                self.timeout_buffer_minutes,
            )
        }
    }

    fn test_swap_info(lockup_address: &str, symbol: &str) -> SwapInfo {
        SwapInfo {
            status: SwapUpdate::SwapCreated,
            currency: symbol.to_string(),
            lockup_address: lockup_address.to_string(),
            expected_amount: 100000,
            timeout_block_height: 500,
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
                .contains("failed to get swap info")
        );
    }

    #[rstest]
    #[case(SwapUpdate::SwapCreated, true)]
    #[case(SwapUpdate::TransactionMempool, true)]
    #[case(SwapUpdate::InvoiceSet, true)]
    #[case(SwapUpdate::TransactionConfirmed, false)]
    #[tokio::test]
    async fn test_can_spend_swap_status_eligibility(
        #[case] swap_status: SwapUpdate,
        #[case] should_succeed: bool,
    ) {
        let signer = TestSignerContext::new()
            .with_swap(SwapInfo {
                status: swap_status,
                ..Default::default()
            })
            .with_currencies()
            .await
            .build();

        let key_pair = get_keypair();
        let funding_address = test_funding_address_with_lockup(
            "test_funding_swap_not_created",
            &key_pair.public_key().serialize(),
            "tx123",
            0,
            100000,
        );

        let result = signer.can_spend(&funding_address, TEST_SWAP_ID);
        assert_eq!(result.is_ok(), should_succeed, "result: {:?}", result);
        if !should_succeed {
            assert!(
                result
                    .unwrap_err()
                    .to_string()
                    .contains("swap is not in an eligible state")
            );
        }
    }

    #[tokio::test]
    async fn test_can_spend_rejects_amount_mismatch() {
        let signer = TestSignerContext::new()
            .with_swap(SwapInfo {
                expected_amount: 100000,
                ..Default::default()
            })
            .with_currencies()
            .await
            .build();
        let key_pair = get_keypair();
        let funding_address = test_funding_address_with_lockup(
            "test_funding_amount_mismatch",
            &key_pair.public_key().serialize(),
            "tx123",
            0,
            100001,
        );

        let result = signer.can_spend(&funding_address, TEST_SWAP_ID);
        assert!(result.is_err());
        assert!(
            result
                .unwrap_err()
                .to_string()
                .contains("funding address amount does not match swaps expected amount")
        );
    }

    #[tokio::test]
    async fn test_can_spend_rejects_chain_mismatch() {
        let signer = TestSignerContext::new()
            .with_swap(SwapInfo {
                currency: "L-BTC".to_string(),
                ..Default::default()
            })
            .with_currencies()
            .await
            .build();
        let key_pair = get_keypair();
        let funding_address = test_funding_address_with_lockup(
            "test_funding_chain_mismatch",
            &key_pair.public_key().serialize(),
            "tx123",
            0,
            100000,
        );

        let result = signer.can_spend(&funding_address, TEST_SWAP_ID);
        assert!(result.is_err());
        assert!(
            result
                .unwrap_err()
                .to_string()
                .contains("funding address chain does not match swap chain")
        );
    }

    #[rstest]
    #[case(true, false, "bcrt1qtest123", 100000, 500, true)] // swap found
    #[case(false, true, "bcrt1qchain123", 100000, 600, true)] // chain swap found
    #[case(false, false, "", 0, 0, false)] // both fail
    #[tokio::test]
    async fn test_get_swap_info_scenarios(
        #[case] swap_exists: bool,
        #[case] chain_swap_exists: bool,
        #[case] expected_address: &str,
        #[case] expected_amount: i64,
        #[case] expected_timeout: u32,
        #[case] should_succeed: bool,
    ) {
        let mut context = TestSignerContext::new().with_currencies().await;

        if swap_exists {
            context = context.with_swap(SwapInfo {
                lockup_address: expected_address.to_string(),
                expected_amount,
                timeout_block_height: expected_timeout,
                ..Default::default()
            });
        } else {
            context = context.with_swap_not_found();
        }

        if chain_swap_exists {
            context = context.with_chain_swap_timeout(expected_address, expected_timeout as i32);
        } else {
            context = context.with_chain_swap_not_found();
        }

        let signer = context.build();
        let result = signer.get_swap_info(TEST_SWAP_ID);

        if should_succeed {
            assert!(result.is_ok());
            let swap_info = result.unwrap();
            assert_eq!(swap_info.lockup_address, expected_address);
            assert_eq!(swap_info.expected_amount, expected_amount);
            assert_eq!(swap_info.timeout_block_height, expected_timeout);
        } else {
            assert!(result.is_err());
            assert!(
                result
                    .unwrap_err()
                    .to_string()
                    .contains("failed to get swap info")
            );
        }
    }

    #[rstest]
    #[case::btc_within_buffer("BTC", 990, Some(100), true)]
    #[case::btc_exceeds_buffer("BTC", 991, Some(100), false)]
    #[case::lbtc_within_buffer("L-BTC", 940, Some(60), true)]
    #[case::lbtc_exceeds_buffer("L-BTC", 941, Some(60), false)]
    #[case::default_buffer("BTC", 856, None, true)]
    #[tokio::test]
    async fn test_validate_timeout_buffer(
        #[case] symbol: &str,
        #[case] swap_timeout: i32,
        #[case] buffer_minutes: Option<u64>,
        #[case] should_pass: bool,
    ) {
        let mut ctx = TestSignerContext::new();
        ctx = ctx.with_currencies().await;
        if let Some(minutes) = buffer_minutes {
            ctx = ctx.with_timeout_buffer_minutes(minutes);
        }
        let signer = ctx.build();

        let key_pair = get_keypair();
        let funding_address = test_funding_address_for_symbol(
            "test_timeout",
            symbol,
            &key_pair.public_key().serialize(),
            1000,
        );

        let result = signer.validate_timeout_buffer(&funding_address, swap_timeout as u32);

        assert_eq!(result.is_ok(), should_pass, "result: {:?}", result);
    }

    #[rstest]
    #[case("BTC")]
    #[case("L-BTC")]
    #[tokio::test]
    #[serial]
    async fn test_set_signature_with_real_lockup(#[case] symbol: &str) {
        let funding_address_id = "test_funding";
        let currencies = get_test_currencies().await;
        let chain_client = currencies
            .get(symbol)
            .unwrap()
            .chain
            .as_ref()
            .unwrap()
            .clone();

        // Generate a lockup address for the swap
        let address_type = if symbol == "L-BTC" {
            Some("blech32")
        } else {
            Some("bech32m")
        };
        let swap_lockup_address = chain_client
            .get_new_address(None, "test", address_type)
            .await
            .unwrap();

        let signer = TestSignerContext::new()
            .with_swap(test_swap_info(&swap_lockup_address, symbol))
            .with_currencies()
            .await
            .build();

        let client_key_pair = get_keypair();
        let server_key_pair = get_keypair();

        let mut funding_address = setup_funding_address_with_real_lockup(
            &chain_client,
            funding_address_id,
            symbol,
            &client_key_pair.public_key().serialize(),
            1000,
            &server_key_pair,
        )
        .await;
        funding_address.status = FundingAddressStatus::TransactionConfirmed.to_string();

        let details = signer
            .get_signing_details(&funding_address, &server_key_pair, TEST_SWAP_ID)
            .await
            .unwrap();

        // Client side signing
        let (client_nonce, client_sig) = client_sign(
            &client_key_pair,
            &server_key_pair,
            &funding_address,
            &details,
        );

        let request = SetSignatureRequest {
            pub_nonce: client_nonce,
            partial_signature: client_sig,
        };

        let signed_tx: std::result::Result<(Transaction, String), anyhow::Error> = signer
            .set_signature(&funding_address, &server_key_pair, &request)
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
        if symbol == "BTC" {
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
                &FundingAddressSigner::cache_field(funding_address_id),
            )
            .await
            .unwrap();
        assert!(cached_session.is_none());
    }

    async fn build_refund_tx(
        signer: &FundingAddressSigner,
        funding_address: &FundingAddress,
        key_pair: &Keypair,
        destination_address: &str,
        currencies: &Currencies,
    ) -> Result<(Transaction, InputDetail, [u8; 32])> {
        let destination = CoreAddress::try_from(destination_address)?;
        let symbol = funding_address.symbol.as_str();

        let input_detail = signer.input_detail(funding_address, key_pair).await?;
        let chain_client = get_chain_client(currencies, symbol)?;
        let fee = chain_client.estimate_fee().await?;
        let params = match &input_detail {
            InputDetail::Bitcoin(btc_input) => Params::Bitcoin(BitcoinParams {
                inputs: &[btc_input.as_ref()],
                destination: &Destination::Single(&destination.clone().try_into()?),
                fee: FeeTarget::Relative(fee),
            }),
            InputDetail::Elements(elements_input) => Params::Elements(ElementsParams {
                genesis_hash: chain_client.network().liquid_genesis_hash()?,
                inputs: &[elements_input.as_ref()],
                destination: &Destination::Single(&destination.clone().try_into()?),
                fee: FeeTarget::Relative(fee),
            }),
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
                let network = currencies
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

        Ok((tx, input_detail, msg))
    }

    #[rstest]
    #[case("BTC")]
    #[case("L-BTC")]
    #[tokio::test]
    #[serial]
    async fn test_sign_refund_with_real_lockup(#[case] symbol: &str) {
        let funding_address_id = "test_funding";
        let currencies = get_test_currencies().await;
        let chain_client = currencies
            .get(symbol)
            .unwrap()
            .chain
            .as_ref()
            .unwrap()
            .clone();

        let signer = TestSignerContext::new().with_currencies().await.build();

        let client_key_pair = get_keypair();
        let server_key_pair = get_keypair();

        let funding_address = setup_funding_address_with_real_lockup(
            &chain_client,
            funding_address_id,
            symbol,
            &client_key_pair.public_key().serialize(),
            1000,
            &server_key_pair,
        )
        .await;

        let address_type = if symbol == "L-BTC" {
            Some("blech32")
        } else {
            Some("bech32m")
        };
        let destination_address = chain_client
            .get_new_address(None, "test", address_type)
            .await
            .unwrap();

        let (mut tx, input_detail, msg) = build_refund_tx(
            &signer,
            &funding_address,
            &server_key_pair,
            &destination_address,
            &currencies,
        )
        .await
        .unwrap();

        let mut musig = Musig::setup(
            Musig::convert_keypair(client_key_pair.secret_key().secret_bytes()).unwrap(),
            vec![
                Musig::convert_pub_key(&server_key_pair.public_key().serialize()).unwrap(),
                Musig::convert_pub_key(&client_key_pair.public_key().serialize()).unwrap(),
            ],
        )
        .unwrap();

        let untweaked_internal_key =
            bitcoin::XOnlyPublicKey::from_slice(&musig.agg_pk().serialize()).unwrap();
        let secp = Secp256k1::new();
        let tree_json = funding_address.tree.clone();
        let tweak = match Chain::from_str(symbol).unwrap() {
            Chain::Bitcoin => {
                let tree =
                    serde_json::from_str::<boltz_core::bitcoin::FundingTree>(&tree_json).unwrap();
                let taproot_spend_info = tree
                    .build()
                    .unwrap()
                    .finalize(&secp, untweaked_internal_key)
                    .unwrap();
                TapTweakHash::from_key_and_tweak(
                    untweaked_internal_key,
                    taproot_spend_info.merkle_root(),
                )
                .to_scalar()
            }
            Chain::Elements => {
                let tree =
                    serde_json::from_str::<boltz_core::elements::FundingTree>(&tree_json).unwrap();
                let taproot_spend_info = tree
                    .build()
                    .unwrap()
                    .finalize(&secp, untweaked_internal_key)
                    .unwrap();
                elements::taproot::TapTweakHash::from_key_and_tweak(
                    untweaked_internal_key,
                    taproot_spend_info.merkle_root(),
                )
                .to_scalar()
            }
        };
        musig = musig
            .xonly_tweak_add(&Musig::convert_scalar_be(&tweak.to_be_bytes()).unwrap())
            .unwrap();

        let musig = musig.message(msg).generate_nonce(&mut Musig::rng());
        let client_pub_nonce = musig.pub_nonce().serialize();

        let response = signer
            .sign_refund(
                &funding_address,
                &server_key_pair,
                &RefundSignatureRequest {
                    pub_nonce: hex::encode(client_pub_nonce),
                    transaction_hash: hex::encode(msg),
                },
            )
            .await
            .unwrap();

        let server_pubkey =
            Musig::convert_pub_key(&server_key_pair.public_key().serialize()).unwrap();
        let musig = musig
            .aggregate_nonces(vec![(
                server_pubkey,
                Musig::convert_pub_nonce(&hex::decode(&response.pub_nonce).unwrap()).unwrap(),
            )])
            .unwrap()
            .initialize_session()
            .unwrap()
            .partial_sign()
            .unwrap()
            .partial_add(
                server_pubkey,
                Musig::convert_partial_signature(
                    hex::decode(&response.partial_signature).unwrap().as_slice(),
                )
                .unwrap(),
            )
            .unwrap();

        let agg_pk = musig.agg_pk();
        let agg_sig = musig.partial_aggregate().unwrap();
        let sig = agg_sig.verify(&agg_pk, &msg).unwrap();
        assert!(sig.verify(&msg, &agg_pk).is_ok());

        let sig_bytes = sig.to_byte_array().to_vec();
        match (&mut tx, &input_detail) {
            (Transaction::Bitcoin(btc_tx), InputDetail::Bitcoin(_)) => {
                btc_tx.input[0].witness = Witness::from_slice(&[sig_bytes]);
            }
            (Transaction::Elements(elements_tx), InputDetail::Elements(_)) => {
                elements_tx.input[0].witness.script_witness = vec![sig_bytes];
            }
            _ => panic!("mismatched transaction/input detail types"),
        }

        let broadcast_result = chain_client
            .send_raw_transaction(&tx.serialize().to_hex())
            .await;
        assert!(
            broadcast_result.is_ok(),
            "broadcast failed: {:?}",
            broadcast_result.err()
        );
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
    #[case(FundingAddressStatus::Created)]
    #[case(FundingAddressStatus::Expired)]
    #[case(FundingAddressStatus::TransactionClaimed)]
    #[tokio::test]
    async fn test_set_signature_rejects_unspendable_statuses(#[case] status: FundingAddressStatus) {
        let signer = TestSignerContext::new()
            .with_swap(test_swap_info("bcrt1qtest123", TEST_SYMBOL))
            .with_currencies()
            .await
            .build();
        let key_pair = get_keypair();

        let mut funding_address = test_funding_address(
            "test_funding_unspendable_status",
            &key_pair.public_key().serialize(),
        );
        signer
            .cache
            .set(
                CACHE_KEY,
                &FundingAddressSigner::cache_field(&funding_address.id),
                &PendingSigningSession {
                    sec_nonce: "00".to_string(),
                    pub_nonce: "00".to_string(),
                    sighash: "00".repeat(32),
                    swap_id: TEST_SWAP_ID.to_string(),
                    transaction: "00".to_string(),
                },
                Some(CACHE_TTL),
            )
            .await
            .unwrap();
        funding_address.status = status.to_string();

        let request = SetSignatureRequest {
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
                .contains("funding address is not in a spendable state")
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

        let mut funding_address_with_lockup = setup_funding_address_with_real_lockup(
            &chain_client,
            "test_input_detail_btc",
            TEST_SYMBOL,
            &client_key_pair.public_key().serialize(),
            1000,
            &server_key_pair,
        )
        .await;
        funding_address_with_lockup.swap_id = Some(TEST_SWAP_ID.to_string());

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
            .with_swap(test_swap_info(&swap_lockup_address, TEST_SYMBOL))
            .with_currencies()
            .await
            .build();

        let client_key_pair = get_keypair();
        let server_key_pair = get_keypair();

        let funding_address = setup_funding_address_with_real_lockup(
            &chain_client,
            "test_funding_no_swap_id",
            TEST_SYMBOL,
            &client_key_pair.public_key().serialize(),
            1000,
            &server_key_pair,
        )
        .await;

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

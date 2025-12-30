use crate::{
    cache::Cache,
    chain::{Client, types::UnspentOutput},
    currencies::{Currencies, Currency},
    db::{
        helpers::{chain_swap::ChainSwapHelper, swap::SwapHelper},
        models::{LightningSwap, SomeSwap, SwapVersion},
    },
    swap::SwapUpdate,
    wallet::Wallet,
};
use alloy::hex;
use anyhow::{Context, Result};
use bitcoin::Amount;
use boltz_core::{
    FeeTarget, Musig, Network,
    elements::{AssetPair, Tree as ElementsTree, construct_asset_rescue},
};
use elements::{
    Address, OutPoint, Transaction,
    secp256k1_zkp::{Keypair, Message, Secp256k1},
    sighash::{Prevouts, SighashCache},
};
use elements::{SchnorrSig, pset::serialize::Serialize};
use futures_util::StreamExt;
use std::{collections::HashMap, str::FromStr, sync::Arc};

/// Short TTL so that clients can't reserve UTXOs for too long
const CACHE_TTL: u64 = 15;
const CACHE_KEY: &str = "asset_rescue";

type RescueNode<'a> = (
    &'a Currency,
    Arc<dyn Client + Send + Sync>,
    Arc<dyn Wallet + Send + Sync>,
);

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
struct PendingRescue {
    sec_nonce: String,
    pub_nonce: String,
    sighash: String,
    funding_txid: String,
    funding_vout: u32,
    transaction: String,
}

struct AssetRescueDetails {
    lockup_address: String,
    key_index: u64,
    their_public_key: Vec<u8>,
    swap_tree: ElementsTree,
}

pub struct AssetRescueParams {
    pub our_public_key: [u8; 33],
    pub pub_nonce: [u8; 66],
    pub transaction: String,
    pub message: [u8; 32],
}

#[derive(serde::Deserialize, serde::Serialize, PartialEq, Clone, Debug)]
pub struct AssetRescueConfig {
    wallets: Option<HashMap<String, String>>,
}

pub struct AssetRescue {
    utxo_mutex: tokio::sync::Mutex<()>,

    cache: Cache,
    wallets: HashMap<String, String>,
    currencies: Currencies,
    swap_repo: Arc<dyn SwapHelper + Send + Sync>,
    chain_swap_repo: Arc<dyn ChainSwapHelper + Send + Sync>,
}

impl AssetRescue {
    pub fn new(
        config: Option<AssetRescueConfig>,
        cache: Cache,
        currencies: Currencies,
        swap_repo: Arc<dyn SwapHelper + Send + Sync>,
        chain_swap_repo: Arc<dyn ChainSwapHelper + Send + Sync>,
    ) -> Self {
        let wallets = match config {
            Some(config) => config.wallets.unwrap_or_default(),
            None => HashMap::new(),
        };
        tracing::debug!("Using wallets for asset rescue: {:#?}", wallets);

        Self {
            utxo_mutex: tokio::sync::Mutex::new(()),
            cache,
            wallets,
            currencies,
            swap_repo,
            chain_swap_repo,
        }
    }

    #[tracing::instrument(name = "AssetRescue::create", skip(self, destination))]
    pub async fn create(
        &self,
        swap_id: &str,
        transaction_id: &str,
        vout: u32,
        destination: &Address,
    ) -> Result<AssetRescueParams> {
        if self
            .cache
            .get::<PendingRescue>(CACHE_KEY, &Self::cache_field_swap(swap_id))
            .await?
            .is_some()
        {
            return Err(anyhow::anyhow!("another rescue is already pending"));
        }

        tracing::debug!(
            "Rescuing asset for swap {swap_id} in transaction {transaction_id}:{vout} to {}",
            destination.to_string()
        );

        let (swap, symbol, swap_rescue_details) = self.get_swap(swap_id)?;
        Self::check_eligibility(swap.as_ref())?;

        let (currency, chain, wallet) = self.get_node(&symbol)?;

        let tx: Transaction = elements::encode::deserialize(&alloy::hex::decode(
            &chain.raw_transaction(transaction_id).await?,
        )?)?;

        let funding_utxo = self
            .find_funding_utxo(&symbol, swap_id, &currency.network, &chain)
            .await?;
        let funding_tx: Transaction = elements::encode::deserialize(&alloy::hex::decode(
            &chain.raw_transaction(&funding_utxo.txid).await?,
        )?)?;

        let wallet_name = self.get_wallet_name(&symbol);
        let change_destination = Address::from_str(
            &chain
                .get_new_address(wallet_name, &Self::change_label(swap.as_ref()), None)
                .await?,
        )?;

        let secp = Secp256k1::new();

        let tx_out = tx.output.get(vout as usize).context("output not found")?;
        let funding_out = funding_tx
            .output
            .get(funding_utxo.vout as usize)
            .context("output not found")?;

        let (tx, _) = construct_asset_rescue(
            &secp,
            currency.network,
            &AssetPair {
                tx_out,
                outpoint: OutPoint::new(tx.txid(), vout),
                blinding_key: Some(Keypair::from_seckey_slice(
                    &secp,
                    &wallet.derive_blinding_key(
                        wallet.decode_address(&swap_rescue_details.lockup_address)?,
                    )?,
                )?),
                destination,
            },
            &AssetPair {
                tx_out: funding_out,
                outpoint: OutPoint::new(funding_tx.txid(), funding_utxo.vout),
                blinding_key: Some(Keypair::from_seckey_slice(
                    &secp,
                    &hex::decode(
                        &chain
                            .dump_blinding_key(wallet_name, &funding_utxo.address)
                            .await?,
                    )?,
                )?),
                destination: &change_destination,
            },
            FeeTarget::Relative(chain.estimate_fee().await?),
        )?;

        let sighash = SighashCache::new(&tx).taproot_key_spend_signature_hash(
            0,
            &Prevouts::All(&[tx_out, funding_out]),
            elements::SchnorrSighashType::Default,
            currency.network.liquid_genesis_hash()?,
        )?;
        let sighash = *Message::from_digest_slice(sighash.as_raw_hash().as_ref())?.as_ref();

        let musig_keys = Musig::convert_keypair(
            wallet
                .derive_keys(swap_rescue_details.key_index)?
                .private_key
                .secret_bytes(),
        )?;
        let musig = Musig::setup(
            musig_keys,
            vec![
                musig_keys.public_key(),
                Musig::convert_pub_key(&swap_rescue_details.their_public_key)?,
            ],
        )?
        .message(sighash)
        .generate_nonce(&mut Musig::rng());

        let pub_nonce = musig.pub_nonce().serialize();
        let sec_nonce = musig.dangerous_secnonce().dangerous_into_bytes();

        let tx = hex::encode(tx.serialize());
        self.cache
            .set(
                CACHE_KEY,
                &Self::cache_field_swap(swap_id),
                &PendingRescue {
                    sec_nonce: hex::encode(sec_nonce),
                    pub_nonce: hex::encode(pub_nonce),
                    sighash: hex::encode(sighash),
                    funding_txid: funding_utxo.txid.to_string(),
                    funding_vout: funding_utxo.vout,
                    transaction: tx.clone(),
                },
                Some(CACHE_TTL),
            )
            .await?;

        tracing::info!(
            "Created funding rescue for swap {swap_id} in transaction {transaction_id}:{vout}"
        );

        Ok(AssetRescueParams {
            our_public_key: musig_keys.public_key().serialize(),
            pub_nonce,
            transaction: tx,
            message: sighash,
        })
    }

    #[tracing::instrument(
        name = "AssetRescue::broadcast",
        skip(self, pub_nonce, partial_signature)
    )]
    pub async fn broadcast(
        &self,
        swap_id: &str,
        pub_nonce: &[u8],
        partial_signature: &[u8],
    ) -> Result<String> {
        let swap_cache_field = Self::cache_field_swap(swap_id);
        let pending_rescue = match self
            .cache
            .get::<PendingRescue>(CACHE_KEY, &swap_cache_field)
            .await?
        {
            Some(pending_rescue) => pending_rescue,
            None => {
                return Err(anyhow::anyhow!("no rescue is pending"));
            }
        };

        let (swap, symbol, swap_rescue_details) = self.get_swap(swap_id)?;

        let res = self
            .broadcast_inner(
                &symbol,
                swap,
                swap_rescue_details,
                &pending_rescue,
                pub_nonce,
                partial_signature,
            )
            .await;

        // Cleanup the cache regardless of the result
        if let Err(e) = self.cache.delete(CACHE_KEY, &swap_cache_field).await {
            tracing::warn!("Failed to delete swap cache: {e}");
        }
        if let Err(e) = self
            .cache
            .delete(
                CACHE_KEY,
                &Self::cache_field_reserved_utxo(
                    &symbol,
                    &pending_rescue.funding_txid,
                    pending_rescue.funding_vout,
                ),
            )
            .await
        {
            tracing::warn!("Failed to delete reserved UTXO cache: {e}");
        }

        if let Err(e) = &res {
            tracing::error!("Failed to broadcast asset rescue for swap {swap_id}: {e}");
        }

        res
    }

    async fn broadcast_inner(
        &self,
        symbol: &str,
        swap: Box<dyn SomeSwap + Send + Sync>,
        swap_rescue_details: AssetRescueDetails,
        pending_rescue: &PendingRescue,
        pub_nonce: &[u8],
        partial_signature: &[u8],
    ) -> Result<String> {
        let their_public_key = Musig::convert_pub_key(&swap_rescue_details.their_public_key)?;

        let (_, chain, wallet) = self.get_node(symbol)?;

        let message = hex::decode(&pending_rescue.sighash)?;

        let musig_keys = Musig::convert_keypair(
            wallet
                .derive_keys(swap_rescue_details.key_index)?
                .private_key
                .secret_bytes(),
        )?;
        let musig = Musig::setup(musig_keys, vec![musig_keys.public_key(), their_public_key])?;

        let internal_key = musig.agg_pk();
        let musig = musig
            .xonly_tweak_add(&Musig::convert_scalar_be(
                &swap_rescue_details
                    .swap_tree
                    .build()?
                    .finalize(
                        &Secp256k1::new(),
                        bitcoin::XOnlyPublicKey::from_slice(&internal_key.serialize())?,
                    )?
                    .tap_tweak()
                    .to_scalar()
                    .to_be_bytes(),
            )?)?
            .message(message.as_slice().try_into()?);
        let aggregate_key = musig.agg_pk();

        let musig = musig
            .dangerous_set_nonce(
                hex::decode(&pending_rescue.sec_nonce)?.as_slice(),
                hex::decode(&pending_rescue.pub_nonce)?.as_slice(),
            )?
            .aggregate_nonces(vec![(
                their_public_key,
                Musig::convert_pub_nonce(pub_nonce)?,
            )])?
            .initialize_session()?
            .partial_add(
                their_public_key,
                Musig::convert_partial_signature(partial_signature)?,
            )?
            .partial_sign()?;

        let signature = musig
            .partial_aggregate()?
            .verify(&aggregate_key, &message)?;

        let mut tx: Transaction =
            elements::encode::deserialize(&hex::decode(&pending_rescue.transaction)?)?;

        let signature = SchnorrSig {
            hash_ty: elements::SchnorrSighashType::Default,
            sig: elements::secp256k1_zkp::schnorr::Signature::from_slice(
                signature.as_byte_array(),
            )?,
        };
        tx.input[0]
            .witness
            .script_witness
            .push(signature.serialize());

        let tx = chain
            .sign_raw_transaction_with_wallet(
                self.get_wallet_name(symbol),
                &hex::encode(tx.serialize()),
            )
            .await?;
        if !tx.complete {
            return Err(anyhow::anyhow!("signing transaction failed"));
        }

        let tx_id = chain.send_raw_transaction(&tx.hex).await?;
        tracing::info!("Broadcast asset rescue for swap {}: {tx_id}", swap.id());

        Ok(tx_id)
    }

    async fn find_funding_utxo(
        &self,
        symbol: &str,
        swap_id: &str,
        network: &Network,
        chain: &Arc<dyn Client + Send + Sync>,
    ) -> Result<UnspentOutput> {
        let liquid_asset_id = network.liquid_asset_id()?;
        let min_amount = Amount::from_sat(1_000).to_btc();

        let _guard = self.utxo_mutex.lock().await;

        let funding_utxo = futures::stream::iter(
            chain
                .list_unspent(self.get_wallet_name(symbol))
                .await?
                .into_iter()
                .filter(|utxo| {
                    utxo.asset == Some(liquid_asset_id.to_string())
                    // We want to avoid tiny UTXOs
                    && utxo.amount > min_amount
                }),
        )
        .filter(|utxo| {
            let cache = self.cache.clone();
            let cache_field = Self::cache_field_reserved_utxo(symbol, &utxo.txid, utxo.vout);

            async move {
                match cache.get::<bool>(CACHE_KEY, &cache_field).await {
                    Ok(Some(reserved)) => !reserved,
                    Ok(None) => true,
                    Err(e) => {
                        tracing::warn!("Error checking reserved UTXO: {e}");
                        false
                    }
                }
            }
        })
        .boxed()
        .next()
        .await
        .ok_or(anyhow::anyhow!("no UTXOs available"))?;

        tracing::debug!(
            "Selected funding UTXO ({}:{}) for asset rescue of swap {swap_id}",
            funding_utxo.txid,
            funding_utxo.vout
        );

        self.cache
            .set(
                CACHE_KEY,
                &Self::cache_field_reserved_utxo(symbol, &funding_utxo.txid, funding_utxo.vout),
                &true,
                Some(CACHE_TTL),
            )
            .await?;

        Ok(funding_utxo)
    }

    fn get_swap(
        &self,
        swap_id: &str,
    ) -> Result<(Box<dyn SomeSwap + Send + Sync>, String, AssetRescueDetails)> {
        Ok(match self.swap_repo.get_by_id(swap_id) {
            Ok(swap) => {
                if SwapVersion::try_from(swap.version)? == SwapVersion::Legacy {
                    return Err(anyhow::anyhow!("legacy swaps do not support asset rescue"));
                }

                let symbol = swap.chain_symbol()?;

                let swap_rescue_details = AssetRescueDetails {
                    lockup_address: swap.lockupAddress.clone(),
                    key_index: swap.keyIndex.context("key index not defined")? as u64,
                    their_public_key: alloy::hex::decode(
                        swap.refundPublicKey
                            .as_deref()
                            .context("refund public key not found")?,
                    )?,
                    swap_tree: serde_json::from_str(
                        swap.redeemScript.as_ref().context("swap tree not found")?,
                    )?,
                };

                (Box::new(swap), symbol, swap_rescue_details)
            }
            Err(_) => match self.chain_swap_repo.get_by_id(swap_id) {
                Ok(swap) => {
                    let receiving = swap.receiving();
                    let symbol = receiving.symbol.clone();

                    let swap_rescue_details = AssetRescueDetails {
                        lockup_address: receiving.lockupAddress.clone(),
                        key_index: receiving.keyIndex.context("key index not defined")? as u64,
                        their_public_key: alloy::hex::decode(
                            receiving
                                .theirPublicKey
                                .as_deref()
                                .context("their public key not found")?,
                        )?,
                        swap_tree: serde_json::from_str(
                            receiving.swapTree.as_ref().context("swap tree not found")?,
                        )?,
                    };

                    (Box::new(swap), symbol, swap_rescue_details)
                }
                Err(_) => return Err(anyhow::anyhow!("swap not found")),
            },
        })
    }

    fn get_node<'a>(&'a self, symbol: &str) -> Result<RescueNode<'a>> {
        let currency = self
            .currencies
            .get(symbol)
            .ok_or(anyhow::anyhow!("currency not found"))?;

        let chain = currency
            .chain
            .clone()
            .ok_or(anyhow::anyhow!("chain client not found"))?;
        let wallet = currency
            .wallet
            .clone()
            .ok_or(anyhow::anyhow!("wallet not found"))?;

        Ok((currency, chain, wallet))
    }

    fn get_wallet_name(&self, symbol: &str) -> Option<&str> {
        self.wallets.get(symbol).map(|s| s.as_str())
    }

    fn check_eligibility(swap: &dyn SomeSwap) -> Result<()> {
        match swap.status() {
            SwapUpdate::TransactionLockupFailed | SwapUpdate::SwapExpired => Ok(()),
            _ => Err(anyhow::anyhow!("swap not eligible for asset rescue")),
        }
    }

    fn cache_field_swap(id: &str) -> String {
        format!("swap:{}", id)
    }

    fn cache_field_reserved_utxo(symbol: &str, txid: &str, vout: u32) -> String {
        format!("reserved_utxo:{symbol}:{txid}:{vout}")
    }

    fn change_label(swap: &dyn SomeSwap) -> String {
        format!("Asset Rescue for {}", swap.id())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{
        cache::MemCache,
        chain::{elements_client::test::get_client, types::RpcParam, utils::Outpoint},
        db::{
            helpers::{
                chain_swap::{ChainSwapCondition, ChainSwapDataNullableCondition},
                swap::{SwapCondition, SwapNullableCondition},
            },
            models::{ChainSwapInfo, Swap, SwapType},
        },
        wallet::{Elements, test::get_seed},
    };
    use async_trait::async_trait;
    use bitcoin::hashes::Hash;
    use boltz_core::{Musig, elements::swap_tree, wrapper::InputDetail};
    use elements::{LockTime, hashes::hash160};
    use mockall::mock;
    use serial_test::serial;
    use std::str::FromStr;

    const TREE: &str = "{\"claimLeaf\":{\"version\":196,\"output\":\"a9140be3e65567f55ff6ac791bd4f65f672bcaf5f211882050d47b462154253db0fcdc63323d50fffef708a4bdce34a34958c46051d1e997ac\"},\"refundLeaf\":{\"version\":196,\"output\":\"206ecd3e58ebe0a558badb9a083a365530e1de168dfa410233433f2b2e3c7f4438ad03b9e101b1\"}}";

    mock! {
        SwapHelper {}

        impl crate::db::helpers::swap::SwapHelper for SwapHelper {
            fn get_by_id(&self, id: &str) -> Result<Swap>;
            fn get_all(&self, condition: SwapCondition) -> Result<Vec<Swap>>;
            fn get_all_nullable(&self, condition: SwapNullableCondition) -> Result<Vec<Swap>>;
            fn update_status(&self, id: &str, status: SwapUpdate, failure_reason: Option<String>) -> Result<usize>;
        }
    }

    mock! {
        ChainSwapHelper {}

        impl crate::db::helpers::chain_swap::ChainSwapHelper for ChainSwapHelper {
            fn get_by_id(&self, id: &str) -> Result<ChainSwapInfo>;
            fn get_all(&self, condition: ChainSwapCondition) -> Result<Vec<ChainSwapInfo>>;
            fn get_by_data_nullable(&self, condition: ChainSwapDataNullableCondition) -> Result<Vec<ChainSwapInfo>>;
        }
    }

    struct MockSwap {
        id: String,
        status: SwapUpdate,
    }

    impl MockSwap {
        fn new(id: &str, status: SwapUpdate) -> Self {
            Self {
                id: id.to_string(),
                status,
            }
        }
    }

    #[async_trait]
    impl SomeSwap for MockSwap {
        fn kind(&self) -> SwapType {
            SwapType::Chain
        }

        fn id(&self) -> String {
            self.id.clone()
        }

        fn status(&self) -> SwapUpdate {
            self.status
        }

        fn sending_outpoint(&self) -> Result<Option<Outpoint>> {
            Ok(None)
        }

        fn claim_symbol(&self) -> Result<String> {
            Ok("L-BTC".to_string())
        }

        async fn claim_details(
            &self,
            _wallet: &Arc<dyn Wallet + Send + Sync>,
            _client: &Arc<dyn Client + Send + Sync>,
        ) -> Result<InputDetail> {
            Err(anyhow::anyhow!("not implemented"))
        }

        fn refund_symbol(&self) -> Result<String> {
            Ok("L-BTC".to_string())
        }

        async fn refund_details(
            &self,
            _wallet: &Arc<dyn Wallet + Send + Sync>,
            _client: &Arc<dyn Client + Send + Sync>,
        ) -> Result<InputDetail> {
            Err(anyhow::anyhow!("not implemented"))
        }
    }

    #[rstest::rstest]
    #[case(SwapUpdate::TransactionLockupFailed, true)]
    #[case(SwapUpdate::SwapExpired, true)]
    #[case(SwapUpdate::SwapCreated, false)]
    #[case(SwapUpdate::TransactionConfirmed, false)]
    #[case(SwapUpdate::TransactionMempool, false)]
    fn test_check_eligibility(#[case] status: SwapUpdate, #[case] should_be_eligible: bool) {
        let swap = MockSwap::new("test_swap", status);
        let result = AssetRescue::check_eligibility(&swap);

        if should_be_eligible {
            assert!(result.is_ok());
        } else {
            assert!(result.is_err());
            assert_eq!(
                result.unwrap_err().to_string(),
                "swap not eligible for asset rescue"
            );
        }
    }

    #[test]
    fn test_cache_field_swap() {
        assert_eq!(AssetRescue::cache_field_swap("swap123"), "swap:swap123");
        assert_eq!(
            AssetRescue::cache_field_swap("abc-def-ghi"),
            "swap:abc-def-ghi"
        );
    }

    #[test]
    fn test_cache_field_reserved_utxo() {
        assert_eq!(
            AssetRescue::cache_field_reserved_utxo("L-BTC", "abc123", 0),
            "reserved_utxo:L-BTC:abc123:0"
        );
        assert_eq!(
            AssetRescue::cache_field_reserved_utxo("L-BTC", "txid456", 42),
            "reserved_utxo:L-BTC:txid456:42"
        );
    }

    #[test]
    fn test_change_label() {
        let swap = MockSwap::new("swap123", SwapUpdate::SwapExpired);
        assert_eq!(AssetRescue::change_label(&swap), "Asset Rescue for swap123");

        let swap2 = MockSwap::new("abc-def", SwapUpdate::TransactionLockupFailed);
        assert_eq!(
            AssetRescue::change_label(&swap2),
            "Asset Rescue for abc-def"
        );
    }

    #[rstest::rstest]
    #[case("L-BTC", Some("liquid_wallet"))]
    #[case("BTC", Some("bitcoin_wallet"))]
    #[case("ETH", None)]
    #[case("unknown", None)]
    fn test_get_wallet_name(#[case] symbol: &str, #[case] expected: Option<&str>) {
        let mut wallets = HashMap::new();
        wallets.insert("L-BTC".to_string(), "liquid_wallet".to_string());
        wallets.insert("BTC".to_string(), "bitcoin_wallet".to_string());

        let asset_rescue = AssetRescue {
            utxo_mutex: tokio::sync::Mutex::new(()),
            cache: Cache::Memory(MemCache::new()),
            wallets,
            currencies: Arc::new(HashMap::new()),
            swap_repo: Arc::new(MockSwapHelper::new()),
            chain_swap_repo: Arc::new(MockChainSwapHelper::new()),
        };

        assert_eq!(asset_rescue.get_wallet_name(symbol), expected);
    }

    #[test]
    fn test_get_node_currency_not_found() {
        let asset_rescue = AssetRescue {
            utxo_mutex: tokio::sync::Mutex::new(()),
            cache: Cache::Memory(MemCache::new()),
            wallets: HashMap::new(),
            currencies: Arc::new(HashMap::new()),
            swap_repo: Arc::new(MockSwapHelper::new()),
            chain_swap_repo: Arc::new(MockChainSwapHelper::new()),
        };

        let result = asset_rescue.get_node("UNKNOWN");
        assert!(result.is_err());
        if let Err(e) = result {
            assert_eq!(e.to_string(), "currency not found");
        }
    }

    #[test]
    fn test_get_node_chain_not_found() {
        let mut currencies_map = HashMap::new();
        currencies_map.insert(
            "L-BTC".to_string(),
            Currency {
                network: boltz_core::Network::Regtest,
                wallet: None,
                chain: None,
                cln: None,
                lnd: None,
                evm_manager: None,
            },
        );

        let asset_rescue = AssetRescue {
            utxo_mutex: tokio::sync::Mutex::new(()),
            cache: Cache::Memory(MemCache::new()),
            wallets: HashMap::new(),
            currencies: Arc::new(currencies_map),
            swap_repo: Arc::new(MockSwapHelper::new()),
            chain_swap_repo: Arc::new(MockChainSwapHelper::new()),
        };

        match asset_rescue.get_node("L-BTC") {
            Err(e) => assert_eq!(e.to_string(), "chain client not found"),
            Ok(_) => panic!("Expected error"),
        }
    }

    #[test]
    fn test_get_swap_from_swap_repo() {
        let mut mock_swap_helper = MockSwapHelper::new();
        mock_swap_helper
            .expect_get_by_id()
            .with(mockall::predicate::eq("swap123"))
            .times(1)
            .returning(|_| {
                Ok(Swap {
                    id: "swap123".to_string(),
                    version: 1,
                    pair: "L-BTC/BTC".to_string(),
                    orderSide: 1,
                    status: "swap.created".to_string(),
                    preimageHash: "hash123".to_string(),
                    invoice: Some("lnbc123".to_string()),
                    keyIndex: Some(1),
                    timeoutBlockHeight: 100,
                    lockupAddress: "lockup_addr".to_string(),
                    redeemScript: Some(TREE.to_string()),
                    refundPublicKey: Some(
                        "033237ae7d7a28645bdd89a3b254922595a6dd7c8f586f1164118c7b75e554c981"
                            .to_string(),
                    ),
                    ..Default::default()
                })
            });

        let asset_rescue = AssetRescue {
            utxo_mutex: tokio::sync::Mutex::new(()),
            cache: Cache::Memory(MemCache::new()),
            wallets: HashMap::new(),
            currencies: Arc::new(HashMap::new()),
            swap_repo: Arc::new(mock_swap_helper),
            chain_swap_repo: Arc::new(MockChainSwapHelper::new()),
        };

        let result = asset_rescue.get_swap("swap123");
        let (swap, symbol, _) = result.unwrap();
        assert_eq!(swap.id(), "swap123");
        assert_eq!(symbol, "L-BTC");
    }

    #[test]
    fn test_get_swap_from_swap_repo_legacy() {
        let mut mock_swap_helper = MockSwapHelper::new();
        mock_swap_helper
            .expect_get_by_id()
            .with(mockall::predicate::eq("swap123"))
            .times(1)
            .returning(|_| {
                Ok(Swap {
                    id: "swap123".to_string(),
                    version: 0,
                    pair: "L-BTC/BTC".to_string(),
                    orderSide: 1,
                    status: "swap.created".to_string(),
                    preimageHash: "hash123".to_string(),
                    invoice: Some("lnbc123".to_string()),
                    keyIndex: Some(1),
                    timeoutBlockHeight: 100,
                    lockupAddress: "lockup_addr".to_string(),
                    ..Default::default()
                })
            });

        let asset_rescue = AssetRescue {
            utxo_mutex: tokio::sync::Mutex::new(()),
            cache: Cache::Memory(MemCache::new()),
            wallets: HashMap::new(),
            currencies: Arc::new(HashMap::new()),
            swap_repo: Arc::new(mock_swap_helper),
            chain_swap_repo: Arc::new(MockChainSwapHelper::new()),
        };

        let result = asset_rescue.get_swap("swap123");
        assert!(result.is_err());
        if let Err(e) = result {
            assert_eq!(e.to_string(), "legacy swaps do not support asset rescue");
        }
    }

    #[test]
    fn test_get_swap_from_chain_swap_repo() {
        use crate::db::models::{ChainSwap, ChainSwapData};

        let mut mock_swap_helper = MockSwapHelper::new();
        mock_swap_helper
            .expect_get_by_id()
            .with(mockall::predicate::eq("chain_swap123"))
            .times(1)
            .returning(|_| Err(anyhow::anyhow!("not found")));

        let mut mock_chain_swap_helper = MockChainSwapHelper::new();
        mock_chain_swap_helper
            .expect_get_by_id()
            .with(mockall::predicate::eq("chain_swap123"))
            .times(1)
            .returning(|_| {
                Ok(ChainSwapInfo::new(
                    ChainSwap {
                        id: "chain_swap123".to_string(),
                        pair: "BTC/L-BTC".to_string(),
                        orderSide: 0,
                        status: "swap.created".to_string(),
                        preimageHash: "hash456".to_string(),
                        ..Default::default()
                    },
                    vec![
                        ChainSwapData {
                            swapId: "chain_swap123".to_string(),
                            symbol: "BTC".to_string(),
                            keyIndex: Some(1),
                            timeoutBlockHeight: 100,
                            lockupAddress: "lockup1".to_string(),
                            ..Default::default()
                        },
                        ChainSwapData {
                            swapId: "chain_swap123".to_string(),
                            symbol: "L-BTC".to_string(),
                            keyIndex: Some(2),
                            timeoutBlockHeight: 200,
                            lockupAddress: "lockup2".to_string(),
                            swapTree: Some(TREE.to_string()),
                            theirPublicKey: Some("03ac0bb1b3e846a5eafb8c4b02d6a3753c55a617188b20688068c1a9efb4c15362".to_string()),
                            ..Default::default()
                        },
                    ],
                )
                .unwrap())
            });

        let asset_rescue = AssetRescue {
            utxo_mutex: tokio::sync::Mutex::new(()),
            cache: Cache::Memory(MemCache::new()),
            wallets: HashMap::new(),
            currencies: Arc::new(HashMap::new()),
            swap_repo: Arc::new(mock_swap_helper),
            chain_swap_repo: Arc::new(mock_chain_swap_helper),
        };

        let result = asset_rescue.get_swap("chain_swap123");
        let (swap, symbol, _) = result.unwrap();
        assert_eq!(swap.id(), "chain_swap123");
        assert_eq!(symbol, "L-BTC");
    }

    #[test]
    fn test_get_swap_not_found() {
        let mut mock_swap_helper = MockSwapHelper::new();
        mock_swap_helper
            .expect_get_by_id()
            .with(mockall::predicate::eq("nonexistent"))
            .times(1)
            .returning(|_| Err(anyhow::anyhow!("not found in swap repo")));

        let mut mock_chain_swap_helper = MockChainSwapHelper::new();
        mock_chain_swap_helper
            .expect_get_by_id()
            .with(mockall::predicate::eq("nonexistent"))
            .times(1)
            .returning(|_| Err(anyhow::anyhow!("not found in chain swap repo")));

        let asset_rescue = AssetRescue {
            utxo_mutex: tokio::sync::Mutex::new(()),
            cache: Cache::Memory(MemCache::new()),
            wallets: HashMap::new(),
            currencies: Arc::new(HashMap::new()),
            swap_repo: Arc::new(mock_swap_helper),
            chain_swap_repo: Arc::new(mock_chain_swap_helper),
        };

        let result = asset_rescue.get_swap("nonexistent");
        assert!(result.is_err());
        if let Err(e) = result {
            assert_eq!(e.to_string(), "swap not found");
        }
    }

    #[tokio::test]
    #[serial(LBTC)]
    async fn test_find_funding_utxo_success() {
        let (client, _) = get_client();
        let client: Arc<dyn Client + Send + Sync> = Arc::new(client);

        let asset_rescue = AssetRescue {
            utxo_mutex: tokio::sync::Mutex::new(()),
            cache: Cache::Memory(MemCache::new()),
            wallets: HashMap::new(),
            currencies: Arc::new(HashMap::new()),
            swap_repo: Arc::new(MockSwapHelper::new()),
            chain_swap_repo: Arc::new(MockChainSwapHelper::new()),
        };

        let result = asset_rescue
            .find_funding_utxo("L-BTC", "swap123", &boltz_core::Network::Regtest, &client)
            .await;

        assert!(result.is_ok());
        let utxo = result.unwrap();

        let reserved = asset_rescue
            .cache
            .get::<bool>(
                CACHE_KEY,
                &AssetRescue::cache_field_reserved_utxo("L-BTC", &utxo.txid, utxo.vout),
            )
            .await
            .unwrap();
        assert_eq!(reserved, Some(true));
    }

    #[tokio::test]
    #[serial(LBTC)]
    async fn test_find_funding_utxo_reserved_utxos_filtered() {
        let (client, _) = get_client();
        let client_ref: Arc<dyn Client + Send + Sync> = Arc::new(client);

        let cache = Cache::Memory(MemCache::new());

        // Get all UTXOs and mark them as reserved
        let utxos = client_ref.list_unspent(None).await.unwrap();
        for utxo in &utxos {
            cache
                .set(
                    CACHE_KEY,
                    &AssetRescue::cache_field_reserved_utxo("L-BTC", &utxo.txid, utxo.vout),
                    &true,
                    Some(CACHE_TTL),
                )
                .await
                .unwrap();
        }

        let asset_rescue = AssetRescue {
            utxo_mutex: tokio::sync::Mutex::new(()),
            cache,
            wallets: HashMap::new(),
            currencies: Arc::new(HashMap::new()),
            swap_repo: Arc::new(MockSwapHelper::new()),
            chain_swap_repo: Arc::new(MockChainSwapHelper::new()),
        };

        let result = asset_rescue
            .find_funding_utxo(
                "L-BTC",
                "swap123",
                &boltz_core::Network::Regtest,
                &client_ref,
            )
            .await;

        assert!(result.is_err());
        assert_eq!(result.unwrap_err().to_string(), "no UTXOs available");
    }

    #[tokio::test]
    #[serial(LBTC)]
    async fn test_find_funding_utxo_filters_by_asset() {
        let (client, _) = get_client();
        let client: Arc<dyn Client + Send + Sync> = Arc::new(client);

        let asset_rescue = AssetRescue {
            utxo_mutex: tokio::sync::Mutex::new(()),
            cache: Cache::Memory(MemCache::new()),
            wallets: HashMap::new(),
            currencies: Arc::new(HashMap::new()),
            swap_repo: Arc::new(MockSwapHelper::new()),
            chain_swap_repo: Arc::new(MockChainSwapHelper::new()),
        };

        let result = asset_rescue
            .find_funding_utxo("L-BTC", "swap123", &boltz_core::Network::Regtest, &client)
            .await;

        assert!(result.is_ok());
        let utxo = result.unwrap();
        assert_eq!(
            utxo.asset,
            Some("5ac9f65c0efcc4775e0baec4ec03abdde22473cd3cf33c0419ca290e0751b225".to_string())
        );
    }

    #[tokio::test]
    #[serial(LBTC)]
    async fn test_find_funding_utxo_filters_by_minimum_amount() {
        let (client, _) = get_client();
        let client: Arc<dyn Client + Send + Sync> = Arc::new(client);

        let asset_rescue = AssetRescue {
            utxo_mutex: tokio::sync::Mutex::new(()),
            cache: Cache::Memory(MemCache::new()),
            wallets: HashMap::new(),
            currencies: Arc::new(HashMap::new()),
            swap_repo: Arc::new(MockSwapHelper::new()),
            chain_swap_repo: Arc::new(MockChainSwapHelper::new()),
        };

        let result = asset_rescue
            .find_funding_utxo("L-BTC", "swap123", &boltz_core::Network::Regtest, &client)
            .await;

        let utxo = result.unwrap();
        assert!(utxo.amount > 0.00001);
    }

    async fn mine_block(client: &Arc<dyn Client + Send + Sync>, wallet: Option<&str>) {
        client
            .request_wallet(
                wallet,
                "generatetoaddress",
                Some(&[
                    RpcParam::Int(1),
                    RpcParam::Str(&client.get_new_address(wallet, "", None).await.unwrap()),
                ]),
            )
            .await
            .unwrap();
    }

    #[tokio::test]
    #[serial(LBTC)]
    async fn test_create_and_broadcast() {
        let swap_id = "swap123";
        let symbol = "L-BTC";
        let wallet_name = None;
        let secp = elements::secp256k1_zkp::Secp256k1::new();
        let address_params = &elements::AddressParams::ELEMENTS;
        let timeout_block_height: i32 = 100;
        let key_index: i32 = 1;
        let asset_amount = 0.1;

        let (client, _) = get_client();
        let client: Arc<dyn Client + Send + Sync> = Arc::new(client);

        mine_block(&client, wallet_name).await;

        let seed = get_seed();
        let wallet = Elements::new(
            boltz_core::Network::Regtest,
            &seed,
            "m/0".to_string(),
            client.clone(),
        )
        .unwrap();

        // Create musig keys for the swap
        let our_keys = wallet
            .derive_keys(key_index as u64)
            .unwrap()
            .to_keypair(&bitcoin::secp256k1::Secp256k1::new());
        let their_keys = Keypair::from_seckey_slice(
            &secp,
            &alloy::hex::decode("767c5a824fe77eaad79e0c0b9b4271b1b846764d478f54ace3f87f1474a1da0d")
                .unwrap(),
        )
        .unwrap();

        // Create swap tree
        let preimage_hash =
            hash160::Hash::from_str("0be3e65567f55ff6ac791bd4f65f672bcaf5f211").unwrap();
        let tree = swap_tree(
            preimage_hash,
            &elements::secp256k1_zkp::XOnlyPublicKey::from_slice(
                &our_keys.x_only_public_key().0.serialize(),
            )
            .unwrap(),
            &elements::secp256k1_zkp::XOnlyPublicKey::from_slice(
                &their_keys.x_only_public_key().0.serialize(),
            )
            .unwrap(),
            LockTime::from_height(timeout_block_height as u32).unwrap(),
        );

        let musig = Musig::setup(
            Musig::convert_keypair(their_keys.secret_key().secret_bytes()).unwrap(),
            vec![
                Musig::convert_pub_key(&our_keys.public_key().serialize()).unwrap(),
                Musig::convert_pub_key(&their_keys.public_key().serialize()).unwrap(),
            ],
        )
        .unwrap();

        let taproot_spend_info = tree
            .clone()
            .build()
            .unwrap()
            .finalize(
                &secp,
                elements::secp256k1_zkp::XOnlyPublicKey::from_slice(&musig.agg_pk().serialize())
                    .unwrap(),
            )
            .unwrap();
        let address = Address::p2tr_tweaked(taproot_spend_info.output_key(), None, address_params);
        let address = Address::p2tr_tweaked(
            taproot_spend_info.output_key(),
            Some(
                Keypair::from_seckey_slice(
                    &secp,
                    &wallet
                        .derive_blinding_key(address.script_pubkey().to_bytes())
                        .unwrap(),
                )
                .unwrap()
                .public_key(),
            ),
            address_params,
        );

        let asset_id = client
            .request_wallet(
                wallet_name,
                "issueasset",
                Some(&[RpcParam::Float(1.0), RpcParam::Float(1.0)]),
            )
            .await
            .unwrap();
        let asset_id = asset_id.get("asset").unwrap().as_str().unwrap();

        let funding_tx_id = client
            .request_wallet(
                wallet_name,
                "sendtoaddress",
                Some(&[
                    RpcParam::Str(&address.to_string()),
                    RpcParam::Float(asset_amount),
                    RpcParam::Null,
                    RpcParam::Null,
                    RpcParam::Null,
                    RpcParam::Null,
                    RpcParam::Null,
                    RpcParam::Null,
                    RpcParam::Null,
                    RpcParam::Str(asset_id),
                ]),
            )
            .await
            .unwrap();
        let funding_tx_id = funding_tx_id.as_str().unwrap();

        let funding_tx = client.raw_transaction(funding_tx_id).await.unwrap();
        let funding_tx: Transaction =
            elements::encode::deserialize(&hex::decode(funding_tx).unwrap()).unwrap();

        let funding_vout = funding_tx
            .output
            .iter()
            .position(|output| output.script_pubkey == address.script_pubkey())
            .unwrap();

        let mut mock_swap_helper = MockSwapHelper::new();
        mock_swap_helper
            .expect_get_by_id()
            .with(mockall::predicate::eq(swap_id))
            .returning(move |_| {
                Ok(Swap {
                    id: swap_id.to_string(),
                    version: 1,
                    referral: None,
                    pair: "L-BTC/BTC".to_string(),
                    orderSide: 1,
                    status: "transaction.lockupFailed".to_string(),
                    failureReason: None,
                    preimage: None,
                    preimageHash: hex::encode(preimage_hash.to_byte_array()),
                    invoice: Some("lnbc123".to_string()),
                    keyIndex: Some(key_index),
                    refundPublicKey: Some(hex::encode(their_keys.public_key().serialize())),
                    timeoutBlockHeight: timeout_block_height,
                    redeemScript: Some(serde_json::to_string(&tree).unwrap()),
                    lockupAddress: address.to_string(),
                    lockupTransactionId: None,
                    lockupTransactionVout: None,
                    createdAt: chrono::Utc::now().naive_utc(),
                    onchainAmount: None,
                })
            });

        let mut currencies_map = HashMap::new();
        currencies_map.insert(
            symbol.to_string(),
            Currency {
                network: boltz_core::Network::Regtest,
                wallet: Some(Arc::new(wallet)),
                chain: Some(client.clone()),
                cln: None,
                lnd: None,
                evm_manager: None,
            },
        );

        let asset_rescue = AssetRescue {
            utxo_mutex: tokio::sync::Mutex::new(()),
            cache: Cache::Memory(MemCache::new()),
            wallets: HashMap::new(),
            currencies: Arc::new(currencies_map),
            swap_repo: Arc::new(mock_swap_helper),
            chain_swap_repo: Arc::new(MockChainSwapHelper::new()),
        };

        let destination =
            Address::from_str(&client.get_new_address(wallet_name, "", None).await.unwrap())
                .unwrap();
        let params = asset_rescue
            .create(swap_id, funding_tx_id, funding_vout as u32, &destination)
            .await
            .unwrap();

        let musig = musig
            .xonly_tweak_add(
                &Musig::convert_scalar_be(
                    &taproot_spend_info.tap_tweak().to_scalar().to_be_bytes(),
                )
                .unwrap(),
            )
            .unwrap()
            .message(params.message)
            .generate_nonce(&mut Musig::rng());

        let pub_nonce = musig.pub_nonce().serialize();
        let musig = musig
            .aggregate_nonces(vec![(
                Musig::convert_pub_key(&our_keys.public_key().serialize()).unwrap(),
                Musig::convert_pub_nonce(&params.pub_nonce).unwrap(),
            )])
            .unwrap()
            .initialize_session()
            .unwrap()
            .partial_sign()
            .unwrap();

        let rescue_tx_id = asset_rescue
            .broadcast(
                swap_id,
                &pub_nonce,
                &musig.our_partial_signature().serialize(),
            )
            .await
            .unwrap();

        let rescue_tx_info = client
            .request_wallet(
                wallet_name,
                "gettransaction",
                Some(&[RpcParam::Str(&rescue_tx_id)]),
            )
            .await
            .unwrap();
        let amount = rescue_tx_info.get("amount").unwrap().as_object().unwrap();

        assert_eq!(amount.get("bitcoin").unwrap().as_f64().unwrap(), 0.0);
        assert_eq!(
            amount.get(asset_id).unwrap().as_f64().unwrap(),
            asset_amount
        );

        mine_block(&client, wallet_name).await;
    }
}

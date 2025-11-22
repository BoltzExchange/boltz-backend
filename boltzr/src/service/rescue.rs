use crate::currencies::Currencies;
use crate::db::helpers::chain_swap::ChainSwapHelper;
use crate::db::helpers::reverse_swap::ReverseSwapHelper;
use crate::db::helpers::swap::SwapHelper;
use crate::db::models::{
    ChainSwapData, ChainSwapInfo, LightningSwap, ReverseSwap, SomeSwap, Swap, SwapType,
};
use crate::service::pubkey_iterator::PubkeyIterator;
use crate::wallet::Wallet;
use alloy::hex;
use anyhow::{Result, anyhow};
use bitcoin::secp256k1;
use bitcoin::secp256k1::Secp256k1;
use diesel::{BoolExpressionMethods, ExpressionMethods};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tracing::{debug, instrument, trace};

trait Identifiable {
    fn id(&self) -> &str;
    fn created_at(&self) -> u64;
}

#[derive(Serialize, Deserialize, PartialEq, Clone, Debug)]
pub struct TreeLeaf {
    pub version: u64,
    pub output: String,
}

#[derive(Serialize, Deserialize, PartialEq, Clone, Debug)]
pub struct SwapTree {
    #[serde(rename = "claimLeaf")]
    pub claim_leaf: TreeLeaf,
    #[serde(rename = "refundLeaf")]
    pub refund_leaf: TreeLeaf,
    #[serde(rename = "covenantClaimLeaf", skip_serializing_if = "Option::is_none")]
    pub covenant_claim_leaf: Option<TreeLeaf>,
}

impl TryFrom<&str> for SwapTree {
    type Error = anyhow::Error;

    fn try_from(value: &str) -> Result<Self> {
        let tree = serde_json::from_str(value)?;
        Ok(tree)
    }
}

#[derive(Serialize, Deserialize, PartialEq, Clone, Debug)]
pub struct Transaction {
    pub id: String,
    pub vout: u64,
}

impl From<(String, i32)> for Transaction {
    fn from((id, vout): (String, i32)) -> Self {
        Transaction {
            id,
            vout: vout as u64,
        }
    }
}

#[derive(Serialize, Deserialize, PartialEq, Clone, Debug)]
pub struct SwapDetailsBase {
    pub tree: SwapTree,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub amount: Option<i64>,
    #[serde(rename = "keyIndex")]
    pub key_index: u32,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub transaction: Option<Transaction>,
    #[serde(rename = "lockupAddress")]
    pub lockup_address: String,
    #[serde(rename = "serverPublicKey")]
    pub server_public_key: String,
    #[serde(rename = "timeoutBlockHeight")]
    pub timeout_block_height: u64,
    #[serde(rename = "blindingKey", skip_serializing_if = "Option::is_none")]
    pub blinding_key: Option<String>,
}

impl TryFrom<(&Swap, u32, String, Option<String>)> for SwapDetailsBase {
    type Error = anyhow::Error;

    fn try_from(
        (s, key_index, server_public_key, blinding_key): (&Swap, u32, String, Option<String>),
    ) -> Result<Self> {
        Ok(SwapDetailsBase {
            amount: s.onchainAmount,
            tree: s
                .redeemScript
                .as_ref()
                .ok_or_else(|| anyhow!("no swap tree for {}", s.id))?
                .as_str()
                .try_into()?,
            key_index,
            transaction: if let (Some(id), Some(vout)) =
                (s.lockupTransactionId.clone(), s.lockupTransactionVout)
            {
                Some((id, vout).into())
            } else {
                None
            },
            lockup_address: s.lockupAddress.clone(),
            server_public_key,
            timeout_block_height: s.timeoutBlockHeight as u64,
            blinding_key,
        })
    }
}

impl TryFrom<(&ReverseSwap, u32, String, Option<String>)> for SwapDetailsBase {
    type Error = anyhow::Error;

    fn try_from(
        (s, key_index, server_public_key, blinding_key): (
            &ReverseSwap,
            u32,
            String,
            Option<String>,
        ),
    ) -> Result<Self> {
        Ok(SwapDetailsBase {
            amount: Some(s.onchainAmount),
            tree: s
                .redeemScript
                .as_ref()
                .ok_or_else(|| anyhow!("no swap tree for {}", s.id))?
                .as_str()
                .try_into()?,
            key_index,
            transaction: if let (Some(id), Some(vout)) =
                (s.transactionId.clone(), s.transactionVout)
            {
                Some((id, vout).into())
            } else {
                None
            },
            lockup_address: s.lockupAddress.clone(),
            server_public_key,
            timeout_block_height: s.timeoutBlockHeight as u64,
            blinding_key,
        })
    }
}

impl TryFrom<(&ChainSwapData, u32, String, Option<String>)> for SwapDetailsBase {
    type Error = anyhow::Error;

    fn try_from(
        (s, key_index, server_public_key, blinding_key): (
            &ChainSwapData,
            u32,
            String,
            Option<String>,
        ),
    ) -> Result<Self> {
        Ok(SwapDetailsBase {
            amount: s.amount,
            tree: s
                .swapTree
                .as_ref()
                .ok_or_else(|| anyhow!("no swap tree for {}", s.swapId))?
                .as_str()
                .try_into()?,
            key_index,
            transaction: if let (Some(id), Some(vout)) =
                (s.transactionId.clone(), s.transactionVout)
            {
                Some((id, vout).into())
            } else {
                None
            },
            lockup_address: s.lockupAddress.clone(),
            server_public_key,
            timeout_block_height: s.timeoutBlockHeight as u64,
            blinding_key,
        })
    }
}

#[derive(Serialize, Deserialize, PartialEq, Clone, Debug)]
pub struct SwapBase {
    pub id: String,
    #[serde(rename = "type")]
    pub kind: SwapType,
    pub status: String,
    #[serde(rename = "createdAt")]
    pub created_at: u64,
}

impl From<&Swap> for SwapBase {
    fn from(s: &Swap) -> Self {
        SwapBase {
            id: s.id.clone(),
            kind: s.kind(),
            status: s.status.clone(),
            created_at: s.createdAt.and_utc().timestamp() as u64,
        }
    }
}

impl From<&ReverseSwap> for SwapBase {
    fn from(s: &ReverseSwap) -> Self {
        SwapBase {
            id: s.id.clone(),
            kind: s.kind(),
            status: s.status.clone(),
            created_at: s.createdAt.and_utc().timestamp() as u64,
        }
    }
}

impl From<&ChainSwapInfo> for SwapBase {
    fn from(s: &ChainSwapInfo) -> Self {
        SwapBase {
            id: s.id().clone(),
            kind: s.kind(),
            status: s.swap.status.clone(),
            created_at: s.swap.createdAt.and_utc().timestamp() as u64,
        }
    }
}

#[derive(Serialize, Deserialize, PartialEq, Clone, Debug)]
pub struct RescuableSwap {
    #[serde(flatten)]
    pub base: SwapBase,
    pub symbol: String,
    #[serde(flatten)]
    pub details: SwapDetailsBase,
    #[serde(rename = "preimageHash")]
    pub preimage_hash: String,
}

impl Identifiable for RescuableSwap {
    fn id(&self) -> &str {
        &self.base.id
    }

    fn created_at(&self) -> u64 {
        self.base.created_at
    }
}

impl TryFrom<(&Swap, u32, String, Option<String>)> for RescuableSwap {
    type Error = anyhow::Error;

    fn try_from(
        (s, key_index, server_public_key, blinding_key): (&Swap, u32, String, Option<String>),
    ) -> Result<Self> {
        Ok(RescuableSwap {
            base: s.into(),
            symbol: s.chain_symbol()?,
            preimage_hash: s.preimageHash.clone(),
            details: (s, key_index, server_public_key, blinding_key).try_into()?,
        })
    }
}

impl TryFrom<(&ChainSwapInfo, u32, String, Option<String>)> for RescuableSwap {
    type Error = anyhow::Error;

    fn try_from(
        (s, key_index, server_public_key, blinding_key): (
            &ChainSwapInfo,
            u32,
            String,
            Option<String>,
        ),
    ) -> Result<Self> {
        Ok(RescuableSwap {
            base: s.into(),
            symbol: s.receiving().symbol.clone(),
            preimage_hash: s.swap.preimageHash.clone(),
            details: (s.receiving(), key_index, server_public_key, blinding_key).try_into()?,
        })
    }
}

#[derive(Serialize, Deserialize, PartialEq, Clone, Debug)]
pub struct ClaimDetails {
    #[serde(flatten)]
    pub base: SwapDetailsBase,
    // Redundant information because it is already in RestorableSwap
    // but kept here for backwards compatibility
    #[serde(rename = "preimageHash")]
    pub preimage_hash: String,
}

impl TryFrom<(&ReverseSwap, u32, String, Option<String>)> for ClaimDetails {
    type Error = anyhow::Error;

    fn try_from(
        (s, key_index, server_public_key, blinding_key): (
            &ReverseSwap,
            u32,
            String,
            Option<String>,
        ),
    ) -> Result<Self> {
        Ok(ClaimDetails {
            base: (s, key_index, server_public_key, blinding_key).try_into()?,
            preimage_hash: s.preimageHash.clone(),
        })
    }
}

impl TryFrom<(&ChainSwapInfo, u32, String, Option<String>)> for ClaimDetails {
    type Error = anyhow::Error;

    fn try_from(
        (s, key_index, server_public_key, blinding_key): (
            &ChainSwapInfo,
            u32,
            String,
            Option<String>,
        ),
    ) -> Result<Self> {
        Ok(ClaimDetails {
            base: (s.sending(), key_index, server_public_key, blinding_key).try_into()?,
            preimage_hash: s.swap.preimageHash.clone(),
        })
    }
}

#[derive(Serialize, Deserialize, PartialEq, Clone, Debug)]
pub struct RestorableSwap {
    #[serde(flatten)]
    pub base: SwapBase,
    pub from: String,
    pub to: String,
    #[serde(rename = "preimageHash")]
    pub preimage_hash: String,
    #[serde(rename = "claimDetails", skip_serializing_if = "Option::is_none")]
    pub claim_details: Option<ClaimDetails>,
    #[serde(rename = "refundDetails", skip_serializing_if = "Option::is_none")]
    pub refund_details: Option<SwapDetailsBase>,
}

impl Identifiable for RestorableSwap {
    fn id(&self) -> &str {
        &self.base.id
    }

    fn created_at(&self) -> u64 {
        self.base.created_at
    }
}

impl TryFrom<(&Swap, u32, String, Option<String>)> for RestorableSwap {
    type Error = anyhow::Error;

    fn try_from(
        (s, key_index, server_public_key, blinding_key): (&Swap, u32, String, Option<String>),
    ) -> Result<Self> {
        Ok(RestorableSwap {
            base: s.into(),
            from: s.chain_symbol()?,
            to: s.lightning_symbol()?,
            preimage_hash: s.preimageHash.clone(),
            claim_details: None,
            refund_details: Some((s, key_index, server_public_key, blinding_key).try_into()?),
        })
    }
}

impl TryFrom<(&ReverseSwap, u32, String, Option<String>)> for RestorableSwap {
    type Error = anyhow::Error;

    fn try_from(
        (s, key_index, server_public_key, blinding_key): (
            &ReverseSwap,
            u32,
            String,
            Option<String>,
        ),
    ) -> Result<Self> {
        Ok(RestorableSwap {
            base: s.into(),
            from: s.lightning_symbol()?,
            to: s.chain_symbol()?,
            preimage_hash: s.preimageHash.clone(),
            claim_details: Some((s, key_index, server_public_key, blinding_key).try_into()?),
            refund_details: None,
        })
    }
}

pub struct SwapRescue {
    currencies: Currencies,
    swap_helper: Arc<dyn SwapHelper + Sync + Send>,
    chain_swap_helper: Arc<dyn ChainSwapHelper + Sync + Send>,
    reverse_swap_helper: Arc<dyn ReverseSwapHelper + Sync + Send>,
}

impl SwapRescue {
    pub fn new(
        swap_helper: Arc<dyn SwapHelper + Sync + Send>,
        chain_swap_helper: Arc<dyn ChainSwapHelper + Sync + Send>,
        reverse_swap_helper: Arc<dyn ReverseSwapHelper + Sync + Send>,
        currencies: Currencies,
    ) -> SwapRescue {
        Self {
            currencies,
            swap_helper,
            chain_swap_helper,
            reverse_swap_helper,
        }
    }

    #[instrument(name = "SwapRescue::rescue", skip_all)]
    pub fn rescue(&self, iterator: Box<dyn PubkeyIterator>) -> Result<Vec<RescuableSwap>> {
        debug!("Scanning for rescuable swaps for {}", iterator.identifier());

        let mut rescuable = self.scan_swaps(
            iterator,
            vec![SwapType::Submarine, SwapType::Chain],
            Self::process_rescuable_swaps,
        )?;

        rescuable.sort_by(|a, b| {
            a.details
                .key_index
                .cmp(&b.details.key_index)
                .then(a.created_at().cmp(&b.created_at()))
        });
        Ok(rescuable)
    }

    #[instrument(name = "SwapRescue::restore", skip_all)]
    pub fn restore(&self, iterator: Box<dyn PubkeyIterator>) -> Result<Vec<RestorableSwap>> {
        debug!(
            "Scanning for restorable swaps for {}",
            iterator.identifier()
        );

        let mut restorable = self.scan_swaps(
            iterator,
            vec![SwapType::Submarine, SwapType::Chain, SwapType::Reverse],
            Self::process_restorable_swaps,
        )?;

        restorable.sort_by(|a, b| {
            fn get_key_index(swap: &RestorableSwap) -> Option<u32> {
                swap.refund_details
                    .as_ref()
                    .map(|r| r.key_index)
                    .or_else(|| swap.claim_details.as_ref().map(|c| c.base.key_index))
            }

            get_key_index(a)
                .cmp(&get_key_index(b))
                .then(a.created_at().cmp(&b.created_at()))
        });
        Ok(restorable)
    }

    #[instrument(name = "SwapRescue::index", skip_all)]
    pub fn index(&self, iterator: Box<dyn PubkeyIterator>) -> Result<i64> {
        debug!(
            "Scanning for highest key index for {}",
            iterator.identifier()
        );

        let restorable = self.scan_swaps(
            iterator,
            vec![SwapType::Submarine, SwapType::Chain, SwapType::Reverse],
            Self::process_restorable_swaps,
        )?;

        let highest_index = restorable
            .iter()
            .filter_map(|swap| {
                match (
                    swap.refund_details.as_ref().map(|r| r.key_index),
                    swap.claim_details.as_ref().map(|c| c.base.key_index),
                ) {
                    (Some(refund), Some(claim)) => Some(std::cmp::max(refund, claim)),
                    (Some(refund), None) => Some(refund),
                    (None, Some(claim)) => Some(claim),
                    (None, None) => None,
                }
            })
            .max();

        Ok(highest_index.map(|i| i as i64).unwrap_or(-1))
    }

    fn scan_swaps<R, F>(
        &self,
        iterator: Box<dyn PubkeyIterator>,
        swap_types: Vec<SwapType>,
        process: F,
    ) -> Result<Vec<R>>
    where
        R: Identifiable,
        F: Fn(
            &Self,
            &HashMap<String, u32>,
            Vec<Swap>,
            Vec<ChainSwapInfo>,
            Vec<ReverseSwap>,
        ) -> Result<Vec<R>>,
    {
        macro_rules! log_scan_result {
            ($to:expr, $iterator:expr, $result:expr) => {
                debug!(
                    "Scanned {} keys for swaps for {} and found {}",
                    $to,
                    $iterator.identifier(),
                    $result.len(),
                );
            };
        }

        let mut result = HashMap::new();
        let mut keys_map = HashMap::new();

        let gap_limit = std::cmp::min(iterator.gap_limit(), iterator.max_keys());
        if gap_limit == 0 {
            log_scan_result!(0, iterator, result);
            return Ok(vec![]);
        }

        for from in (0..).step_by(gap_limit as usize) {
            let to = from + gap_limit;

            trace!(
                "Scanning for swaps from key index {} to {} for {}",
                from,
                to,
                iterator.identifier()
            );

            let keys = iterator.derive_keys(&mut keys_map, from, to)?;

            let mut swaps = Vec::new();
            let mut chain_swaps = Vec::new();
            let mut reverse_swaps = Vec::new();

            for swap_type in &swap_types {
                match swap_type {
                    SwapType::Submarine => {
                        swaps = self.swap_helper.get_all_nullable(Box::new(
                            crate::db::schema::swaps::dsl::version
                                // No legacy swaps
                                .gt(0)
                                .and(
                                    crate::db::schema::swaps::dsl::refundPublicKey
                                        .eq_any(keys.clone()),
                                ),
                        ))?;
                    }
                    SwapType::Chain => {
                        chain_swaps = self.chain_swap_helper.get_by_data_nullable(Box::new(
                            crate::db::schema::chainSwapData::dsl::theirPublicKey
                                .eq_any(keys.clone()),
                        ))?;
                    }
                    SwapType::Reverse => {
                        reverse_swaps = self.reverse_swap_helper.get_all_nullable(Box::new(
                            crate::db::schema::reverseSwaps::dsl::version
                                // No legacy swaps
                                .gt(0)
                                .and(
                                    crate::db::schema::reverseSwaps::dsl::claimPublicKey
                                        .eq_any(keys.clone()),
                                ),
                        ))?;
                    }
                }
            }

            if swaps.is_empty() && chain_swaps.is_empty() && reverse_swaps.is_empty() {
                log_scan_result!(to, iterator, result);
                break;
            }

            for swap in process(self, &keys_map, swaps, chain_swaps, reverse_swaps)? {
                // The map deduplicates for us
                result.insert(swap.id().to_string(), swap);
            }

            if to >= iterator.max_keys() {
                log_scan_result!(to, iterator, result);
                break;
            }
        }

        Ok(result.into_values().collect())
    }

    fn process_rescuable_swaps(
        &self,
        keys_map: &HashMap<String, u32>,
        swaps: Vec<Swap>,
        chain_swaps: Vec<ChainSwapInfo>,
        _reverse_swaps: Vec<ReverseSwap>,
    ) -> Result<Vec<RescuableSwap>> {
        let secp = Secp256k1::default();
        let mut rescuable = Vec::new();

        rescuable.append(
            &mut swaps
                .into_iter()
                .map(|s| self.create_rescuable_swap(&secp, keys_map, s))
                .collect::<Result<Vec<RescuableSwap>>>()?,
        );

        rescuable.append(
            &mut chain_swaps
                .into_iter()
                .filter(|s| s.receiving().theirPublicKey.is_some())
                .map(|s| self.create_rescuable_chain_swap(&secp, keys_map, s))
                .collect::<Result<Vec<RescuableSwap>>>()?,
        );

        Ok(rescuable)
    }

    fn process_restorable_swaps(
        &self,
        keys_map: &HashMap<String, u32>,
        swaps: Vec<Swap>,
        chain_swaps: Vec<ChainSwapInfo>,
        reverse_swaps: Vec<ReverseSwap>,
    ) -> Result<Vec<RestorableSwap>> {
        let secp = Secp256k1::default();
        let mut restorable = Vec::new();

        restorable.append(
            &mut swaps
                .into_iter()
                .map(|s| self.create_restorable_swap(&secp, keys_map, s))
                .collect::<Result<Vec<RestorableSwap>>>()?,
        );

        restorable.append(
            &mut chain_swaps
                .into_iter()
                .filter(|s| s.receiving().theirPublicKey.is_some())
                .map(|s| self.create_restorable_chain_swap(&secp, keys_map, s))
                .collect::<Result<Vec<RestorableSwap>>>()?,
        );

        restorable.append(
            &mut reverse_swaps
                .into_iter()
                .map(|s| self.create_restorable_reverse_swap(&secp, keys_map, s))
                .collect::<Result<Vec<RestorableSwap>>>()?,
        );

        Ok(restorable)
    }

    fn create_rescuable_swap(
        &self,
        secp: &Secp256k1<secp256k1::All>,
        keys_map: &HashMap<String, u32>,
        s: Swap,
    ) -> Result<RescuableSwap> {
        let chain_symbol = s.chain_symbol()?;
        let wallet = self.get_wallet(&chain_symbol)?;

        (
            &s,
            Self::lookup_from_keys(keys_map, &s.refundPublicKey, &s.id)?,
            Self::derive_our_public_key(secp, &wallet, &s.id(), s.keyIndex)?,
            Self::derive_blinding_key(&wallet, &s.id, &chain_symbol, &s.lockupAddress)?,
        )
            .try_into()
    }

    fn create_rescuable_chain_swap(
        &self,
        secp: &Secp256k1<secp256k1::All>,
        keys_map: &HashMap<String, u32>,
        s: ChainSwapInfo,
    ) -> Result<RescuableSwap> {
        let wallet = self.get_wallet(&s.receiving().symbol)?;

        (
            &s,
            Self::lookup_from_keys(keys_map, &s.receiving().theirPublicKey, &s.id())?,
            Self::derive_our_public_key(secp, &wallet, &s.id(), s.receiving().keyIndex)?,
            Self::derive_blinding_key(
                &wallet,
                &s.id(),
                &s.receiving().symbol,
                &s.receiving().lockupAddress,
            )?,
        )
            .try_into()
    }

    fn create_restorable_swap(
        &self,
        secp: &Secp256k1<secp256k1::All>,
        keys_map: &HashMap<String, u32>,
        s: Swap,
    ) -> Result<RestorableSwap> {
        let chain_symbol = s.chain_symbol()?;
        let wallet = self.get_wallet(&chain_symbol)?;

        (
            &s,
            Self::lookup_from_keys(keys_map, &s.refundPublicKey, &s.id)?,
            Self::derive_our_public_key(secp, &wallet, &s.id(), s.keyIndex)?,
            Self::derive_blinding_key(&wallet, &s.id, &chain_symbol, &s.lockupAddress)?,
        )
            .try_into()
    }

    fn create_restorable_chain_swap(
        &self,
        secp: &Secp256k1<secp256k1::All>,
        keys_map: &HashMap<String, u32>,
        s: ChainSwapInfo,
    ) -> Result<RestorableSwap> {
        let receiving_wallet = self.get_wallet(&s.receiving().symbol)?;
        let sending_data = s.sending();

        // No support for claim details on RSK yet
        let claim_details = if sending_data.theirPublicKey.is_some() {
            let sending_wallet = self.get_wallet(&sending_data.symbol)?;
            Some(
                (
                    &s,
                    Self::lookup_from_keys(keys_map, &s.sending().theirPublicKey, &s.id())?,
                    Self::derive_our_public_key(
                        secp,
                        &sending_wallet,
                        &s.id(),
                        s.sending().keyIndex,
                    )?,
                    Self::derive_blinding_key(
                        &sending_wallet,
                        &s.id(),
                        &s.sending().symbol,
                        &s.sending().lockupAddress,
                    )?,
                )
                    .try_into()?,
            )
        } else {
            None
        };

        Ok(RestorableSwap {
            base: (&s).into(),
            preimage_hash: s.swap.preimageHash.clone(),
            from: s.receiving().symbol.clone(),
            to: sending_data.symbol.clone(),
            claim_details,
            refund_details: Some(
                (
                    s.receiving(),
                    Self::lookup_from_keys(keys_map, &s.receiving().theirPublicKey, &s.id())?,
                    Self::derive_our_public_key(
                        secp,
                        &receiving_wallet,
                        &s.id(),
                        s.receiving().keyIndex,
                    )?,
                    Self::derive_blinding_key(
                        &receiving_wallet,
                        &s.id(),
                        &s.receiving().symbol,
                        &s.receiving().lockupAddress,
                    )?,
                )
                    .try_into()?,
            ),
        })
    }

    fn create_restorable_reverse_swap(
        &self,
        secp: &Secp256k1<secp256k1::All>,
        keys_map: &HashMap<String, u32>,
        s: ReverseSwap,
    ) -> Result<RestorableSwap> {
        let chain_symbol = s.chain_symbol()?;
        let wallet = self.get_wallet(&chain_symbol)?;

        (
            &s,
            Self::lookup_from_keys(keys_map, &s.claimPublicKey, &s.id())?,
            Self::derive_our_public_key(secp, &wallet, &s.id(), s.keyIndex)?,
            Self::derive_blinding_key(&wallet, &s.id, &chain_symbol, &s.lockupAddress)?,
        )
            .try_into()
    }

    fn get_wallet(&self, symbol: &str) -> Result<Arc<dyn Wallet + Send + Sync>> {
        self.currencies
            .get(symbol)
            .ok_or_else(|| anyhow!("no currency for {}", symbol))?
            .wallet
            .clone()
            .ok_or_else(|| anyhow!("no wallet for {}", symbol))
    }

    fn derive_our_public_key(
        secp: &Secp256k1<secp256k1::All>,
        wallet: &Arc<dyn Wallet + Send + Sync>,
        id: &str,
        key_index: Option<i32>,
    ) -> Result<String> {
        Ok(hex::encode(
            wallet
                .derive_keys(key_index.ok_or_else(|| anyhow!("no key index for {}", id))? as u64)?
                .private_key
                .public_key(secp)
                .serialize(),
        ))
    }

    fn derive_blinding_key(
        wallet: &Arc<dyn Wallet + Send + Sync>,
        id: &str,
        symbol: &str,
        address: &str,
    ) -> Result<Option<String>> {
        if symbol != crate::chain::elements_client::SYMBOL {
            return Ok(None);
        }

        Ok(Some(hex::encode(
            wallet
                .derive_blinding_key(address)
                .map_err(|e| anyhow!("deriving blinding key failed for {}: {}", id, e))?,
        )))
    }

    fn lookup_from_keys(
        keys: &HashMap<String, u32>,
        key: &Option<String>,
        id: &str,
    ) -> Result<u32> {
        Ok(*keys
            .get(
                key.as_ref()
                    .ok_or_else(|| anyhow!("no public key for {}", id))?,
            )
            .ok_or_else(|| anyhow!("no key mapping for {}", id))?)
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use crate::currencies::Currency;
    use crate::db::helpers::chain_swap::test::MockChainSwapHelper;
    use crate::db::helpers::reverse_swap::test::MockReverseSwapHelper;
    use crate::db::helpers::swap::test::MockSwapHelper;
    use crate::db::models::{ChainSwap, ChainSwapData, ChainSwapInfo, ReverseSwap, Swap};
    use crate::service::{SingleKeyIterator, XpubIterator};
    use crate::wallet::{Elements, Network};
    use bitcoin::{PublicKey, bip32::Xpub};
    use std::str::FromStr;

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

    fn get_test_tree() -> String {
        "{\"claimLeaf\":{\"version\":196,\"output\":\"a914617cc637679ded498738a09314294837227fbf938820ceb839aafaafdb6370781cb102567101f4ab628f54734792ede606fa8fd4f35fac\"},\"refundLeaf\":{\"version\":196,\"output\":\"2020103b104886a5180dd1be5146cceb12f19e59bdd63bca41470c91d94f317cdead02c527b1\"}}".to_string()
    }

    fn get_test_swap(tree: String) -> Swap {
        Swap {
            id: "swap".to_string(),
            pair: "L-BTC/BTC".to_string(),
            orderSide: 1,
            status: "invoice.failedToPay".to_string(),
            keyIndex: Some(1),
            timeoutBlockHeight: 321,
            preimageHash: "101a17e334bcaba40cbf8e3580b73d263c3b94ed65e86ff81317f95fe1346dd8".to_string(),
            refundPublicKey: Some("025964821780625d20ba1af21a45b203a96dcc5986c75c2d43bdc873d224810b0c".to_string()),
            lockupAddress: "el1qqwgersfg6zwpr0htqwg6rt7zwvz5ypec9q2zn2d2s526uevt4hdtyf8jqgtak7aummc7te0rj0ke4v7ygj60s7a07pe3nz6a6".to_string(),
            redeemScript: Some(tree),
            lockupTransactionId: Some("some tx".to_string()),
            lockupTransactionVout: Some(12),
            onchainAmount: Some(100000),
            createdAt: chrono::NaiveDateTime::from_str("2025-01-01T23:56:04").unwrap(),
            ..Default::default()
        }
    }

    fn get_test_chain_swap() -> ChainSwap {
        ChainSwap {
            id: "chain".to_string(),
            pair: "L-BTC/BTC".to_string(),
            orderSide: 1,
            status: "transaction.failed".to_string(),
            preimageHash: "966ea2be5351178cf96b1ae2b5b41e57bcc3d42ebcb3ef5e3bb2647641d34414"
                .to_string(),
            createdAt: chrono::NaiveDateTime::from_str("2025-01-01T23:57:21").unwrap(),
        }
    }

    fn get_test_reverse_swap(tree: String) -> ReverseSwap {
        ReverseSwap {
            id: "reverse".to_string(),
            version: 1,
            pair: "BTC/L-BTC".to_string(),
            orderSide: 0,
            status: "transaction.failed".to_string(),
            keyIndex: Some(789),
            timeoutBlockHeight: 654,
            preimageHash: "a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456"
                .to_string(),
            claimPublicKey: Some(
                "03f00262509d6c450463b293dedf06ccb472d160325debdb97fae58b05f0863cf0".to_string(),
            ),
            lockupAddress: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh".to_string(),
            redeemScript: Some(tree),
            transactionId: Some("reverse tx".to_string()),
            transactionVout: Some(42),
            onchainAmount: 150000,
            createdAt: chrono::NaiveDateTime::from_str("2025-01-01T23:58:00").unwrap(),
        }
    }

    #[tokio::test]
    async fn test_rescue() {
        let tree = get_test_tree();
        let swap = get_test_swap(tree.clone());
        let chain_swap = ChainSwapInfo::new(
            get_test_chain_swap(),
            vec![ChainSwapData {
                swapId: "chain".to_string(),
                symbol: "L-BTC".to_string(),
                keyIndex: Some(123),
                theirPublicKey: Some(
                    "02a21f37434b4f5b9e53c8401b75a078e5f6fb797c6d29feb8d9fbf980e6320b3b"
                        .to_string(),
                ),
                swapTree: Some(tree.clone()),
                timeoutBlockHeight: 13_211,
                lockupAddress: "el1qqdg7adcqj6kqgz0fp3pyts0kmvgft07r38t3lqhspw7cjncahffay897ym8xmd9c20kc8yx90xt3n38f8wpygvnuc3d4cue6m".to_string(),
                amount: Some(50000),
                ..Default::default()
            }, ChainSwapData {
                swapId: "chain".to_string(),
                symbol: "BTC".to_string(),
                keyIndex: Some(456),
                theirPublicKey: Some(
                    "03f00262509d6c450463b293dedf06ccb472d160325debdb97fae58b05f0863cf0"
                        .to_string(),
                ),
                swapTree: Some(tree),
                timeoutBlockHeight: 13_211,
                lockupAddress: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh".to_string(),
                amount: Some(200000),
                ..Default::default()
            }],
        ).unwrap();

        let mut swap_helper = MockSwapHelper::new();
        {
            let swap = swap.clone();
            swap_helper
                .expect_get_all_nullable()
                .returning(move |_| Ok(vec![swap.clone()]))
                .times(1);
        }
        swap_helper
            .expect_get_all_nullable()
            .returning(|_| Ok(vec![]))
            .times(1);

        let mut chain_helper = MockChainSwapHelper::new();
        {
            let chain_swap = chain_swap.clone();
            chain_helper
                .expect_get_by_data_nullable()
                .returning(move |_| Ok(vec![chain_swap.clone()]))
                .times(1);
        }
        chain_helper
            .expect_get_by_data_nullable()
            .returning(|_| Ok(vec![]))
            .times(1);

        let rescue = SwapRescue::new(
            Arc::new(swap_helper),
            Arc::new(chain_helper),
            Arc::new(MockReverseSwapHelper::new()),
            Arc::new(HashMap::from([(
                crate::chain::elements_client::SYMBOL.to_string(),
                Currency {
                    network: Network::Regtest,
                    wallet: Some(get_liquid_wallet()),
                    chain: None,
                    cln: None,
                    lnd: None,
                    evm_manager: None,
                },
            )])),
        );
        let xpub = Xpub::from_str("xpub661MyMwAqRbcGXPykvqCkK3sspTv2iwWTYpY9gBewku5Noj96ov1EqnKMDzGN9yPsncpRoUymJ7zpJ7HQiEtEC9Af2n3DmVu36TSV4oaiym").unwrap();
        let res = rescue
            .rescue(Box::new(XpubIterator::new(xpub, None, None).unwrap()))
            .unwrap();
        assert_eq!(res.len(), 2);
        assert_eq!(
            res[0],
            RescuableSwap {
                base: SwapBase {
                    id: swap.id,
                    kind: SwapType::Submarine,
                    status: swap.status,
                    created_at: 1735775764,
                },
                symbol: crate::chain::elements_client::SYMBOL.to_string(),
                details: SwapDetailsBase {
                    amount: Some(100_000),
                    tree: swap.redeemScript.unwrap().as_str().try_into().unwrap(),
                    key_index: 0,
                    transaction: Some(Transaction {
                        id: swap.lockupTransactionId.unwrap(),
                        vout: swap.lockupTransactionVout.unwrap() as u64,
                    }),
                    lockup_address: swap.lockupAddress,
                    server_public_key:
                        "03f80e5650435fb598bb07257d50af378d4f7ddf8f2f78181f8b29abb0b05ecb47"
                            .to_string(),
                    blinding_key: Some(
                        "cf93ed8c71de3fff39a265898766ef327cf123e8eb7084fabaead2d6092de90d"
                            .to_string()
                    ),
                    timeout_block_height: 321,
                },
                preimage_hash: swap.preimageHash,
            }
        );
        assert_eq!(
            res[1],
            RescuableSwap {
                base: SwapBase {
                    id: chain_swap.id(),
                    kind: SwapType::Chain,
                    status: chain_swap.swap.status.clone(),
                    created_at: 1735775841,
                },
                symbol: crate::chain::elements_client::SYMBOL.to_string(),
                details: SwapDetailsBase {
                    amount: Some(50_000),
                    tree: chain_swap
                        .receiving()
                        .swapTree
                        .clone()
                        .unwrap()
                        .as_str()
                        .try_into()
                        .unwrap(),
                    key_index: 11,
                    transaction: None,
                    lockup_address: chain_swap.receiving().lockupAddress.clone(),
                    server_public_key:
                        "02609b800f905a8bfba6763a5f0d9bdca4192648b006aeeb22598ea0b9004cf6c9"
                            .to_string(),
                    blinding_key: Some(
                        "fdf74d729d49d917bcc1befdc66922d6bf99af2e1cf49659299340962957916a"
                            .to_string()
                    ),
                    timeout_block_height: 13_211,
                },
                preimage_hash: chain_swap.swap.preimageHash,
            }
        );
    }

    #[tokio::test]
    async fn test_restore_xpub() {
        let tree = get_test_tree();
        let swap = get_test_swap(tree.clone());
        let chain_swap = ChainSwapInfo::new(
            get_test_chain_swap(),
            vec![ChainSwapData {
                swapId: "chain".to_string(),
                symbol: "L-BTC".to_string(),
                keyIndex: Some(123),
                theirPublicKey: Some(
                    "02a21f37434b4f5b9e53c8401b75a078e5f6fb797c6d29feb8d9fbf980e6320b3b"
                        .to_string(),
                ),
                swapTree: Some(tree.clone()),
                timeoutBlockHeight: 13_211,
                lockupAddress: "el1qqdg7adcqj6kqgz0fp3pyts0kmvgft07r38t3lqhspw7cjncahffay897ym8xmd9c20kc8yx90xt3n38f8wpygvnuc3d4cue6m".to_string(),
                amount: Some(50000),
                transactionId: Some("chain tx".to_string()),
                transactionVout: Some(5),
            }, ChainSwapData {
                swapId: "chain".to_string(),
                symbol: "BTC".to_string(),
                keyIndex: Some(456),
                theirPublicKey: Some(
                    "03f00262509d6c450463b293dedf06ccb472d160325debdb97fae58b05f0863cf0"
                        .to_string(),
                ),
                swapTree: Some(tree.clone()),
                timeoutBlockHeight: 13_211,
                lockupAddress: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh".to_string(),
                amount: Some(200000),
                transactionId: Some("chain tx".to_string()),
                transactionVout: Some(5),
            }],
        ).unwrap();
        let reverse_swap = get_test_reverse_swap(tree.clone());

        let mut swap_helper = MockSwapHelper::new();
        {
            let swap = swap.clone();
            swap_helper
                .expect_get_all_nullable()
                .returning(move |_| Ok(vec![swap.clone()]))
                .times(1);
        }
        swap_helper
            .expect_get_all_nullable()
            .returning(|_| Ok(vec![]))
            .times(1);

        let mut chain_helper = MockChainSwapHelper::new();
        {
            let chain_swap = chain_swap.clone();
            chain_helper
                .expect_get_by_data_nullable()
                .returning(move |_| Ok(vec![chain_swap.clone()]))
                .times(1);
        }
        chain_helper
            .expect_get_by_data_nullable()
            .returning(|_| Ok(vec![]))
            .times(1);

        let mut reverse_helper = MockReverseSwapHelper::new();
        {
            let reverse_swap = reverse_swap.clone();
            reverse_helper
                .expect_get_all_nullable()
                .returning(move |_| Ok(vec![reverse_swap.clone()]))
                .times(1);
        }
        reverse_helper
            .expect_get_all_nullable()
            .returning(|_| Ok(vec![]))
            .times(1);

        let rescue = SwapRescue::new(
            Arc::new(swap_helper),
            Arc::new(chain_helper),
            Arc::new(reverse_helper),
            Arc::new(HashMap::from([
                (
                    crate::chain::elements_client::SYMBOL.to_string(),
                    Currency {
                        network: Network::Regtest,
                        wallet: Some(get_liquid_wallet()),
                        chain: None,
                        cln: None,
                        lnd: None,
                        evm_manager: None,
                    },
                ),
                (
                    "BTC".to_string(),
                    Currency {
                        network: Network::Regtest,
                        wallet: Some(get_liquid_wallet()),
                        chain: None,
                        cln: None,
                        lnd: None,
                        evm_manager: None,
                    },
                ),
            ])),
        );
        let xpub = Xpub::from_str("xpub661MyMwAqRbcGXPykvqCkK3sspTv2iwWTYpY9gBewku5Noj96ov1EqnKMDzGN9yPsncpRoUymJ7zpJ7HQiEtEC9Af2n3DmVu36TSV4oaiym").unwrap();
        let res = rescue
            .restore(Box::new(XpubIterator::new(xpub, None, None).unwrap()))
            .unwrap();
        assert_eq!(res.len(), 3);

        assert_eq!(
            res[0],
            RestorableSwap {
                base: SwapBase {
                    id: swap.id,
                    kind: SwapType::Submarine,
                    status: swap.status,
                    created_at: 1735775764,
                },
                from: crate::chain::elements_client::SYMBOL.to_string(),
                to: "BTC".to_string(),
                preimage_hash: swap.preimageHash,
                claim_details: None,
                refund_details: Some(SwapDetailsBase {
                    amount: swap.onchainAmount,
                    tree: swap.redeemScript.unwrap().as_str().try_into().unwrap(),
                    key_index: 0,
                    transaction: Some(Transaction {
                        id: swap.lockupTransactionId.unwrap(),
                        vout: swap.lockupTransactionVout.unwrap() as u64,
                    }),
                    lockup_address: swap.lockupAddress,
                    server_public_key:
                        "03f80e5650435fb598bb07257d50af378d4f7ddf8f2f78181f8b29abb0b05ecb47"
                            .to_string(),
                    blinding_key: Some(
                        "cf93ed8c71de3fff39a265898766ef327cf123e8eb7084fabaead2d6092de90d"
                            .to_string()
                    ),
                    timeout_block_height: 321,
                }),
            }
        );

        assert_eq!(
            res[1],
            RestorableSwap {
                base: SwapBase {
                    id: reverse_swap.id(),
                    kind: SwapType::Reverse,
                    status: reverse_swap.status.clone(),
                    created_at: 1735775880,
                },
                from: "L-BTC".to_string(),
                to: "BTC".to_string(),
                preimage_hash: reverse_swap.preimageHash.clone(),
                claim_details: Some(ClaimDetails {
                    base: SwapDetailsBase {
                        amount: Some(reverse_swap.onchainAmount),
                        tree: reverse_swap
                            .redeemScript
                            .unwrap()
                            .as_str()
                            .try_into()
                            .unwrap(),
                        key_index: 1,
                        transaction: Some(Transaction {
                            id: reverse_swap.transactionId.unwrap(),
                            vout: reverse_swap.transactionVout.unwrap() as u64,
                        }),
                        lockup_address: reverse_swap.lockupAddress.clone(),
                        server_public_key:
                            "03f96a3b06079754e09a7dbca45c8eb1346fa6efb966b21c25fbf1fc85542675c7"
                                .to_string(),
                        blinding_key: None,
                        timeout_block_height: 654,
                    },
                    preimage_hash: reverse_swap.preimageHash.clone(),
                }),
                refund_details: None,
            }
        );

        assert_eq!(
            res[2],
            RestorableSwap {
                base: SwapBase {
                    id: chain_swap.id(),
                    kind: SwapType::Chain,
                    status: chain_swap.swap.status.clone(),
                    created_at: 1735775841,
                },
                from: crate::chain::elements_client::SYMBOL.to_string(),
                to: "BTC".to_string(),
                preimage_hash: chain_swap.swap.preimageHash.clone(),
                claim_details: Some(ClaimDetails {
                    base: SwapDetailsBase {
                        amount: chain_swap.sending().amount,
                        tree: chain_swap
                            .sending()
                            .swapTree
                            .clone()
                            .unwrap()
                            .as_str()
                            .try_into()
                            .unwrap(),
                        key_index: 1,
                        transaction: Some(Transaction {
                            id: chain_swap.sending().transactionId.clone().unwrap(),
                            vout: chain_swap.sending().transactionVout.unwrap() as u64,
                        }),
                        lockup_address: chain_swap.sending().lockupAddress.clone(),
                        server_public_key:
                            "03eaf6026d7cc1e455b9fc7d0fcac16b1ff01f70bac0872ee633e6484b5e8792e5"
                                .to_string(),
                        blinding_key: None,
                        timeout_block_height: 13_211,
                    },
                    preimage_hash: chain_swap.swap.preimageHash.clone(),
                }),
                refund_details: Some(SwapDetailsBase {
                    amount: chain_swap.receiving().amount,
                    tree: chain_swap
                        .receiving()
                        .swapTree
                        .clone()
                        .unwrap()
                        .as_str()
                        .try_into()
                        .unwrap(),
                    key_index: 11,
                    transaction: Some(Transaction {
                        id: chain_swap.receiving().transactionId.clone().unwrap(),
                        vout: chain_swap.receiving().transactionVout.unwrap() as u64,
                    }),
                    lockup_address: chain_swap.receiving().lockupAddress.clone(),
                    server_public_key:
                        "02609b800f905a8bfba6763a5f0d9bdca4192648b006aeeb22598ea0b9004cf6c9"
                            .to_string(),
                    blinding_key: Some(
                        "fdf74d729d49d917bcc1befdc66922d6bf99af2e1cf49659299340962957916a"
                            .to_string()
                    ),
                    timeout_block_height: 13_211,
                }),
            }
        );
    }

    #[tokio::test]
    async fn test_restore_single_key() {
        let tree = get_test_tree();
        let reverse_swap = get_test_reverse_swap(tree.clone());

        let mut swap_helper = MockSwapHelper::new();
        swap_helper
            .expect_get_all_nullable()
            .returning(|_| Ok(vec![]))
            .times(1);

        let mut chain_helper = MockChainSwapHelper::new();
        chain_helper
            .expect_get_by_data_nullable()
            .returning(|_| Ok(vec![]))
            .times(1);

        let mut reverse_helper = MockReverseSwapHelper::new();
        {
            let reverse_swap = reverse_swap.clone();
            reverse_helper
                .expect_get_all_nullable()
                .returning(move |_| Ok(vec![reverse_swap.clone()]))
                .times(1);
        }

        let rescue = SwapRescue::new(
            Arc::new(swap_helper),
            Arc::new(chain_helper),
            Arc::new(reverse_helper),
            Arc::new(HashMap::from([
                (
                    crate::chain::elements_client::SYMBOL.to_string(),
                    Currency {
                        network: Network::Regtest,
                        wallet: Some(get_liquid_wallet()),
                        chain: None,
                        cln: None,
                        lnd: None,
                        evm_manager: None,
                    },
                ),
                (
                    "BTC".to_string(),
                    Currency {
                        network: Network::Regtest,
                        wallet: Some(get_liquid_wallet()),
                        chain: None,
                        cln: None,
                        lnd: None,
                        evm_manager: None,
                    },
                ),
            ])),
        );

        let pubkey = PublicKey::from_str(
            "03f00262509d6c450463b293dedf06ccb472d160325debdb97fae58b05f0863cf0",
        )
        .unwrap();
        let res = rescue
            .restore(Box::new(SingleKeyIterator::new(pubkey)))
            .unwrap();

        assert_eq!(res.len(), 1);
        assert_eq!(
            res[0],
            RestorableSwap {
                base: SwapBase {
                    id: reverse_swap.id(),
                    kind: SwapType::Reverse,
                    status: reverse_swap.status.clone(),
                    created_at: 1735775880,
                },
                from: "L-BTC".to_string(),
                to: "BTC".to_string(),
                preimage_hash: reverse_swap.preimageHash.clone(),
                claim_details: Some(ClaimDetails {
                    base: SwapDetailsBase {
                        amount: Some(reverse_swap.onchainAmount),
                        tree: reverse_swap
                            .redeemScript
                            .unwrap()
                            .as_str()
                            .try_into()
                            .unwrap(),
                        key_index: 0,
                        transaction: Some(Transaction {
                            id: reverse_swap.transactionId.unwrap(),
                            vout: reverse_swap.transactionVout.unwrap() as u64,
                        }),
                        lockup_address: reverse_swap.lockupAddress.clone(),
                        server_public_key:
                            "03f96a3b06079754e09a7dbca45c8eb1346fa6efb966b21c25fbf1fc85542675c7"
                                .to_string(),
                        blinding_key: None,
                        timeout_block_height: 654,
                    },
                    preimage_hash: reverse_swap.preimageHash.clone(),
                }),
                refund_details: None,
            }
        );
    }

    #[tokio::test]
    async fn test_derive_our_public_key() {
        assert_eq!(
            SwapRescue::derive_our_public_key(
                &Secp256k1::default(),
                &get_liquid_wallet(),
                "",
                Some(0)
            )
            .unwrap(),
            "0371ce2b829f0de3863be481d9d72fde7a11f780e070be73f35b5ddd4a878327f9"
        );
    }

    #[tokio::test]
    async fn test_derive_our_public_key_no_key_index() {
        let id = "id";
        assert_eq!(
            SwapRescue::derive_our_public_key(
                &Secp256k1::default(),
                &get_liquid_wallet(),
                id,
                None
            )
            .err()
            .unwrap()
            .to_string(),
            format!("no key index for {id}")
        );
    }

    #[tokio::test]
    async fn test_derive_blinding_key() {
        assert_eq!(SwapRescue::derive_blinding_key(
            &get_liquid_wallet(),
            "",
            crate::chain::elements_client::SYMBOL,
            "el1pqt0dzt0mh2gxxvrezmzqexg0n66rkmd5997wn255wmfpqdegd2qyh284rq5v4h2vtj0ey3399k8d8v8qwsphj3qt4cf9zj08h0zqhraf0qcqltm5nfxq",
        ).unwrap().unwrap(), "bd47a0bd2544c3d2e171a31cc769b8c2f7e5670f7cb14c06fe1dbf827b18e3cf");
    }

    #[tokio::test]
    async fn test_derive_blinding_key_non_liquid() {
        assert!(
            SwapRescue::derive_blinding_key(&get_liquid_wallet(), "", "BTC", "")
                .unwrap()
                .is_none()
        );
    }

    #[test]
    fn test_lookup_from_keys() {
        let key = "key";
        assert_eq!(
            SwapRescue::lookup_from_keys(
                &HashMap::from([(key.to_string(), 21)]),
                &Some(key.to_string()),
                ""
            )
            .unwrap(),
            21
        );
    }

    #[test]
    fn test_lookup_from_keys_no_key() {
        let id = "adsf";
        assert_eq!(
            SwapRescue::lookup_from_keys(&HashMap::new(), &None, id)
                .err()
                .unwrap()
                .to_string(),
            format!("no public key for {id}")
        );
    }

    #[test]
    fn test_lookup_from_keys_no_mapping() {
        let id = "adsf";
        assert_eq!(
            SwapRescue::lookup_from_keys(&HashMap::new(), &Some("".to_string()), id)
                .err()
                .unwrap()
                .to_string(),
            format!("no key mapping for {id}")
        );
    }

    #[test]
    fn test_parse_tree() {
        let tree: Result<SwapTree> = ("{\"claimLeaf\":{\"version\":192,\"output\":\"82012088a91433ca578b1dde9cb32e4b6a2c05fe74520911b66e8820884ff511cc5061a90f07e553de127095df5d438b2bda23db4159c5f32df5e1f9ac\"},\"refundLeaf\":{\"version\":192,\"output\":\"205bbdfe5d1bf863f65c5271d4cd6621c44048b89e80aa79301fe671d98bed598aad026001b1\"}}").try_into();
        assert!(tree.is_ok());
    }

    #[tokio::test]
    async fn test_index_no_swaps() {
        let mut swap_helper = MockSwapHelper::new();
        swap_helper
            .expect_get_all_nullable()
            .returning(|_| Ok(vec![]))
            .times(1);

        let mut chain_helper = MockChainSwapHelper::new();
        chain_helper
            .expect_get_by_data_nullable()
            .returning(|_| Ok(vec![]))
            .times(1);

        let mut reverse_helper = MockReverseSwapHelper::new();
        reverse_helper
            .expect_get_all_nullable()
            .returning(|_| Ok(vec![]))
            .times(1);

        let rescue = SwapRescue::new(
            Arc::new(swap_helper),
            Arc::new(chain_helper),
            Arc::new(reverse_helper),
            Arc::new(HashMap::from([(
                crate::chain::elements_client::SYMBOL.to_string(),
                Currency {
                    network: Network::Regtest,
                    wallet: Some(get_liquid_wallet()),
                    chain: None,
                    cln: None,
                    lnd: None,
                    evm_manager: None,
                },
            )])),
        );

        let xpub = Xpub::from_str("xpub661MyMwAqRbcGXPykvqCkK3sspTv2iwWTYpY9gBewku5Noj96ov1EqnKMDzGN9yPsncpRoUymJ7zpJ7HQiEtEC9Af2n3DmVu36TSV4oaiym").unwrap();
        let index = rescue
            .index(Box::new(XpubIterator::new(xpub, None, None).unwrap()))
            .unwrap();

        assert_eq!(index, -1);
    }

    #[tokio::test]
    async fn test_index_submarine_swap_only() {
        let tree = get_test_tree();
        let swap = get_test_swap(tree);

        let mut swap_helper = MockSwapHelper::new();
        {
            let swap = swap.clone();
            swap_helper
                .expect_get_all_nullable()
                .returning(move |_| Ok(vec![swap.clone()]))
                .times(1);
        }
        swap_helper
            .expect_get_all_nullable()
            .returning(|_| Ok(vec![]))
            .times(1);

        let mut chain_helper = MockChainSwapHelper::new();
        chain_helper
            .expect_get_by_data_nullable()
            .returning(|_| Ok(vec![]))
            .times(2);

        let mut reverse_helper = MockReverseSwapHelper::new();
        reverse_helper
            .expect_get_all_nullable()
            .returning(|_| Ok(vec![]))
            .times(2);

        let rescue = SwapRescue::new(
            Arc::new(swap_helper),
            Arc::new(chain_helper),
            Arc::new(reverse_helper),
            Arc::new(HashMap::from([(
                crate::chain::elements_client::SYMBOL.to_string(),
                Currency {
                    network: Network::Regtest,
                    wallet: Some(get_liquid_wallet()),
                    chain: None,
                    cln: None,
                    lnd: None,
                    evm_manager: None,
                },
            )])),
        );

        let xpub = Xpub::from_str("xpub661MyMwAqRbcGXPykvqCkK3sspTv2iwWTYpY9gBewku5Noj96ov1EqnKMDzGN9yPsncpRoUymJ7zpJ7HQiEtEC9Af2n3DmVu36TSV4oaiym").unwrap();
        let index = rescue
            .index(Box::new(XpubIterator::new(xpub, None, None).unwrap()))
            .unwrap();

        assert_eq!(index, 0);
    }

    #[tokio::test]
    async fn test_index_reverse_swap_only() {
        let tree = get_test_tree();
        let mut reverse_swap = get_test_reverse_swap(tree);
        reverse_swap.keyIndex = Some(42);

        let mut swap_helper = MockSwapHelper::new();
        swap_helper
            .expect_get_all_nullable()
            .returning(|_| Ok(vec![]))
            .times(1);

        let mut chain_helper = MockChainSwapHelper::new();
        chain_helper
            .expect_get_by_data_nullable()
            .returning(|_| Ok(vec![]))
            .times(1);

        let mut reverse_helper = MockReverseSwapHelper::new();
        {
            let reverse_swap = reverse_swap.clone();
            reverse_helper
                .expect_get_all_nullable()
                .returning(move |_| Ok(vec![reverse_swap.clone()]))
                .times(1);
        }

        let rescue = SwapRescue::new(
            Arc::new(swap_helper),
            Arc::new(chain_helper),
            Arc::new(reverse_helper),
            Arc::new(HashMap::from([
                (
                    crate::chain::elements_client::SYMBOL.to_string(),
                    Currency {
                        network: Network::Regtest,
                        wallet: Some(get_liquid_wallet()),
                        chain: None,
                        cln: None,
                        lnd: None,
                        evm_manager: None,
                    },
                ),
                (
                    "BTC".to_string(),
                    Currency {
                        network: Network::Regtest,
                        wallet: Some(get_liquid_wallet()),
                        chain: None,
                        cln: None,
                        lnd: None,
                        evm_manager: None,
                    },
                ),
            ])),
        );

        let pubkey = PublicKey::from_str(
            "03f00262509d6c450463b293dedf06ccb472d160325debdb97fae58b05f0863cf0",
        )
        .unwrap();
        let index = rescue
            .index(Box::new(SingleKeyIterator::new(pubkey)))
            .unwrap();

        assert_eq!(index, 0);
    }

    #[tokio::test]
    async fn test_index_chain_swap_with_both_details() {
        let tree = get_test_tree();
        let chain_swap = ChainSwapInfo::new(
            get_test_chain_swap(),
            vec![
                ChainSwapData {
                    swapId: "chain".to_string(),
                    symbol: "L-BTC".to_string(),
                    keyIndex: Some(123),
                    theirPublicKey: Some(
                        "02a21f37434b4f5b9e53c8401b75a078e5f6fb797c6d29feb8d9fbf980e6320b3b"
                            .to_string(),
                    ),
                    swapTree: Some(tree.clone()),
                    timeoutBlockHeight: 13_211,
                    lockupAddress:
                        "el1qqdg7adcqj6kqgz0fp3pyts0kmvgft07r38t3lqhspw7cjncahffay897ym8xmd9c20kc8yx90xt3n38f8wpygvnuc3d4cue6m"
                            .to_string(),
                    amount: Some(50000),
                    transactionId: Some("chain tx".to_string()),
                    transactionVout: Some(5),
                },
                ChainSwapData {
                    swapId: "chain".to_string(),
                    symbol: "BTC".to_string(),
                    keyIndex: Some(456),
                    theirPublicKey: Some(
                        "03f00262509d6c450463b293dedf06ccb472d160325debdb97fae58b05f0863cf0"
                            .to_string(),
                    ),
                    swapTree: Some(tree),
                    timeoutBlockHeight: 13_211,
                    lockupAddress: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh".to_string(),
                    amount: Some(200000),
                    transactionId: Some("chain tx".to_string()),
                    transactionVout: Some(5),
                },
            ],
        )
        .unwrap();

        let mut swap_helper = MockSwapHelper::new();
        swap_helper
            .expect_get_all_nullable()
            .returning(|_| Ok(vec![]))
            .times(2);

        let mut chain_helper = MockChainSwapHelper::new();
        {
            let chain_swap = chain_swap.clone();
            chain_helper
                .expect_get_by_data_nullable()
                .returning(move |_| Ok(vec![chain_swap.clone()]))
                .times(1);
        }
        chain_helper
            .expect_get_by_data_nullable()
            .returning(|_| Ok(vec![]))
            .times(1);

        let mut reverse_helper = MockReverseSwapHelper::new();
        reverse_helper
            .expect_get_all_nullable()
            .returning(|_| Ok(vec![]))
            .times(2);

        let rescue = SwapRescue::new(
            Arc::new(swap_helper),
            Arc::new(chain_helper),
            Arc::new(reverse_helper),
            Arc::new(HashMap::from([
                (
                    crate::chain::elements_client::SYMBOL.to_string(),
                    Currency {
                        network: Network::Regtest,
                        wallet: Some(get_liquid_wallet()),
                        chain: None,
                        cln: None,
                        lnd: None,
                        evm_manager: None,
                    },
                ),
                (
                    "BTC".to_string(),
                    Currency {
                        network: Network::Regtest,
                        wallet: Some(get_liquid_wallet()),
                        chain: None,
                        cln: None,
                        lnd: None,
                        evm_manager: None,
                    },
                ),
            ])),
        );

        let xpub = Xpub::from_str("xpub661MyMwAqRbcGXPykvqCkK3sspTv2iwWTYpY9gBewku5Noj96ov1EqnKMDzGN9yPsncpRoUymJ7zpJ7HQiEtEC9Af2n3DmVu36TSV4oaiym").unwrap();
        let index = rescue
            .index(Box::new(XpubIterator::new(xpub, None, None).unwrap()))
            .unwrap();

        assert_eq!(index, 11);
    }

    #[tokio::test]
    async fn test_index_multiple_swaps_returns_highest() {
        let tree = get_test_tree();
        let mut swap1 = get_test_swap(tree.clone());
        swap1.id = "swap1".to_string();
        swap1.keyIndex = Some(5);

        let mut swap2 = get_test_swap(tree.clone());
        swap2.id = "swap2".to_string();
        swap2.keyIndex = Some(10);
        swap2.refundPublicKey =
            Some("02a21f37434b4f5b9e53c8401b75a078e5f6fb797c6d29feb8d9fbf980e6320b3b".to_string());

        let mut reverse_swap = get_test_reverse_swap(tree.clone());
        reverse_swap.keyIndex = Some(15);

        let mut swap_helper = MockSwapHelper::new();
        {
            let swap1 = swap1.clone();
            let swap2 = swap2.clone();
            swap_helper
                .expect_get_all_nullable()
                .returning(move |_| Ok(vec![swap1.clone(), swap2.clone()]))
                .times(1);
        }
        swap_helper
            .expect_get_all_nullable()
            .returning(|_| Ok(vec![]))
            .times(1);

        let mut chain_helper = MockChainSwapHelper::new();
        chain_helper
            .expect_get_by_data_nullable()
            .returning(|_| Ok(vec![]))
            .times(2);

        let mut reverse_helper = MockReverseSwapHelper::new();
        {
            let reverse_swap = reverse_swap.clone();
            reverse_helper
                .expect_get_all_nullable()
                .returning(move |_| Ok(vec![reverse_swap.clone()]))
                .times(1);
        }
        reverse_helper
            .expect_get_all_nullable()
            .returning(|_| Ok(vec![]))
            .times(1);

        let rescue = SwapRescue::new(
            Arc::new(swap_helper),
            Arc::new(chain_helper),
            Arc::new(reverse_helper),
            Arc::new(HashMap::from([
                (
                    crate::chain::elements_client::SYMBOL.to_string(),
                    Currency {
                        network: Network::Regtest,
                        wallet: Some(get_liquid_wallet()),
                        chain: None,
                        cln: None,
                        lnd: None,
                        evm_manager: None,
                    },
                ),
                (
                    "BTC".to_string(),
                    Currency {
                        network: Network::Regtest,
                        wallet: Some(get_liquid_wallet()),
                        chain: None,
                        cln: None,
                        lnd: None,
                        evm_manager: None,
                    },
                ),
            ])),
        );

        let xpub = Xpub::from_str("xpub661MyMwAqRbcGXPykvqCkK3sspTv2iwWTYpY9gBewku5Noj96ov1EqnKMDzGN9yPsncpRoUymJ7zpJ7HQiEtEC9Af2n3DmVu36TSV4oaiym").unwrap();
        let index = rescue
            .index(Box::new(XpubIterator::new(xpub, None, None).unwrap()))
            .unwrap();

        assert_eq!(index, 11);
    }
}

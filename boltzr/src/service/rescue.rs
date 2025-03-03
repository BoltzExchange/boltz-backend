use crate::currencies::Currencies;
use crate::db::helpers::chain_swap::ChainSwapHelper;
use crate::db::helpers::swap::SwapHelper;
use crate::db::models::{LightningSwap, SomeSwap, SwapType};
use crate::wallet::Wallet;
use alloy::hex;
use anyhow::{Result, anyhow};
use bitcoin::bip32::{DerivationPath, Xpub};
use bitcoin::secp256k1;
use bitcoin::secp256k1::Secp256k1;
use diesel::{BoolExpressionMethods, ExpressionMethods};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::str::FromStr;
use std::sync::Arc;
use tracing::{debug, instrument, trace};

const DERIVATION_PATH: &str = "m/44/0/0/0";
const GAP_LIMIT: u64 = 50;

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

#[derive(Serialize, Deserialize, PartialEq, Clone, Debug)]
pub struct Transaction {
    pub id: String,
    pub vout: u64,
}

#[derive(Serialize, Deserialize, PartialEq, Clone, Debug)]
pub struct RescuableSwap {
    pub id: String,
    #[serde(rename = "type")]
    pub kind: SwapType,
    pub status: String,
    pub symbol: String,
    #[serde(rename = "keyIndex")]
    pub key_index: u64,
    #[serde(rename = "preimageHash")]
    pub preimage_hash: String,
    #[serde(rename = "timeoutBlockHeight")]
    pub timeout_block_height: u64,
    #[serde(rename = "serverPublicKey")]
    pub server_public_key: String,
    #[serde(rename = "blindingKey", skip_serializing_if = "Option::is_none")]
    pub blinding_key: Option<String>,
    pub tree: SwapTree,
    #[serde(rename = "lockupAddress")]
    pub lockup_address: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub transaction: Option<Transaction>,
    #[serde(rename = "createdAt")]
    pub created_at: u64,
}

pub struct SwapRescue {
    currencies: Currencies,
    swap_helper: Arc<dyn SwapHelper + Sync + Send>,
    chain_swap_helper: Arc<dyn ChainSwapHelper + Sync + Send>,
}

impl SwapRescue {
    pub fn new(
        swap_helper: Arc<dyn SwapHelper + Sync + Send>,
        chain_swap_helper: Arc<dyn ChainSwapHelper + Sync + Send>,
        currencies: Currencies,
    ) -> SwapRescue {
        Self {
            currencies,
            swap_helper,
            chain_swap_helper,
        }
    }

    #[instrument(name = "SwapRescue::rescue_xpub", skip_all)]
    pub fn rescue_xpub(
        &self,
        xpub: &Xpub,
        derivation_path: Option<String>,
    ) -> Result<Vec<RescuableSwap>> {
        debug!(
            "Scanning for rescuable swaps for {}",
            xpub.identifier().to_string()
        );

        let secp = Secp256k1::default();
        let derivation_path = if let Some(path) = &derivation_path {
            path
        } else {
            DERIVATION_PATH
        };

        let mut rescuable = Vec::new();

        for from in (0..).step_by(GAP_LIMIT as usize) {
            let to = from + GAP_LIMIT;

            trace!(
                "Scanning for rescuable swaps from key index {} to {} for {}",
                from,
                to,
                xpub.identifier().to_string()
            );

            let keys_map = Self::derive_keys(&secp, xpub, derivation_path, from, to)?;
            let keys = keys_map.keys().map(|k| Some(k.clone())).collect::<Vec<_>>();

            let swaps = self.swap_helper.get_all_nullable(Box::new(
                crate::db::schema::swaps::dsl::version
                    // No legacy swaps
                    .gt(0)
                    .and(crate::db::schema::swaps::dsl::refundPublicKey.eq_any(keys.clone())),
            ))?;
            let chain_swaps = self.chain_swap_helper.get_by_data_nullable(Box::new(
                crate::db::schema::chainSwapData::dsl::theirPublicKey.eq_any(keys),
            ))?;

            if swaps.is_empty() && chain_swaps.is_empty() {
                debug!(
                    "Scanned {} keys for rescuable swaps for {} and found {}",
                    to,
                    xpub.identifier().to_string(),
                    rescuable.len(),
                );
                break;
            }

            rescuable.append(
                &mut swaps
                    .into_iter()
                    .map(|s| {
                        let wallet = &self
                            .currencies
                            .get(&s.chain_symbol()?)
                            .ok_or_else(|| anyhow!("no wallet for {}", s.id))?
                            .wallet;

                        Ok(RescuableSwap {
                            id: s.id.clone(),
                            kind: s.kind(),
                            symbol: s.chain_symbol()?,
                            key_index: Self::lookup_from_keys(
                                &keys_map,
                                s.refundPublicKey.clone(),
                                &s.id,
                            )?,
                            timeout_block_height: s.timeoutBlockHeight as u64,
                            server_public_key: Self::derive_our_public_key(
                                &secp,
                                wallet,
                                &s.id(),
                                s.keyIndex,
                            )?,
                            blinding_key: Self::derive_blinding_key(
                                wallet,
                                &s.id,
                                &s.chain_symbol()?,
                                &s.lockupAddress,
                            )?,
                            tree: Self::parse_tree(
                                s.redeemScript
                                    .as_ref()
                                    .ok_or_else(|| anyhow!("no swap tree for {}", s.id))?,
                            )?,
                            transaction: Self::transform_transaction(
                                s.lockupTransactionId,
                                s.lockupTransactionVout,
                            ),
                            status: s.status,
                            preimage_hash: s.preimageHash,
                            lockup_address: s.lockupAddress,
                            created_at: s.createdAt.and_utc().timestamp() as u64,
                        })
                    })
                    .collect::<Result<Vec<RescuableSwap>>>()?,
            );
            rescuable.append(
                &mut chain_swaps
                    .into_iter()
                    .filter(|s| {
                        if let Some(their_public_key) = &s.receiving().theirPublicKey {
                            return keys_map.contains_key(their_public_key);
                        }

                        false
                    })
                    .map(|s| {
                        let wallet = &self
                            .currencies
                            .get(&s.receiving().symbol)
                            .ok_or_else(|| anyhow!("no wallet for {}", s.id()))?
                            .wallet;

                        Ok(RescuableSwap {
                            id: s.id(),
                            kind: s.kind(),
                            symbol: s.receiving().symbol.clone(),
                            key_index: Self::lookup_from_keys(
                                &keys_map,
                                s.receiving().theirPublicKey.clone(),
                                &s.id(),
                            )?,
                            server_public_key: Self::derive_our_public_key(
                                &secp,
                                wallet,
                                &s.id(),
                                s.receiving().keyIndex,
                            )?,
                            timeout_block_height: s.receiving().timeoutBlockHeight as u64,
                            blinding_key: Self::derive_blinding_key(
                                wallet,
                                &s.id(),
                                &s.receiving().symbol,
                                &s.receiving().lockupAddress,
                            )?,
                            tree: Self::parse_tree(
                                s.receiving()
                                    .swapTree
                                    .as_ref()
                                    .ok_or_else(|| anyhow!("no swap tree for {}", s.id()))?,
                            )?,
                            transaction: Self::transform_transaction(
                                s.receiving().transactionId.clone(),
                                s.receiving().transactionVout,
                            ),
                            lockup_address: s.receiving().lockupAddress.clone(),
                            status: s.swap.status,
                            preimage_hash: s.swap.preimageHash,
                            created_at: s.swap.createdAt.and_utc().timestamp() as u64,
                        })
                    })
                    .collect::<Result<Vec<RescuableSwap>>>()?,
            );
        }

        rescuable.sort_by(|a, b| a.key_index.cmp(&b.key_index));
        Ok(rescuable)
    }

    fn transform_transaction(
        transaction_id: Option<String>,
        vout: Option<i32>,
    ) -> Option<Transaction> {
        if let (Some(transaction_id), Some(vout)) = (transaction_id, vout) {
            Some(Transaction {
                id: transaction_id,
                vout: vout as u64,
            })
        } else {
            None
        }
    }

    fn derive_our_public_key<C: secp256k1::Signing>(
        secp: &Secp256k1<C>,
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

    fn lookup_from_keys(keys: &HashMap<String, u64>, key: Option<String>, id: &str) -> Result<u64> {
        Ok(*keys
            .get(&key.ok_or_else(|| anyhow!("no public key for {}", id))?)
            .ok_or_else(|| anyhow!("no key mapping for {}", id))?)
    }

    fn derive_keys<C: secp256k1::Verification>(
        secp: &Secp256k1<C>,
        xpub: &Xpub,
        derivation_path: &str,
        start: u64,
        end: u64,
    ) -> Result<HashMap<String, u64>> {
        let mut map = HashMap::new();

        for i in start..end {
            let key = xpub
                .derive_pub(
                    secp,
                    &DerivationPath::from_str(&format!("{}/{}", derivation_path, i))?,
                )
                .map(|derived| derived.public_key)?;

            map.insert(hex::encode(key.serialize()), i);
        }

        Ok(map)
    }

    fn parse_tree(tree: &str) -> Result<SwapTree> {
        serde_json::from_str(tree).map_err(|e| e.into())
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use crate::currencies::Currency;
    use crate::db::helpers::chain_swap::test::MockChainSwapHelper;
    use crate::db::helpers::swap::test::MockSwapHelper;
    use crate::db::models::{ChainSwap, ChainSwapData, ChainSwapInfo, Swap};
    use crate::wallet::{Elements, Network};
    use rstest::rstest;

    fn get_liquid_wallet() -> Arc<dyn Wallet + Send + Sync> {
        Arc::new(
            Elements::new(
                Network::Regtest,
                &crate::wallet::test::get_seed(),
                "m/0/1".to_string(),
            )
            .unwrap(),
        )
    }

    #[test]
    fn test_rescue_xpub() {
        let tree = "{\"claimLeaf\":{\"version\":196,\"output\":\"a914617cc637679ded498738a09314294837227fbf938820ceb839aafaafdb6370781cb102567101f4ab628f54734792ede606fa8fd4f35fac\"},\"refundLeaf\":{\"version\":196,\"output\":\"2020103b104886a5180dd1be5146cceb12f19e59bdd63bca41470c91d94f317cdead02c527b1\"}}";

        let swap = Swap {
            id: "swap".to_string(),
            pair: "L-BTC/BTC".to_string(),
            orderSide: 1,
            status: "invoice.failedToPay".to_string(),
            keyIndex: Some(1),
            timeoutBlockHeight: 321,
            preimageHash: "101a17e334bcaba40cbf8e3580b73d263c3b94ed65e86ff81317f95fe1346dd8".to_string(),
            refundPublicKey: Some("025964821780625d20ba1af21a45b203a96dcc5986c75c2d43bdc873d224810b0c".to_string()),
            lockupAddress: "el1qqwgersfg6zwpr0htqwg6rt7zwvz5ypec9q2zn2d2s526uevt4hdtyf8jqgtak7aummc7te0rj0ke4v7ygj60s7a07pe3nz6a6".to_string(),
            redeemScript: Some(tree.to_string()),
            lockupTransactionId: Some("some tx".to_string()),
            lockupTransactionVout: Some(12),
            createdAt: chrono::NaiveDateTime::from_str("2025-01-01T23:56:04").unwrap(),
            ..Default::default()
        };

        let chain_swap = ChainSwapInfo::new(
            ChainSwap {
                id: "chain".to_string(),
                pair: "L-BTC/BTC".to_string(),
                orderSide: 1,
                status: "transaction.failed".to_string(),
                preimageHash: "966ea2be5351178cf96b1ae2b5b41e57bcc3d42ebcb3ef5e3bb2647641d34414".to_string(),
                createdAt: chrono::NaiveDateTime::from_str("2025-01-01T23:57:21").unwrap(),
            },
            vec![ChainSwapData {
                swapId: "chain".to_string(),
                symbol: "L-BTC".to_string(),
                keyIndex: Some(123),
                theirPublicKey: Some(
                    "02a21f37434b4f5b9e53c8401b75a078e5f6fb797c6d29feb8d9fbf980e6320b3b"
                        .to_string(),
                ),
                swapTree: Some(tree.to_string()),
                timeoutBlockHeight: 13_211,
                lockupAddress: "el1qqdg7adcqj6kqgz0fp3pyts0kmvgft07r38t3lqhspw7cjncahffay897ym8xmd9c20kc8yx90xt3n38f8wpygvnuc3d4cue6m".to_string(),
                ..Default::default()
            }, ChainSwapData {
                swapId: "chain".to_string(),
                symbol: "BTC".to_string(),
                ..Default::default()
            }],
        )
        .unwrap();

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
            Arc::new(HashMap::from([(
                crate::chain::elements_client::SYMBOL.to_string(),
                Currency {
                    network: Network::Regtest,
                    wallet: get_liquid_wallet(),
                    chain: None,
                    cln: None,
                    lnd: None,
                },
            )])),
        );
        let xpub = Xpub::from_str("xpub661MyMwAqRbcGXPykvqCkK3sspTv2iwWTYpY9gBewku5Noj96ov1EqnKMDzGN9yPsncpRoUymJ7zpJ7HQiEtEC9Af2n3DmVu36TSV4oaiym").unwrap();
        let res = rescue.rescue_xpub(&xpub, None).unwrap();
        assert_eq!(res.len(), 2);
        assert_eq!(
            res[0],
            RescuableSwap {
                id: swap.id,
                kind: SwapType::Submarine,
                status: swap.status,
                symbol: crate::chain::elements_client::SYMBOL.to_string(),
                key_index: 0,
                preimage_hash: swap.preimageHash,
                timeout_block_height: swap.timeoutBlockHeight as u64,
                server_public_key:
                    "03f80e5650435fb598bb07257d50af378d4f7ddf8f2f78181f8b29abb0b05ecb47".to_string(),
                blinding_key: Some(
                    "cf93ed8c71de3fff39a265898766ef327cf123e8eb7084fabaead2d6092de90d".to_string()
                ),
                tree: SwapRescue::parse_tree(&swap.redeemScript.unwrap()).unwrap(),
                lockup_address: swap.lockupAddress,
                transaction: Some(Transaction {
                    id: swap.lockupTransactionId.unwrap(),
                    vout: swap.lockupTransactionVout.unwrap() as u64,
                }),
                created_at: 1735775764,
            }
        );
        assert_eq!(
            res[1],
            RescuableSwap {
                id: chain_swap.id(),
                kind: SwapType::Chain,
                timeout_block_height: chain_swap.receiving().timeoutBlockHeight as u64,
                tree: SwapRescue::parse_tree(&chain_swap.receiving().swapTree.clone().unwrap())
                    .unwrap(),
                lockup_address: chain_swap.receiving().lockupAddress.clone(),
                status: chain_swap.swap.status,
                symbol: crate::chain::elements_client::SYMBOL.to_string(),
                key_index: 11,
                preimage_hash: chain_swap.swap.preimageHash,
                server_public_key:
                    "02609b800f905a8bfba6763a5f0d9bdca4192648b006aeeb22598ea0b9004cf6c9".to_string(),
                blinding_key: Some(
                    "fdf74d729d49d917bcc1befdc66922d6bf99af2e1cf49659299340962957916a".to_string()
                ),
                transaction: None,
                created_at: 1735775841,
            }
        );
    }

    #[rstest]
    #[case(Some("txid".to_string()), Some(23), Some(Transaction { id: "txid".to_string(), vout: 23 }))]
    #[case(Some("txid".to_string()), None, None)]
    #[case(None, Some(23), None)]
    fn test_transform_transaction(
        #[case] tx_id: Option<String>,
        #[case] vout: Option<i32>,
        #[case] res: Option<Transaction>,
    ) {
        assert_eq!(SwapRescue::transform_transaction(tx_id, vout), res);
    }

    #[test]
    fn test_derive_our_public_key() {
        assert_eq!(
            SwapRescue::derive_our_public_key(
                &Secp256k1::signing_only(),
                &get_liquid_wallet(),
                "",
                Some(0)
            )
            .unwrap(),
            "0371ce2b829f0de3863be481d9d72fde7a11f780e070be73f35b5ddd4a878327f9"
        );
    }

    #[test]
    fn test_derive_our_public_key_no_key_index() {
        let id = "id";
        assert_eq!(
            SwapRescue::derive_our_public_key(
                &Secp256k1::signing_only(),
                &get_liquid_wallet(),
                id,
                None
            )
            .err()
            .unwrap()
            .to_string(),
            format!("no key index for {}", id)
        );
    }

    #[test]
    fn test_derive_blinding_key() {
        assert_eq!(SwapRescue::derive_blinding_key(
            &get_liquid_wallet(),
            "",
            crate::chain::elements_client::SYMBOL,
            "el1pqt0dzt0mh2gxxvrezmzqexg0n66rkmd5997wn255wmfpqdegd2qyh284rq5v4h2vtj0ey3399k8d8v8qwsphj3qt4cf9zj08h0zqhraf0qcqltm5nfxq",
        ).unwrap().unwrap(), "bd47a0bd2544c3d2e171a31cc769b8c2f7e5670f7cb14c06fe1dbf827b18e3cf");
    }

    #[test]
    fn test_derive_blinding_key_non_liquid() {
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
                Some(key.to_string()),
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
            SwapRescue::lookup_from_keys(&HashMap::new(), None, id)
                .err()
                .unwrap()
                .to_string(),
            format!("no public key for {}", id)
        );
    }

    #[test]
    fn test_lookup_from_keys_no_mapping() {
        let id = "adsf";
        assert_eq!(
            SwapRescue::lookup_from_keys(&HashMap::new(), Some("".to_string()), id)
                .err()
                .unwrap()
                .to_string(),
            format!("no key mapping for {}", id)
        );
    }

    #[test]
    fn test_derive_keys() {
        let xpub = Xpub::from_str("xpub661MyMwAqRbcGXPykvqCkK3sspTv2iwWTYpY9gBewku5Noj96ov1EqnKMDzGN9yPsncpRoUymJ7zpJ7HQiEtEC9Af2n3DmVu36TSV4oaiym").unwrap();
        let keys = SwapRescue::derive_keys(
            &Secp256k1::verification_only(),
            &xpub,
            DERIVATION_PATH,
            0,
            10,
        )
        .unwrap();

        assert_eq!(keys.len(), 10);
        assert_eq!(
            *keys
                .get("025964821780625d20ba1af21a45b203a96dcc5986c75c2d43bdc873d224810b0c")
                .unwrap(),
            0
        );
        assert_eq!(
            *keys
                .get("03f00262509d6c450463b293dedf06ccb472d160325debdb97fae58b05f0863cf0")
                .unwrap(),
            1
        );
    }

    #[test]
    fn test_derive_keys_custom_path() {
        let xpub = Xpub::from_str("xpub661MyMwAqRbcGXPykvqCkK3sspTv2iwWTYpY9gBewku5Noj96ov1EqnKMDzGN9yPsncpRoUymJ7zpJ7HQiEtEC9Af2n3DmVu36TSV4oaiym").unwrap();
        let keys =
            SwapRescue::derive_keys(&Secp256k1::verification_only(), &xpub, "m/45/1/0/0", 0, 10)
                .unwrap();

        assert_eq!(keys.len(), 10);
        assert_eq!(
            *keys
                .get("0331369109fbd305f2fdd1a0babc5a6bc629bed7aa987b4472526c2be520ed3457")
                .unwrap(),
            0
        );
        assert_eq!(
            *keys
                .get("035d6f0b7f7cde3c1db252aec0262721c1858effc2cc806db4eca4d2f2928f1bc0")
                .unwrap(),
            1
        );
    }

    #[test]
    fn test_parse_tree() {
        assert!(SwapRescue::parse_tree("{\"claimLeaf\":{\"version\":192,\"output\":\"82012088a91433ca578b1dde9cb32e4b6a2c05fe74520911b66e8820884ff511cc5061a90f07e553de127095df5d438b2bda23db4159c5f32df5e1f9ac\"},\"refundLeaf\":{\"version\":192,\"output\":\"205bbdfe5d1bf863f65c5271d4cd6621c44048b89e80aa79301fe671d98bed598aad026001b1\"}}").err().is_none());
    }
}

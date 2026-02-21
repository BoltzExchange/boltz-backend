use crate::chain::types::Type;
use crate::currencies::{get_chain_client, get_wallet};
use crate::db::helpers::funding_address::FundingAddressHelper;
use crate::db::models::{ChainSwapInfo, LightningSwap, SomeSwap, Swap};
use crate::{currencies::Currencies, db::models::FundingAddress};
use anyhow::{Context, Result, anyhow};
use bitcoin::OutPoint as BitcoinOutPoint;
use boltz_core::bitcoin::{InputDetail as BitcoinInputDetail, UncooperativeDetails};
use boltz_core::elements::{
    InputDetail as ElementsInputDetail, UncooperativeDetails as ElementsUncooperativeDetails,
};
use boltz_core::utils::{InputType, OutputType};
use boltz_core::wrapper::{
    BitcoinParams, ElementsParams, InputDetail, Params, Transaction, construct_tx,
};
use boltz_core::{Address, Destination, FeeTarget, Musig};
use elements::hex::ToHex;
use elements::{AssetId, OutPoint as ElementsOutPoint};
use std::collections::HashMap;
use std::str::FromStr;
use std::sync::Arc;
use tracing::{error, info};

#[derive(Clone)]
pub struct FundingAddressClaimer {
    funding_address_helper: Arc<dyn FundingAddressHelper + Sync + Send>,
    currencies: Currencies,
}

#[derive(Debug, Clone)]
pub struct SwapInfo {
    pub id: String,
    pub symbol: String,
    pub key_index: u64,
    pub refund_public_key: String,
    pub tree: String,
    pub preimage: String,
    pub funding_address: FundingAddress,
}

impl FundingAddressClaimer {
    pub fn new(
        funding_address_helper: Arc<dyn FundingAddressHelper + Sync + Send>,
        currencies: Currencies,
    ) -> Self {
        Self {
            funding_address_helper,
            currencies,
        }
    }

    fn input_detail(&self, swap: &SwapInfo) -> Result<InputDetail> {
        let chain_type = boltz_core::utils::Chain::from_str(&swap.funding_address.symbol)?;
        let presigned = Transaction::parse(
            &chain_type,
            swap.funding_address
                .presigned_tx
                .as_ref()
                .ok_or_else(|| anyhow!("funding address has no presigned transaction"))?
                .as_slice(),
        )?;

        let secp = bitcoin::secp256k1::Secp256k1::new();

        let wallet = get_wallet(&self.currencies, &swap.funding_address.symbol)?;
        let keys = wallet.derive_keys(swap.key_index)?.to_keypair(&secp);

        let internal_key = Musig::setup(
            Musig::convert_keypair(keys.secret_key().secret_bytes())?,
            vec![
                Musig::convert_pub_key(&keys.public_key().serialize())?,
                Musig::convert_pub_key(alloy::hex::decode(&swap.refund_public_key)?.as_slice())?,
            ],
        )?
        .agg_pk()
        .serialize();

        let preimage = alloy::hex::decode(&swap.preimage)?;
        let input_type = InputType::Claim(
            preimage
                .try_into()
                .map_err(|_| anyhow!("failed to convert preimage to claim input type"))?,
        );

        match presigned {
            Transaction::Bitcoin(tx) => Ok(InputDetail::Bitcoin(Box::new(BitcoinInputDetail {
                input_type,
                output_type: OutputType::Taproot(Some(UncooperativeDetails {
                    tree: serde_json::from_str(swap.tree.as_str())?,
                    internal_key: bitcoin::XOnlyPublicKey::from_slice(&internal_key)?,
                })),
                outpoint: BitcoinOutPoint::new(tx.compute_txid(), 0),
                tx_out: tx.output.first().context("missing bitcoin output")?.clone(),
                keys,
            }))),
            Transaction::Elements(tx) => {
                let tx_out = tx.output.first().context("missing liquid output")?.clone();
                let blinding_key = Some(bitcoin::secp256k1::Keypair::from_seckey_slice(
                    &secp,
                    &wallet.derive_blinding_key(tx_out.script_pubkey.to_bytes())?,
                )?);
                Ok(InputDetail::Elements(Box::new(ElementsInputDetail {
                    input_type,
                    output_type: OutputType::Taproot(Some(ElementsUncooperativeDetails {
                        tree: serde_json::from_str(swap.tree.as_str())?,
                        internal_key: elements::secp256k1_zkp::XOnlyPublicKey::from_slice(
                            &internal_key,
                        )?,
                    })),
                    outpoint: ElementsOutPoint::new(tx.txid(), 0),
                    tx_out,
                    keys,
                    blinding_key,
                })))
            }
        }
    }

    pub async fn get_claim_address(&self, symbol: &str, swaps: &[SwapInfo]) -> Result<Address> {
        let wallet = get_wallet(&self.currencies, symbol)?;
        let label = wallet.label_batch_claim(
            &swaps
                .iter()
                .map(|info| info.id.as_str())
                .collect::<Vec<_>>(),
        );

        let address = wallet.get_address(None, &label).await?;
        Address::try_from(address.as_str())
    }

    pub async fn claim_batch(
        &self,
        swaps: &[SwapInfo],
        fees_per_swap: &mut HashMap<String, u64>,
        txids: &mut Vec<String>,
    ) -> Result<()> {
        // Return early with empty results if swaps are empty
        let symbol = match swaps.first() {
            Some(swap) => swap.symbol.as_str(),
            None => return Ok(()),
        };

        let chain = get_chain_client(&self.currencies, symbol)?;
        match chain.chain_type() {
            Type::Elements => {
                // Broadcast all presigned transactions first
                for swap in swaps {
                    let (txid, presigned_fee) =
                        self.broadcast_presigned_tx(&swap.funding_address).await?;
                    fees_per_swap.insert(swap.id.clone(), presigned_fee);
                    txids.push(txid);
                }

                let genesis_hash = chain.network().liquid_genesis_hash()?;
                let fee_rate = chain.estimate_fee().await?;

                let elements_inputs: Vec<ElementsInputDetail> = swaps
                    .iter()
                    .map(|swap| {
                        let elements_input: ElementsInputDetail =
                            self.input_detail(swap)?.try_into()?;
                        Ok(elements_input)
                    })
                    .collect::<Result<Vec<ElementsInputDetail>>>()?;
                let inputs_refs: Vec<&ElementsInputDetail> = elements_inputs.iter().collect();
                let address = self.get_claim_address(symbol, swaps).await?;

                let (tx, claim_fee) = construct_tx(&Params::Elements(ElementsParams {
                    genesis_hash,
                    inputs: &inputs_refs,
                    destination: &Destination::Single(&address.try_into()?),
                    fee: FeeTarget::Relative(fee_rate),
                }))?;

                // Distribute the claim transaction fee evenly across swaps
                let claim_fee_per_swap = (claim_fee as f64 / swaps.len() as f64).ceil() as u64;
                for swap in swaps {
                    *fees_per_swap.entry(swap.id.clone()).or_insert(0) += claim_fee_per_swap;
                }

                let claim_txid = chain.send_raw_transaction(&tx.serialize().to_hex()).await?;
                txids.push(claim_txid);
            }
            Type::Bitcoin => {
                let fee_rate = chain.estimate_fee().await?;

                for swap in swaps {
                    let address = self
                        .get_claim_address(symbol, std::slice::from_ref(swap))
                        .await?;

                    let presigned_bytes = swap
                        .funding_address
                        .presigned_tx
                        .as_ref()
                        .ok_or_else(|| anyhow!("missing presigned tx"))?;
                    let presigned_tx: bitcoin::Transaction =
                        bitcoin::consensus::deserialize(presigned_bytes)?;
                    let presigned_vsize = presigned_tx.vsize() as u64;

                    let mut params = BitcoinParams {
                        inputs: &[&self.input_detail(swap)?.try_into()?],
                        destination: &Destination::Single(&address.clone().try_into()?),
                        fee: FeeTarget::Absolute(0),
                    };
                    let (tx, _) = construct_tx(&Params::Bitcoin(params.clone()))?;

                    let claim_vsize = tx.vsize();
                    let total_vsize = presigned_vsize + claim_vsize;
                    let package_fee = ((total_vsize as f64) * fee_rate).ceil() as u64;

                    params.fee = FeeTarget::Absolute(package_fee);
                    let (tx, _) = construct_tx(&Params::Bitcoin(params))?;
                    fees_per_swap.insert(swap.id.clone(), package_fee);
                    let presigned_hex = presigned_bytes.to_hex();
                    let tx_hex = tx.serialize().to_hex();

                    let response = chain.submit_package(&[&presigned_hex, &tx_hex]).await?;
                    if response.package_msg != "success" {
                        error!(
                            "Failed to submit package for claiming swap {}: {} - tx_results: {:?}",
                            swap.id, response.package_msg, response.tx_results
                        );
                        return Err(anyhow!(
                            "failed to submit package: {}",
                            response.package_msg
                        ));
                    }

                    txids.extend(response.tx_results.keys().cloned());
                }
            }
        }

        Ok(())
    }

    // Broadcasts the presigned transaction of a funding address to the chain.
    // Should only be used for liquid swaps - bitcoin swaps use zero-fee transactions which have
    // to be broadcast as a package with a fee-paying child.
    pub async fn broadcast_presigned_tx(
        &self,
        funding_address: &FundingAddress,
    ) -> Result<(String, u64)> {
        let chain = get_chain_client(&self.currencies, funding_address.symbol.as_str())?;
        if funding_address.symbol_type()? != Type::Elements {
            return Err(anyhow!(
                "broadcast_presigned_tx can only be used for liquid swaps"
            ));
        }
        let presigned_bytes = funding_address
            .presigned_tx
            .as_ref()
            .ok_or(anyhow!("missing presigned tx"))?;
        let tx: elements::Transaction = elements::encode::deserialize(presigned_bytes)?;
        let tx_id = chain
            .send_raw_transaction(presigned_bytes.to_hex().as_str())
            .await?;
        info!(
            "Broadcast presigned transaction for funding address {}: {}",
            funding_address.id, tx_id
        );
        let currency = self
            .currencies
            .get(funding_address.symbol.as_str())
            .ok_or_else(|| anyhow!("currency not found: {}", funding_address.symbol))?;
        Ok((
            tx_id,
            tx.fee_in(AssetId::from_str(currency.network.liquid_asset_id()?)?),
        ))
    }

    pub async fn prepare_claimable_swaps(
        &self,
        swaps: Vec<Swap>,
        chain_swaps: Vec<ChainSwapInfo>,
    ) -> Result<Vec<SwapInfo>> {
        let mut swap_infos: Vec<SwapInfo> = Vec::new();
        for swap in swaps {
            let funding_address = self.funding_address_helper.get_by_swap_id(&swap.id)?;

            if let Some(funding_address) = funding_address {
                swap_infos.push(SwapInfo {
                    id: swap.id.clone(),
                    symbol: swap.chain_symbol()?,
                    key_index: swap.keyIndex.ok_or(anyhow!("key index not found"))? as u64,
                    refund_public_key: swap
                        .refundPublicKey
                        .ok_or(anyhow!("refund public key not found"))?,
                    tree: swap
                        .redeemScript
                        .ok_or(anyhow!("redeem script not found"))?,
                    preimage: swap.preimage.ok_or(anyhow!("preimage not found"))?,
                    funding_address,
                });
            }
        }
        for chain_swap in chain_swaps {
            let funding_address = self
                .funding_address_helper
                .get_by_swap_id(&chain_swap.swap.id)?;
            if let Some(funding_address) = funding_address {
                swap_infos.push(SwapInfo {
                    id: chain_swap.id(),
                    symbol: chain_swap.claim_symbol()?,
                    key_index: chain_swap
                        .receiving()
                        .keyIndex
                        .ok_or(anyhow!("key index not found"))?
                        as u64,
                    refund_public_key: chain_swap
                        .receiving()
                        .theirPublicKey
                        .clone()
                        .ok_or(anyhow!("their public key not found"))?,
                    tree: chain_swap
                        .receiving()
                        .swapTree
                        .clone()
                        .ok_or(anyhow!("redeem script not found"))?,
                    preimage: chain_swap
                        .swap
                        .preimage
                        .ok_or(anyhow!("preimage not found"))?,
                    funding_address,
                });
            }
        }
        Ok(swap_infos)
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use crate::db::helpers::chain_swap::test::MockChainSwapHelper;
    use crate::db::helpers::funding_address::test::MockFundingAddressHelper;
    use crate::db::helpers::swap::test::MockSwapHelper;
    use crate::service::funding_address_test_utils::test::{
        compute_preimage_hash, compute_swap_lockup_address, create_presigned_tx, create_signer,
        create_swap_tree_json, encode_funding_address, fund_address, get_keypair,
        test_funding_address, test_funding_address_for_symbol, test_swap,
    };
    use crate::service::test::get_test_currencies;
    use boltz_core::Musig;
    use boltz_core::utils::Chain;
    use rstest::rstest;
    use serial_test::serial;

    fn create_claimer(
        funding_address_helper: MockFundingAddressHelper,
        currencies: Currencies,
    ) -> FundingAddressClaimer {
        FundingAddressClaimer::new(Arc::new(funding_address_helper), currencies)
    }

    fn create_claimer_with_mock(currencies: Currencies) -> FundingAddressClaimer {
        let mock = MockFundingAddressHelper::new();
        create_claimer(mock, currencies)
    }

    #[tokio::test]
    async fn test_claim_batch_empty_swaps() {
        let currencies = get_test_currencies().await;
        let claimer = create_claimer_with_mock(currencies);
        let mut swap_fees = HashMap::new();
        let mut txids = Vec::new();

        let result = claimer.claim_batch(&[], &mut swap_fees, &mut txids).await;
        assert!(result.is_ok());
        assert!(txids.is_empty());
        assert!(swap_fees.is_empty());
    }

    #[tokio::test]
    async fn test_prepare_claimable_swaps_skips_unlinked() {
        let currencies = get_test_currencies().await;
        let mut mock = MockFundingAddressHelper::new();
        mock.expect_get_by_swap_id().returning(|_| Ok(None));
        let claimer = create_claimer(mock, currencies);

        let swaps = vec![test_swap("bcrt1qtest")];
        let result = claimer.prepare_claimable_swaps(swaps, vec![]).await;

        assert!(result.is_ok());
        assert!(result.unwrap().is_empty());
    }

    #[tokio::test]
    async fn test_prepare_claimable_swaps_missing_presigned_tx() {
        let currencies = get_test_currencies().await;
        let claimer = create_claimer_with_mock(currencies);

        let client_keypair = get_keypair();
        let funding_address = test_funding_address(
            "test_missing_presigned",
            &client_keypair.public_key().serialize(),
        );

        let swap_info = SwapInfo {
            id: "test".to_string(),
            symbol: "BTC".to_string(),
            key_index: 10,
            refund_public_key: alloy::hex::encode(client_keypair.public_key().serialize()),
            preimage: "0000000000000000000000000000000000000000000000000000000000000001"
                .to_string(),
            funding_address,
            tree: "".to_string(),
        };

        let result = claimer.input_detail(&swap_info);
        assert!(result.is_err());
        assert!(
            result
                .unwrap_err()
                .to_string()
                .contains("funding address has no presigned transaction")
        );
    }

    #[rstest]
    #[case::elements("L-BTC", Chain::Elements, "test_batch_claim_lbtc")]
    #[case::bitcoin("BTC", Chain::Bitcoin, "test_batch_claim_btc")]
    #[tokio::test]
    #[serial]
    async fn test_batch_claim(
        #[case] symbol: &str,
        #[case] chain_type: Chain,
        #[case] funding_address_id: &str,
    ) {
        let currencies = get_test_currencies().await;
        let currency = currencies.get(symbol).expect("currency not found");
        let chain_client = currency.chain.as_ref().expect("chain client not found");
        let wallet = currency.wallet.as_ref().expect("wallet not found");

        let client_keypair = get_keypair();
        let server_keypair = wallet
            .derive_keys(10)
            .unwrap()
            .to_keypair(&bitcoin::secp256k1::Secp256k1::new());

        let mut funding_address = test_funding_address_for_symbol(
            funding_address_id,
            symbol,
            &client_keypair.public_key().serialize(),
            100000,
        );

        let script_pubkey = funding_address.script_pubkey(&server_keypair).unwrap();
        let funding_address_str = encode_funding_address(symbol, script_pubkey.clone());
        let (tx_id, vout, amount) =
            fund_address(chain_client, symbol, &funding_address_str, &script_pubkey).await;

        funding_address.lockup_transaction_id = Some(tx_id);
        funding_address.lockup_transaction_vout = Some(vout);
        funding_address.lockup_amount = Some(amount);

        let preimage = "0000000000000000000000000000000000000000000000000000000000000001";
        let preimage_bytes: [u8; 32] = alloy::hex::decode(preimage).unwrap().try_into().unwrap();
        let preimage_hash = compute_preimage_hash(&preimage_bytes);
        let claim_pubkey = server_keypair.x_only_public_key().0;
        let refund_pubkey = client_keypair.x_only_public_key().0;
        let swap_tree_json = create_swap_tree_json(
            chain_type,
            &preimage_hash,
            &claim_pubkey,
            &refund_pubkey,
            100000,
        );

        let internal_key = Musig::setup(
            Musig::convert_keypair(server_keypair.secret_key().secret_bytes()).unwrap(),
            vec![
                Musig::convert_pub_key(&server_keypair.public_key().serialize()).unwrap(),
                Musig::convert_pub_key(&client_keypair.public_key().serialize()).unwrap(),
            ],
        )
        .unwrap()
        .agg_pk();
        let internal_key_xonly =
            bitcoin::XOnlyPublicKey::from_slice(&internal_key.serialize()).unwrap();

        let swap_lockup_address =
            compute_swap_lockup_address(chain_type, &swap_tree_json, &internal_key_xonly);

        let mut swap_helper = MockSwapHelper::new();
        let lockup_addr = swap_lockup_address.clone();
        swap_helper
            .expect_get_by_id()
            .returning(move |_| Ok(test_swap(&lockup_addr)));

        let mut chain_swap_helper = MockChainSwapHelper::new();
        chain_swap_helper
            .expect_get_by_id()
            .returning(|_| Err(anyhow!("not found")));

        let signer = create_signer(swap_helper, chain_swap_helper, currencies.clone(), None);

        let presigned_tx = create_presigned_tx(
            &signer,
            &mut funding_address,
            &server_keypair,
            &client_keypair,
            "test_swap_claim",
        )
        .await;
        funding_address.presigned_tx = Some(presigned_tx);

        let swap_info = SwapInfo {
            id: "test_swap_claim".to_string(),
            symbol: symbol.to_string(),
            key_index: 10,
            refund_public_key: alloy::hex::encode(client_keypair.public_key().serialize()),
            tree: swap_tree_json,
            preimage: preimage.to_string(),
            funding_address: funding_address.clone(),
        };

        let claimer = create_claimer_with_mock(currencies);
        let mut swap_fees = HashMap::new();
        let mut txids = Vec::new();
        let result = claimer
            .claim_batch(&[swap_info], &mut swap_fees, &mut txids)
            .await;
        assert!(
            result.is_ok(),
            "{} batch_claim failed: {:?}",
            symbol,
            result.err()
        );

        assert!(!txids.is_empty());
        assert!(!swap_fees.is_empty(), "Expected non-empty swap fees");
        let swap_fee = swap_fees
            .get("test_swap_claim")
            .copied()
            .expect("Expected fee for test_swap_claim");
        assert!(swap_fee > 0, "Expected non-zero fee for test_swap_claim");
        assert_eq!(
            txids.len(),
            2,
            "Expected presigned + claim txids for Liquid"
        );
    }
}

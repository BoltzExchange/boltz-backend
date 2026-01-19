use crate::chain::Client;
use crate::db::helpers::funding_address::FundingAddressHelper;
use crate::db::models::{ChainSwapInfo, Swap};
use crate::wallet::Wallet;
use crate::{currencies::Currencies, db::models::FundingAddress};
use anyhow::{Result, anyhow};
use bitcoin::OutPoint as BitcoinOutPoint;
use boltz_core::bitcoin::{InputDetail as BitcoinInputDetail, UncooperativeDetails};
use boltz_core::elements::{
    InputDetail as ElementsInputDetail, UncooperativeDetails as ElementsUncooperativeDetails,
};
use boltz_core::utils::{InputType, OutputType, Type};
use boltz_core::wrapper::{
    BitcoinParams, ElementsParams, InputDetail, Params, Transaction, construct_tx,
};
use boltz_core::{Address, Destination, FeeTarget, Musig};
use elements::OutPoint as ElementsOutPoint;
use elements::hex::ToHex;
use std::str::FromStr;
use std::sync::Arc;
use tracing::{error, info};

pub struct FundingAddressClaimer {
    funding_address_helper: Arc<dyn FundingAddressHelper + Sync + Send>,
    currencies: Currencies,
}

struct SwapInfo {
    id: String,
    key_index: u64,
    refund_public_key: String,
    tree: String,
    preimage: String,
    funding_address: FundingAddress,
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

    fn wallet(&self, symbol: &str) -> Result<Arc<dyn Wallet + Send + Sync>> {
        self.currencies
            .get(symbol)
            .ok_or_else(|| anyhow!("currency not found: {}", symbol))?
            .wallet
            .clone()
            .ok_or_else(|| anyhow!("no wallet for currency: {}", symbol))
    }

    fn chain(&self, symbol: &str) -> Result<Arc<dyn Client + Send + Sync>> {
        self.currencies
            .get(symbol)
            .as_ref()
            .ok_or_else(|| anyhow!("currency not found: {}", symbol))?
            .chain
            .clone()
            .ok_or_else(|| anyhow!("no chain client for currency: {}", symbol))
    }

    fn input_detail(&self, swap: &SwapInfo) -> Result<InputDetail> {
        let chain_type = Type::from_str(&swap.funding_address.symbol)?;
        let presigned = Transaction::parse(
            &chain_type,
            &swap
                .funding_address
                .presigned_tx
                .as_ref()
                .ok_or_else(|| anyhow!("funding address has no presigned transaction"))?
                .as_slice(),
        )?;

        let secp = bitcoin::secp256k1::Secp256k1::new();

        let wallet = self.wallet(&swap.funding_address.symbol)?;
        let keys = wallet.derive_keys(swap.key_index)?.to_keypair(&secp);

        let internal_key = Musig::setup(
            Musig::convert_keypair(keys.secret_key().secret_bytes())?,
            vec![
                Musig::convert_pub_key(&keys.public_key().serialize())?,
                Musig::convert_pub_key(&alloy::hex::decode(&swap.refund_public_key)?.as_slice())?,
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
                tx_out: tx.output[0].clone(),
                keys,
            }))),
            Transaction::Elements(tx) => Ok(InputDetail::Elements(Box::new(ElementsInputDetail {
                input_type,
                output_type: OutputType::Taproot(Some(ElementsUncooperativeDetails {
                    tree: serde_json::from_str(swap.tree.as_str())?,
                    internal_key: elements::secp256k1_zkp::XOnlyPublicKey::from_slice(
                        &internal_key,
                    )?,
                })),
                outpoint: ElementsOutPoint::new(tx.txid(), 0),
                tx_out: tx.output[0].clone(),
                keys,
                blinding_key: Some(bitcoin::secp256k1::Keypair::from_seckey_slice(
                    &secp,
                    &wallet.derive_blinding_key(vec![0; 32])?,
                )?),
            }))),
        }
    }

    pub async fn batch_claim(&self, symbol: &str, swaps: &[SwapInfo]) -> Result<()> {
        let wallet = self.wallet(symbol)?;
        let label = wallet.label_batch_claim(
            &swaps
                .iter()
                .map(|info| info.id.as_str())
                .collect::<Vec<_>>(),
        );

        let address = wallet.get_address(None, &label).await?;
        let address = Address::try_from(address.as_str())?;

        match symbol {
            "L-BTC" => {
                for swap in swaps {
                    self.broadcast_presigned_tx(&swap.funding_address).await?;
                }

                let client = self.chain(symbol)?;
                let genesis_hash = client.network().liquid_genesis_hash()?;

                let elements_inputs: Vec<ElementsInputDetail> = swaps
                    .iter()
                    .map(|swap| {
                        let elements_input: ElementsInputDetail =
                            self.input_detail(swap)?.try_into()?;
                        Ok(elements_input)
                    })
                    .collect::<Result<Vec<ElementsInputDetail>>>()?;
                let inputs_refs: Vec<&ElementsInputDetail> = elements_inputs.iter().collect();
                let _tx = construct_tx(&Params::Elements(ElementsParams {
                    genesis_hash,
                    inputs: &inputs_refs,
                    destination: &Destination::Single(&address.try_into()?),
                    fee: FeeTarget::Absolute(0),
                }))?;
                Ok(())
            }
            "BTC" => {
                for swap in swaps {
                    let chain = self.chain(swap.funding_address.symbol.as_str())?;
                    let fee_rate = chain.estimate_fee().await?;
                    let tx = construct_tx(&Params::Bitcoin(BitcoinParams {
                        inputs: &[&self.input_detail(swap)?.try_into()?],
                        destination: &Destination::Single(&address.clone().try_into()?),
                        fee: FeeTarget::Relative(fee_rate),
                    }))?;
                    let presigned = swap.funding_address.presigned_tx_hex()?;
                    let tx_hex = tx.0.serialize().to_hex();

                    let response = chain.submit_package(&[&presigned, &tx_hex]).await?;
                    if response.package_msg != "success" {
                        return Err(anyhow!(
                            "failed to submit package: {}",
                            response.package_msg
                        ));
                    }
                }
                Ok(())
            }
            _ => {
                return Err(anyhow!("unknown symbol: {}", symbol));
            }
        }
    }

    /// Broadcasts the presigned transaction of a funding address to the chain.
    /// Returns the transaction ID if successful.
    pub async fn broadcast_presigned_tx(&self, funding_address: &FundingAddress) -> Result<String> {
        let chain = self.chain(funding_address.symbol.as_str())?;
        let tx_id = chain
            .send_raw_transaction(&funding_address.presigned_tx_hex()?)
            .await?;
        info!(
            "Broadcast presigned transaction for funding address {}: {}",
            funding_address.id, tx_id
        );
        Ok(tx_id)
    }

    pub async fn funding_claimable_swaps(
        &self,
        swaps: Vec<Swap>,
        chain_swaps: Vec<ChainSwapInfo>,
    ) -> Result<Vec<SwapInfo>> {
        let mut swap_infos: Vec<SwapInfo> = Vec::new();
        for swap in swaps {
            let funding_address = self
                .funding_address_helper
                .get_by_swap_id(&swap.id)?
                .ok_or(anyhow!("swap not linked to a funding address: {}", swap.id))?;
            swap_infos.push(SwapInfo {
                id: swap.id.clone(),
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
        for chain_swap in chain_swaps {
            let funding_address = self
                .funding_address_helper
                .get_by_swap_id(&chain_swap.swap.id)?
                .ok_or(anyhow!(
                    "chain swap not linked to a funding address: {}",
                    chain_swap.swap.id
                ))?;
            swap_infos.push(SwapInfo {
                id: chain_swap.swap.id.clone(),
                key_index: chain_swap
                    .receiving()
                    .keyIndex
                    .ok_or(anyhow!("key index not found"))? as u64,
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
        Ok(swap_infos)
    }

    pub async fn sweep_swaps(&self, symbol: &str, swaps: Vec<SwapInfo>) -> Result<Vec<String>> {
        let mut claimed = Vec::new();
        let chunk_size = match symbol {
            "BTC" => 1,
            _ => 10,
        };
        for chunk in swaps.chunks(chunk_size) {
            match self.batch_claim(symbol, chunk).await {
                Ok(()) => claimed.extend(chunk.iter().map(|swap| swap.id.clone())),
                Err(e) => {
                    error!("failed to batch claim swaps: {}", e);
                }
            }
        }

        Ok(claimed)
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use crate::currencies::Currency;
    use crate::db::helpers::chain_swap::test::MockChainSwapHelper;
    use crate::db::helpers::funding_address::test::MockFundingAddressHelper;
    use crate::db::helpers::swap::test::MockSwapHelper;
    use crate::service::test::get_test_currencies;
    use std::collections::HashMap;
    use std::sync::Arc;

    async fn get_test_currencies_with_chain() -> Currencies {
        let currencies = get_test_currencies().await;

        // Add chain clients for BTC and L-BTC
        let btc_chain = Some(
            Arc::new(crate::chain::chain_client::test::get_client().await)
                as Arc<dyn Client + Send + Sync>,
        );

        let lbtc_chain = Some(
            Arc::new(crate::chain::elements_client::test::get_client().0)
                as Arc<dyn Client + Send + Sync>,
        );

        // Update currencies with chain clients
        let mut updated = HashMap::new();
        if let Some(btc) = currencies.get("BTC") {
            updated.insert(
                "BTC".to_string(),
                Currency {
                    network: btc.network,
                    wallet: btc.wallet.clone(),
                    chain: btc_chain,
                    cln: btc.cln.clone(),
                    lnd: btc.lnd.clone(),
                    evm_manager: btc.evm_manager.clone(),
                },
            );
        }
        if let Some(lbtc) = currencies.get("L-BTC") {
            updated.insert(
                "L-BTC".to_string(),
                Currency {
                    network: lbtc.network,
                    wallet: lbtc.wallet.clone(),
                    chain: lbtc_chain,
                    cln: lbtc.cln.clone(),
                    lnd: lbtc.lnd.clone(),
                    evm_manager: lbtc.evm_manager.clone(),
                },
            );
        }
        Arc::new(updated)
    }

    fn create_claimer(
        funding_address_helper: MockFundingAddressHelper,
        currencies: Option<Currencies>,
    ) -> FundingAddressClaimer {
        FundingAddressClaimer::new(
            Arc::new(funding_address_helper),
            currencies.unwrap_or_default(),
        )
    }
}

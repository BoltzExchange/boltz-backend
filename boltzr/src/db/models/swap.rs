use crate::chain::utils::Outpoint;
use crate::chain::{Client, elements_client::SYMBOL as ELEMENTS_SYMBOL};
use crate::db::models::{LightningSwap, SomeSwap, SwapType, SwapVersion, aggregate_musig_key};
use crate::swap::SwapUpdate;
use crate::utils::pair::{OrderSide, split_pair};
use crate::wallet::Wallet;
use anyhow::{Context, Result};
use async_trait::async_trait;
use boltz_core::utils::{InputType, OutputType};
use boltz_core::wrapper::{BitcoinInputDetail, ElementsInputDetail, InputDetail};
use diesel::{AsChangeset, Insertable, Queryable, Selectable};
use elements::hex::FromHex;
use std::sync::Arc;

#[derive(Queryable, Selectable, Insertable, AsChangeset, PartialEq, Default, Clone, Debug)]
#[diesel(table_name = crate::db::schema::swaps)]
#[allow(non_snake_case)]
pub struct Swap {
    pub id: String,
    pub version: i32,
    pub referral: Option<String>,
    pub pair: String,
    pub orderSide: i32,
    pub status: String,
    pub failureReason: Option<String>,
    pub preimage: Option<String>,
    pub preimageHash: String,
    pub invoice: Option<String>,
    pub keyIndex: Option<i32>,
    pub refundPublicKey: Option<String>,
    pub timeoutBlockHeight: i32,
    pub redeemScript: Option<String>,
    pub lockupAddress: String,
    pub lockupTransactionId: Option<String>,
    pub lockupTransactionVout: Option<i32>,
    pub createdAt: chrono::NaiveDateTime,
    pub onchainAmount: Option<i64>,
}

#[async_trait]
impl SomeSwap for Swap {
    fn kind(&self) -> SwapType {
        SwapType::Submarine
    }

    fn id(&self) -> String {
        self.id.clone()
    }

    fn status(&self) -> SwapUpdate {
        SwapUpdate::parse(self.status.as_str())
    }

    fn sending_outpoint(&self) -> Result<Option<Outpoint>> {
        Ok(None)
    }

    fn claim_symbol(&self) -> Result<String> {
        self.chain_symbol()
    }

    async fn claim_details(
        &self,
        wallet: &Arc<dyn Wallet + Send + Sync>,
        client: &Arc<dyn Client + Send + Sync>,
    ) -> Result<InputDetail> {
        let keys = wallet.derive_keys(self.keyIndex.context("key index not found")? as u64)?;
        let input_type = InputType::Claim(
            alloy::hex::decode(self.preimage.as_ref().context("preimage not found")?)?
                .as_slice()
                .try_into()?,
        );

        if self.chain_symbol()? != ELEMENTS_SYMBOL {
            let keys = keys.to_keypair(&bitcoin::secp256k1::Secp256k1::new());

            let output_type = match SwapVersion::try_from(self.version)? {
                SwapVersion::Legacy => {
                    OutputType::Compatibility(bitcoin::ScriptBuf::from_bytes(alloy::hex::decode(
                        self.redeemScript
                            .clone()
                            .context("redeem script not found")?,
                    )?))
                }
                SwapVersion::Taproot => {
                    OutputType::Taproot(Some(boltz_core::bitcoin::UncooperativeDetails {
                        tree: serde_json::from_str(
                            &self.redeemScript.clone().context("swap tree not found")?,
                        )?,
                        internal_key: bitcoin::XOnlyPublicKey::from_slice(&aggregate_musig_key!(
                            keys,
                            self.refundPublicKey
                                .clone()
                                .context("refund public key not found")?
                        ))?,
                    }))
                }
            };

            Ok(InputDetail::Bitcoin(Box::new(BitcoinInputDetail {
                keys,
                output_type,
                input_type,
                outpoint: bitcoin::OutPoint::new(
                    self.lockupTransactionId
                        .clone()
                        .context("lockup transaction id not found")?
                        .parse()?,
                    self.lockupTransactionVout
                        .context("lockup transaction vout not found")? as u32,
                ),
                tx_out: bitcoin::TxOut {
                    script_pubkey: wallet.decode_address(&self.lockupAddress)?.into(),
                    value: bitcoin::Amount::from_sat(
                        self.onchainAmount.context("onchain amount not found")? as u64,
                    ),
                },
            })))
        } else {
            let secp = elements::secp256k1_zkp::Secp256k1::new();
            let keys = elements::secp256k1_zkp::Keypair::from_seckey_slice(
                &secp,
                &keys.to_priv().to_bytes(),
            )?;

            let tx_id = self
                .lockupTransactionId
                .clone()
                .context("lockup transaction id not found")?;
            let tx_vout = self
                .lockupTransactionVout
                .context("lockup transaction vout not found")? as u32;

            let lockup_tx: elements::Transaction = elements::encode::deserialize(
                &alloy::hex::decode(&client.raw_transaction(&tx_id).await?)?,
            )?;

            let output_type = match SwapVersion::try_from(self.version)? {
                SwapVersion::Legacy => OutputType::SegwitV0(
                    elements::Script::from_hex(
                        &self
                            .redeemScript
                            .clone()
                            .context("redeem script not found")?,
                    )
                    .map_err(|e| anyhow::anyhow!("failed to parse redeem script: {}", e))?,
                ),
                SwapVersion::Taproot => {
                    OutputType::Taproot(Some(boltz_core::elements::UncooperativeDetails {
                        tree: serde_json::from_str(
                            &self.redeemScript.clone().context("swap tree not found")?,
                        )?,
                        internal_key: elements::secp256k1_zkp::XOnlyPublicKey::from_slice(
                            &aggregate_musig_key!(
                                keys,
                                self.refundPublicKey
                                    .clone()
                                    .context("refund public key not found")?
                            ),
                        )?,
                    }))
                }
            };

            Ok(InputDetail::Elements(Box::new(ElementsInputDetail {
                keys,
                output_type,
                input_type,
                outpoint: elements::OutPoint::new(tx_id.parse()?, tx_vout),
                blinding_key: Some(elements::secp256k1_zkp::Keypair::from_seckey_slice(
                    &secp,
                    &wallet.derive_blinding_key(&self.lockupAddress)?,
                )?),
                tx_out: lockup_tx
                    .output
                    .get(tx_vout as usize)
                    .context("output not found")?
                    .clone(),
            })))
        }
    }

    fn refund_symbol(&self) -> Result<String> {
        self.lightning_symbol()
    }

    async fn refund_details(
        &self,
        _: &Arc<dyn Wallet + Send + Sync>,
        _: &Arc<dyn Client + Send + Sync>,
    ) -> Result<InputDetail> {
        Err(anyhow::anyhow!(
            "submarine swaps cannot be refunded onchain"
        ))
    }
}

impl LightningSwap for Swap {
    fn chain_symbol(&self) -> Result<String> {
        let pair = split_pair(&self.pair)?;
        Ok(if self.orderSide == OrderSide::Buy as i32 {
            pair.quote
        } else {
            pair.base
        })
    }

    fn lightning_symbol(&self) -> Result<String> {
        let pair = split_pair(&self.pair)?;
        Ok(if self.orderSide == OrderSide::Buy as i32 {
            pair.base
        } else {
            pair.quote
        })
    }
}

#[cfg(test)]
mod test {
    use crate::db::models::{LightningSwap, SomeSwap, Swap, SwapType};
    use crate::swap::SwapUpdate;
    use crate::utils::pair::OrderSide;
    use rstest::*;

    #[test]
    fn test_kind() {
        assert_eq!(create_swap(None).kind(), SwapType::Submarine);
    }

    #[test]
    fn test_id() {
        let swap = create_swap(None);
        assert_eq!(swap.id(), swap.id);
    }

    #[test]
    fn test_status() {
        let swap = create_swap(None);
        assert_eq!(swap.status(), SwapUpdate::parse(swap.status.as_str()))
    }

    #[rstest]
    #[case(OrderSide::Buy, "BTC")]
    #[case(OrderSide::Sell, "L-BTC")]
    fn test_chain_symbol(#[case] side: OrderSide, #[case] expected: &str) {
        let swap = create_swap(Some(side));
        assert_eq!(swap.chain_symbol().unwrap(), expected);
    }

    #[rstest]
    #[case(OrderSide::Buy, "L-BTC")]
    #[case(OrderSide::Sell, "BTC")]
    fn test_lightning_symbol(#[case] side: OrderSide, #[case] expected: &str) {
        let swap = create_swap(Some(side));
        assert_eq!(swap.lightning_symbol().unwrap(), expected);
    }

    fn create_swap(order_side: Option<OrderSide>) -> Swap {
        Swap {
            id: "swap id".to_string(),
            pair: "L-BTC/BTC".to_string(),
            status: "transaction.mempool".to_string(),
            orderSide: order_side.unwrap_or(OrderSide::Buy) as i32,
            ..Default::default()
        }
    }
}

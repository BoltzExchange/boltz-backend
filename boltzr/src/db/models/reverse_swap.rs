use crate::chain::{Client, elements_client::SYMBOL as ELEMENTS_SYMBOL};
use crate::db::models::{LightningSwap, SomeSwap, SwapType, SwapVersion};
use crate::swap::SwapUpdate;
use crate::utils::pair::{OrderSide, split_pair};
use crate::wallet::Wallet;
use anyhow::{Context, Result};
use async_trait::async_trait;
use boltz_core::Musig;
use boltz_core::utils::{InputType, OutputType};
use boltz_core::wrapper::{BitcoinInputDetail, ElementsInputDetail, InputDetail};
use diesel::{AsChangeset, Associations, Identifiable, Insertable, Queryable, Selectable};
use elements::hex::FromHex;
use std::sync::Arc;

#[derive(
    Queryable, Identifiable, Selectable, Insertable, AsChangeset, PartialEq, Default, Clone, Debug,
)]
#[diesel(table_name = crate::db::schema::reverseSwaps)]
#[allow(non_snake_case)]
pub struct ReverseSwap {
    pub id: String,
    pub version: i32,
    pub pair: String,
    pub orderSide: i32,
    pub status: String,
    pub preimageHash: String,
    pub transactionId: Option<String>,
    pub transactionVout: Option<i32>,
    pub claimPublicKey: Option<String>,
    pub keyIndex: Option<i32>,
    pub lockupAddress: String,
    pub timeoutBlockHeight: i32,
    pub redeemScript: Option<String>,
    pub createdAt: chrono::NaiveDateTime,
    pub onchainAmount: i64,
}

#[derive(Queryable, Selectable, Identifiable, Associations, Debug, PartialEq, Clone)]
#[diesel(primary_key(swapId))]
#[diesel(belongs_to(ReverseSwap, foreign_key = swapId))]
#[diesel(table_name = crate::db::schema::reverseRoutingHints)]
#[allow(non_snake_case)]
pub struct ReverseRoutingHint {
    pub swapId: String,
    pub symbol: String,
    pub scriptPubkey: Vec<u8>,
    pub blindingPubkey: Option<Vec<u8>>,
    pub params: Option<String>,
    pub signature: Vec<u8>,
}

#[async_trait]
impl SomeSwap for ReverseSwap {
    fn kind(&self) -> SwapType {
        SwapType::Reverse
    }

    fn id(&self) -> String {
        self.id.clone()
    }

    fn status(&self) -> SwapUpdate {
        SwapUpdate::parse(self.status.as_str())
    }

    fn refund_symbol(&self) -> Result<String> {
        self.chain_symbol()
    }

    async fn refund_details(
        &self,
        wallet: &Arc<dyn Wallet + Send + Sync>,
        client: &Arc<dyn Client + Send + Sync>,
    ) -> Result<InputDetail> {
        let keys = wallet.derive_keys(self.keyIndex.context("key index not found")? as u64)?;
        let input_type = InputType::Refund(self.timeoutBlockHeight as u32);

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
                    let secp = Musig::new_secp();

                    OutputType::Taproot(Some(boltz_core::bitcoin::UncooperativeDetails {
                        tree: serde_json::from_str(
                            &self.redeemScript.clone().context("swap tree not found")?,
                        )?,
                        internal_key: bitcoin::XOnlyPublicKey::from_slice(
                            &Musig::new(
                                &secp,
                                Musig::convert_keypair(&secp, keys.secret_key().secret_bytes())?,
                                vec![
                                    Musig::convert_pub_key(&keys.public_key().serialize())?,
                                    Musig::convert_pub_key(&alloy::hex::decode(
                                        self.claimPublicKey
                                            .clone()
                                            .context("refund public key not found")?,
                                    )?)?,
                                ],
                                [0; 32],
                            )?
                            .agg_pk()
                            .serialize(),
                        )?,
                    }))
                }
            };

            Ok(InputDetail::Bitcoin(Box::new(BitcoinInputDetail {
                keys,
                output_type,
                input_type,
                outpoint: bitcoin::OutPoint::new(
                    self.transactionId
                        .clone()
                        .context("lockup transaction id not found")?
                        .parse()?,
                    self.transactionVout
                        .context("lockup transaction vout not found")? as u32,
                ),
                tx_out: bitcoin::TxOut {
                    script_pubkey: wallet.decode_address(&self.lockupAddress)?.into(),
                    value: bitcoin::Amount::from_sat(self.onchainAmount as u64),
                },
            })))
        } else {
            let secp = elements::secp256k1_zkp::Secp256k1::new();
            let keys = elements::secp256k1_zkp::Keypair::from_seckey_slice(
                &secp,
                &keys.to_priv().to_bytes(),
            )?;

            let tx_id = self
                .transactionId
                .clone()
                .context("lockup transaction id not found")?;
            let tx_vout = self
                .transactionVout
                .context("lockup transaction vout not found")? as u32;

            let lockup_tx: elements::Transaction = elements::encode::deserialize(
                &alloy::hex::decode(&client.raw_transaction(&tx_id).await?)?,
            )?;

            let output_type = match SwapVersion::try_from(self.version)? {
                SwapVersion::Legacy => OutputType::Compatibility(
                    elements::Script::from_hex(
                        &self
                            .redeemScript
                            .clone()
                            .context("redeem script not found")?,
                    )
                    .map_err(|e| anyhow::anyhow!("failed to parse redeem script: {}", e))?,
                ),
                SwapVersion::Taproot => {
                    let secp = Musig::new_secp();

                    OutputType::Taproot(Some(boltz_core::elements::UncooperativeDetails {
                        tree: serde_json::from_str(
                            &self.redeemScript.clone().context("swap tree not found")?,
                        )?,
                        internal_key: elements::secp256k1_zkp::XOnlyPublicKey::from_slice(
                            &Musig::new(
                                &secp,
                                Musig::convert_keypair(&secp, keys.secret_key().secret_bytes())?,
                                vec![
                                    Musig::convert_pub_key(&keys.public_key().serialize())?,
                                    Musig::convert_pub_key(&alloy::hex::decode(
                                        self.claimPublicKey
                                            .clone()
                                            .context("refund public key not found")?,
                                    )?)?,
                                ],
                                [0; 32],
                            )?
                            .agg_pk()
                            .serialize(),
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
}

impl LightningSwap for ReverseSwap {
    fn chain_symbol(&self) -> Result<String> {
        let pair = split_pair(&self.pair)?;
        Ok(if self.orderSide == OrderSide::Buy as i32 {
            pair.base
        } else {
            pair.quote
        })
    }

    fn lightning_symbol(&self) -> Result<String> {
        let pair = split_pair(&self.pair)?;
        Ok(if self.orderSide == OrderSide::Buy as i32 {
            pair.quote
        } else {
            pair.base
        })
    }
}

#[cfg(test)]
mod test {
    use crate::db::models::{LightningSwap, ReverseSwap, SomeSwap, SwapType};
    use crate::swap::SwapUpdate;
    use crate::utils::pair::OrderSide;
    use rstest::*;

    #[test]
    fn test_kind() {
        assert_eq!(create_swap(None).kind(), SwapType::Reverse);
    }

    #[test]
    fn test_id() {
        let swap = create_swap(None);
        assert_eq!(swap.id(), swap.id);
    }

    #[test]
    fn test_status() {
        let swap = create_swap(None);
        assert_eq!(swap.status(), SwapUpdate::parse(swap.status.as_str()));
    }

    #[rstest]
    #[case(OrderSide::Buy, "L-BTC")]
    #[case(OrderSide::Sell, "BTC")]
    fn test_chain_symbol(#[case] side: OrderSide, #[case] expected: &str) {
        let swap = create_swap(Some(side));
        assert_eq!(swap.chain_symbol().unwrap(), expected);
    }

    #[rstest]
    #[case(OrderSide::Buy, "BTC")]
    #[case(OrderSide::Sell, "L-BTC")]
    fn test_lightning_symbol(#[case] side: OrderSide, #[case] expected: &str) {
        let swap = create_swap(Some(side));
        assert_eq!(swap.lightning_symbol().unwrap(), expected);
    }

    fn create_swap(order_side: Option<OrderSide>) -> ReverseSwap {
        ReverseSwap {
            id: "reverse id".to_string(),
            version: 1,
            pair: "L-BTC/BTC".to_string(),
            orderSide: order_side.unwrap_or(OrderSide::Buy) as i32,
            status: "transaction.confirmed".to_string(),
            preimageHash: "preimage hash".to_string(),
            transactionId: None,
            transactionVout: None,
            claimPublicKey: None,
            keyIndex: None,
            lockupAddress: "lockup address".to_string(),
            timeoutBlockHeight: 0,
            redeemScript: None,
            createdAt: chrono::Utc::now().naive_utc(),
            onchainAmount: 0,
        }
    }
}

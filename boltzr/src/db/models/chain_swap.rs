use crate::chain::utils::Outpoint;
use crate::chain::{Client, elements_client::SYMBOL as ELEMENTS_SYMBOL};
use crate::db::models::{SomeSwap, SwapType, aggregate_musig_key};
use crate::swap::SwapUpdate;
use crate::utils::pair::{OrderSide, split_pair};
use crate::wallet::Wallet;
use anyhow::{Context, Result, anyhow};
use async_trait::async_trait;
use boltz_core::utils::{InputType, OutputType};
use boltz_core::wrapper::{BitcoinInputDetail, ElementsInputDetail, InputDetail};
use diesel::{AsChangeset, Associations, Identifiable, Insertable, Queryable, Selectable};
use std::sync::Arc;

#[derive(
    Queryable, Selectable, Insertable, Identifiable, AsChangeset, PartialEq, Default, Clone, Debug,
)]
#[diesel(table_name = crate::db::schema::chainSwaps)]
#[allow(non_snake_case)]
pub struct ChainSwap {
    pub id: String,
    pub pair: String,
    pub orderSide: i32,
    pub status: String,
    pub preimage: Option<String>,
    pub preimageHash: String,
    pub createdAt: chrono::NaiveDateTime,
}

#[derive(
    Queryable,
    Selectable,
    Insertable,
    Identifiable,
    AsChangeset,
    Associations,
    PartialEq,
    Default,
    Clone,
    Debug,
)]
#[diesel(primary_key(swapId, symbol))]
#[diesel(belongs_to(ChainSwap, foreign_key = swapId))]
#[diesel(table_name = crate::db::schema::chainSwapData)]
#[allow(non_snake_case)]
pub struct ChainSwapData {
    pub swapId: String,
    pub symbol: String,
    pub keyIndex: Option<i32>,
    pub theirPublicKey: Option<String>,
    pub swapTree: Option<String>,
    pub timeoutBlockHeight: i32,
    pub lockupAddress: String,
    pub transactionId: Option<String>,
    pub transactionVout: Option<i32>,
    pub amount: Option<i64>,
}

#[derive(Default, Clone, Debug)]
pub struct ChainSwapInfo {
    pub swap: ChainSwap,
    sending_data: ChainSwapData,
    receiving_data: ChainSwapData,
}

impl ChainSwapInfo {
    pub fn new(swap: ChainSwap, data: Vec<ChainSwapData>) -> Result<Self> {
        if data.len() != 2 {
            return Err(anyhow!("invalid number of data params for chain swap"));
        }

        let pair = split_pair(&swap.pair)?;
        let base = pair.base.as_str();
        let quote = pair.quote.as_str();

        let sending_data = Self::find_side(
            &data,
            if swap.orderSide == OrderSide::Buy as i32 {
                base
            } else {
                quote
            },
        );
        let receiving_data = Self::find_side(
            &data,
            if swap.orderSide == OrderSide::Buy as i32 {
                quote
            } else {
                base
            },
        );

        if let Some(sending) = sending_data
            && let Some(receiving) = receiving_data
        {
            return Ok(Self {
                swap,
                sending_data: sending.clone(),
                receiving_data: receiving.clone(),
            });
        }

        Err(anyhow!("invalid data params for chain swap"))
    }

    pub fn sending(&self) -> &ChainSwapData {
        &self.sending_data
    }

    pub fn receiving(&self) -> &ChainSwapData {
        &self.receiving_data
    }

    fn find_side<'a>(data: &'a [ChainSwapData], symbol: &str) -> Option<&'a ChainSwapData> {
        data.iter().find(|entry| entry.symbol == symbol)
    }
}

#[async_trait]
impl SomeSwap for ChainSwapInfo {
    fn kind(&self) -> SwapType {
        SwapType::Chain
    }

    fn id(&self) -> String {
        self.swap.id.clone()
    }

    fn status(&self) -> SwapUpdate {
        SwapUpdate::parse(self.swap.status.as_str())
    }

    fn sending_outpoint(&self) -> Result<Option<Outpoint>> {
        if let Some(id) = &self.sending().transactionId
            && let Some(vout) = self.sending().transactionVout
        {
            let mut hash = alloy::hex::decode(id)?;
            hash.reverse();

            Ok(Some(Outpoint {
                hash,
                vout: vout as u32,
            }))
        } else {
            Ok(None)
        }
    }

    fn claim_symbol(&self) -> Result<String> {
        Ok(self.receiving().symbol.clone())
    }

    async fn claim_details(
        &self,
        wallet: &Arc<dyn Wallet + Send + Sync>,
        client: &Arc<dyn Client + Send + Sync>,
    ) -> Result<InputDetail> {
        let receiving = self.receiving();
        let input_type = InputType::Claim(
            alloy::hex::decode(self.swap.preimage.as_ref().context("preimage not found")?)?
                .as_slice()
                .try_into()?,
        );

        create_input_detail(input_type, receiving, wallet, client).await
    }

    fn refund_symbol(&self) -> Result<String> {
        Ok(self.sending().symbol.clone())
    }

    async fn refund_details(
        &self,
        wallet: &Arc<dyn Wallet + Send + Sync>,
        client: &Arc<dyn Client + Send + Sync>,
    ) -> Result<InputDetail> {
        let sending = self.sending();
        let input_type = InputType::Refund(sending.timeoutBlockHeight as u32);

        create_input_detail(input_type, sending, wallet, client).await
    }
}

async fn create_input_detail(
    input_type: InputType,
    data: &ChainSwapData,
    wallet: &Arc<dyn Wallet + Send + Sync>,
    client: &Arc<dyn Client + Send + Sync>,
) -> Result<InputDetail> {
    let keys = wallet.derive_keys(data.keyIndex.context("key index not found")? as u64)?;
    let key_pair = keys.to_keypair(&bitcoin::secp256k1::Secp256k1::new());
    let internal_key = aggregate_musig_key!(
        key_pair,
        data.theirPublicKey
            .clone()
            .context("their public key not found")?
    );

    if data.symbol != ELEMENTS_SYMBOL {
        let output_type = OutputType::Taproot(Some(boltz_core::bitcoin::UncooperativeDetails {
            tree: serde_json::from_str(data.swapTree.as_ref().context("swap tree not found")?)?,
            internal_key: bitcoin::XOnlyPublicKey::from_slice(&internal_key)?,
        }));

        Ok(InputDetail::Bitcoin(Box::new(BitcoinInputDetail {
            keys: key_pair,
            output_type,
            input_type,
            outpoint: bitcoin::OutPoint::new(
                data.transactionId
                    .clone()
                    .context("lockup transaction id not found")?
                    .parse()?,
                data.transactionVout
                    .context("lockup transaction vout not found")? as u32,
            ),
            tx_out: bitcoin::TxOut {
                script_pubkey: wallet.decode_address(&data.lockupAddress)?.into(),
                value: bitcoin::Amount::from_sat(data.amount.context("amount not found")? as u64),
            },
        })))
    } else {
        let secp = elements::secp256k1_zkp::Secp256k1::new();
        let keys =
            elements::secp256k1_zkp::Keypair::from_seckey_slice(&secp, &keys.to_priv().to_bytes())?;

        let tx_id = data
            .transactionId
            .clone()
            .context("lockup transaction id not found")?;
        let tx_vout = data
            .transactionVout
            .context("lockup transaction vout not found")? as u32;

        let lockup_tx: elements::Transaction = elements::encode::deserialize(&alloy::hex::decode(
            &client.raw_transaction(&tx_id).await?,
        )?)?;

        let output_type = OutputType::Taproot(Some(boltz_core::elements::UncooperativeDetails {
            tree: serde_json::from_str(data.swapTree.as_ref().context("swap tree not found")?)?,
            internal_key: elements::secp256k1_zkp::XOnlyPublicKey::from_slice(&internal_key)?,
        }));

        Ok(InputDetail::Elements(Box::new(ElementsInputDetail {
            keys,
            output_type,
            input_type,
            outpoint: elements::OutPoint::new(tx_id.parse()?, tx_vout),
            blinding_key: Some(elements::secp256k1_zkp::Keypair::from_seckey_slice(
                &secp,
                &wallet.derive_blinding_key(&data.lockupAddress)?,
            )?),
            tx_out: lockup_tx
                .output
                .get(tx_vout as usize)
                .context("output not found")?
                .clone(),
        })))
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use rstest::*;

    #[rstest]
    #[case(OrderSide::Buy, "L-BTC", "BTC")]
    #[case(OrderSide::Sell, "BTC", "L-BTC")]
    fn test_new(#[case] side: OrderSide, #[case] sending: &str, #[case] receiving: &str) {
        let (swap, data) = create_swap(Some(side));
        let info = ChainSwapInfo::new(swap, data).unwrap();

        assert_eq!(info.sending_data.symbol, sending);
        assert_eq!(info.receiving_data.symbol, receiving);
    }

    #[test]
    fn test_new_invalid_data_length() {
        let (swap, data) = create_swap(None);
        let expected_err = "invalid number of data params for chain swap";

        assert_eq!(
            ChainSwapInfo::new(swap.clone(), vec![])
                .unwrap_err()
                .to_string(),
            expected_err
        );
        assert_eq!(
            ChainSwapInfo::new(
                swap,
                vec![data[0].clone(), data[0].clone(), data[0].clone()]
            )
            .unwrap_err()
            .to_string(),
            expected_err
        );
    }

    #[test]
    fn test_new_invalid_data() {
        let (swap, data) = create_swap(None);
        assert_eq!(
            ChainSwapInfo::new(swap.clone(), vec![data[0].clone(), data[0].clone()])
                .unwrap_err()
                .to_string(),
            "invalid data params for chain swap"
        );
    }

    #[test]
    fn test_kind() {
        let (swap, data) = create_swap(None);
        assert_eq!(
            ChainSwapInfo::new(swap, data).unwrap().kind(),
            SwapType::Chain
        );
    }

    #[test]
    fn test_id() {
        let (swap, data) = create_swap(None);
        assert_eq!(
            ChainSwapInfo::new(swap.clone(), data).unwrap().id(),
            swap.id
        );
    }

    #[test]
    fn test_status() {
        let (swap, data) = create_swap(None);
        assert_eq!(
            ChainSwapInfo::new(swap.clone(), data).unwrap().status(),
            SwapUpdate::parse(&swap.status)
        );
    }

    #[test]
    fn test_claim_symbol() {
        let (swap, data) = create_swap(None);
        assert_eq!(
            ChainSwapInfo::new(swap.clone(), data)
                .unwrap()
                .claim_symbol()
                .unwrap(),
            "BTC"
        );
    }

    #[test]
    fn test_refund_symbol() {
        let (swap, data) = create_swap(None);
        assert_eq!(
            ChainSwapInfo::new(swap.clone(), data)
                .unwrap()
                .refund_symbol()
                .unwrap(),
            "L-BTC"
        );
    }

    fn create_swap(order_side: Option<OrderSide>) -> (ChainSwap, Vec<ChainSwapData>) {
        let id = "chain id";

        let swap_tree = r#"{"claimLeaf":{"version":196,"output":"a914c7e956bafda11bc819b85508122afa1d3c4a81d58820c4b06805b2103b001673228719c7605d12072d2eaee379b7403f4cd81c2202fbac"},"refundLeaf":{"version":196,"output":"207553af4cf0f17f4c73904e6f11dbc92b69fd758a0f5f87645ab0f936cf9f5517ad02f827b1"}}"#.to_string();

        (
            ChainSwap {
                id: id.to_string(),
                pair: "L-BTC/BTC".to_string(),
                status: "swap.created".to_string(),
                orderSide: order_side.unwrap_or(OrderSide::Buy) as i32,
                preimage: Some(
                    "9225ebb9155d90092f4c63766a8db50164c9db646c7e8d8d49ce73b20616e79d".to_string(),
                ),
                preimageHash: "a027b02074f921404491aea955e4b873ad12555fbc02435abb9979ec3fd7cc0e"
                    .to_string(),
                ..Default::default()
            },
            vec![
                ChainSwapData {
                    swapId: id.to_string(),
                    symbol: "BTC".to_string(),
                    keyIndex: Some(21),
                    theirPublicKey: Some(
                        "0220c58a6c0d1f0608af704659b11570bff82bb6fcb6991bd91bcb4ca3b60be0a3"
                            .to_string(),
                    ),
                    swapTree: Some(swap_tree.clone()),
                    transactionId: Some(
                        "dfe86c4a61742b9b0bcd769794d33ea00d1505948b18a3333aa280ebc0f7f78e"
                            .to_string(),
                    ),
                    transactionVout: Some(0),
                    lockupAddress:
                        "bcrt1p7xunxpgmulz9v5trnhwhewe7erk0sthhc5dweklmh9u6dpc7puzqmyt4l6"
                            .to_string(),
                    amount: Some(21_212),
                    ..Default::default()
                },
                ChainSwapData {
                    swapId: id.to_string(),
                    symbol: "L-BTC".to_string(),
                    keyIndex: Some(21),
                    theirPublicKey: Some(
                        "0220c58a6c0d1f0608af704659b11570bff82bb6fcb6991bd91bcb4ca3b60be0a3"
                            .to_string(),
                    ),
                    swapTree: Some(swap_tree),
                    lockupAddress:
                        "el1qq0kh7665vuxew983efx5emduzvn0shl8rscds8qe7vj2jq4jdmj575whl4zfmapjxqnsy5wm2adzd7jxzne6ul9vvcgvghqrt"
                            .to_string(),
                    amount: Some(21_212),
                    timeoutBlockHeight: 42_210,
                    ..Default::default()
                },
            ],
        )
    }
}

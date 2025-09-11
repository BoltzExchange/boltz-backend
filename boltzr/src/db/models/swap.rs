use crate::chain::Client;
use crate::db::models::{LightningSwap, SomeSwap, SwapType};
use crate::swap::SwapUpdate;
use crate::utils::pair::{OrderSide, split_pair};
use crate::wallet::Wallet;
use anyhow::Result;
use async_trait::async_trait;
use boltz_core::wrapper::InputDetail;
use diesel::{AsChangeset, Insertable, Queryable, Selectable};
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

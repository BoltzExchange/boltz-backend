use crate::db::models::{LightningSwap, SomeSwap, SwapType};
use crate::swap::SwapUpdate;
use crate::utils::pair::{OrderSide, split_pair};
use diesel::{AsChangeset, Associations, Identifiable, Insertable, Queryable, Selectable};

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
}

impl LightningSwap for ReverseSwap {
    fn chain_symbol(&self) -> anyhow::Result<String> {
        let pair = split_pair(&self.pair)?;
        Ok(if self.orderSide == OrderSide::Buy as i32 {
            pair.base
        } else {
            pair.quote
        })
    }

    fn lightning_symbol(&self) -> anyhow::Result<String> {
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

use crate::db::models::{LightningSwap, SomeSwap, SwapType};
use crate::swap::SwapUpdate;
use crate::utils::pair::{split_pair, OrderSide};
use diesel::{AsChangeset, Insertable, Queryable, Selectable};

#[derive(Queryable, Selectable, Insertable, AsChangeset, PartialEq, Clone, Debug)]
#[diesel(table_name = crate::db::schema::swaps)]
#[allow(non_snake_case)]
pub struct Swap {
    pub id: String,
    pub pair: String,
    pub orderSide: i32,
    pub status: String,
    pub failureReason: Option<String>,
    pub invoice: Option<String>,
    pub lockupAddress: String,
}

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
}

impl LightningSwap for Swap {
    fn chain_symbol(&self) -> anyhow::Result<String> {
        let pair = split_pair(&self.pair)?;
        Ok(if self.orderSide == OrderSide::Buy as i32 {
            pair.quote
        } else {
            pair.base
        })
    }

    fn lightning_symbol(&self) -> anyhow::Result<String> {
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
            lockupAddress: "".to_string(),
            status: "transaction.mempool".to_string(),
            orderSide: order_side.unwrap_or(OrderSide::Buy) as i32,
            invoice: None,
            failureReason: None,
        }
    }
}

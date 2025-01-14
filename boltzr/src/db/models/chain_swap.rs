use crate::db::models::{SomeSwap, SwapType};
use crate::swap::SwapUpdate;
use crate::utils::pair::{split_pair, OrderSide};
use diesel::{AsChangeset, Associations, Identifiable, Insertable, Queryable, Selectable};

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
    pub lockupAddress: String,
    pub transactionId: Option<String>,
    pub transactionVout: Option<i32>,
}

#[derive(Default, Clone, Debug)]
pub struct ChainSwapInfo {
    swap: ChainSwap,
    sending_data: ChainSwapData,
    receiving_data: ChainSwapData,
}

impl ChainSwapInfo {
    pub fn new(swap: ChainSwap, data: Vec<ChainSwapData>) -> anyhow::Result<Self> {
        if data.len() != 2 {
            return Err(anyhow::anyhow!(
                "invalid number of data params for chain swap"
            ));
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

        if let Some(sending_data) = sending_data {
            if let Some(receiving_data) = receiving_data {
                return Ok(Self {
                    swap,
                    sending_data: sending_data.clone(),
                    receiving_data: receiving_data.clone(),
                });
            }
        }

        Err(anyhow::anyhow!("invalid data params for chain swap"))
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
}

#[cfg(test)]
mod test {
    use crate::db::models::{ChainSwap, ChainSwapData, ChainSwapInfo, SomeSwap, SwapType};
    use crate::swap::SwapUpdate;
    use crate::utils::pair::OrderSide;
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

    fn create_swap(order_side: Option<OrderSide>) -> (ChainSwap, Vec<ChainSwapData>) {
        let id = "chain id";

        (
            ChainSwap {
                id: id.to_string(),
                pair: "L-BTC/BTC".to_string(),
                status: "swap.created".to_string(),
                orderSide: order_side.unwrap_or(OrderSide::Buy) as i32,
            },
            vec![
                ChainSwapData {
                    transactionId: None,
                    transactionVout: None,
                    swapId: id.to_string(),
                    symbol: "BTC".to_string(),
                    lockupAddress: "bc1".to_string(),
                },
                ChainSwapData {
                    transactionId: None,
                    transactionVout: None,
                    swapId: id.to_string(),
                    symbol: "L-BTC".to_string(),
                    lockupAddress: "lq1".to_string(),
                },
            ],
        )
    }
}

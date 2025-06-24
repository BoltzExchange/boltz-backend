use crate::db::Pool;
use crate::db::helpers::{BoxedCondition, QueryResponse};
use crate::db::models::{ReverseRoutingHint, ReverseSwap};
use crate::db::schema::{reverseRoutingHints, reverseSwaps};
use crate::swap::SwapUpdate;
use diesel::{ExpressionMethods, OptionalExtension, QueryDsl, RunQueryDsl, SelectableHelper};

pub type ReverseSwapCondition = BoxedCondition<reverseSwaps::table>;

pub trait ReverseSwapHelper {
    fn get_all(&self, condition: ReverseSwapCondition) -> QueryResponse<Vec<ReverseSwap>>;
    fn get_routing_hint(&self, preimage_hash: &str) -> QueryResponse<Option<ReverseRoutingHint>>;
    fn get_routing_hints(
        &self,
        script_pubkeys: Vec<Vec<u8>>,
    ) -> QueryResponse<Vec<ReverseRoutingHint>>;
}

#[derive(Clone, Debug)]
pub struct ReverseSwapHelperDatabase {
    pool: Pool,
}

impl ReverseSwapHelperDatabase {
    pub fn new(pool: Pool) -> Self {
        ReverseSwapHelperDatabase { pool }
    }
}

impl ReverseSwapHelper for ReverseSwapHelperDatabase {
    fn get_all(&self, condition: ReverseSwapCondition) -> QueryResponse<Vec<ReverseSwap>> {
        Ok(reverseSwaps::dsl::reverseSwaps
            .select(ReverseSwap::as_select())
            .filter(condition)
            .load(&mut self.pool.get()?)?)
    }

    fn get_routing_hint(&self, preimage_hash: &str) -> QueryResponse<Option<ReverseRoutingHint>> {
        Ok(reverseRoutingHints::dsl::reverseRoutingHints
            .inner_join(reverseSwaps::dsl::reverseSwaps)
            .select(ReverseRoutingHint::as_select())
            .filter(reverseSwaps::dsl::preimageHash.eq(preimage_hash))
            .first(&mut self.pool.get()?)
            .optional()?)
    }

    fn get_routing_hints(
        &self,
        script_pubkeys: Vec<Vec<u8>>,
    ) -> QueryResponse<Vec<ReverseRoutingHint>> {
        Ok(reverseRoutingHints::dsl::reverseRoutingHints
            .select(ReverseRoutingHint::as_select())
            .filter(reverseRoutingHints::dsl::scriptPubkey.eq_any(script_pubkeys))
            .inner_join(reverseSwaps::dsl::reverseSwaps)
            .filter(reverseSwaps::dsl::status.eq(SwapUpdate::SwapCreated.to_string()))
            .load(&mut self.pool.get()?)?)
    }
}

#[cfg(test)]
pub mod test {
    use super::*;
    use mockall::mock;

    mock! {
        pub ReverseSwapHelper {}

        impl Clone for ReverseSwapHelper {
            fn clone(&self) -> Self;
        }

        impl ReverseSwapHelper for ReverseSwapHelper {
            fn get_all(
                &self,
                condition: ReverseSwapCondition,
            ) -> QueryResponse<Vec<ReverseSwap>>;
            fn get_routing_hint(&self, preimage_hash: &str) -> QueryResponse<Option<ReverseRoutingHint>>;
            fn get_routing_hints(&self, script_pubkeys: Vec<Vec<u8>>) -> QueryResponse<Vec<ReverseRoutingHint>>;
        }
    }
}

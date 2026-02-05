use crate::db::helpers::QueryResponse;
use crate::db::models::FundingAddress;
use crate::db::schema::{funding_addresses, script_pubkeys};
use crate::db::{Pool, models::ScriptPubKey};
use anyhow::anyhow;
use diesel::{
    Connection, ExpressionMethods, QueryDsl, RunQueryDsl, SelectableHelper, dsl::update,
    insert_into,
};

#[derive(Clone, Debug, PartialEq)]
pub struct SwapTxInfo {
    pub swap_id: String,
    pub presigned_tx: Vec<u8>,
}

pub trait FundingAddressHelper {
    fn insert(
        &self,
        funding_address: &FundingAddress,
        script_pubkey: &ScriptPubKey,
    ) -> QueryResponse<usize>;
    fn get_by_id(&self, id: &str) -> QueryResponse<Option<FundingAddress>>;
    /// Sets or clears the swap_id and presigned_tx for a funding address.
    fn set_presigned_tx(&self, id: &str, swap_tx_info: Option<SwapTxInfo>) -> QueryResponse<usize>;
    fn get_by_swap_id(&self, swap_id: &str) -> QueryResponse<Option<FundingAddress>>;
    /// If `delink` is true, also clears the swap_id and presigned_tx in a transaction.
    fn set_transaction(
        &self,
        id: &str,
        transaction_id: &str,
        vout: i32,
        value: i64,
        status: &str,
        delink: bool,
    ) -> QueryResponse<usize>;
    fn set_status(&self, id: &str, status: &str) -> QueryResponse<usize>;
}

#[derive(Clone, Debug)]
pub struct FundingAddressHelperDatabase {
    pool: Pool,
}

impl FundingAddressHelperDatabase {
    pub fn new(pool: Pool) -> Self {
        Self { pool }
    }
}

impl FundingAddressHelper for FundingAddressHelperDatabase {
    fn insert(
        &self,
        funding_address: &FundingAddress,
        script_pubkey: &ScriptPubKey,
    ) -> QueryResponse<usize> {
        let mut conn = self.pool.get()?;
        conn.transaction(|conn| {
            insert_into(funding_addresses::dsl::funding_addresses)
                .values(funding_address)
                .execute(conn)?;

            insert_into(script_pubkeys::dsl::script_pubkeys)
                .values(script_pubkey)
                .execute(conn)
        })
        .map_err(|e| anyhow!("failed to insert funding address and script pubkey: {}", e))
    }

    fn get_by_id(&self, id: &str) -> QueryResponse<Option<FundingAddress>> {
        let res = funding_addresses::dsl::funding_addresses
            .select(FundingAddress::as_select())
            .filter(funding_addresses::dsl::id.eq(id))
            .limit(1)
            .load(&mut self.pool.get()?)?;

        if res.is_empty() {
            return Ok(None);
        }

        Ok(Some(res[0].clone()))
    }

    fn set_presigned_tx(&self, id: &str, swap_tx_info: Option<SwapTxInfo>) -> QueryResponse<usize> {
        let (presigned_tx, swap_id) = match swap_tx_info {
            Some(info) => (Some(info.presigned_tx), Some(info.swap_id)),
            None => (None, None),
        };
        Ok(update(funding_addresses::dsl::funding_addresses)
            .set((
                funding_addresses::dsl::presigned_tx.eq(presigned_tx),
                funding_addresses::dsl::swap_id.eq(swap_id),
            ))
            .filter(funding_addresses::dsl::id.eq(id))
            .execute(&mut self.pool.get()?)?)
    }

    fn get_by_swap_id(&self, swap_id: &str) -> QueryResponse<Option<FundingAddress>> {
        let res = funding_addresses::dsl::funding_addresses
            .select(FundingAddress::as_select())
            .filter(funding_addresses::dsl::swap_id.eq(swap_id))
            .limit(1)
            .load(&mut self.pool.get()?)?;
        if res.is_empty() {
            return Ok(None);
        }

        Ok(Some(res[0].clone()))
    }

    fn set_transaction(
        &self,
        id: &str,
        transaction_id: &str,
        vout: i32,
        value: i64,
        status: &str,
        delink: bool,
    ) -> QueryResponse<usize> {
        let mut conn = self.pool.get()?;

        conn.transaction(|conn| {
            if delink {
                update(funding_addresses::dsl::funding_addresses)
                    .set((
                        funding_addresses::dsl::presigned_tx.eq(None::<Vec<u8>>),
                        funding_addresses::dsl::swap_id.eq(None::<String>),
                    ))
                    .filter(funding_addresses::dsl::id.eq(id))
                    .execute(conn)?;
            }

            update(funding_addresses::dsl::funding_addresses)
                .set((
                    funding_addresses::dsl::lockup_transaction_id.eq(transaction_id),
                    funding_addresses::dsl::lockup_transaction_vout.eq(vout),
                    funding_addresses::dsl::lockup_amount.eq(value),
                    funding_addresses::dsl::status.eq(status.to_string()),
                ))
                .filter(funding_addresses::dsl::id.eq(id))
                .execute(conn)
        })
        .map_err(|e| anyhow!("failed to set funding address transaction: {}", e))
    }

    fn set_status(&self, id: &str, status: &str) -> QueryResponse<usize> {
        Ok(update(funding_addresses::dsl::funding_addresses)
            .set(funding_addresses::dsl::status.eq(status.to_string()))
            .filter(funding_addresses::dsl::id.eq(id))
            .execute(&mut self.pool.get()?)?)
    }
}

#[cfg(test)]
pub mod test {
    use super::*;
    use mockall::mock;

    mock! {
        pub FundingAddressHelper {}

        impl FundingAddressHelper for FundingAddressHelper {
            fn insert(&self, funding_address: &FundingAddress, script_pubkey: &ScriptPubKey) -> QueryResponse<usize>;
            fn get_by_id(&self, id: &str) -> QueryResponse<Option<FundingAddress>>;
            fn set_presigned_tx(&self, id: &str, swap_tx_info: Option<SwapTxInfo>) -> QueryResponse<usize>;
            fn get_by_swap_id(&self, swap_id: &str) -> QueryResponse<Option<FundingAddress>>;
            fn set_transaction(
                &self,
                id: &str,
                transaction_id: &str,
                vout: i32,
                value: i64,
                status: &str,
                delink: bool,
            ) -> QueryResponse<usize>;
            fn set_status(&self, id: &str, status: &str) -> QueryResponse<usize>;
        }
    }
}

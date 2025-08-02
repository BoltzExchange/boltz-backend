use crate::{
    chain::{
        Client,
        bumper::handlers::{HandlerType, PendingTransaction, TransactionHandler},
    },
    db::{
        helpers::{
            chain_swap::ChainSwapHelper,
            refund_transaction::{RefundStatus, RefundTransactionHelper},
            reverse_swap::ReverseSwapHelper,
        },
        models::SomeSwap,
    },
    wallet::Wallet,
};
use anyhow::Result;
use async_trait::async_trait;
use boltz_core::{
    Destination,
    address::Address,
    wrapper::{BitcoinParams, Params, construct_tx},
};
use diesel::{BoolExpressionMethods, ExpressionMethods};
use std::sync::Arc;

#[derive(Clone)]
pub struct RefundTransactionHandler<H, R, C>
where
    H: RefundTransactionHelper + Send + Sync,
    R: ReverseSwapHelper + Send + Sync,
    C: ChainSwapHelper + Send + Sync,
{
    tx_helper: H,
    reverse_swap_helper: R,
    chain_swap_helper: C,

    wallet: Arc<dyn Wallet + Send + Sync>,
    chain_client: Arc<dyn Client + Send + Sync>,
}

impl<H, R, C> RefundTransactionHandler<H, R, C>
where
    H: RefundTransactionHelper + Send + Sync,
    R: ReverseSwapHelper + Send + Sync,
    C: ChainSwapHelper + Send + Sync,
{
    pub fn new(
        tx_helper: H,
        reverse_swap_helper: R,
        chain_swap_helper: C,
        wallet: Arc<dyn Wallet + Send + Sync>,
        chain_client: Arc<dyn Client + Send + Sync>,
    ) -> Self {
        Self {
            tx_helper,
            reverse_swap_helper,
            chain_swap_helper,
            wallet,
            chain_client,
        }
    }

    fn get_swap(&self, id: &str) -> Result<Box<dyn SomeSwap + Send + Sync>> {
        Ok(match self.reverse_swap_helper.get_by_id(id) {
            Ok(swap) => Box::new(swap),
            Err(_) => match self.chain_swap_helper.get_by_id(id) {
                Ok(swap) => Box::new(swap),
                Err(_) => return Err(anyhow::anyhow!("swap {} not found", id)),
            },
        })
    }
}

#[async_trait]
impl<H, R, C> TransactionHandler for RefundTransactionHandler<H, R, C>
where
    H: RefundTransactionHelper + Send + Sync,
    R: ReverseSwapHelper + Send + Sync,
    C: ChainSwapHelper + Send + Sync,
{
    fn handler_type(&self) -> HandlerType {
        HandlerType::Refund
    }

    fn fetch_pending(&self) -> anyhow::Result<Vec<PendingTransaction>> {
        let transactions = self.tx_helper.get_all(Box::new(
            crate::db::schema::refund_transactions::dsl::status
                .eq(RefundStatus::Pending.to_string())
                .and(
                    crate::db::schema::refund_transactions::dsl::symbol
                        .eq(self.chain_client.symbol()),
                ),
        ))?;

        Ok(transactions
            .into_iter()
            .map(|t| PendingTransaction {
                swap_id: t.swapId,
                transaction_id: t.id,
            })
            .collect())
    }

    #[tracing::instrument(name = "RefundTransactionHandler::bump_fee", skip(self))]
    async fn bump_fee(&self, pending: &PendingTransaction, fee_target: f64) -> Result<String> {
        let swap = self.get_swap(&pending.swap_id)?;
        let refund_details = swap
            .refund_details(&self.wallet, &self.chain_client)
            .await?;

        let tx = construct_tx(&Params::Bitcoin(BitcoinParams {
            inputs: &[&refund_details.try_into()?],
            fee: fee_target.into(),
            destination: &Destination::Single(
                &Address::try_from(
                    self.wallet
                        .get_address(format!(
                            "Refund of {} swap {}",
                            swap.kind(),
                            pending.swap_id
                        ))
                        .await?
                        .as_str(),
                )?
                .try_into()?,
            ),
        }))?;

        self.chain_client
            .send_raw_transaction(alloy::hex::encode(tx.serialize()))
            .await?;

        let tx_id = tx.txid();
        self.tx_helper
            .update_transaction_id(&pending.swap_id, &tx_id, Some(0))?;

        Ok(tx_id)
    }
}

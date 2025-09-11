use crate::{
    chain::{
        Client,
        bumper::handlers::{HandlerType, PendingTransaction, TransactionHandler},
        elements_client::SYMBOL as ELEMENTS_SYMBOL,
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
    Address, Destination,
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
    async fn bump_fee(
        &self,
        pending: &PendingTransaction,
        fee_target: f64,
        sweep_address: Option<Address>,
    ) -> Result<String> {
        let swap = self.get_swap(&pending.swap_id)?;
        if swap.refund_symbol()? == ELEMENTS_SYMBOL {
            return Err(anyhow::anyhow!(
                "cannot bump fee for Elements refund transaction of swap {}",
                pending.swap_id
            ));
        }

        let refund_details = swap
            .refund_details(&self.wallet, &self.chain_client)
            .await?;

        let destination = match sweep_address {
            Some(address) => address,
            None => Address::try_from(
                self.wallet
                    .get_address(&format!(
                        "Refund of {} swap {}",
                        swap.kind(),
                        pending.swap_id
                    ))
                    .await?
                    .as_str(),
            )?,
        };

        let tx = construct_tx(&Params::Bitcoin(BitcoinParams {
            inputs: &[&refund_details.try_into()?],
            fee: fee_target.into(),
            destination: &Destination::Single(&destination.try_into()?),
        }))?;

        self.chain_client
            .send_raw_transaction(&alloy::hex::encode(tx.serialize()))
            .await?;

        let tx_id = tx.txid();
        self.tx_helper
            .update_transaction_id(&pending.swap_id, &tx_id, Some(0))
            .map_err(|err| {
                anyhow::anyhow!("failed to update transaction id to ({}): {}", tx_id, err)
            })?;

        Ok(tx_id)
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use crate::chain::chain_client::test as bitcoin_test;
    use crate::db::helpers::chain_swap::test::MockChainSwapHelper;
    use crate::db::helpers::refund_transaction::test::MockRefundTransactionHelper;
    use crate::db::helpers::reverse_swap::test::MockReverseSwapHelper;
    use crate::db::models::ReverseSwap;
    use crate::swap::SwapUpdate;
    use crate::wallet::{Bitcoin, Network};
    use mockall::predicate::eq;

    fn get_wallet(client: Arc<dyn Client + Send + Sync>) -> Bitcoin {
        Bitcoin::new(Network::Regtest, &[0; 64], "m/0/0".to_string(), client).unwrap()
    }

    #[tokio::test]
    async fn test_bump_fee_elements() {
        let client = bitcoin_test::get_client().await;
        let wallet = get_wallet(Arc::new(client.clone()));

        let pending = PendingTransaction {
            swap_id: "swap".to_string(),
            transaction_id: "tx".to_string(),
        };

        let mut reverse_helper = MockReverseSwapHelper::new();
        reverse_helper
            .expect_get_by_id()
            .with(eq(pending.swap_id.clone()))
            .returning(|_| {
                Ok(ReverseSwap {
                    id: "swap".to_string(),
                    status: SwapUpdate::SwapCreated.to_string(),
                    pair: "L-BTC/BTC".to_string(),
                    orderSide: 0,
                    ..Default::default()
                })
            });

        let handler = RefundTransactionHandler::new(
            MockRefundTransactionHelper::new(),
            reverse_helper,
            MockChainSwapHelper::new(),
            Arc::new(wallet),
            Arc::new(client),
        );

        assert_eq!(
            handler
                .bump_fee(&pending, 21.0, None)
                .await
                .err()
                .unwrap()
                .to_string(),
            format!(
                "cannot bump fee for Elements refund transaction of swap {}",
                pending.swap_id
            )
        );
    }
}

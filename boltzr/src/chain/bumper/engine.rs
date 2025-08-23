use crate::chain::types::Type;
use crate::chain::utils::Transaction;
use crate::chain::{
    Client,
    bumper::handlers::{PendingTransaction, TransactionHandler},
};
use anyhow::Result;
use std::sync::Arc;
use tokio::time::Duration;
use tokio_util::sync::CancellationToken;
use tracing::{debug, info, trace, warn};

const CHECK_INTERVAL_SECONDS: u64 = 30;

const RBF_MIN_INCREMENT: f64 = 1.0;
const RBF_MIN_BUMP: f64 = 2.0;

#[derive(Clone)]
pub struct Bumper {
    cancellation_token: CancellationToken,
    chain_client: Arc<dyn Client + Send + Sync>,
    handlers: Vec<Arc<dyn TransactionHandler + Send + Sync>>,
}

impl Bumper {
    pub fn new(
        cancellation_token: CancellationToken,
        chain_client: Arc<dyn Client + Send + Sync>,
        handlers: Vec<Arc<dyn TransactionHandler + Send + Sync>>,
    ) -> Self {
        Self {
            cancellation_token,
            handlers,
            chain_client,
        }
    }

    pub fn symbol(&self) -> String {
        self.chain_client.symbol()
    }

    pub async fn start(&self) {
        if self.chain_client.chain_type() == Type::Elements {
            debug!("RBF bumper not needed on {}", self.chain_client.symbol());
            return;
        }

        let duration = Duration::from_secs(CHECK_INTERVAL_SECONDS);
        debug!(
            "{} bumper running every {:#?}",
            self.chain_client.symbol(),
            duration
        );

        tokio::select! {
            _ = tokio::time::sleep(duration) => {},
            _ = self.cancellation_token.cancelled() => return,
        };

        let mut interval = tokio::time::interval(duration);
        loop {
            tokio::select! {
                _ = interval.tick() => {},
                _ = self.cancellation_token.cancelled() => break,
            };

            if let Err(e) = self.run().await {
                warn!("{} RBF bumper error: {}", self.chain_client.symbol(), e);
            }
        }
    }

    async fn run(&self) -> Result<()> {
        let fee_target = self.chain_client.estimate_fee().await?;
        trace!(
            "{} bumper running with fee target {}",
            self.chain_client.symbol(),
            fee_target
        );

        #[cfg(feature = "metrics")]
        metrics::gauge!(crate::metrics::FEE_TARGET, "symbol" => self.symbol()).set(fee_target);

        for handler in self.handlers.iter() {
            for tx in handler.fetch_pending()? {
                if let Err(e) = self.check_transaction(handler, &tx, fee_target).await {
                    warn!(
                        "{} RBF bumper errored for transaction {} ({}): {}",
                        self.chain_client.symbol(),
                        tx.swap_id,
                        tx.transaction_id,
                        e
                    );
                }
            }
        }

        Ok(())
    }

    async fn check_transaction(
        &self,
        handler: &Arc<dyn TransactionHandler + Send + Sync>,
        pending_tx: &PendingTransaction,
        fee_target: f64,
    ) -> Result<()> {
        trace!(
            "{} RBF bumper checking {} transaction {} ({})",
            self.chain_client.symbol(),
            handler.handler_type(),
            pending_tx.swap_id,
            pending_tx.transaction_id
        );

        let tx = self
            .chain_client
            .raw_transaction(&pending_tx.transaction_id)
            .await?;
        let tx = Transaction::parse_hex(&self.chain_client.chain_type(), &tx)?;
        let fee_sat_vbyte = tx.calculate_fee(&self.chain_client).await?;

        if !Self::should_bump(fee_sat_vbyte, fee_target) {
            debug!(
                "{} RBF bumper skipping {} transaction {} ({}) with fee {:.2} sat/vbyte",
                self.chain_client.symbol(),
                handler.handler_type(),
                pending_tx.swap_id,
                pending_tx.transaction_id,
                fee_sat_vbyte
            );
            return Ok(());
        }

        debug!(
            "{} RBF bumping {} transaction {} ({}) from {:.2} sat/vbyte to {:.2} sat/vbyte",
            self.chain_client.symbol(),
            handler.handler_type(),
            pending_tx.swap_id,
            pending_tx.transaction_id,
            fee_sat_vbyte,
            fee_target
        );

        let tx_id = handler.bump_fee(pending_tx, fee_target).await?;
        info!(
            "RBF bumped {} transaction for swap {} to {:.2} sat/vbyte: {}",
            handler.handler_type(),
            pending_tx.swap_id,
            fee_target,
            tx_id
        );

        Ok(())
    }

    fn should_bump(actual: f64, target: f64) -> bool {
        // Make the bump worthwhile
        Self::can_bump(actual, target) && actual + RBF_MIN_BUMP <= target
    }

    fn can_bump(actual: f64, target: f64) -> bool {
        // RBFs can only be done in 1 sat/vbyte increments
        actual + RBF_MIN_INCREMENT <= target
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use crate::chain::{bumper::handlers::HandlerType, chain_client::test as bitcoin_test};
    use async_trait::async_trait;
    use mockall::mock;
    use serial_test::serial;

    mock! {
        TransactionHandler {}

        #[async_trait]
        impl TransactionHandler for TransactionHandler {
            fn handler_type(&self) -> HandlerType;
            fn fetch_pending(&self) -> anyhow::Result<Vec<PendingTransaction>>;
            async fn bump_fee(&self, tx: &PendingTransaction, fee_target: f64) -> Result<String>;
        }
    }

    #[tokio::test]
    #[serial(BTC)]
    async fn test_check_transaction_bump() {
        let client = bitcoin_test::get_client().await;

        let cancel_token = CancellationToken::new();
        let bumper = Bumper::new(cancel_token.clone(), Arc::new(client.clone()), vec![]);

        let tx = bitcoin_test::send_transaction(&client).await;

        let pending_tx = PendingTransaction {
            swap_id: "swap".to_string(),
            transaction_id: tx.txid_hex().to_string(),
        };
        let fee_target = 21.0;

        let mut handler = MockTransactionHandler::new();
        let pending_cloned = pending_tx.clone();
        handler.expect_bump_fee().returning(move |tx, fee| {
            assert_eq!(tx, &pending_cloned);
            assert_eq!(fee, fee_target);
            Ok("tx_id".to_string())
        });

        bumper
            .check_transaction(
                &(Arc::new(handler) as Arc<dyn TransactionHandler + Send + Sync>),
                &pending_tx,
                fee_target,
            )
            .await
            .unwrap();

        cancel_token.cancel();
    }

    #[tokio::test]
    #[serial(BTC)]
    async fn test_check_transaction_skip() {
        let client = bitcoin_test::get_client().await;

        let cancel_token = CancellationToken::new();
        let bumper = Bumper::new(cancel_token.clone(), Arc::new(client.clone()), vec![]);

        let tx = bitcoin_test::send_transaction(&client).await;

        bumper
            .check_transaction(
                &(Arc::new(MockTransactionHandler::new())
                    as Arc<dyn TransactionHandler + Send + Sync>),
                &PendingTransaction {
                    swap_id: "swap".to_string(),
                    transaction_id: tx.txid_hex().to_string(),
                },
                1.0,
            )
            .await
            .unwrap();

        cancel_token.cancel();
    }

    #[test]
    fn should_bump() {
        assert!(Bumper::should_bump(1.0, 3.0));
        assert!(Bumper::should_bump(2.0, 4.2));
        assert!(Bumper::should_bump(50.0, 100.0));

        assert!(!Bumper::should_bump(1.0, 2.0));
        assert!(!Bumper::should_bump(1.9, 2.0));
        assert!(!Bumper::should_bump(2.0, 2.0));
        assert!(!Bumper::should_bump(2.1, 2.0));
        assert!(!Bumper::should_bump(100.0, 50.0));
    }

    #[test]
    fn can_bump() {
        assert!(Bumper::can_bump(1.0, 2.0));
        assert!(Bumper::can_bump(1.0, 3.0));
        assert!(Bumper::can_bump(50.0, 100.0));

        assert!(!Bumper::can_bump(1.9, 2.0));
        assert!(!Bumper::can_bump(2.0, 2.0));
        assert!(!Bumper::can_bump(2.1, 2.0));
        assert!(!Bumper::can_bump(100.0, 50.0));
    }
}

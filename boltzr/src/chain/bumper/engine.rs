use crate::chain::types::Type;
use crate::chain::utils::Transaction;
use crate::chain::{
    Client,
    bumper::handlers::{PendingTransaction, TransactionHandler},
};
use anyhow::Result;
use boltz_core::Address;
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

    #[tracing::instrument(name = "Bumper::check_transaction", skip_all)]
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

        let tx_id = handler
            .bump_fee(pending_tx, fee_target, self.get_sweep_address(tx))
            .await?;
        info!(
            "RBF bumped {} transaction for swap {} to {:.2} sat/vbyte: {}",
            handler.handler_type(),
            pending_tx.swap_id,
            fee_target,
            tx_id
        );

        Ok(())
    }

    fn get_sweep_address(&self, tx: Transaction) -> Option<Address> {
        let scripts = tx.output_script_pubkeys();
        if scripts.is_empty() || scripts.len() > 1 {
            debug!("Ambiguous sweep address for transaction {}", tx.txid_hex());
            return None;
        }

        match self.chain_client.chain_type() {
            Type::Bitcoin => match scripts.first() {
                Some(script) => Address::from_bitcoin_script(self.chain_client.network(), script),
                None => Err(anyhow::anyhow!("no output script")),
            },
            Type::Elements => {
                // For elements we'll need to get the blinding public key from the wallet
                Err(anyhow::anyhow!("not implemented for elements"))
            }
        }
        .map_err(|e| {
            debug!("Failed to derive address from script: {}", e);
            e
        })
        .ok()
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
    use rstest::rstest;
    use serial_test::serial;

    mock! {
        TransactionHandler {}

        #[async_trait]
        impl TransactionHandler for TransactionHandler {
            fn handler_type(&self) -> HandlerType;
            fn fetch_pending(&self) -> anyhow::Result<Vec<PendingTransaction>>;
            async fn bump_fee(&self, tx: &PendingTransaction, fee_target: f64, sweep_address: Option<Address>) -> Result<String>;
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
        handler.expect_bump_fee().returning(move |tx, fee, _| {
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

    #[rstest]
    #[case::single_output(
        Some("bcrt1qwpd89pwmqvczac422jwv9q0dekwssma4hsucl4".to_string()),
        "010000000001019fb0a1967eb39928600d39d0df01c349bacd797d198ff7e2451d194f07629d3a0000000000fdffffff0193c1000000000000160014705a7285db03302ee2aa549cc281edcd9d086fb50140371374880c8a5bb08b12b6c001f5ce08a0ede226f18e68ca492b149c9206ba7796735fec4d8a5d74364db85a7ee5b5ecf9e6207a1d6db8073bbbba74d11f6a3d00000000"
    )]
    #[case::multiple_outputs(
        None,
        "02000000000101397aaad161fd94a56141eed7bdae2047a65a0c48e3b964acad3bbc08be3cf4340100000017160014923bad59550beda08945546b15449ec8a218bc3cfdffffff023256010000000000225120bf7963d741478f1be8b4d5672201300ceee59cafd036567f5096cd2ad68dbf93102700000000000022512030da084ff6773b126e1bf5be887e33d80f560a615318162ce44e31fa16afba1d0247304402206a4a85b8ddadfa3045c3640098787c897a3d792fc1efdf1f1da480ebad6e6eab0220751e9080a7f2251e1d84daf41039be24c7c9718ca8c2af7f31b384941ea5d550012103915514fcd3ced46cad3eb2176d858f60aa3f12682df61f08c2da12a8427163f430010000"
    )]
    #[tokio::test]
    #[serial(BTC)]
    async fn test_get_sweep_address(#[case] expected_address: Option<String>, #[case] tx: &str) {
        let client = bitcoin_test::get_client().await;

        let cancel_token = CancellationToken::new();
        let bumper = Bumper::new(cancel_token.clone(), Arc::new(client.clone()), vec![]);

        let sweep_address =
            bumper.get_sweep_address(Transaction::parse_hex(&Type::Bitcoin, tx).unwrap());
        assert_eq!(sweep_address.map(|a| a.to_string()), expected_address);
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

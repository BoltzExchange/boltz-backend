use crate::chain::bumper::fetcher::{FetcherType, PendingTransaction};
use crate::chain::types::Type;
use crate::chain::utils::parse_transaction_hex;
use crate::chain::{Client, bumper::fetcher::TransactionFetcher};
use anyhow::Result;
use std::sync::Arc;
use tokio::sync::broadcast::{Receiver, Sender, channel};
use tokio::time::Duration;
use tokio_util::sync::CancellationToken;
use tracing::{debug, info, trace, warn};

const CHECK_INTERVAL_SECONDS: u64 = 30;

const RBF_MIN_INCREMENT: f64 = 1.0;
const RBF_MIN_BUMP: f64 = 2.0;

#[derive(Debug, Clone)]
pub struct TransactionToBump {
    pub transaction_type: FetcherType,
    pub symbol: String,
    pub swap_id: String,
    pub transaction_id: String,
    pub fee_target: f64,
}

#[derive(Clone)]
pub struct Bumper {
    cancellation_token: CancellationToken,
    chain_client: Arc<dyn Client + Send + Sync>,
    fetchers: Vec<Arc<dyn TransactionFetcher + Send + Sync>>,

    txs_to_bump: Sender<TransactionToBump>,
}

impl Bumper {
    pub fn new(
        cancellation_token: CancellationToken,
        chain_client: Arc<dyn Client + Send + Sync>,
        fetchers: Vec<Arc<dyn TransactionFetcher + Send + Sync>>,
    ) -> Self {
        Self {
            cancellation_token,
            fetchers,
            chain_client,
            txs_to_bump: channel(1_024).0,
        }
    }

    pub fn symbol(&self) -> String {
        self.chain_client.symbol()
    }

    pub fn txs_to_bump(&self) -> Receiver<TransactionToBump> {
        self.txs_to_bump.subscribe()
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

        for fetcher in self.fetchers.iter() {
            for tx in fetcher.fetch_pending()? {
                if let Err(e) = self
                    .check_transaction(fetcher.fetcher_type(), &tx, fee_target)
                    .await
                {
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
        fetcher_type: FetcherType,
        pending_tx: &PendingTransaction,
        fee_target: f64,
    ) -> Result<()> {
        trace!(
            "{} RBF bumper checking {} transaction {} ({})",
            self.chain_client.symbol(),
            fetcher_type,
            pending_tx.swap_id,
            pending_tx.transaction_id
        );

        let tx = self
            .chain_client
            .raw_transaction(&pending_tx.transaction_id)
            .await?;
        let tx = parse_transaction_hex(&self.chain_client.chain_type(), &tx)?;
        let fee_sat_vbyte = tx.calculate_fee(&self.chain_client).await?;

        if !Self::should_bump(fee_sat_vbyte, fee_target) {
            debug!(
                "{} RBF bumper skipping {} transaction {} ({}) with fee {} sat/vbyte",
                self.chain_client.symbol(),
                fetcher_type,
                pending_tx.swap_id,
                pending_tx.transaction_id,
                fee_sat_vbyte
            );
            return Ok(());
        }

        info!(
            "{} RBF bumping {} transaction {} ({}) from {} sat/vbyte to {} sat/vbyte",
            self.chain_client.symbol(),
            fetcher_type,
            pending_tx.swap_id,
            pending_tx.transaction_id,
            fee_sat_vbyte,
            fee_target
        );

        if self.txs_to_bump.receiver_count() == 0 {
            return Ok(());
        }

        self.txs_to_bump.send(TransactionToBump {
            transaction_type: fetcher_type,
            symbol: self.chain_client.symbol(),
            swap_id: pending_tx.swap_id.clone(),
            transaction_id: pending_tx.transaction_id.clone(),
            fee_target,
        })?;

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
    use crate::chain::BaseClient;
    use crate::chain::chain_client::test as bitcoin_test;
    use serial_test::serial;

    #[tokio::test]
    #[serial(BTC)]
    async fn test_check_transaction_bump() {
        let client = bitcoin_test::get_client();

        let cancel_token = CancellationToken::new();
        let bumper = Bumper::new(cancel_token.clone(), Arc::new(client.clone()), vec![]);
        let mut recv = bumper.txs_to_bump();

        let tx = bitcoin_test::send_transaction(&client).await;

        let pending_tx = PendingTransaction {
            swap_id: "swap".to_string(),
            transaction_id: tx.txid_hex().to_string(),
        };
        let fee_target = 21.0;

        bumper
            .check_transaction(FetcherType::Refund, &pending_tx, fee_target)
            .await
            .unwrap();

        cancel_token.cancel();

        let tx_to_bump = recv.recv().await.unwrap();
        assert_eq!(tx_to_bump.transaction_type, FetcherType::Refund);
        assert_eq!(tx_to_bump.symbol, client.symbol());
        assert_eq!(tx_to_bump.swap_id, pending_tx.swap_id);
        assert_eq!(tx_to_bump.transaction_id, tx.txid_hex());
        assert_eq!(tx_to_bump.fee_target, fee_target);
    }

    #[tokio::test]
    #[serial(BTC)]
    async fn test_check_transaction_skip() {
        let client = bitcoin_test::get_client();

        let cancel_token = CancellationToken::new();
        let bumper = Bumper::new(cancel_token.clone(), Arc::new(client.clone()), vec![]);
        let recv = bumper.txs_to_bump();

        let tx = bitcoin_test::send_transaction(&client).await;

        bumper
            .check_transaction(
                FetcherType::Refund,
                &PendingTransaction {
                    swap_id: "swap".to_string(),
                    transaction_id: tx.txid_hex().to_string(),
                },
                1.0,
            )
            .await
            .unwrap();

        assert!(recv.is_empty());

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

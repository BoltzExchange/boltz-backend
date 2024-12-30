use crate::api::ws::types::SwapStatus;
use crate::currencies::Currencies;
use crate::db::helpers::swap::SwapHelper;
use crate::db::models::LightningSwap;
use crate::lightning::invoice;
use crate::swap::{serialize_swap_updates, SwapUpdate};
use anyhow::anyhow;
use diesel::{BoolExpressionMethods, ExpressionMethods};
use std::sync::Arc;
use std::time::Duration;
use tokio_util::sync::CancellationToken;
use tracing::{error, info, instrument, trace};

const CHECK_INTERVAL_SECONDS: u64 = 60;
const EXPIRED_INVOICE_FAILURE_REASON: &str = "invoice expired";

pub struct InvoiceExpiryChecker {
    cancellation_token: CancellationToken,
    update_tx: tokio::sync::broadcast::Sender<SwapStatus>,

    currencies: Arc<Currencies>,
    swap_repo: Arc<dyn SwapHelper + Sync + Send>,
}

impl InvoiceExpiryChecker {
    pub fn new(
        cancellation_token: CancellationToken,
        update_tx: tokio::sync::broadcast::Sender<SwapStatus>,
        currencies: Arc<Currencies>,
        swap_repo: Arc<dyn SwapHelper + Sync + Send>,
    ) -> Self {
        InvoiceExpiryChecker {
            swap_repo,
            update_tx,
            currencies,
            cancellation_token,
        }
    }

    pub async fn start(&self) {
        let duration = Duration::from_secs(CHECK_INTERVAL_SECONDS);
        info!(
            "Checking for expired invoices of Submarine Swaps every {:#?}",
            duration
        );
        let mut interval = tokio::time::interval(duration);

        tokio::select! {
            _ =  tokio::time::sleep(duration) => {},
            _ = self.cancellation_token.cancelled() => {
                return;
            }
        }

        loop {
            tokio::select! {
                _ = interval.tick() => {},
                _ = self.cancellation_token.cancelled() => {
                    break;
                }
            }

            if let Err(err) = self.check().await {
                error!(
                    "Checking Submarine Swaps for expired invoices failed: {}",
                    err
                );
            }
        }
    }

    #[instrument(name = "InvoiceExpiryChecker::check", skip_all)]
    pub async fn check(&self) -> anyhow::Result<()> {
        let swaps = self.swap_repo.get_all(Box::new(
            crate::db::schema::swaps::dsl::status
                .ne_all(serialize_swap_updates(&[
                    SwapUpdate::SwapExpired,
                    SwapUpdate::InvoicePending,
                    SwapUpdate::InvoiceFailedToPay,
                    SwapUpdate::TransactionClaimed,
                    SwapUpdate::TransactionLockupFailed,
                    SwapUpdate::TransactionClaimPending,
                ]))
                .and(crate::db::schema::swaps::dsl::invoice.is_not_null()),
        ))?;
        trace!(
            "Checking for expired invoices of {} Submarine Swaps",
            swaps.len()
        );

        for swap in swaps {
            let invoice = match &swap.invoice {
                Some(invoice) => invoice,
                None => continue,
            };
            let network = match self.currencies.get(&swap.lightning_symbol()?) {
                Some(cur) => cur.network,
                None => {
                    return Err(anyhow!(
                        "currency {} not configured",
                        swap.lightning_symbol()?
                    ));
                }
            };

            if !invoice::decode(network, invoice)?.is_expired() {
                continue;
            }

            info!(
                "Failing Submarine Swap {} because its invoice expired already",
                swap.id
            );

            let status = SwapUpdate::InvoiceFailedToPay;
            let failure_reason = EXPIRED_INVOICE_FAILURE_REASON;

            self.swap_repo
                .update_status(&swap.id, status, Some(failure_reason.to_string()))?;

            self.update_tx.send(SwapStatus {
                id: swap.id,
                status: status.to_string(),
                failure_reason: Some(failure_reason.to_string()),
                transaction: None,
                channel_info: None,
                failure_details: None,
                zero_conf_rejected: None,
            })?;
        }

        Ok(())
    }
}

#[cfg(test)]
mod test {
    use crate::api::ws::types::SwapStatus;
    use crate::currencies::{Currencies, Currency};
    use crate::db::helpers::swap::{SwapCondition, SwapHelper};
    use crate::db::helpers::QueryResponse;
    use crate::db::models::Swap;
    use crate::swap::expiry_checker::{InvoiceExpiryChecker, EXPIRED_INVOICE_FAILURE_REASON};
    use crate::swap::SwapUpdate;
    use crate::wallet::{Bitcoin, Network};
    use mockall::{mock, predicate};
    use std::sync::{Arc, OnceLock};
    use tokio_util::sync::CancellationToken;

    mock! {
        SwapHelper {}

        impl Clone for SwapHelper {
            fn clone(&self) -> Self;
        }

        impl SwapHelper for SwapHelper {
            fn get_all(&self, condition: SwapCondition) -> QueryResponse<Vec<Swap>>;
            fn update_status(
                &self,
                id: &str,
                status: SwapUpdate,
                failure_reason: Option<String>,
            ) -> QueryResponse<usize>;
        }
    }

    fn get_currencies() -> Currencies {
        static CURRENCIES: OnceLock<Currencies> = OnceLock::new();
        CURRENCIES
            .get_or_init(|| {
                Currencies::from([(
                    String::from("BTC"),
                    Currency {
                        network: Network::Regtest,
                        wallet: Arc::new(Bitcoin::new(Network::Regtest)),
                        chain: Some(Arc::new(Box::new(
                            crate::chain::chain_client::test::get_client(),
                        ))),
                        cln: None,
                        lnd: None,
                    },
                )])
            })
            .clone()
    }

    #[tokio::test]
    async fn test_check_ignore_non_expired() {
        let mut swap = MockSwapHelper::new();
        swap.expect_get_all().returning(|_| {
            Ok(vec![
                Swap {
                    id: "id".to_string(),
                    pair: "L-BTC/BTC".to_string(),
                    orderSide: 1,
                    status: "invoice.set".to_string(),
                    invoice: Some("lno1qgsqvgnwgcg35z6ee2h3yczraddm72xrfua9uve2rlrm9deu7xyfzrc2q3skgumxzcssyeyreggqmet8r4k6krvd3knppsx6c8v5g7tj8hcuq8lleta9ve5n".to_string()),
                    failureReason: None,
                    lockupAddress: "".to_string(),
                }
            ])
        });

        let (tx, _) = tokio::sync::broadcast::channel(1);
        let checker = InvoiceExpiryChecker::new(
            CancellationToken::new(),
            tx,
            Arc::new(get_currencies()),
            Arc::new(swap),
        );

        checker.check().await.unwrap();
    }

    #[tokio::test]
    async fn test_check_expired_invoice() {
        let swap_id = "expired";

        let mut swap = MockSwapHelper::new();
        swap.expect_get_all().returning(|_| {
            Ok(vec![
                Swap {
                    id: swap_id.to_string(),
                    pair: "L-BTC/BTC".to_string(),
                    orderSide: 1,
                    status: "invoice.set".to_string(),
                    invoice: Some("lnbcrt1230p1pnwzkshsp584p434kjslfl030shwps75nvy4leq5k6psvdxn4kzsxjnptlmr3spp5nxqauehzqkx3xswjtrgx9lh5pqjxkyx0kszj0nc4m4jn7uk9gc5qdq8v9ekgesxqyjw5qcqp29qxpqysgqu6ft6p8c36khp082xng2xzmta25nlg803qjncal3fhzw8eshrsdyevhlgs970a09n95r3gtvqvvyk24vyv4506cu6cxl8ytaywrjkhcp468qnl".to_string()),
                    failureReason: None,
                    lockupAddress: "".to_string(),
                }
            ])
        });
        swap.expect_update_status()
            .with(
                predicate::eq(swap_id),
                predicate::eq(SwapUpdate::InvoiceFailedToPay),
                predicate::eq(Some(EXPIRED_INVOICE_FAILURE_REASON.to_string())),
            )
            .returning(|_, _, _| Ok(1));

        let (tx, mut rx) = tokio::sync::broadcast::channel(1);
        let checker = InvoiceExpiryChecker::new(
            CancellationToken::new(),
            tx,
            Arc::new(get_currencies()),
            Arc::new(swap),
        );

        checker.check().await.unwrap();

        let emitted = rx.recv().await.unwrap();
        assert_eq!(
            emitted,
            SwapStatus {
                id: swap_id.to_string(),
                status: SwapUpdate::InvoiceFailedToPay.to_string(),
                failure_reason: Some(EXPIRED_INVOICE_FAILURE_REASON.to_string()),
                zero_conf_rejected: None,
                transaction: None,
                failure_details: None,
                channel_info: None,
            }
        );
    }
}

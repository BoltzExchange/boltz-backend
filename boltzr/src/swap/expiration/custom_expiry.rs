use crate::api::ws::types::SwapStatus;
use crate::db::helpers::referral::ReferralHelper;
use crate::db::helpers::swap::SwapHelper;
use crate::db::models::{Referral, SwapType};
use crate::swap::expiration::ExpirationChecker;
use crate::swap::{serialize_swap_updates, SwapUpdate};
use chrono::Local;
use diesel::{BoolExpressionMethods, ExpressionMethods};
use std::collections::HashMap;
use std::sync::Arc;
use std::time::Duration;
use tracing::{info, instrument, trace};

const FAILURE_REASON_CUSTOM_EXPIRATION: &str = "swap expired";

pub struct CustomExpirationChecker {
    update_tx: tokio::sync::broadcast::Sender<SwapStatus>,
    swap_repo: Arc<dyn SwapHelper + Sync + Send>,
    referral_repo: Arc<dyn ReferralHelper + Sync + Send>,
}

impl CustomExpirationChecker {
    pub fn new(
        update_tx: tokio::sync::broadcast::Sender<SwapStatus>,
        swap_repo: Arc<dyn SwapHelper + Sync + Send>,
        referral_repo: Arc<dyn ReferralHelper + Sync + Send>,
    ) -> Self {
        Self {
            update_tx,
            swap_repo,
            referral_repo,
        }
    }

    fn get_referrals(&self) -> anyhow::Result<HashMap<String, Referral>> {
        let referrals = self
            .referral_repo
            .get_all(Box::new(crate::db::schema::referrals::config.is_not_null()))?;

        Ok(referrals
            .into_iter()
            .map(|referral| (referral.id.clone(), referral))
            .collect())
    }
}

impl ExpirationChecker for CustomExpirationChecker {
    fn name(&self) -> &'static str {
        "Submarine Swaps with custom expiration"
    }

    fn interval(&self) -> Duration {
        Duration::from_secs(60)
    }

    #[instrument(name = "CustomExpirationChecker::check", skip_all)]
    fn check(&self) -> anyhow::Result<()> {
        let referrals = self.get_referrals()?;
        let swaps = self.swap_repo.get_all(Box::new(
            crate::db::schema::swaps::dsl::status
                .eq_any(serialize_swap_updates(&[
                    SwapUpdate::SwapCreated,
                    SwapUpdate::InvoiceSet,
                ]))
                .and(crate::db::schema::swaps::dsl::referral.is_not_null()),
        ))?;

        trace!(
            "Checking for custom expirations of {} Submarine Swaps",
            swaps.len()
        );

        let now = Local::now().naive_utc();

        for swap in swaps {
            let expiration_secs = match referrals.get(&match swap.referral {
                Some(referral) => referral,
                None => continue,
            }) {
                Some(referral) => {
                    match referral.custom_expiration_secs(&swap.pair, SwapType::Submarine)? {
                        Some(expiration) => expiration,
                        None => continue,
                    }
                }
                None => continue,
            };

            if now.signed_duration_since(swap.createdAt).num_seconds() <= expiration_secs as i64 {
                continue;
            }

            info!(
                "Failing Submarine Swap {} because of a custom expiration from the referral",
                swap.id
            );

            let status = SwapUpdate::InvoiceFailedToPay;
            let failure_reason = FAILURE_REASON_CUSTOM_EXPIRATION;

            self.swap_repo
                .update_status(&swap.id, status, Some(failure_reason.to_string()))?;

            self.update_tx.send(SwapStatus {
                id: swap.id,
                status: status.to_string(),
                failure_reason: Some(failure_reason.to_string()),
                ..Default::default()
            })?;
        }

        Ok(())
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use crate::db::helpers::referral::{ReferralCondition, ReferralHelper};
    use crate::db::helpers::swap::{SwapCondition, SwapHelper};
    use crate::db::helpers::QueryResponse;
    use crate::db::models::Swap;
    use mockall::{mock, predicate};

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

    mock! {
        ReferralHelper {}

        impl Clone for ReferralHelper {
            fn clone(&self) -> Self;
        }

        impl ReferralHelper for ReferralHelper {
            fn get_all(&self, condition: ReferralCondition) -> QueryResponse<Vec<Referral>>;
        }
    }

    #[test]
    fn test_get_referrals() {
        let mut referral_repo = MockReferralHelper::new();

        let refs = vec![
            Referral {
                id: "empty".to_string(),
                config: None,
            },
            Referral {
                id: "config".to_string(),
                config: Some(serde_json::json!({ "some": "values"})),
            },
        ];

        let refs_cp = refs.clone();
        referral_repo
            .expect_get_all()
            .returning(move |_| Ok(refs_cp.clone()));

        let (tx, _) = tokio::sync::broadcast::channel(1);
        let referrals = CustomExpirationChecker::new(
            tx,
            Arc::new(MockSwapHelper::new()),
            Arc::new(referral_repo),
        )
        .get_referrals()
        .unwrap();

        assert_eq!(referrals.len(), 2);
        assert_eq!(*referrals.get("empty").unwrap(), refs[0]);
        assert_eq!(*referrals.get("config").unwrap(), refs[1]);
    }

    #[test]
    fn test_check_ignore_not_expired() {
        let mut referral_repo = MockReferralHelper::new();
        referral_repo.expect_get_all().returning(|_| {
            Ok(vec![Referral {
                id: "pro".to_string(),
                config: Some(serde_json::json!({ "expirations": { "0": 120 }})),
            }])
        });

        let mut swap_repo = MockSwapHelper::new();
        swap_repo.expect_get_all().returning(|_| {
            Ok(vec![Swap {
                id: "id".to_string(),
                pair: "BTC/BTC".to_string(),
                referral: Some("pro".to_string()),
                status: SwapUpdate::InvoiceSet.to_string(),
                createdAt: Local::now().naive_utc() - Duration::from_secs(119),
                ..Default::default()
            }])
        });

        let (tx, _) = tokio::sync::broadcast::channel(1);
        let checker =
            CustomExpirationChecker::new(tx, Arc::new(swap_repo), Arc::new(referral_repo));

        checker.check().unwrap();
    }

    #[tokio::test]
    async fn test_check_expired() {
        let mut referral_repo = MockReferralHelper::new();
        referral_repo.expect_get_all().returning(|_| {
            Ok(vec![Referral {
                id: "pro".to_string(),
                config: Some(serde_json::json!({ "expirations": { "0": 120 }})),
            }])
        });

        let mut swap_repo = MockSwapHelper::new();

        let swap_id = "id";
        swap_repo.expect_get_all().returning(|_| {
            Ok(vec![Swap {
                id: swap_id.to_string(),
                pair: "BTC/BTC".to_string(),
                referral: Some("pro".to_string()),
                status: SwapUpdate::InvoiceSet.to_string(),
                createdAt: Local::now().naive_utc() - Duration::from_secs(212),
                ..Default::default()
            }])
        });
        swap_repo
            .expect_update_status()
            .with(
                predicate::eq(swap_id),
                predicate::eq(SwapUpdate::InvoiceFailedToPay),
                predicate::eq(Some(FAILURE_REASON_CUSTOM_EXPIRATION.to_string())),
            )
            .returning(|_, _, _| Ok(1));

        let (tx, mut rx) = tokio::sync::broadcast::channel(1);
        let checker =
            CustomExpirationChecker::new(tx, Arc::new(swap_repo), Arc::new(referral_repo));

        checker.check().unwrap();

        let emitted = rx.recv().await.unwrap();
        assert_eq!(
            emitted,
            SwapStatus {
                id: swap_id.to_string(),
                status: SwapUpdate::InvoiceFailedToPay.to_string(),
                failure_reason: Some(FAILURE_REASON_CUSTOM_EXPIRATION.to_string()),
                ..Default::default()
            }
        );
    }
}

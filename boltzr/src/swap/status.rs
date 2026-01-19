use std::iter::Map;
use std::slice::Iter;
use strum_macros::{Display, EnumString};

#[derive(EnumString, Display, PartialEq, Clone, Copy, Debug)]
pub enum SwapUpdate {
    #[strum(serialize = "swap.created")]
    SwapCreated,
    #[strum(serialize = "swap.expired")]
    SwapExpired,

    #[strum(serialize = "transaction.mempool")]
    TransactionMempool,
    #[strum(serialize = "transaction.confirmed")]
    TransactionConfirmed,
    #[strum(serialize = "transaction.claim.pending")]
    TransactionClaimPending,
    #[strum(serialize = "transaction.claimed")]
    TransactionClaimed,
    #[strum(serialize = "transaction.lockupFailed")]
    TransactionLockupFailed,
    #[strum(serialize = "transaction.zeroconf.rejected")]
    TransactionZeroconfRejected,
    #[strum(serialize = "transaction.direct")]
    TransactionDirect,
    #[strum(serialize = "transaction.refunded")]
    TransactionRefunded,
    #[strum(serialize = "transaction.failed")]
    TransactionFailed,

    #[strum(serialize = "transaction.server.mempool")]
    TransactionServerMempool,
    #[strum(serialize = "transaction.server.confirmed")]
    TransactionServerConfirmed,

    #[strum(serialize = "invoice.set")]
    InvoiceSet,
    #[strum(serialize = "invoice.pending")]
    InvoicePending,
    #[strum(serialize = "invoice.failedToPay")]
    InvoiceFailedToPay,
    #[strum(serialize = "invoice.settled")]
    InvoiceSettled,

    // In case we cannot parse a string
    Unknown,
}

impl SwapUpdate {
    pub fn parse(value: &str) -> Self {
        SwapUpdate::try_from(value).unwrap_or(SwapUpdate::Unknown)
    }

    pub fn is_success(&self) -> bool {
        matches!(
            self,
            SwapUpdate::InvoiceSettled | SwapUpdate::TransactionClaimed
        )
    }

    pub fn is_failed(&self) -> bool {
        matches!(
            self,
            SwapUpdate::SwapExpired
                | SwapUpdate::TransactionFailed
                | SwapUpdate::TransactionLockupFailed
                | SwapUpdate::InvoiceFailedToPay
                | SwapUpdate::TransactionRefunded
        )
    }
}

pub fn serialize_swap_updates(
    status: &[SwapUpdate],
) -> Map<Iter<'_, SwapUpdate>, fn(&SwapUpdate) -> String> {
    status.iter().map(|status| status.to_string())
}

#[derive(EnumString, Display, PartialEq, Clone, Copy, Debug)]
pub enum FundingAddressStatus {
    #[strum(serialize = "created")]
    Created,
    #[strum(serialize = "expired")]
    Expired,
    #[strum(serialize = "signature.required")]
    SignatureRequired,
    #[strum(serialize = "transaction.mempool")]
    TransactionMempool,
    #[strum(serialize = "transaction.confirmed")]
    TransactionConfirmed,
    #[strum(serialize = "transaction.claimed")]
    TransactionClaimed,

    // In case we cannot parse a string
    Unknown,
}

impl Default for FundingAddressStatus {
    fn default() -> Self {
        FundingAddressStatus::Created
    }
}

impl FundingAddressStatus {
    pub fn parse(value: &str) -> Self {
        FundingAddressStatus::try_from(value).unwrap_or(FundingAddressStatus::Unknown)
    }
}

#[cfg(test)]
mod test {
    use crate::swap::{FundingAddressStatus, SwapUpdate, serialize_swap_updates};
    use rstest::*;

    #[rstest]
    #[case(SwapUpdate::SwapCreated)]
    #[case(SwapUpdate::TransactionMempool)]
    #[case(SwapUpdate::TransactionServerMempool)]
    #[case(SwapUpdate::InvoiceSettled)]
    #[case(SwapUpdate::TransactionFailed)]
    fn test_swap_update_parse(#[case] update: SwapUpdate) {
        assert_eq!(SwapUpdate::parse(update.to_string().as_str()), update);
    }

    #[test]
    fn test_serialize_swap_updates() {
        assert_eq!(
            serialize_swap_updates(&[SwapUpdate::SwapCreated]).collect::<Vec<String>>(),
            vec![SwapUpdate::SwapCreated.to_string()]
        );
        assert_eq!(
            serialize_swap_updates(&[SwapUpdate::TransactionMempool, SwapUpdate::SwapExpired])
                .collect::<Vec<String>>(),
            vec![
                SwapUpdate::TransactionMempool.to_string(),
                SwapUpdate::SwapExpired.to_string()
            ]
        );
    }

    #[test]
    fn test_swap_update_is_success() {
        // Success events
        assert!(SwapUpdate::InvoiceSettled.is_success());
        assert!(SwapUpdate::TransactionClaimed.is_success());

        // Non-success events
        assert!(!SwapUpdate::SwapCreated.is_success());
        assert!(!SwapUpdate::SwapExpired.is_success());
        assert!(!SwapUpdate::TransactionMempool.is_success());
        assert!(!SwapUpdate::TransactionConfirmed.is_success());
        assert!(!SwapUpdate::TransactionFailed.is_success());
        assert!(!SwapUpdate::InvoiceFailedToPay.is_success());
        assert!(!SwapUpdate::TransactionRefunded.is_success());
        assert!(!SwapUpdate::TransactionLockupFailed.is_success());
    }

    #[test]
    fn test_swap_update_is_failed() {
        // Failed events
        assert!(SwapUpdate::SwapExpired.is_failed());
        assert!(SwapUpdate::TransactionFailed.is_failed());
        assert!(SwapUpdate::InvoiceFailedToPay.is_failed());
        assert!(SwapUpdate::TransactionRefunded.is_failed());

        // TransactionLockupFailed is NOT considered a failure for funding addresses
        assert!(!SwapUpdate::TransactionLockupFailed.is_failed());

        // Non-failure events
        assert!(!SwapUpdate::SwapCreated.is_failed());
        assert!(!SwapUpdate::TransactionMempool.is_failed());
        assert!(!SwapUpdate::TransactionConfirmed.is_failed());
        assert!(!SwapUpdate::InvoiceSettled.is_failed());
        assert!(!SwapUpdate::TransactionClaimed.is_failed());
    }

    #[rstest]
    #[case(FundingAddressStatus::Created)]
    #[case(FundingAddressStatus::Expired)]
    #[case(FundingAddressStatus::SignatureRequired)]
    #[case(FundingAddressStatus::TransactionMempool)]
    #[case(FundingAddressStatus::TransactionConfirmed)]
    #[case(FundingAddressStatus::TransactionClaimed)]
    fn test_funding_address_status_parse(#[case] status: FundingAddressStatus) {
        assert_eq!(
            FundingAddressStatus::parse(status.to_string().as_str()),
            status
        );
    }

    #[test]
    fn test_funding_address_status_transaction_claimed_serialization() {
        assert_eq!(
            FundingAddressStatus::TransactionClaimed.to_string(),
            "transaction.claimed"
        );
        assert_eq!(
            FundingAddressStatus::parse("transaction.claimed"),
            FundingAddressStatus::TransactionClaimed
        );
    }
}

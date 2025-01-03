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

    #[strum(serialize = "transaction.server.mempool")]
    TransactionServerMempool,
    #[strum(serialize = "transaction.server.confirmed")]
    TransactionServerConfirmed,

    #[strum(serialize = "invoice.pending")]
    InvoicePending,
    #[strum(serialize = "invoice.failedToPay")]
    InvoiceFailedToPay,

    // In case we cannot parse a string
    Unknown,
}

impl SwapUpdate {
    pub fn parse(value: &str) -> Self {
        SwapUpdate::try_from(value).unwrap_or(SwapUpdate::Unknown)
    }
}

pub fn serialize_swap_updates(
    status: &[SwapUpdate],
) -> Map<Iter<SwapUpdate>, fn(&SwapUpdate) -> String> {
    status.iter().map(|status| status.to_string())
}

#[cfg(test)]
mod test {
    use crate::swap::{serialize_swap_updates, SwapUpdate};
    use rstest::*;

    #[rstest]
    #[case(SwapUpdate::SwapCreated)]
    #[case(SwapUpdate::TransactionMempool)]
    #[case(SwapUpdate::TransactionServerMempool)]
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
}

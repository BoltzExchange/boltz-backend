use serde::{Deserialize, Serialize};

#[derive(Deserialize, Serialize, Debug)]
pub(super) struct ZeroConfResponse {
    pub observations: Option<Observations>,
}

#[derive(Deserialize, Serialize, Debug, Default)]
pub(super) struct Observations {
    pub bridge: Option<BridgeData>,
}

#[derive(Deserialize, Serialize, Debug, Default)]
pub(super) struct BridgeData {
    pub seen: u64,
    pub total: u64,
}

#[derive(Debug, PartialEq, Eq)]
pub(super) enum Decision {
    Accept,
    Pending,
}

pub(super) fn evaluate(observations: Option<Observations>) -> Decision {
    let bridge = observations.unwrap_or_default().bridge.unwrap_or_default();
    if bridge.seen > 0 && bridge.seen == bridge.total {
        Decision::Accept
    } else {
        Decision::Pending
    }
}

#[cfg(test)]
mod test {
    use super::*;

    #[test]
    fn evaluate_accepts_on_full_quorum() {
        let obs = Some(Observations {
            bridge: Some(BridgeData { seen: 3, total: 3 }),
        });
        assert_eq!(evaluate(obs), Decision::Accept);
    }

    #[test]
    fn evaluate_pending_on_partial_quorum() {
        let obs = Some(Observations {
            bridge: Some(BridgeData { seen: 2, total: 3 }),
        });
        assert_eq!(evaluate(obs), Decision::Pending);
    }

    #[test]
    fn evaluate_pending_when_zero_seen() {
        let obs = Some(Observations {
            bridge: Some(BridgeData { seen: 0, total: 0 }),
        });
        assert_eq!(evaluate(obs), Decision::Pending);
    }

    #[test]
    fn evaluate_pending_when_observations_missing() {
        assert_eq!(evaluate(None), Decision::Pending);
    }

    #[test]
    fn evaluate_pending_when_bridge_missing() {
        let obs = Some(Observations { bridge: None });
        assert_eq!(evaluate(obs), Decision::Pending);
    }
}

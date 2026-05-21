use crate::chain::elements::zero_conf_tool::shared::{Decision, Observations, evaluate};
use crate::chain::elements::zero_conf_tool::ws::WsZeroConfTool;
use crate::chain::elements::zero_conf_tool::ws::connection::WsConnection;
use crate::chain::elements::zero_conf_tool::ws::protocol::Inbound;
use async_tungstenite::tungstenite::Message;
use tokio::sync::oneshot;
use tokio::time::Instant;
use tracing::{info, trace, warn};

#[derive(Debug)]
pub struct WsTxState {
    pub deadline: Instant,
    pub snapshots_seen: u64,
    pub senders: Vec<oneshot::Sender<bool>>,
}

impl WsZeroConfTool {
    pub fn collect_pending_subscribes(&self, connection: &WsConnection) -> Vec<String> {
        self.to_check
            .iter()
            .filter(|e| !connection.is_subscribed_to(e.key().as_str()))
            .map(|e| e.key().clone())
            .collect()
    }

    pub fn handle_message(&self, msg: Message) -> Option<Vec<String>> {
        let text = match msg {
            Message::Text(t) => t,
            Message::Close(_) => {
                info!("{} 0-conf WS closed", self.symbol);
                return None;
            }
            _ => {
                return None;
            }
        };

        let frame: Inbound = match serde_json::from_str(text.as_ref()) {
            Ok(f) => f,
            Err(e) => {
                warn!(
                    "{} 0-conf WS unparseable frame: {} ({})",
                    self.symbol, e, text
                );
                return None;
            }
        };

        match frame {
            Inbound::Subscribed => None,
            Inbound::Snapshot { txid, observations } => self.handle_snapshot(&txid, observations),
            Inbound::Expired { txid } => {
                self.reject_and_remove(&txid, "expired");
                Some(vec![txid])
            }
            Inbound::Error {
                txid,
                reason,
                message,
            } => {
                warn!(
                    "{} 0-conf WS error frame: reason={:?} message={:?} txid={:?}",
                    self.symbol, reason, message, txid
                );
                if let Some(txid) = txid {
                    self.reject_and_remove(&txid, "error");
                    return Some(vec![txid]);
                }
                None
            }
        }
    }

    fn handle_snapshot(
        &self,
        txid: &str,
        observations: Option<Observations>,
    ) -> Option<Vec<String>> {
        match evaluate(observations) {
            Decision::Accept => {
                let (_, mut state) = self.to_check.remove(txid)?;
                state.snapshots_seen += 1;
                let snapshots = state.snapshots_seen;
                let listeners = state.senders.len();
                for sender in state.senders.drain(..) {
                    let _ = sender.send(true);
                }
                trace!(
                    "{} 0-conf WS accepted {} after {} snapshot(s), {} listener(s)",
                    self.symbol, txid, snapshots, listeners
                );

                #[cfg(feature = "metrics")]
                metrics::counter!(crate::metrics::ZEROCONF_TOOL_TXS, "status" => "accepted")
                    .increment(1);
                #[cfg(feature = "metrics")]
                metrics::counter!(crate::metrics::ZEROCONF_TOOL_TXS_CALLS).increment(snapshots);

                Some(vec![txid.to_string()])
            }
            Decision::Pending => {
                if let Some(mut state) = self.to_check.get_mut(txid) {
                    state.snapshots_seen += 1;
                }
                None
            }
        }
    }

    pub fn reject_and_remove(&self, txid: &str, reason: &str) {
        let Some((_, mut state)) = self.to_check.remove(txid) else {
            return;
        };
        let listeners = state.senders.len();
        for sender in state.senders.drain(..) {
            let _ = sender.send(false);
        }
        trace!(
            "{} 0-conf WS rejected {} ({}, listeners={}, snapshots={})",
            self.symbol, txid, reason, listeners, state.snapshots_seen
        );

        #[cfg(feature = "metrics")]
        metrics::counter!(crate::metrics::ZEROCONF_TOOL_TXS, "status" => "rejected").increment(1);
    }

    pub fn expire_deadlines(&self) -> Vec<String> {
        let now = Instant::now();
        let expired: Vec<String> = self
            .to_check
            .iter()
            .filter(|e| e.value().deadline <= now)
            .map(|e| e.key().clone())
            .collect();

        let mut to_unsub = Vec::new();
        for txid in expired {
            self.reject_and_remove(&txid, "deadline");
            to_unsub.push(txid);
        }
        to_unsub
    }
}

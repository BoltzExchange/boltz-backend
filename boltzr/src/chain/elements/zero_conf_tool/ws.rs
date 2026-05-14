use crate::chain::elements::ZeroConfCheck;
use crate::chain::elements::zero_conf_tool::config::ZeroConfToolConfig;
use crate::chain::elements::zero_conf_tool::shared::{Decision, Observations, evaluate};
use crate::chain::utils::Transaction;
use anyhow::{Context, Result};
use async_tungstenite::tungstenite::Message;
use dashmap::DashMap;
use futures::StreamExt as _;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use std::time::Duration;
use tokio::sync::{Notify, oneshot};
use tokio::time::{Instant, Interval, MissedTickBehavior, interval_at};
use tokio_util::sync::CancellationToken;
use tracing::{debug, error, info, trace, warn};

const DEFAULT_DEADLINE_SECS: u64 = 6;
const DEFAULT_RECONNECT_DELAY_SECS: u64 = 5;
const DEADLINE_TICK: Duration = Duration::from_millis(50);

#[derive(Serialize, Debug)]
#[serde(tag = "action", rename_all = "lowercase")]
enum Outbound<'a> {
    Subscribe { txid: &'a str },
    Unsubscribe { txid: &'a str },
}

#[derive(Deserialize, Debug)]
#[serde(tag = "action", rename_all = "lowercase")]
enum Inbound {
    Subscribed {
        #[allow(dead_code)]
        txid: String,
    },
    Snapshot {
        txid: String,
        observations: Option<Observations>,
    },
    Expired {
        txid: String,
    },
    Error {
        #[serde(default)]
        txid: Option<String>,
        #[serde(default)]
        reason: Option<String>,
        #[serde(default)]
        message: Option<String>,
    },
}

#[derive(Debug)]
struct WsTxState {
    deadline: Instant,
    snapshots_seen: u64,
    senders: Vec<oneshot::Sender<bool>>,
    /// `true` when a subscribe frame has been written on the *current* WS
    /// connection. Reset to `false` on (re)connect because the server forgot.
    subscribed: bool,
}

#[derive(Clone)]
pub struct WsZeroConfTool {
    symbol: String,
    endpoint: String,
    deadline: Duration,

    to_check: Arc<DashMap<String, WsTxState>>,
    /// Wakes the run loop when there is reconcile work to do (new entries to
    /// subscribe to). The run loop is the sole writer to the WebSocket sink,
    /// which makes the protocol race-free without per-frame coordination.
    wake: Arc<Notify>,
}

impl WsZeroConfTool {
    pub fn new(
        cancellation_token: CancellationToken,
        symbol: String,
        config: ZeroConfToolConfig,
    ) -> Self {
        Self::new_internal(
            cancellation_token,
            symbol,
            config,
            Duration::from_secs(DEFAULT_RECONNECT_DELAY_SECS),
        )
    }

    fn new_internal(
        cancellation_token: CancellationToken,
        symbol: String,
        config: ZeroConfToolConfig,
        reconnect_delay: Duration,
    ) -> Self {
        let deadline = Duration::from_secs(config.deadline_secs.unwrap_or(DEFAULT_DEADLINE_SECS));

        let tool = WsZeroConfTool {
            symbol,
            endpoint: config.endpoint,
            deadline,
            to_check: Arc::new(DashMap::new()),
            wake: Arc::new(Notify::new()),
        };

        info!(
            "Subscribing to {} 0-conf updates at {} (deadline {}s)",
            tool.symbol,
            tool.endpoint,
            deadline.as_secs()
        );

        {
            let tool = tool.clone();
            tokio::spawn(async move {
                tool.run(cancellation_token, reconnect_delay).await;
            });
        }

        tool
    }

    async fn run(&self, cancellation_token: CancellationToken, reconnect_delay: Duration) {
        let mut deadline_ticker = Self::deadline_interval();

        'worker: loop {
            if cancellation_token.is_cancelled() {
                return;
            }

            let connect = async_tungstenite::tokio::connect_async(self.endpoint.as_str());
            tokio::pin!(connect);

            let stream = loop {
                tokio::select! {
                    r = &mut connect => match r {
                        Ok((stream, _resp)) => break stream,
                        Err(e) => {
                            error!(
                                "{} 0-conf WS connect to {} failed: {}",
                                self.symbol, self.endpoint, e
                            );
                            if !self
                                .sleep_with_deadline_expiry(
                                    &cancellation_token,
                                    reconnect_delay,
                                    &mut deadline_ticker,
                                )
                                .await
                            {
                                return;
                            }
                            continue 'worker;
                        }
                    },
                    _ = deadline_ticker.tick() => {
                        let _ = self.expire_deadlines();
                    },
                    _ = cancellation_token.cancelled() => return,
                }
            };

            debug!("{} 0-conf WS connected to {}", self.symbol, self.endpoint);

            let (mut ws_tx, mut ws_rx) = stream.split();

            // The server forgets our subscriptions across reconnects; flag every
            // pending entry so the next reconcile pass re-subscribes.
            for mut entry in self.to_check.iter_mut() {
                entry.subscribed = false;
            }
            self.wake.notify_one();

            let mut alive = true;
            while alive {
                tokio::select! {
                    biased;

                    _ = cancellation_token.cancelled() => return,

                    incoming = ws_rx.next() => {
                        match incoming {
                            Some(Ok(Message::Ping(payload))) => {
                                if let Err(e) = send_pong(&mut ws_tx, payload).await {
                                    warn!("{} 0-conf WS pong failed: {:#}", self.symbol, e);
                                    alive = false;
                                }
                            }
                            Some(Ok(msg)) => {
                                if let Some(unsubs) = self.handle_message(msg) {
                                    for txid in unsubs {
                                        if let Err(e) = send_unsubscribe(&mut ws_tx, &txid).await {
                                            warn!(
                                                "{} 0-conf WS unsubscribe failed: {:#}",
                                                self.symbol, e
                                            );
                                            alive = false;
                                            break;
                                        }
                                    }
                                }
                            }
                            Some(Err(e)) => {
                                warn!("{} 0-conf WS read error: {}", self.symbol, e);
                                alive = false;
                            }
                            None => {
                                debug!("{} 0-conf WS stream closed by peer", self.symbol);
                                alive = false;
                            }
                        }
                    }

                    _ = self.wake.notified() => {
                        let pending = self.collect_pending_subscribes();
                        for txid in pending {
                            if let Err(e) = send_subscribe(&mut ws_tx, &txid).await {
                                warn!("{} 0-conf WS subscribe failed: {:#}", self.symbol, e);
                                alive = false;
                                break;
                            }
                            if let Some(mut state) = self.to_check.get_mut(&txid) {
                                state.subscribed = true;
                            }
                        }
                    }

                    _ = deadline_ticker.tick() => {
                        let unsubs = self.expire_deadlines();
                        for txid in unsubs {
                            if let Err(e) = send_unsubscribe(&mut ws_tx, &txid).await {
                                warn!("{} 0-conf WS unsubscribe failed: {:#}", self.symbol, e);
                                alive = false;
                                break;
                            }
                        }
                    }
                }
            }

            if !self
                .sleep_with_deadline_expiry(
                    &cancellation_token,
                    reconnect_delay,
                    &mut deadline_ticker,
                )
                .await
            {
                return;
            }
        }
    }

    fn deadline_interval() -> Interval {
        let mut deadline_ticker = interval_at(Instant::now() + DEADLINE_TICK, DEADLINE_TICK);
        deadline_ticker.set_missed_tick_behavior(MissedTickBehavior::Delay);
        deadline_ticker
    }

    async fn sleep_with_deadline_expiry(
        &self,
        cancellation_token: &CancellationToken,
        delay: Duration,
        deadline_ticker: &mut Interval,
    ) -> bool {
        let sleep = tokio::time::sleep(delay);
        tokio::pin!(sleep);

        loop {
            tokio::select! {
                _ = &mut sleep => return true,
                _ = deadline_ticker.tick() => {
                    let _ = self.expire_deadlines();
                },
                _ = cancellation_token.cancelled() => return false,
            }
        }
    }

    fn collect_pending_subscribes(&self) -> Vec<String> {
        self.to_check
            .iter()
            .filter(|e| !e.value().subscribed)
            .map(|e| e.key().clone())
            .collect()
    }

    fn handle_message(&self, msg: Message) -> Option<Vec<String>> {
        let text = match msg {
            Message::Text(t) => t,
            Message::Binary(_) | Message::Pong(_) | Message::Close(_) => {
                return None;
            }
            other => {
                trace!("{} 0-conf WS ignoring frame: {:?}", self.symbol, other);
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
            Inbound::Subscribed { txid } => {
                trace!("{} 0-conf WS subscribed to {}", self.symbol, txid);
                None
            }
            Inbound::Snapshot { txid, observations } => self.handle_snapshot(&txid, observations),
            Inbound::Expired { txid } => {
                self.reject_and_remove(&txid, "expired");
                None
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
                let Some((_, mut state)) = self.to_check.remove(txid) else {
                    trace!(
                        "{} 0-conf WS accept snapshot for unknown txid {}",
                        self.symbol, txid
                    );
                    return None;
                };
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

                // Only emit unsubscribe if the server knew about this subscription.
                if state.subscribed {
                    Some(vec![txid.to_string()])
                } else {
                    None
                }
            }
            Decision::Pending => {
                if let Some(mut state) = self.to_check.get_mut(txid) {
                    state.snapshots_seen += 1;
                }
                None
            }
        }
    }

    fn reject_and_remove(&self, txid: &str, reason: &str) {
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

    fn expire_deadlines(&self) -> Vec<String> {
        let now = Instant::now();
        let expired: Vec<String> = self
            .to_check
            .iter()
            .filter(|e| e.value().deadline <= now)
            .map(|e| e.key().clone())
            .collect();

        let mut to_unsub = Vec::new();
        for txid in expired {
            let was_subscribed = self
                .to_check
                .get(&txid)
                .map(|e| e.subscribed)
                .unwrap_or(false);
            self.reject_and_remove(&txid, "deadline");
            if was_subscribed {
                to_unsub.push(txid);
            }
        }
        to_unsub
    }
}

async fn send_subscribe<S>(sink: &mut S, txid: &str) -> Result<()>
where
    S: futures::Sink<Message> + Unpin,
    S::Error: std::error::Error + Send + Sync + 'static,
{
    let frame = serde_json::to_string(&Outbound::Subscribe { txid })
        .context("serialize subscribe frame")?;
    futures::SinkExt::send(sink, Message::text(frame))
        .await
        .with_context(|| format!("send subscribe for {txid}"))?;
    Ok(())
}

async fn send_unsubscribe<S>(sink: &mut S, txid: &str) -> Result<()>
where
    S: futures::Sink<Message> + Unpin,
    S::Error: std::error::Error + Send + Sync + 'static,
{
    let frame = serde_json::to_string(&Outbound::Unsubscribe { txid })
        .context("serialize unsubscribe frame")?;
    futures::SinkExt::send(sink, Message::text(frame))
        .await
        .with_context(|| format!("send unsubscribe for {txid}"))?;
    Ok(())
}

async fn send_pong<S>(sink: &mut S, payload: bytes::Bytes) -> Result<()>
where
    S: futures::Sink<Message> + Unpin,
    S::Error: std::error::Error + Send + Sync + 'static,
{
    futures::SinkExt::send(sink, Message::Pong(payload))
        .await
        .context("send pong")?;
    Ok(())
}

impl ZeroConfCheck for WsZeroConfTool {
    fn check_transaction(&self, transaction: &Transaction) -> oneshot::Receiver<bool> {
        let tx_id = transaction.txid_hex();
        let (tx, rx) = oneshot::channel();

        let mut entry = self.to_check.entry(tx_id).or_insert_with(|| WsTxState {
            deadline: Instant::now() + self.deadline,
            snapshots_seen: 0,
            senders: Vec::new(),
            subscribed: false,
        });
        let needs_subscribe = !entry.subscribed;
        entry.senders.push(tx);
        drop(entry);

        if needs_subscribe {
            self.wake.notify_one();
        }

        rx
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use crate::chain::elements::zero_conf_tool::shared::{BridgeData, Observations};
    use crate::chain::types::Type;
    use async_tungstenite::tokio::accept_async;
    use serde_json::{Value, json};
    use std::net::SocketAddr;
    use tokio::net::TcpListener;
    use tokio::sync::Mutex;
    use tokio::sync::mpsc;

    const TX_HEX: &str = "0200000000010103645fa5850fa5800a87b2a8c79b9326c81c0efe3ad487a6aade4f9fc57578550100000000fdffffff02406f40010000000022512060b5cba1e3a0577877cd2978dfc4d859c0f8e6a5f627c93ef339d3f886fe52e7e7575a3a00000000225120bb7beca2338aeaa5cf8237c3106b63a70bfebb8ced05f82c7ccc399ba815da610247304402205bf0c42957549cac99a3fab2a562090ea2b7aff0612efbdd38877b2327523a69022074781677c7e25d3632bfaec4cc350c4624db73e3d91ed9bf02f24ccd856bc582012103fbc5c2e836f3d7a088214b265b6afafa3186852d95032ed0d122e5b96d74997791000000";

    enum ServerOp {
        Send(String),
        Ping(bytes::Bytes),
        Drop,
    }

    struct WsHarness {
        addr: SocketAddr,
        ops_tx: mpsc::UnboundedSender<ServerOp>,
        incoming_rx: Mutex<mpsc::UnboundedReceiver<Value>>,
        pongs_rx: Mutex<mpsc::UnboundedReceiver<bytes::Bytes>>,
        cancel: CancellationToken,
    }

    impl WsHarness {
        async fn start() -> Arc<Self> {
            let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
            let addr = listener.local_addr().unwrap();
            let (ops_tx, ops_rx) = mpsc::unbounded_channel();
            let (incoming_tx, incoming_rx) = mpsc::unbounded_channel();
            let (pongs_tx, pongs_rx) = mpsc::unbounded_channel();
            let cancel = CancellationToken::new();
            let cancel_inner = cancel.clone();

            tokio::spawn(run_server(
                listener,
                ops_rx,
                incoming_tx,
                pongs_tx,
                cancel_inner,
            ));

            Arc::new(WsHarness {
                addr,
                ops_tx,
                incoming_rx: Mutex::new(incoming_rx),
                pongs_rx: Mutex::new(pongs_rx),
                cancel,
            })
        }

        fn url(&self) -> String {
            format!("ws://{}", self.addr)
        }

        fn send(&self, payload: Value) {
            self.ops_tx
                .send(ServerOp::Send(payload.to_string()))
                .expect("harness server alive");
        }

        fn send_ping(&self, payload: bytes::Bytes) {
            self.ops_tx
                .send(ServerOp::Ping(payload))
                .expect("harness server alive");
        }

        fn drop_connection(&self) {
            self.ops_tx
                .send(ServerOp::Drop)
                .expect("harness server alive");
        }

        async fn recv(&self) -> Value {
            let mut rx = self.incoming_rx.lock().await;
            tokio::time::timeout(Duration::from_secs(5), rx.recv())
                .await
                .expect("timed out waiting for ws frame")
                .expect("ws harness closed")
        }

        async fn recv_pong(&self) -> bytes::Bytes {
            let mut rx = self.pongs_rx.lock().await;
            tokio::time::timeout(Duration::from_secs(5), rx.recv())
                .await
                .expect("timed out waiting for ws pong")
                .expect("ws harness closed")
        }
    }

    impl Drop for WsHarness {
        fn drop(&mut self) {
            self.cancel.cancel();
        }
    }

    async fn run_server(
        listener: TcpListener,
        mut ops_rx: mpsc::UnboundedReceiver<ServerOp>,
        incoming_tx: mpsc::UnboundedSender<Value>,
        pongs_tx: mpsc::UnboundedSender<bytes::Bytes>,
        cancel: CancellationToken,
    ) {
        loop {
            let (stream, _) = tokio::select! {
                r = listener.accept() => match r {
                    Ok(p) => p,
                    Err(_) => return,
                },
                _ = cancel.cancelled() => return,
            };

            let ws = match accept_async(stream).await {
                Ok(ws) => ws,
                Err(_) => continue,
            };

            let (mut sink, mut stream) = ws.split();

            let incoming_tx_inner = incoming_tx.clone();
            let pongs_tx_inner = pongs_tx.clone();
            let read_task = tokio::spawn(async move {
                while let Some(Ok(msg)) = stream.next().await {
                    match msg {
                        Message::Text(t) => {
                            if let Ok(v) = serde_json::from_str::<Value>(t.as_ref()) {
                                let _ = incoming_tx_inner.send(v);
                            }
                        }
                        Message::Pong(payload) => {
                            let _ = pongs_tx_inner.send(payload);
                        }
                        _ => {}
                    }
                }
            });

            loop {
                tokio::select! {
                    op = ops_rx.recv() => match op {
                        Some(ServerOp::Send(t)) => {
                            if sink.send(Message::text(t)).await.is_err() {
                                break;
                            }
                        }
                        Some(ServerOp::Ping(payload)) => {
                            if sink.send(Message::Ping(payload)).await.is_err() {
                                break;
                            }
                        }
                        Some(ServerOp::Drop) => break,
                        None => return,
                    },
                    _ = cancel.cancelled() => return,
                }
            }

            drop(sink);
            read_task.abort();
            let _ = read_task.await;
        }
    }

    fn tool_config(endpoint: String, deadline_secs: Option<u64>) -> ZeroConfToolConfig {
        ZeroConfToolConfig {
            endpoint,
            interval: None,
            max_retries: None,
            deadline_secs,
        }
    }

    fn make_tool(
        cancel: CancellationToken,
        endpoint: String,
        deadline_secs: Option<u64>,
        reconnect_delay: Duration,
    ) -> WsZeroConfTool {
        WsZeroConfTool::new_internal(
            cancel,
            "L-BTC".to_string(),
            tool_config(endpoint, deadline_secs),
            reconnect_delay,
        )
    }

    fn tx() -> Transaction {
        Transaction::parse_hex(&Type::Bitcoin, TX_HEX).unwrap()
    }

    #[tokio::test]
    async fn test_new_uses_default_deadline() {
        let cancel = CancellationToken::new();
        let tool = make_tool(
            cancel.clone(),
            "ws://127.0.0.1:1".to_string(),
            None,
            Duration::from_millis(50),
        );
        assert_eq!(tool.deadline, Duration::from_secs(DEFAULT_DEADLINE_SECS));
        cancel.cancel();
    }

    #[tokio::test]
    async fn test_accept_on_full_bridge_quorum() {
        let harness = WsHarness::start().await;
        let cancel = CancellationToken::new();
        let tool = make_tool(
            cancel.clone(),
            harness.url(),
            Some(10),
            Duration::from_millis(50),
        );

        let tx = tx();
        let rx = tool.check_transaction(&tx);

        let subscribe = harness.recv().await;
        assert_eq!(subscribe["action"], "subscribe");
        assert_eq!(subscribe["txid"], tx.txid_hex());

        harness.send(json!({
            "action": "snapshot",
            "txid": tx.txid_hex(),
            "observations": Observations { bridge: Some(BridgeData { seen: 3, total: 3 }) },
        }));

        assert!(rx.await.unwrap());

        let unsubscribe = harness.recv().await;
        assert_eq!(unsubscribe["action"], "unsubscribe");
        assert_eq!(unsubscribe["txid"], tx.txid_hex());

        assert!(tool.to_check.is_empty());

        cancel.cancel();
    }

    #[tokio::test]
    async fn test_pending_then_accept() {
        let harness = WsHarness::start().await;
        let cancel = CancellationToken::new();
        let tool = make_tool(
            cancel.clone(),
            harness.url(),
            Some(10),
            Duration::from_millis(50),
        );

        let tx = tx();
        let rx = tool.check_transaction(&tx);
        let _ = harness.recv().await;

        harness.send(json!({
            "action": "snapshot",
            "txid": tx.txid_hex(),
            "observations": Observations { bridge: Some(BridgeData { seen: 1, total: 3 }) },
        }));
        harness.send(json!({
            "action": "snapshot",
            "txid": tx.txid_hex(),
            "observations": Observations { bridge: Some(BridgeData { seen: 3, total: 3 }) },
        }));

        assert!(rx.await.unwrap());
        cancel.cancel();
    }

    #[tokio::test]
    async fn test_reject_on_expired() {
        let harness = WsHarness::start().await;
        let cancel = CancellationToken::new();
        let tool = make_tool(
            cancel.clone(),
            harness.url(),
            Some(10),
            Duration::from_millis(50),
        );

        let tx = tx();
        let rx = tool.check_transaction(&tx);
        let _ = harness.recv().await;

        harness.send(json!({
            "action": "expired",
            "txid": tx.txid_hex(),
        }));

        assert!(!rx.await.unwrap());
        assert!(tool.to_check.is_empty());
        cancel.cancel();
    }

    #[tokio::test]
    async fn test_reject_on_deadline() {
        let harness = WsHarness::start().await;
        let cancel = CancellationToken::new();
        let tool = make_tool(
            cancel.clone(),
            harness.url(),
            Some(1),
            Duration::from_millis(50),
        );

        let tx = tx();
        let rx = tool.check_transaction(&tx);
        let _ = harness.recv().await;

        // Real-network setup is done; pause the clock and fast-forward past
        // the deadline so the ticker fires without any real sleep.
        tokio::time::pause();
        tokio::time::advance(Duration::from_millis(1_100)).await;

        assert!(!rx.await.unwrap());
        cancel.cancel();
    }

    #[tokio::test]
    async fn test_deadline_expires_while_endpoint_unavailable() {
        tokio::time::pause();

        let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
        let endpoint = format!("ws://{}", listener.local_addr().unwrap());
        drop(listener);

        let cancel = CancellationToken::new();
        let tool = make_tool(cancel.clone(), endpoint, Some(1), Duration::from_secs(60));

        let tx = tx();
        let rx = tool.check_transaction(&tx);

        tokio::task::yield_now().await;
        tokio::time::advance(Duration::from_millis(1_100)).await;

        assert!(!rx.await.unwrap());
        assert!(tool.to_check.is_empty());
        cancel.cancel();
    }

    #[tokio::test]
    async fn test_deadline_expires_during_reconnect_backoff() {
        let harness = WsHarness::start().await;
        let cancel = CancellationToken::new();
        let tool = make_tool(
            cancel.clone(),
            harness.url(),
            Some(1),
            Duration::from_secs(60),
        );

        let tx = tx();
        let rx = tool.check_transaction(&tx);
        let subscribe = harness.recv().await;
        assert_eq!(subscribe["action"], "subscribe");

        harness.drop_connection();

        tokio::time::pause();
        tokio::task::yield_now().await;
        tokio::time::advance(Duration::from_millis(1_100)).await;

        assert!(!rx.await.unwrap());
        assert!(tool.to_check.is_empty());
        cancel.cancel();
    }

    #[tokio::test]
    async fn test_fanout_for_duplicate_txid() {
        let harness = WsHarness::start().await;
        let cancel = CancellationToken::new();
        let tool = make_tool(
            cancel.clone(),
            harness.url(),
            Some(10),
            Duration::from_millis(50),
        );

        let tx = tx();
        let rx1 = tool.check_transaction(&tx);
        let rx2 = tool.check_transaction(&tx);

        let subscribe = harness.recv().await;
        assert_eq!(subscribe["action"], "subscribe");

        // Drive the protocol to completion: if a duplicate subscribe had been
        // sent, the next received frame would be that second subscribe rather
        // than the eventual unsubscribe-after-accept. That's a sharper signal
        // than waiting on a wall clock to prove a negative.
        harness.send(json!({
            "action": "snapshot",
            "txid": tx.txid_hex(),
            "observations": Observations { bridge: Some(BridgeData { seen: 3, total: 3 }) },
        }));

        assert!(rx1.await.unwrap());
        assert!(rx2.await.unwrap());

        let next = harness.recv().await;
        assert_eq!(next["action"], "unsubscribe", "duplicate subscribe leaked");
        assert_eq!(next["txid"], tx.txid_hex());

        cancel.cancel();
    }

    #[tokio::test]
    async fn test_error_frame_rejects_targeted_txid() {
        let harness = WsHarness::start().await;
        let cancel = CancellationToken::new();
        let tool = make_tool(
            cancel.clone(),
            harness.url(),
            Some(10),
            Duration::from_millis(50),
        );

        let tx = tx();
        let rx = tool.check_transaction(&tx);
        let _ = harness.recv().await;

        harness.send(json!({
            "action": "error",
            "txid": tx.txid_hex(),
            "reason": "bad_txid",
            "message": "TXID must be 64 hex characters",
        }));

        assert!(!rx.await.unwrap());
        assert!(tool.to_check.is_empty());
        cancel.cancel();
    }

    #[tokio::test]
    async fn test_reconnect_resubscribes() {
        let harness = WsHarness::start().await;
        let cancel = CancellationToken::new();
        let tool = make_tool(
            cancel.clone(),
            harness.url(),
            Some(10),
            Duration::from_millis(50),
        );

        let tx = tx();
        let rx = tool.check_transaction(&tx);

        let first_subscribe = harness.recv().await;
        assert_eq!(first_subscribe["action"], "subscribe");

        // Drop the current server connection. Client should reconnect and re-subscribe.
        harness.drop_connection();

        let second_subscribe = harness.recv().await;
        assert_eq!(second_subscribe["action"], "subscribe");
        assert_eq!(second_subscribe["txid"], tx.txid_hex());

        harness.send(json!({
            "action": "snapshot",
            "txid": tx.txid_hex(),
            "observations": Observations { bridge: Some(BridgeData { seen: 3, total: 3 }) },
        }));

        assert!(rx.await.unwrap());
        cancel.cancel();
    }

    #[tokio::test]
    async fn test_responds_to_ping_with_matching_pong() {
        let harness = WsHarness::start().await;
        let cancel = CancellationToken::new();
        let tool = make_tool(
            cancel.clone(),
            harness.url(),
            Some(10),
            Duration::from_millis(50),
        );

        // Force the connection to be established by triggering a subscribe,
        // then drain the subscribe frame so it doesn't pollute later assertions.
        let tx = tx();
        let _rx = tool.check_transaction(&tx);
        let _ = harness.recv().await;

        let payload = bytes::Bytes::from_static(b"heartbeat-42");
        harness.send_ping(payload.clone());

        let pong = harness.recv_pong().await;
        assert_eq!(pong, payload);

        cancel.cancel();
    }
}

use super::*;
use crate::chain::elements::zero_conf_tool::shared::{BridgeData, Observations};
use crate::chain::types::Type;
use async_tungstenite::tokio::accept_async;
use serde_json::{Value, json};
use std::net::SocketAddr;
use std::sync::Mutex as StdMutex;
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
    connections: Arc<StdMutex<Vec<mpsc::UnboundedSender<ServerOp>>>>,
    incoming_rx: Mutex<mpsc::UnboundedReceiver<Value>>,
    pongs_rx: Mutex<mpsc::UnboundedReceiver<bytes::Bytes>>,
    accept_cancel: CancellationToken,
    cancel: CancellationToken,
}

impl WsHarness {
    async fn start() -> Arc<Self> {
        let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
        let addr = listener.local_addr().unwrap();
        let (incoming_tx, incoming_rx) = mpsc::unbounded_channel();
        let (pongs_tx, pongs_rx) = mpsc::unbounded_channel();
        let connections = Arc::new(StdMutex::new(Vec::new()));
        let accept_cancel = CancellationToken::new();
        let cancel = CancellationToken::new();
        let connections_inner = connections.clone();
        let accept_cancel_inner = accept_cancel.clone();
        let cancel_inner = cancel.clone();

        tokio::spawn(run_server(
            listener,
            connections_inner,
            incoming_tx,
            pongs_tx,
            accept_cancel_inner,
            cancel_inner,
        ));

        Arc::new(WsHarness {
            addr,
            connections,
            incoming_rx: Mutex::new(incoming_rx),
            pongs_rx: Mutex::new(pongs_rx),
            accept_cancel,
            cancel,
        })
    }

    fn url(&self) -> String {
        format!("ws://{}", self.addr)
    }

    fn send(&self, payload: Value) {
        self.latest_connection()
            .send(ServerOp::Send(payload.to_string()))
            .expect("harness server alive");
    }

    fn send_ping(&self, payload: bytes::Bytes) {
        self.latest_connection()
            .send(ServerOp::Ping(payload))
            .expect("harness server alive");
    }

    fn drop_connection(&self) {
        self.latest_connection()
            .send(ServerOp::Drop)
            .expect("harness server alive");
    }

    fn stop_accepting(&self) {
        self.accept_cancel.cancel();
    }

    fn latest_connection(&self) -> mpsc::UnboundedSender<ServerOp> {
        self.connections
            .lock()
            .unwrap()
            .last()
            .expect("at least one websocket connection")
            .clone()
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
        self.accept_cancel.cancel();
        self.cancel.cancel();
    }
}

async fn run_server(
    listener: TcpListener,
    connections: Arc<StdMutex<Vec<mpsc::UnboundedSender<ServerOp>>>>,
    incoming_tx: mpsc::UnboundedSender<Value>,
    pongs_tx: mpsc::UnboundedSender<bytes::Bytes>,
    accept_cancel: CancellationToken,
    cancel: CancellationToken,
) {
    loop {
        let (stream, _) = tokio::select! {
            r = listener.accept() => match r {
                Ok(p) => p,
                Err(_) => return,
            },
            _ = accept_cancel.cancelled() => return,
            _ = cancel.cancelled() => return,
        };

        let ws = match accept_async(stream).await {
            Ok(ws) => ws,
            Err(_) => continue,
        };

        let (ops_tx, ops_rx) = mpsc::unbounded_channel();
        connections.lock().unwrap().push(ops_tx);
        tokio::spawn(handle_connection(
            ws,
            ops_rx,
            incoming_tx.clone(),
            pongs_tx.clone(),
            cancel.clone(),
        ));
    }
}

async fn handle_connection(
    ws: async_tungstenite::WebSocketStream<
        async_tungstenite::tokio::TokioAdapter<tokio::net::TcpStream>,
    >,
    mut ops_rx: mpsc::UnboundedReceiver<ServerOp>,
    incoming_tx: mpsc::UnboundedSender<Value>,
    pongs_tx: mpsc::UnboundedSender<bytes::Bytes>,
    cancel: CancellationToken,
) {
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
                None => break,
            },
            _ = cancel.cancelled() => break,
        }
    }

    drop(sink);
    read_task.abort();
    let _ = read_task.await;
}

fn tool_config(
    endpoint: String,
    deadline_secs: Option<u64>,
    rotation_interval_secs: Option<u64>,
) -> ZeroConfToolConfig {
    ZeroConfToolConfig {
        endpoint,
        interval: None,
        max_retries: None,
        deadline_secs,
        rotation_interval_secs,
    }
}

fn make_tool(
    cancel: CancellationToken,
    endpoint: String,
    deadline_secs: Option<u64>,
    reconnect_delay: Duration,
) -> WsZeroConfTool {
    make_tool_with_rotation(cancel, endpoint, deadline_secs, Some(0), reconnect_delay)
}

fn make_tool_with_rotation(
    cancel: CancellationToken,
    endpoint: String,
    deadline_secs: Option<u64>,
    rotation_interval_secs: Option<u64>,
    reconnect_delay: Duration,
) -> WsZeroConfTool {
    WsZeroConfTool::new_internal(
        cancel,
        "L-BTC".to_string(),
        tool_config(endpoint, deadline_secs, rotation_interval_secs),
        reconnect_delay,
    )
}

fn tx() -> Transaction {
    Transaction::parse_hex(&Type::Bitcoin, TX_HEX).unwrap()
}

fn tx_alt() -> Transaction {
    let mut bytes = hex::decode(TX_HEX).unwrap();
    let last = bytes.len() - 1;
    bytes[last] = 1;
    Transaction::parse(&Type::Bitcoin, &bytes).unwrap()
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
async fn test_new_uses_default_rotation_interval() {
    let cancel = CancellationToken::new();
    let tool = make_tool_with_rotation(
        cancel.clone(),
        "ws://127.0.0.1:1".to_string(),
        None,
        None,
        Duration::from_millis(50),
    );
    assert_eq!(
        tool.rotation_interval,
        Some(Duration::from_secs(DEFAULT_ROTATION_INTERVAL_SECS))
    );
    cancel.cancel();
}

#[tokio::test]
async fn test_new_can_disable_rotation() {
    let cancel = CancellationToken::new();
    let tool = make_tool(
        cancel.clone(),
        "ws://127.0.0.1:1".to_string(),
        None,
        Duration::from_millis(50),
    );
    assert_eq!(tool.rotation_interval, None);
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
async fn test_expired_unsubscribes_and_clears_subscription() {
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
        "action": "expired",
        "txid": tx.txid_hex(),
    }));

    assert!(!rx.await.unwrap());

    let unsubscribe = harness.recv().await;
    assert_eq!(unsubscribe["action"], "unsubscribe");
    assert_eq!(unsubscribe["txid"], tx.txid_hex());

    let _rx2 = tool.check_transaction(&tx);
    let resubscribe = harness.recv().await;
    assert_eq!(resubscribe["action"], "subscribe");
    assert_eq!(resubscribe["txid"], tx.txid_hex());

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

    // Real-network setup is done; wait past the deadline so the ticker
    // fires while the harness connection is active.
    tokio::time::sleep(Duration::from_millis(1_100)).await;

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
async fn test_rotation_replays_subscriptions_and_promotes() {
    let harness = WsHarness::start().await;
    let cancel = CancellationToken::new();
    let tool = make_tool_with_rotation(
        cancel.clone(),
        harness.url(),
        Some(10),
        Some(1),
        Duration::from_millis(50),
    );

    let tx = tx();
    let rx = tool.check_transaction(&tx);

    let first_subscribe = harness.recv().await;
    assert_eq!(first_subscribe["action"], "subscribe");
    assert_eq!(first_subscribe["txid"], tx.txid_hex());

    tokio::time::sleep(Duration::from_millis(1_100)).await;

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
async fn test_new_tx_subscribes_after_rotation_promotion() {
    let harness = WsHarness::start().await;
    let cancel = CancellationToken::new();
    let tool = make_tool_with_rotation(
        cancel.clone(),
        harness.url(),
        Some(10),
        Some(1),
        Duration::from_millis(50),
    );

    let tx = tx();
    let _rx = tool.check_transaction(&tx);

    let first_subscribe = harness.recv().await;
    assert_eq!(first_subscribe["action"], "subscribe");

    tokio::time::sleep(Duration::from_millis(1_100)).await;

    let second_subscribe = harness.recv().await;
    assert_eq!(second_subscribe["action"], "subscribe");
    assert_eq!(second_subscribe["txid"], tx.txid_hex());

    let tx_alt = tx_alt();
    let _rx_alt = tool.check_transaction(&tx_alt);

    let mut saw_new_subscribe = false;
    for _ in 0..3 {
        let subscribe = harness.recv().await;
        assert_eq!(subscribe["action"], "subscribe");
        if subscribe["txid"] == tx_alt.txid_hex() {
            saw_new_subscribe = true;
            break;
        }
    }
    assert!(saw_new_subscribe);

    cancel.cancel();
}

#[tokio::test]
async fn test_failed_rotation_keeps_current_connection() {
    let harness = WsHarness::start().await;
    let cancel = CancellationToken::new();
    let tool = make_tool_with_rotation(
        cancel.clone(),
        harness.url(),
        Some(10),
        Some(1),
        Duration::from_millis(50),
    );

    let tx = tx();
    let rx = tool.check_transaction(&tx);

    let first_subscribe = harness.recv().await;
    assert_eq!(first_subscribe["action"], "subscribe");

    harness.stop_accepting();
    tokio::time::pause();
    tokio::time::advance(Duration::from_millis(1_100)).await;
    tokio::task::yield_now().await;

    harness.send(json!({
        "action": "snapshot",
        "txid": tx.txid_hex(),
        "observations": Observations { bridge: Some(BridgeData { seen: 3, total: 3 }) },
    }));

    assert!(rx.await.unwrap());
    cancel.cancel();
}

#[tokio::test]
async fn test_connect_timeout_drives_reconnect() {
    tokio::time::pause();

    let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
    let endpoint = format!("ws://{}", listener.local_addr().unwrap());

    let (conn_tx, mut conn_rx) = mpsc::unbounded_channel::<()>();
    let server_cancel = CancellationToken::new();
    let server_cancel_inner = server_cancel.clone();
    tokio::spawn(async move {
        let mut held = Vec::new();
        loop {
            tokio::select! {
                r = listener.accept() => match r {
                    Ok((stream, _)) => {
                        let _ = conn_tx.send(());
                        held.push(stream);
                    }
                    Err(_) => return,
                },
                _ = server_cancel_inner.cancelled() => return,
            }
        }
    });

    let cancel = CancellationToken::new();
    let _tool = make_tool(
        cancel.clone(),
        endpoint,
        Some(60),
        Duration::from_millis(200),
    );

    conn_rx.recv().await.expect("first TCP connect");

    tokio::time::advance(Duration::from_millis(500)).await;

    conn_rx
        .recv()
        .await
        .expect("second TCP connect after timeout");

    cancel.cancel();
    server_cancel.cancel();
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

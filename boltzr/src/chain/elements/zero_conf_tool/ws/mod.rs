use crate::chain::elements::ZeroConfCheck;
use crate::chain::elements::zero_conf_tool::config::ZeroConfToolConfig;
use crate::chain::elements::zero_conf_tool::ws::connection::WsConnection;
use crate::chain::elements::zero_conf_tool::ws::protocol::send_pong;
use crate::chain::elements::zero_conf_tool::ws::state::WsTxState;
use crate::chain::utils::Transaction;
use anyhow::Result;
use async_tungstenite::tungstenite::Message;
use dashmap::DashMap;
use futures::StreamExt as _;
use std::sync::Arc;
use std::time::Duration;
use tokio::sync::{mpsc, oneshot};
use tokio::time::{Instant, Interval, MissedTickBehavior, interval_at, sleep_until};
use tokio_util::sync::CancellationToken;
use tracing::{debug, info, warn};

const DEFAULT_DEADLINE_SECS: u64 = 6;
const DEFAULT_RECONNECT_DELAY_SECS: u64 = 5;
const DEFAULT_ROTATION_INTERVAL_SECS: u64 = 55 * 60;
const DEADLINE_TICK: Duration = Duration::from_millis(50);

mod connection;
mod protocol;
mod state;

#[cfg(test)]
mod tests;

#[derive(Debug)]
enum WsCommand {
    Subscribe(String),
}

#[derive(Clone)]
pub struct WsZeroConfTool {
    symbol: String,
    endpoint: String,
    deadline: Duration,
    rotation_interval: Option<Duration>,

    to_check: Arc<DashMap<String, WsTxState>>,
    commands: mpsc::UnboundedSender<WsCommand>,
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
        let rotation_interval = config
            .rotation_interval_secs
            .or(Some(DEFAULT_ROTATION_INTERVAL_SECS))
            .filter(|interval| *interval > 0)
            .map(Duration::from_secs);
        let (commands, command_rx) = mpsc::unbounded_channel();

        let tool = WsZeroConfTool {
            symbol,
            endpoint: config.endpoint,
            deadline,
            rotation_interval,
            to_check: Arc::new(DashMap::new()),
            commands,
        };

        match rotation_interval {
            Some(rotation_interval) => info!(
                "Subscribing to {} 0-conf updates at {} (deadline {}s, rotation {}s)",
                tool.symbol,
                tool.endpoint,
                deadline.as_secs(),
                rotation_interval.as_secs()
            ),
            None => info!(
                "Subscribing to {} 0-conf updates at {} (deadline {}s, rotation disabled)",
                tool.symbol,
                tool.endpoint,
                deadline.as_secs()
            ),
        }

        {
            let tool = tool.clone();
            tokio::spawn(async move {
                tool.run(cancellation_token, reconnect_delay, command_rx)
                    .await;
            });
        }

        tool
    }

    async fn run(
        &self,
        cancellation_token: CancellationToken,
        reconnect_delay: Duration,
        mut command_rx: mpsc::UnboundedReceiver<WsCommand>,
    ) {
        let mut deadline_ticker = Self::deadline_interval();

        'worker: loop {
            if cancellation_token.is_cancelled() {
                return;
            }

            let mut connection = match self
                .connect_with_deadline_expiry(
                    &cancellation_token,
                    reconnect_delay,
                    &mut deadline_ticker,
                )
                .await
            {
                Some(connection) => connection,
                None => return,
            };

            info!("{} 0-conf WS connected to {}", self.symbol, self.endpoint);

            if let Err(e) = self.reconcile_subscriptions(&mut connection).await {
                warn!(
                    "{} 0-conf WS initial subscribe failed: {:#}",
                    self.symbol, e
                );
                continue 'worker;
            }

            let mut rotation_at = self
                .rotation_interval
                .map(|interval| Instant::now() + interval);
            let mut alive = true;
            while alive {
                tokio::select! {
                    biased;

                    _ = cancellation_token.cancelled() => return,

                    incoming = connection.stream.next() => {
                        match incoming {
                            Some(Ok(Message::Ping(payload))) => {
                                if let Err(e) = send_pong(&mut connection.sink, payload).await {
                                    warn!("{} 0-conf WS pong failed: {:#}", self.symbol, e);
                                    alive = false;
                                }
                            }
                            Some(Ok(msg)) => {
                                if let Some(unsubs) = self.handle_message(msg) {
                                    for txid in unsubs {
                                        if let Err(e) = connection.unsubscribe(&txid).await {
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
                                warn!("{} 0-conf WS stream closed by peer", self.symbol);
                                alive = false;
                            }
                        }
                    }

                    command = command_rx.recv() => {
                        match command {
                            Some(command) => {
                                if let Err(e) = self.handle_command(command, &mut connection).await {
                                    warn!("{} 0-conf WS command failed: {:#}", self.symbol, e);
                                    alive = false;
                                }
                            }
                            None => {
                                debug!("{} 0-conf WS command channel closed", self.symbol);
                                return;
                            }
                        }
                    }

                    _ = deadline_ticker.tick() => {
                        let unsubs = self.expire_deadlines();
                        for txid in unsubs {
                            if let Err(e) = connection.unsubscribe(&txid).await {
                                warn!("{} 0-conf WS unsubscribe failed: {:#}", self.symbol, e);
                                alive = false;
                                break;
                            }
                        }
                    }

                    _ = async {
                        match rotation_at {
                            Some(rotation_at) => sleep_until(rotation_at).await,
                            None => std::future::pending::<()>().await,
                        }
                    } => {
                        match self.rotate_connection(reconnect_delay, connection).await {
                            Ok(replacement) => {
                                info!("{} 0-conf WS rotation complete", self.symbol);
                                connection = replacement;
                                rotation_at = self
                                    .rotation_interval
                                    .map(|interval| Instant::now() + interval);
                            }
                            Err((current, e)) => {
                                warn!("{} 0-conf WS rotation failed: {:#}", self.symbol, e);
                                connection = current;
                                rotation_at = self
                                    .rotation_interval
                                    .map(|_| Instant::now() + reconnect_delay);
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

    async fn connect_with_deadline_expiry(
        &self,
        cancellation_token: &CancellationToken,
        reconnect_delay: Duration,
        deadline_ticker: &mut Interval,
    ) -> Option<WsConnection> {
        loop {
            debug!("{} 0-conf WS connecting to {}", self.symbol, self.endpoint);
            let connect = WsConnection::connect(&self.endpoint, reconnect_delay);
            tokio::pin!(connect);

            loop {
                tokio::select! {
                    res = &mut connect => {
                        match res {
                            Ok(connection) => return Some(connection),
                            Err(e) => warn!(
                                "{} 0-conf WS connect to {} failed: {:#}",
                                self.symbol, self.endpoint, e
                            ),
                        }
                        break;
                    },
                    _ = deadline_ticker.tick() => {
                        let _ = self.expire_deadlines();
                    }
                    _ = cancellation_token.cancelled() => return None,
                }
            }

            if !self
                .sleep_with_deadline_expiry(cancellation_token, reconnect_delay, deadline_ticker)
                .await
            {
                return None;
            }
        }
    }

    async fn rotate_connection(
        &self,
        reconnect_delay: Duration,
        current: WsConnection,
    ) -> std::result::Result<WsConnection, (WsConnection, anyhow::Error)> {
        debug!("{} 0-conf WS starting proactive rotation", self.symbol);

        let mut replacement = match WsConnection::connect(&self.endpoint, reconnect_delay).await {
            Ok(connection) => connection,
            Err(e) => return Err((current, e)),
        };

        if let Err(e) = self.reconcile_subscriptions(&mut replacement).await {
            return Err((current, e));
        }

        if let Err(e) = current.close().await {
            debug!(
                "{} 0-conf WS old connection close during rotation failed: {:#}",
                self.symbol, e
            );
        }

        Ok(replacement)
    }

    async fn handle_command(
        &self,
        command: WsCommand,
        connection: &mut WsConnection,
    ) -> Result<()> {
        match command {
            WsCommand::Subscribe(txid) => self.subscribe_if_pending(connection, &txid).await,
        }
    }

    async fn subscribe_if_pending(&self, connection: &mut WsConnection, txid: &str) -> Result<()> {
        if !self.to_check.contains_key(txid) {
            debug!(
                "{} 0-conf WS subscribe command skipped for {}; no pending check",
                self.symbol, txid
            );
            return Ok(());
        }

        connection.subscribe(txid).await
    }

    async fn reconcile_subscriptions(&self, connection: &mut WsConnection) -> Result<()> {
        let pending = self.collect_pending_subscribes(connection);
        if !pending.is_empty() {
            info!(
                "{} 0-conf WS resubscribing {} pending transaction(s) on active connection",
                self.symbol,
                pending.len()
            );
        }

        for txid in pending {
            connection.subscribe(&txid).await?;
        }

        Ok(())
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
}

impl ZeroConfCheck for WsZeroConfTool {
    fn check_transaction(&self, transaction: &Transaction) -> oneshot::Receiver<bool> {
        let tx_id = transaction.txid_hex();
        let (tx, rx) = oneshot::channel();

        let mut entry = self
            .to_check
            .entry(tx_id.clone())
            .or_insert_with(|| WsTxState {
                deadline: Instant::now() + self.deadline,
                snapshots_seen: 0,
                senders: Vec::new(),
            });
        entry.senders.push(tx);
        drop(entry);

        if let Err(e) = self.commands.send(WsCommand::Subscribe(tx_id.clone())) {
            warn!(
                "{} 0-conf WS subscribe command failed for {}: {}",
                self.symbol, tx_id, e
            );
            self.reject_and_remove(&tx_id, "worker stopped");
        }

        rx
    }
}

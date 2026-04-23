use async_tungstenite::tungstenite::Message;
use boltz_utils::defer;
use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use std::sync::{Arc, RwLock};
use tokio::sync::Notify;
use tokio::time::{Duration, Instant, timeout};
use tokio_stream::StreamExt;
use tokio_util::sync::CancellationToken;
use tracing::{debug, error, info, instrument, warn};

const WEBSOCKET_RECONNECT_INTERVAL_SECONDS: u64 = 10;
const WEBSOCKET_PING_INTERVAL_SECONDS: u64 = 30;
const WEBSOCKET_TIMEOUT_SECONDS: u64 = 120;
const FEES_WAIT_TIMEOUT_SECONDS: u64 = 5;

#[derive(Serialize, Debug, Clone)]
enum DataType {
    #[serde(rename = "stats")]
    Stats,
    #[serde(rename = "blocks")]
    Blocks,
}

#[derive(Serialize, Debug, Clone)]
enum ActionType {
    #[serde(rename = "want")]
    Want,
}

#[derive(Serialize, Debug, Clone)]
struct Request {
    action: ActionType,
    data: Vec<DataType>,
}

#[derive(Deserialize, Serialize, Debug, Clone, Copy)]
struct Fees {
    #[serde(rename = "fastestFee")]
    fastest: f64,
}

#[derive(Debug, Clone, Copy)]
struct CachedFees {
    fees: Fees,
    at: Instant,
}

#[derive(Debug, Clone, Copy)]
pub struct Thresholds {
    pub max_block_lag: u64,
    pub max_fee_multiplier: f64,
    pub max_fee_delta: f64,
}

#[derive(Deserialize, Serialize, Debug, Clone)]
struct ResponseFees {
    fees: Fees,
}

#[derive(Deserialize, Serialize, Debug, Clone)]
struct Block {
    height: u64,
}

#[derive(Deserialize, Serialize, Debug, Clone)]
struct ResponseBlocks {
    blocks: Vec<Block>,
}

#[derive(Deserialize, Serialize, Debug, Clone)]
struct ResponseBlock {
    block: Block,
}

#[derive(Debug, Clone)]
pub struct Client {
    cancellation_token: CancellationToken,
    ready_notify: Arc<Notify>,

    url: String,
    symbol: String,

    max_age: Option<Duration>,

    last_block: Arc<RwLock<Option<u64>>>,
    last_fees: Arc<RwLock<Option<CachedFees>>>,
}

impl Client {
    #[instrument(name = "MempoolClient::new", skip(cancellation_token))]
    pub fn new(
        cancellation_token: CancellationToken,
        ready_notify: Arc<Notify>,
        symbol: String,
        url: String,
        max_age: Option<Duration>,
    ) -> Self {
        Self {
            url,
            symbol,
            cancellation_token,
            ready_notify,
            max_age,
            last_block: Arc::new(RwLock::new(None)),
            last_fees: Arc::new(RwLock::new(None)),
        }
    }

    pub async fn listen(&mut self) {
        let url = format!("{}/v1/ws", self.url)
            .replace("http://", "ws://")
            .replace("https://", "wss://");

        loop {
            if self.cancellation_token.is_cancelled() {
                break;
            }

            match self.connect_websocket(&url).await {
                Ok(_) => break,
                Err(err) => {
                    warn!(
                        "{} {} WebSocket connection closed: {}",
                        self.symbol, self.url, err
                    );

                    let sleep_duration = Duration::from_secs(WEBSOCKET_RECONNECT_INTERVAL_SECONDS);
                    info!(
                        "Reconnecting to {} {} WebSocket in: {:#?}",
                        self.symbol, self.url, sleep_duration
                    );
                    tokio::time::sleep(sleep_duration).await;
                }
            }
        }
    }

    pub fn get_latest(&self) -> Result<(u64, f64), anyhow::Error> {
        let cached = *self
            .last_fees
            .read()
            .map_err(|err| anyhow::anyhow!("failed to read last_fees: {}", err))?;

        let Some(cached) = cached else {
            return Err(anyhow::anyhow!("no fees found"));
        };

        if let Some((age, max_age)) = self.staleness(&cached) {
            return Err(anyhow::anyhow!(
                "fees are stale: age {:?} exceeds max {:?}",
                age,
                max_age
            ));
        }

        let block = self
            .last_block
            .read()
            .map_err(|err| anyhow::anyhow!("failed to read last_block: {}", err))?;

        match *block {
            Some(block) => Ok((block, cached.fees.fastest)),
            None => Err(anyhow::anyhow!("no block height available")),
        }
    }

    /// Returns (age, max_age) if `cached` has exceeded `max_age`; `None` if fresh or no max set.
    fn staleness(&self, cached: &CachedFees) -> Option<(Duration, Duration)> {
        let max_age = self.max_age?;
        let age = cached.at.elapsed();
        (age > max_age).then_some((age, max_age))
    }

    fn has_stale_fees(&self) -> bool {
        self.last_fees
            .read()
            .ok()
            .and_then(|cached| *cached)
            .is_some_and(|cached| self.staleness(&cached).is_some())
    }

    async fn connect_websocket(&mut self, url: &str) -> anyhow::Result<()> {
        let self_fees = self.last_fees.clone();
        let self_block = self.last_block.clone();

        let _guard = defer(move || {
            match self_fees.write() {
                Ok(mut last_fees) => *last_fees = None,
                Err(err) => warn!("failed to clear last_fees: {}", err),
            };
            match self_block.write() {
                Ok(mut last_block) => *last_block = None,
                Err(err) => warn!("failed to clear last_block: {}", err),
            }
        });

        let (mut ws_stream, _) = async_tungstenite::tokio::connect_async(url).await?;
        debug!("Connected to WebSocket: {}", url);

        ws_stream
            .send(
                serde_json::to_string(&Request {
                    action: ActionType::Want,
                    data: vec![DataType::Stats, DataType::Blocks],
                })
                .unwrap()
                .into(),
            )
            .await?;

        let timeout_duration = Duration::from_secs(WEBSOCKET_TIMEOUT_SECONDS);
        let mut ping_interval =
            tokio::time::interval(Duration::from_secs(WEBSOCKET_PING_INTERVAL_SECONDS));

        loop {
            tokio::select! {
                res = timeout(timeout_duration, ws_stream.next()) => {
                    match res {
                        Ok(Some(event)) => {
                            let msg = match event? {
                                Message::Text(data) => data,
                                Message::Ping(data) => {
                                    ws_stream.send(Message::Pong(data)).await?;
                                    continue;
                                }
                                Message::Close(_) => return Err(anyhow::anyhow!("WebSocket closed")),
                                _ => continue,
                            };

                            if let Err(err) = self.handle_message(msg.as_ref()) {
                                error!("Handling message failed: {}", err);
                            };
                        }
                        Ok(None) => {
                            return Err(anyhow::anyhow!("WebSocket closed"));
                        }
                        Err(_) => {
                            return Err(anyhow::anyhow!(
                                "no WebSocket message received in {} seconds",
                                WEBSOCKET_TIMEOUT_SECONDS
                            ));
                        }
                    }
                },
                _ = ping_interval.tick() => {
                    ws_stream.send(Message::Ping(vec![].into())).await.unwrap_or_else(|err| {
                        warn!("Sending ping failed: {}", err);
                    });
                }
                _ = self.cancellation_token.cancelled() => {
                    debug!("Stopping WebSocket");
                    ws_stream.close(None).await.unwrap_or_else(|err| {
                        warn!("Closing WebSocket failed: {}", err);
                    });
                    return Ok(());
                }
            }
        }
    }

    fn handle_message(&mut self, msg: &[u8]) -> anyhow::Result<()> {
        self.handle_fees(msg)?;
        self.handle_blocks(msg)?;

        Ok(())
    }

    fn handle_fees(&mut self, msg: &[u8]) -> anyhow::Result<()> {
        if let Some(msg) = self.parse_message::<ResponseFees>(msg) {
            self.last_fees
                .write()
                .map_err(|err| anyhow::anyhow!("failed to write to last_fees: {}", err))?
                .replace(CachedFees {
                    fees: msg.fees,
                    at: Instant::now(),
                });
            self.notify_waiters_if_ready();
        }

        Ok(())
    }

    fn handle_blocks(&mut self, msg: &[u8]) -> anyhow::Result<()> {
        let best_parsed: Option<u64> = if let Some(msg) = self.parse_message::<ResponseBlocks>(msg)
            && let Some(latest_block) = msg.blocks.last()
        {
            Some(latest_block.height)
        } else if let Some(msg) = self.parse_message::<ResponseBlock>(msg) {
            Some(msg.block.height)
        } else {
            None
        };

        if let Some(best_parsed) = best_parsed {
            let mut state = self
                .last_block
                .write()
                .map_err(|err| anyhow::anyhow!("failed to write to last_block: {}", err))?;

            if let Some(current) = *state
                && current >= best_parsed
            {
                return Ok(());
            }

            state.replace(best_parsed);
            drop(state);

            self.notify_waiters_if_ready();
        }

        Ok(())
    }

    fn parse_message<'a, T: Deserialize<'a>>(&self, msg: &'a [u8]) -> Option<T> {
        // We just ignore messages we cannot parse
        serde_json::from_slice::<T>(msg).ok()
    }

    fn notify_waiters_if_ready(&self) {
        let has_fees = self
            .last_fees
            .read()
            .map(|fees| fees.is_some())
            .unwrap_or(false);
        let has_block = self
            .last_block
            .read()
            .map(|block| block.is_some())
            .unwrap_or(false);

        if has_fees && has_block {
            // Wake all concurrent waiters when this client has both fees and block height
            self.ready_notify.notify_waiters();
        }
    }
}

#[derive(Debug, Clone)]
pub struct MempoolSpace {
    clients: Vec<Client>,
    ready_notify: Arc<Notify>,
}

impl MempoolSpace {
    pub fn new(
        cancellation_token: CancellationToken,
        symbol: String,
        urls: Vec<String>,
        max_age: Option<Duration>,
    ) -> Self {
        let ready_notify = Arc::new(Notify::new());
        Self {
            clients: urls
                .into_iter()
                .map(|url| {
                    Client::new(
                        cancellation_token.clone(),
                        ready_notify.clone(),
                        symbol.clone(),
                        url,
                        max_age,
                    )
                })
                .collect(),
            ready_notify,
        }
    }

    pub fn combine_urls(legacy: Option<&str>, extra: Option<&[String]>) -> Vec<String> {
        let mut seen: HashSet<String> = HashSet::new();
        let mut insert = |raw: &str| {
            let trimmed = raw.trim();
            if !trimmed.is_empty() {
                seen.insert(trimmed.to_string());
            }
        };
        if let Some(src) = legacy {
            for part in src.split(',') {
                insert(part);
            }
        }
        if let Some(src) = extra {
            for url in src {
                insert(url);
            }
        }
        seen.into_iter().collect()
    }

    pub fn value_trusted(
        symbol: &str,
        thresholds: Thresholds,
        mempool_height: u64,
        mempool_fee: f64,
        local_tip: Option<u64>,
        bitcoind_fee: Option<f64>,
    ) -> bool {
        if !mempool_fee.is_finite() || mempool_fee < 0.0 {
            warn!(
                "Mempool.space {} reported invalid fee {} (not finite or negative)",
                symbol, mempool_fee,
            );
            return false;
        }

        if let Some(tip) = local_tip
            && tip.saturating_sub(mempool_height) > thresholds.max_block_lag
        {
            warn!(
                "Mempool.space {} block tip lags: mempool {} vs local {} (max lag {})",
                symbol, mempool_height, tip, thresholds.max_block_lag,
            );
            return false;
        }

        if let Some(bitcoind_fee) = bitcoind_fee {
            if !bitcoind_fee.is_finite() {
                warn!(
                    "Mempool.space {} skipping ceiling check: bitcoind fee {} is not finite",
                    symbol, bitcoind_fee,
                );
            } else {
                let ceiling = (thresholds.max_fee_multiplier * bitcoind_fee)
                    .max(bitcoind_fee + thresholds.max_fee_delta);
                if mempool_fee > ceiling {
                    warn!(
                        "Mempool.space {} fee {} exceeds ceiling {} (bitcoind {}, {}x, +{})",
                        symbol,
                        mempool_fee,
                        ceiling,
                        bitcoind_fee,
                        thresholds.max_fee_multiplier,
                        thresholds.max_fee_delta,
                    );
                    return false;
                }
            }
        }

        true
    }

    pub async fn connect(&self) -> anyhow::Result<()> {
        for mut client in self.clients.clone() {
            tokio::spawn(async move {
                client.listen().await;
            });
        }

        Ok(())
    }

    pub async fn get_fees_and_height(&self) -> Option<(u64, f64)> {
        if let Some(fees) = self.collect_best_fees_and_height() {
            return Some(fees);
        }

        if self.clients.iter().all(Client::has_stale_fees) {
            debug!(
                "{} mempool.space cached fees are stale; skipping startup wait",
                self.clients
                    .first()
                    .map(|client| client.symbol.as_str())
                    .unwrap_or("unknown")
            );
            return None;
        }

        let wait_for_fees = async {
            loop {
                // Register interest before checking the condition to avoid
                // a race where notify_waiters() fires between our check and
                // the await — which would lose the notification.
                let notified = self.ready_notify.notified();
                tokio::pin!(notified);
                notified.as_mut().enable();

                if let Some(fees) = self.collect_best_fees_and_height() {
                    return Some(fees);
                }

                notified.await;
            }
        };

        match timeout(
            Duration::from_secs(FEES_WAIT_TIMEOUT_SECONDS),
            wait_for_fees,
        )
        .await
        {
            Ok(fees) => fees,
            Err(_) => {
                warn!(
                    "{} mempool.space did not provide initial fees within {} seconds",
                    self.clients
                        .first()
                        .map(|client| client.symbol.clone())
                        .unwrap_or_else(|| "unknown".to_string()),
                    FEES_WAIT_TIMEOUT_SECONDS
                );
                None
            }
        }
    }

    fn collect_best_fees_and_height(&self) -> Option<(u64, f64)> {
        let fees = self
            .clients
            .iter()
            .map(|client| (client, client.get_latest()))
            .filter_map(|(client, fee)| match fee {
                Ok((height, fee)) => Some((client, height, fee)),
                Err(err) => {
                    debug!(
                        "Failed to get fees for {} {}: {}",
                        client.symbol, client.url, err
                    );
                    None
                }
            })
            .collect::<Vec<_>>();

        let best_height = fees.iter().map(|(_, height, _)| height).max().cloned()?;

        let best_fees = fees
            .into_iter()
            .filter(|(client, height, _)| {
                if *height == best_height {
                    true
                } else {
                    tracing::debug!(
                        "{} {} is not at best height: {} != {}",
                        client.symbol,
                        client.url,
                        best_height,
                        height
                    );
                    false
                }
            })
            .map(|(_, _, fee)| fee)
            .collect::<Vec<_>>();

        Self::median(best_fees).map(|fee| (best_height, fee))
    }

    fn median(mut vec: Vec<f64>) -> Option<f64> {
        if vec.is_empty() {
            return None;
        }

        vec.sort_by(|a, b| a.total_cmp(b));

        let len = vec.len();
        let mid = len / 2;

        Some(if len.is_multiple_of(2) {
            let left = vec[mid - 1];
            let right = vec[mid];
            (left + right) / 2.0
        } else {
            vec[mid]
        })
    }
}

#[cfg(test)]
pub mod test {
    use super::*;
    use boltz_utils::ensure_rustls_crypto_provider;
    use rstest::rstest;
    use serial_test::serial;

    const MEMPOOL_API: &str = "https://mempool.space/api";

    mod client {
        use super::*;

        #[tokio::test]
        #[serial(MempoolSpace)]
        async fn test_get_latest() {
            ensure_rustls_crypto_provider();

            let cancellation_token = CancellationToken::new();
            let client = Client::new(
                cancellation_token.clone(),
                Arc::new(Notify::new()),
                "BTC".to_string(),
                MEMPOOL_API.to_string(),
                None,
            );

            {
                let mut client = client.clone();
                tokio::spawn(async move {
                    client.listen().await;
                });
            }

            // Wait for the client to receive initial data
            for _ in 0..50 {
                if client.get_latest().is_ok() {
                    break;
                }
                tokio::time::sleep(Duration::from_millis(100)).await;
            }

            let (height, fee) = client.get_latest().unwrap();
            assert!(height >= 903_535);
            assert!(fee >= 1.0);
            cancellation_token.cancel();
        }

        #[test]
        fn test_get_latest_empty() {
            let client = Client::new(
                CancellationToken::new(),
                Arc::new(Notify::new()),
                "BTC".to_string(),
                MEMPOOL_API.to_string(),
                None,
            );
            assert!(client.get_latest().is_err());
        }

        #[test]
        fn test_handle_fees() {
            let mut client = Client::new(
                CancellationToken::new(),
                Arc::new(Notify::new()),
                "BTC".to_string(),
                MEMPOOL_API.to_string(),
                None,
            );

            let new_fee = 2.1;
            let msg = serde_json::to_string(&ResponseFees {
                fees: Fees { fastest: new_fee },
            })
            .unwrap();
            client.handle_fees(msg.as_bytes()).unwrap();
            assert_eq!(
                client.last_fees.read().unwrap().unwrap().fees.fastest,
                new_fee
            );
        }

        #[test]
        fn test_handle_blocks_multiple_blocks() {
            let mut client = Client::new(
                CancellationToken::new(),
                Arc::new(Notify::new()),
                "BTC".to_string(),
                MEMPOOL_API.to_string(),
                None,
            );

            let latest_block = 21_021;
            let msg = serde_json::to_string(&ResponseBlocks {
                blocks: vec![
                    Block {
                        height: latest_block - 1,
                    },
                    Block {
                        height: latest_block,
                    },
                ],
            })
            .unwrap();
            client.handle_blocks(msg.as_bytes()).unwrap();
            assert_eq!((*client.last_block.read().unwrap()).unwrap(), latest_block);
        }

        #[test]
        fn test_handle_blocks_single_block() {
            let mut client = Client::new(
                CancellationToken::new(),
                Arc::new(Notify::new()),
                "BTC".to_string(),
                MEMPOOL_API.to_string(),
                None,
            );

            let latest_block = 21_021;
            let msg = serde_json::to_string(&ResponseBlock {
                block: Block {
                    height: latest_block,
                },
            })
            .unwrap();
            client.handle_blocks(msg.as_bytes()).unwrap();
            assert_eq!((*client.last_block.read().unwrap()).unwrap(), latest_block);
        }

        #[tokio::test(start_paused = true)]
        async fn test_get_latest_rejects_stale_fees() {
            let max_age = Duration::from_secs(60);
            let client = Client::new(
                CancellationToken::new(),
                Arc::new(Notify::new()),
                "BTC".to_string(),
                MEMPOOL_API.to_string(),
                Some(max_age),
            );

            client.last_fees.write().unwrap().replace(CachedFees {
                fees: Fees { fastest: 5.0 },
                at: Instant::now(),
            });
            client.last_block.write().unwrap().replace(100);

            assert_eq!(client.get_latest().unwrap(), (100, 5.0));

            tokio::time::advance(max_age + Duration::from_secs(1)).await;

            let err = client.get_latest().unwrap_err();
            assert!(
                err.to_string().contains("stale"),
                "expected stale error, got: {}",
                err
            );
        }

        #[tokio::test(start_paused = true)]
        async fn test_get_latest_without_max_age_never_stale() {
            let client = Client::new(
                CancellationToken::new(),
                Arc::new(Notify::new()),
                "BTC".to_string(),
                MEMPOOL_API.to_string(),
                None,
            );

            client.last_fees.write().unwrap().replace(CachedFees {
                fees: Fees { fastest: 5.0 },
                at: Instant::now(),
            });
            client.last_block.write().unwrap().replace(100);

            tokio::time::advance(Duration::from_secs(3600)).await;

            assert_eq!(client.get_latest().unwrap(), (100, 5.0));
        }

        #[test]
        fn test_handle_blocks_stale() {
            let mut client = Client::new(
                CancellationToken::new(),
                Arc::new(Notify::new()),
                "BTC".to_string(),
                MEMPOOL_API.to_string(),
                None,
            );

            let latest_block = 21_021;
            let msg = serde_json::to_string(&ResponseBlock {
                block: Block {
                    height: latest_block,
                },
            })
            .unwrap();
            client.handle_blocks(msg.as_bytes()).unwrap();
            assert_eq!((*client.last_block.read().unwrap()).unwrap(), latest_block);

            client
                .handle_blocks(
                    serde_json::to_string(&ResponseBlock {
                        block: Block {
                            height: latest_block - 1,
                        },
                    })
                    .unwrap()
                    .as_bytes(),
                )
                .unwrap();
            assert_eq!((*client.last_block.read().unwrap()).unwrap(), latest_block);
        }
    }

    mod mempool_space {
        use super::*;
        use std::sync::Arc;

        #[test]
        fn test_parse_urls() {
            let second_api = "http://localhost:8080";
            let mempool_space = MempoolSpace::new(
                CancellationToken::new(),
                "BTC".to_string(),
                vec![MEMPOOL_API.to_string(), second_api.to_string()],
                None,
            );
            assert_eq!(mempool_space.clients.len(), 2);
            assert_eq!(mempool_space.clients[0].url, MEMPOOL_API);
            assert_eq!(mempool_space.clients[1].url, second_api);
        }

        #[tokio::test]
        #[serial(MempoolSpace)]
        async fn test_get_fees() {
            ensure_rustls_crypto_provider();

            let cancellation_token = CancellationToken::new();
            let mempool_space = MempoolSpace::new(
                cancellation_token.clone(),
                "BTC".to_string(),
                vec![MEMPOOL_API.to_string()],
                None,
            );
            mempool_space.connect().await.unwrap();

            let (_, fees) = mempool_space.get_fees_and_height().await.unwrap();
            assert!(fees > 0.9);
            cancellation_token.cancel();
        }

        #[tokio::test]
        async fn test_get_fees_out_of_sync() {
            let mempool_space = MempoolSpace::new(
                CancellationToken::new(),
                "BTC".to_string(),
                vec![MEMPOOL_API.to_string(), "http://localhost:8080".to_string()],
                None,
            );

            mempool_space.clients[0]
                .last_block
                .write()
                .unwrap()
                .replace(1);
            mempool_space.clients[0]
                .last_fees
                .write()
                .unwrap()
                .replace(CachedFees {
                    fees: Fees { fastest: 1.0 },
                    at: Instant::now(),
                });

            mempool_space.clients[1]
                .last_block
                .write()
                .unwrap()
                .replace(2);
            mempool_space.clients[1]
                .last_fees
                .write()
                .unwrap()
                .replace(CachedFees {
                    fees: Fees { fastest: 100.0 },
                    at: Instant::now(),
                });

            let (_, fees) = mempool_space.get_fees_and_height().await.unwrap();
            assert_eq!(fees, 100.0);
        }

        #[tokio::test]
        async fn test_get_fees_wakes_multiple_waiters() {
            let mempool_space = Arc::new(MempoolSpace::new(
                CancellationToken::new(),
                "BTC".to_string(),
                vec![MEMPOOL_API.to_string()],
                None,
            ));

            let mut waiters = Vec::new();
            for _ in 0..5 {
                let mempool_space = mempool_space.clone();
                waiters.push(tokio::spawn(async move {
                    let fees = tokio::time::timeout(
                        Duration::from_secs(5),
                        mempool_space.get_fees_and_height(),
                    )
                    .await
                    .expect("get_fees waiter timed out");
                    let (_, fee) = fees.expect("expected fees once notify_waiters is triggered");
                    fee
                }));
            }

            tokio::time::sleep(Duration::from_millis(100)).await;
            assert!(waiters.iter().all(|waiter| !waiter.is_finished()));

            let fees = 3.0;

            mempool_space.clients[0]
                .last_block
                .write()
                .unwrap()
                .replace(21_021);
            mempool_space.clients[0]
                .last_fees
                .write()
                .unwrap()
                .replace(CachedFees {
                    fees: Fees { fastest: fees },
                    at: Instant::now(),
                });
            mempool_space.clients[0].notify_waiters_if_ready();

            for waiter in waiters {
                assert_eq!(waiter.await.unwrap(), fees);
            }
        }

        #[tokio::test(start_paused = true)]
        async fn test_get_fees_timeout() {
            let mempool_space = MempoolSpace::new(
                CancellationToken::new(),
                "BTC".to_string(),
                vec![MEMPOOL_API.to_string()],
                None,
            );

            assert!(mempool_space.get_fees_and_height().await.is_none());
        }

        #[tokio::test]
        async fn test_get_fees_no_notify_on_partial_readiness() {
            let mempool_space = Arc::new(MempoolSpace::new(
                CancellationToken::new(),
                "BTC".to_string(),
                vec![MEMPOOL_API.to_string()],
                None,
            ));

            let ms = mempool_space.clone();
            let waiter = tokio::spawn(async move { ms.get_fees_and_height().await });

            tokio::time::sleep(Duration::from_millis(50)).await;
            assert!(!waiter.is_finished());

            let fees = 5.0;

            // Set only fees — should not wake the waiter
            mempool_space.clients[0]
                .last_fees
                .write()
                .unwrap()
                .replace(CachedFees {
                    fees: Fees { fastest: fees },
                    at: Instant::now(),
                });
            mempool_space.clients[0].notify_waiters_if_ready();

            tokio::time::sleep(Duration::from_millis(50)).await;
            assert!(!waiter.is_finished());

            // Now set block too — should wake the waiter
            mempool_space.clients[0]
                .last_block
                .write()
                .unwrap()
                .replace(21_021);
            mempool_space.clients[0].notify_waiters_if_ready();

            let res = tokio::time::timeout(Duration::from_secs(2), waiter)
                .await
                .expect("waiter timed out")
                .unwrap();
            assert_eq!(res, Some((21_021, fees)));
        }

        #[tokio::test]
        async fn test_get_fees_wakes_via_handle_methods() {
            let mempool_space = Arc::new(MempoolSpace::new(
                CancellationToken::new(),
                "BTC".to_string(),
                vec![MEMPOOL_API.to_string()],
                None,
            ));

            let ms = mempool_space.clone();
            let waiter = tokio::spawn(async move { ms.get_fees_and_height().await });

            tokio::time::sleep(Duration::from_millis(50)).await;
            assert!(!waiter.is_finished());

            let fees = 7.0;

            let fees_msg = serde_json::to_string(&ResponseFees {
                fees: Fees { fastest: fees },
            })
            .unwrap();

            let mut client = mempool_space.clients[0].clone();

            client.handle_fees(fees_msg.as_bytes()).unwrap();

            tokio::time::sleep(Duration::from_millis(50)).await;
            assert!(!waiter.is_finished());

            let block_msg = serde_json::to_string(&ResponseBlock {
                block: Block { height: 900_000 },
            })
            .unwrap();
            client.handle_blocks(block_msg.as_bytes()).unwrap();

            let res = tokio::time::timeout(Duration::from_secs(2), waiter)
                .await
                .expect("waiter timed out")
                .unwrap();
            assert_eq!(res, Some((900_000, fees)));
        }

        #[tokio::test]
        async fn test_get_fees_and_height_returns_height() {
            let mempool_space = MempoolSpace::new(
                CancellationToken::new(),
                "BTC".to_string(),
                vec![MEMPOOL_API.to_string(), "http://localhost:8080".to_string()],
                None,
            );

            mempool_space.clients[0]
                .last_block
                .write()
                .unwrap()
                .replace(100);
            mempool_space.clients[0]
                .last_fees
                .write()
                .unwrap()
                .replace(CachedFees {
                    fees: Fees { fastest: 1.0 },
                    at: Instant::now(),
                });

            mempool_space.clients[1]
                .last_block
                .write()
                .unwrap()
                .replace(101);
            mempool_space.clients[1]
                .last_fees
                .write()
                .unwrap()
                .replace(CachedFees {
                    fees: Fees { fastest: 42.0 },
                    at: Instant::now(),
                });

            let (height, fee) = mempool_space.get_fees_and_height().await.unwrap();
            assert_eq!(height, 101);
            assert_eq!(fee, 42.0);
        }

        #[tokio::test]
        async fn test_get_fees_and_height_returns_none_immediately_for_stale_cache() {
            let max_age = Duration::from_millis(10);
            let mempool_space = MempoolSpace::new(
                CancellationToken::new(),
                "BTC".to_string(),
                vec![MEMPOOL_API.to_string()],
                Some(max_age),
            );

            mempool_space.clients[0]
                .last_fees
                .write()
                .unwrap()
                .replace(CachedFees {
                    fees: Fees { fastest: 5.0 },
                    at: Instant::now() - Duration::from_millis(20),
                });
            mempool_space.clients[0]
                .last_block
                .write()
                .unwrap()
                .replace(100);

            let res = tokio::time::timeout(
                Duration::from_millis(100),
                mempool_space.get_fees_and_height(),
            )
            .await
            .expect("stale cache should not wait for startup timeout");
            assert_eq!(res, None);
        }

        #[tokio::test(start_paused = true)]
        async fn test_get_fees_and_height_waits_when_not_all_clients_stale() {
            let max_age = Duration::from_secs(60);
            let mempool_space = MempoolSpace::new(
                CancellationToken::new(),
                "BTC".to_string(),
                vec![MEMPOOL_API.to_string(), "http://localhost:8080".to_string()],
                Some(max_age),
            );

            // Client 0 has cache that will go stale; client 1 is still initializing.
            mempool_space.clients[0]
                .last_fees
                .write()
                .unwrap()
                .replace(CachedFees {
                    fees: Fees { fastest: 5.0 },
                    at: Instant::now(),
                });
            mempool_space.clients[0]
                .last_block
                .write()
                .unwrap()
                .replace(100);

            tokio::time::advance(max_age + Duration::from_secs(1)).await;

            // Client 0 is now stale; client 1 has never received data (not stale).
            // Not all clients stale → should go into wait loop and hit full timeout.
            let start = Instant::now();
            let res = mempool_space.get_fees_and_height().await;
            let elapsed = start.elapsed();

            assert_eq!(res, None);
            assert!(
                elapsed >= Duration::from_secs(FEES_WAIT_TIMEOUT_SECONDS),
                "expected full wait timeout ({}s), got {:?}",
                FEES_WAIT_TIMEOUT_SECONDS,
                elapsed,
            );
        }

        #[rstest]
        #[case::both_none(None, None, &[])]
        #[case::legacy_only(Some("a"), None, &["a"])]
        #[case::extra_only(None, Some(&["b"] as &[&str]), &["b"])]
        #[case::both(Some("a,b"), Some(&["c"] as &[&str]), &["a", "b", "c"])]
        #[case::trimmed(
            Some(" a , b "),
            Some(&[" c ", "", " d "] as &[&str]),
            &["a", "b", "c", "d"]
        )]
        #[case::all_empty(Some(""), Some(&[""] as &[&str]), &[])]
        #[case::dedup_across_sources(
            Some("a,b"),
            Some(&["b", "c"] as &[&str]),
            &["a", "b", "c"]
        )]
        #[case::dedup_within_legacy(Some("a, a, b"), None, &["a", "b"])]
        #[case::dedup_with_whitespace(
            Some("a"),
            Some(&[" a ", "b"] as &[&str]),
            &["a", "b"]
        )]
        fn test_combine_urls(
            #[case] legacy: Option<&str>,
            #[case] extra: Option<&[&str]>,
            #[case] expected: &[&str],
        ) {
            let extra_vec: Option<Vec<String>> =
                extra.map(|e| e.iter().map(|s| s.to_string()).collect());
            let got: HashSet<String> = MempoolSpace::combine_urls(legacy, extra_vec.as_deref())
                .into_iter()
                .collect();
            let expected_set: HashSet<String> = expected.iter().map(|s| s.to_string()).collect();
            assert_eq!(got, expected_set);
        }

        // Thresholds: multiplier=3, delta=25, block_lag=2
        // Ceiling = max(3 * bitcoind, bitcoind + 25)
        #[rstest]
        // delta dominates (bitcoind=5 → ceiling = 30)
        #[case::delta_happy(100, 10.0, Some(100), Some(5.0), true)]
        #[case::delta_edge(100, 30.0, Some(100), Some(5.0), true)]
        #[case::delta_over(100, 30.1, Some(100), Some(5.0), false)]
        // very low bitcoind (bitcoind=1 → ceiling = 26)
        #[case::tiny_bitcoind_edge(100, 26.0, Some(100), Some(1.0), true)]
        #[case::tiny_bitcoind_over(100, 26.1, Some(100), Some(1.0), false)]
        #[case::tiny_bitcoind_far_over(100, 1_000.0, Some(100), Some(1.0), false)]
        // multiplier dominates (bitcoind=100 → ceiling = 300)
        #[case::mult_edge(100, 300.0, Some(100), Some(100.0), true)]
        #[case::mult_over(100, 300.1, Some(100), Some(100.0), false)]
        // crossover (bitcoind=12.5 → both limbs equal 37.5)
        #[case::crossover_edge(100, 37.5, Some(100), Some(12.5), true)]
        #[case::crossover_over(100, 37.6, Some(100), Some(12.5), false)]
        // block lag
        #[case::lag_edge(98, 5.0, Some(100), Some(5.0), true)]
        #[case::lag_over(97, 5.0, Some(100), Some(5.0), false)]
        // missing references: best-effort, still trusted
        #[case::no_bitcoind(100, 1_000_000.0, Some(100), None, true)]
        #[case::no_local_tip(50, 5.0, None, Some(5.0), true)]
        #[case::no_references(100, 5.0, None, None, true)]
        // mempool ahead of local (saturating sub = 0)
        #[case::mempool_ahead(110, 5.0, Some(100), Some(5.0), true)]
        // invalid fee values
        #[case::nan(100, f64::NAN, Some(100), Some(5.0), false)]
        #[case::positive_inf(100, f64::INFINITY, Some(100), Some(5.0), false)]
        #[case::negative_inf(100, f64::NEG_INFINITY, Some(100), Some(5.0), false)]
        #[case::negative(100, -1.0, Some(100), Some(5.0), false)]
        // invalid fee rejected even without references
        #[case::nan_no_refs(100, f64::NAN, None, None, false)]
        // zero still passes (floor enforced higher up)
        #[case::zero_ok(100, 0.0, Some(100), Some(5.0), true)]
        // non-finite bitcoind_fee: skip ceiling, don't let NaN math bypass the cap
        #[case::bitcoind_nan(100, 1_000_000.0, Some(100), Some(f64::NAN), true)]
        #[case::bitcoind_pos_inf(100, 1_000_000.0, Some(100), Some(f64::INFINITY), true)]
        #[case::bitcoind_neg_inf(100, 1_000_000.0, Some(100), Some(f64::NEG_INFINITY), true)]
        fn test_value_trusted(
            #[case] mempool_height: u64,
            #[case] mempool_fee: f64,
            #[case] local_tip: Option<u64>,
            #[case] bitcoind_fee: Option<f64>,
            #[case] expected: bool,
        ) {
            let t = Thresholds {
                max_block_lag: 2,
                max_fee_multiplier: 3.0,
                max_fee_delta: 25.0,
            };
            assert_eq!(
                MempoolSpace::value_trusted(
                    "BTC",
                    t,
                    mempool_height,
                    mempool_fee,
                    local_tip,
                    bitcoind_fee,
                ),
                expected
            );
        }

        #[test]
        fn test_median_empty_vec() {
            assert_eq!(MempoolSpace::median(Vec::new()), None);
        }

        #[test]
        fn test_median_odd_number_of_elements() {
            let data = vec![3.0, 1.0, 2.0];
            assert_eq!(MempoolSpace::median(data), Some(2.0));
        }

        #[test]
        fn test_median_even_number_of_elements() {
            let data = vec![4.0, 1.0, 3.0, 2.0];
            assert_eq!(MempoolSpace::median(data), Some(2.5));
        }
    }
}

use async_tungstenite::tungstenite::Message;
use boltz_utils::defer;
use serde::{Deserialize, Serialize};
use std::sync::{Arc, RwLock};
use tokio::sync::Notify;
use tokio::time::{Duration, timeout};
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

#[derive(Deserialize, Serialize, Debug, Clone)]
struct Fees {
    #[serde(rename = "fastestFee")]
    fastest: f64,
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

    last_block: Arc<RwLock<Option<u64>>>,
    last_fees: Arc<RwLock<Option<Fees>>>,
}

impl Client {
    #[instrument(name = "MempoolClient::new", skip(cancellation_token))]
    pub fn new(
        cancellation_token: CancellationToken,
        ready_notify: Arc<Notify>,
        symbol: String,
        url: String,
    ) -> Self {
        Self {
            url,
            symbol,
            cancellation_token,
            ready_notify,
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
        let fee = self
            .last_fees
            .read()
            .map_err(|err| anyhow::anyhow!("failed to read last_fees: {}", err))?
            .as_ref()
            .map(|fees| fees.fastest);

        if let Some(fee) = fee {
            let block = self
                .last_block
                .read()
                .map_err(|err| anyhow::anyhow!("failed to read last_block: {}", err))?;

            if let Some(block) = *block {
                return Ok((block, fee));
            }
        }

        Err(anyhow::anyhow!("no fees found"))
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
                .replace(msg.fees);
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
    pub fn new(cancellation_token: CancellationToken, symbol: String, urls: String) -> Self {
        let ready_notify = Arc::new(Notify::new());
        Self {
            clients: urls
                .split(",")
                .map(|url| {
                    Client::new(
                        cancellation_token.clone(),
                        ready_notify.clone(),
                        symbol.clone(),
                        url.trim().to_string(),
                    )
                })
                .collect(),
            ready_notify,
        }
    }

    pub async fn connect(&self) -> anyhow::Result<()> {
        for mut client in self.clients.clone() {
            tokio::spawn(async move {
                client.listen().await;
            });
        }

        Ok(())
    }

    pub async fn get_fees(&self) -> Option<f64> {
        if let Some(fees) = self.collect_best_fees() {
            return Some(fees);
        }

        let wait_for_fees = async {
            loop {
                // Register interest before checking the condition to avoid
                // a race where notify_waiters() fires between our check and
                // the await — which would lose the notification.
                let notified = self.ready_notify.notified();
                tokio::pin!(notified);
                notified.as_mut().enable();

                if let Some(fees) = self.collect_best_fees() {
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

    fn collect_best_fees(&self) -> Option<f64> {
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

        if let Some(best_height) = fees.iter().map(|(_, height, _)| height).max().cloned() {
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

            Self::median(best_fees)
        } else {
            None
        }
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
    use serial_test::serial;

    const MEMPOOL_API: &str = "https://mempool.space/api";

    mod client {
        use super::*;

        #[tokio::test]
        #[serial(MempoolSpace)]
        async fn test_get_latest() {
            let cancellation_token = CancellationToken::new();
            let client = Client::new(
                cancellation_token.clone(),
                Arc::new(Notify::new()),
                "BTC".to_string(),
                MEMPOOL_API.to_string(),
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
            );

            let new_fee = 2.1;
            let msg = serde_json::to_string(&ResponseFees {
                fees: Fees { fastest: new_fee },
            })
            .unwrap();
            client.handle_fees(msg.as_bytes()).unwrap();
            assert_eq!(
                client.last_fees.read().unwrap().clone().unwrap().fastest,
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

        #[test]
        fn test_handle_blocks_stale() {
            let mut client = Client::new(
                CancellationToken::new(),
                Arc::new(Notify::new()),
                "BTC".to_string(),
                MEMPOOL_API.to_string(),
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
            let urls = format!("{MEMPOOL_API}, {second_api}");
            let mempool_space = MempoolSpace::new(
                CancellationToken::new(),
                "BTC".to_string(),
                urls.to_string(),
            );
            assert_eq!(mempool_space.clients.len(), 2);
            assert_eq!(mempool_space.clients[0].url, MEMPOOL_API);
            assert_eq!(mempool_space.clients[1].url, second_api);
        }

        #[tokio::test]
        #[serial(MempoolSpace)]
        async fn test_get_fees() {
            let cancellation_token = CancellationToken::new();
            let mempool_space = MempoolSpace::new(
                cancellation_token.clone(),
                "BTC".to_string(),
                MEMPOOL_API.to_string(),
            );
            mempool_space.connect().await.unwrap();

            let fees = mempool_space.get_fees().await.unwrap();
            assert!(fees > 0.9);
            cancellation_token.cancel();
        }

        #[tokio::test]
        async fn test_get_fees_out_of_sync() {
            let mempool_space = MempoolSpace::new(
                CancellationToken::new(),
                "BTC".to_string(),
                format!("{}, {}", MEMPOOL_API, "http://localhost:8080"),
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
                .replace(Fees { fastest: 1.0 });

            mempool_space.clients[1]
                .last_block
                .write()
                .unwrap()
                .replace(2);
            mempool_space.clients[1]
                .last_fees
                .write()
                .unwrap()
                .replace(Fees { fastest: 100.0 });

            let fees = mempool_space.get_fees().await.unwrap();
            assert_eq!(fees, 100.0);
        }

        #[tokio::test]
        async fn test_get_fees_wakes_multiple_waiters() {
            let mempool_space = Arc::new(MempoolSpace::new(
                CancellationToken::new(),
                "BTC".to_string(),
                MEMPOOL_API.to_string(),
            ));

            let mut waiters = Vec::new();
            for _ in 0..5 {
                let mempool_space = mempool_space.clone();
                waiters.push(tokio::spawn(async move {
                    let fees =
                        tokio::time::timeout(Duration::from_secs(5), mempool_space.get_fees())
                            .await
                            .expect("get_fees waiter timed out");
                    fees.expect("expected fees once notify_waiters is triggered")
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
                .replace(Fees { fastest: fees });
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
                MEMPOOL_API.to_string(),
            );

            assert!(mempool_space.get_fees().await.is_none());
        }

        #[tokio::test]
        async fn test_get_fees_no_notify_on_partial_readiness() {
            let mempool_space = Arc::new(MempoolSpace::new(
                CancellationToken::new(),
                "BTC".to_string(),
                MEMPOOL_API.to_string(),
            ));

            let ms = mempool_space.clone();
            let waiter = tokio::spawn(async move { ms.get_fees().await });

            tokio::time::sleep(Duration::from_millis(50)).await;
            assert!(!waiter.is_finished());

            let fees = 5.0;

            // Set only fees — should not wake the waiter
            mempool_space.clients[0]
                .last_fees
                .write()
                .unwrap()
                .replace(Fees { fastest: fees });
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
            assert_eq!(res, Some(fees));
        }

        #[tokio::test]
        async fn test_get_fees_wakes_via_handle_methods() {
            let mempool_space = Arc::new(MempoolSpace::new(
                CancellationToken::new(),
                "BTC".to_string(),
                MEMPOOL_API.to_string(),
            ));

            let ms = mempool_space.clone();
            let waiter = tokio::spawn(async move { ms.get_fees().await });

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
            assert_eq!(res, Some(fees));
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

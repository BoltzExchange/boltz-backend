use crate::chain::elements::ZeroConfCheck;
use crate::chain::utils::Transaction;
use anyhow::Result;
use dashmap::DashMap;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use std::time::Duration;
use tokio::sync::oneshot;
use tokio_util::sync::CancellationToken;
use tracing::{error, info, trace};

const REQUEST_TIMEOUT: Duration = Duration::from_secs(5);

const DEFAULT_MAX_RETRIES: u64 = 60;
const DEFAULT_RETRY_DELAY: u64 = 100;

#[derive(Deserialize, Serialize, PartialEq, Debug, Clone)]
pub struct ZeroConfToolConfig {
    pub endpoint: String,
    pub interval: Option<u64>,
    pub max_retries: Option<u64>,
}

#[derive(Deserialize, Serialize, Debug)]
struct ZeroConfResponse {
    observations: Option<Observations>,
}

#[derive(Deserialize, Serialize, Debug, Default)]
struct Observations {
    bridge: Option<BridgeData>,
}

#[derive(Deserialize, Serialize, Debug, Default)]
struct BridgeData {
    seen: u64,
    total: u64,
}

#[derive(Default, Debug)]
struct TxState {
    retries: u64,
    senders: Vec<oneshot::Sender<bool>>,
}

#[derive(Clone)]
pub struct ZeroConfTool {
    symbol: String,
    endpoint: String,
    max_retries: u64,
    retry_delay: u64,

    to_check: Arc<DashMap<String, TxState>>,

    client: reqwest::Client,
}

impl ZeroConfTool {
    pub fn new(
        cancellation_token: CancellationToken,
        symbol: String,
        config: ZeroConfToolConfig,
    ) -> Self {
        let tool = ZeroConfTool {
            symbol,
            client: Client::new(),
            endpoint: config.endpoint,
            max_retries: config.max_retries.unwrap_or(DEFAULT_MAX_RETRIES),
            retry_delay: config.interval.unwrap_or(DEFAULT_RETRY_DELAY),
            to_check: Arc::new(DashMap::new()),
        };
        info!(
            "Checking every {}ms with {} retries with 0-conf tool for {} at: {}",
            tool.retry_delay, tool.max_retries, tool.symbol, tool.endpoint
        );

        {
            let tool = tool.clone();
            tokio::spawn(async move {
                tool.start(cancellation_token).await;
            });
        }

        tool
    }

    async fn start(&self, cancellation_token: CancellationToken) {
        loop {
            if let Err(e) = self.check().await {
                error!("Error calling {} 0-conf tool: {}", self.symbol, e);

                for mut entry in self.to_check.iter_mut() {
                    for sender in entry.value_mut().senders.drain(..) {
                        let _ = sender.send(false);
                    }
                }
                self.to_check.clear();
            }

            tokio::select! {
                _ = tokio::time::sleep(Duration::from_millis(self.retry_delay)) => {},
                _ = cancellation_token.cancelled() => break,
            };
        }
    }

    async fn check(&self) -> Result<()> {
        let mut to_remove = Vec::new();

        for mut entry in self.to_check.iter_mut() {
            let tx_id = entry.key().clone();

            let data = self
                .client
                .get(format!("{}/{}", self.endpoint, tx_id))
                .timeout(REQUEST_TIMEOUT)
                .send()
                .await?
                .json::<ZeroConfResponse>()
                .await?;

            let bridge = data
                .observations
                .unwrap_or_default()
                .bridge
                .unwrap_or_default();

            if bridge.seen > 0 && bridge.seen == bridge.total {
                let value = entry.value_mut();
                for sender in value.senders.drain(..) {
                    let _ = sender.send(true);
                }

                trace!(
                    "Accepted {} transaction {} after {} retries",
                    self.symbol,
                    tx_id,
                    // Current check is not counted yet
                    value.retries + 1
                );

                #[cfg(feature = "metrics")]
                metrics::counter!(crate::metrics::ZEROCONF_TOOL_TXS, "status" => "accepted")
                    .increment(1);
                #[cfg(feature = "metrics")]
                metrics::counter!(crate::metrics::ZEROCONF_TOOL_TXS_CALLS)
                    .increment(value.retries + 1);

                to_remove.push(tx_id);
                continue;
            }

            let retries = entry.value().retries + 1;
            if retries >= self.max_retries {
                for sender in entry.value_mut().senders.drain(..) {
                    let _ = sender.send(false);
                }

                trace!(
                    "Rejected {} transaction {} after {} retries",
                    self.symbol, tx_id, retries
                );

                to_remove.push(tx_id);

                #[cfg(feature = "metrics")]
                metrics::counter!(crate::metrics::ZEROCONF_TOOL_TXS, "status" => "rejected")
                    .increment(1);

                continue;
            }

            entry.value_mut().retries = retries;
        }

        for key in to_remove {
            self.to_check.remove(&key);
        }

        Ok(())
    }
}

impl ZeroConfCheck for ZeroConfTool {
    fn check_transaction(&self, transaction: &Transaction) -> oneshot::Receiver<bool> {
        let tx_id = transaction.txid_hex();
        let (tx, rx) = oneshot::channel();

        let mut entry = self.to_check.entry(tx_id).or_default();
        entry.senders.push(tx);

        rx
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use crate::chain::types::Type;
    use crate::chain::utils::parse_transaction_hex;
    use rstest::rstest;
    use wiremock::matchers::{method, path};
    use wiremock::{Mock, MockServer, ResponseTemplate};

    const TX_HEX: &str = "0200000000010103645fa5850fa5800a87b2a8c79b9326c81c0efe3ad487a6aade4f9fc57578550100000000fdffffff02406f40010000000022512060b5cba1e3a0577877cd2978dfc4d859c0f8e6a5f627c93ef339d3f886fe52e7e7575a3a00000000225120bb7beca2338aeaa5cf8237c3106b63a70bfebb8ced05f82c7ccc399ba815da610247304402205bf0c42957549cac99a3fab2a562090ea2b7aff0612efbdd38877b2327523a69022074781677c7e25d3632bfaec4cc350c4624db73e3d91ed9bf02f24ccd856bc582012103fbc5c2e836f3d7a088214b265b6afafa3186852d95032ed0d122e5b96d74997791000000";

    #[tokio::test]
    async fn test_new_coalesce_options() {
        let config = ZeroConfToolConfig {
            endpoint: "https://example.com".to_string(),
            interval: None,
            max_retries: None,
        };

        let cancel = CancellationToken::new();
        let tool = ZeroConfTool::new(cancel.clone(), "BTC".to_string(), config);
        assert_eq!(tool.max_retries, DEFAULT_MAX_RETRIES);
        assert_eq!(tool.retry_delay, DEFAULT_RETRY_DELAY);

        cancel.cancel();
    }

    #[tokio::test]
    async fn test_check_transaction_accepted() {
        let tx = parse_transaction_hex(&Type::Bitcoin, TX_HEX).unwrap();

        let mock_server = MockServer::start().await;
        Mock::given(method("GET"))
            .and(path(format!("/{}", tx.txid_hex()).as_str()))
            .respond_with(ResponseTemplate::new(200).set_body_json(ZeroConfResponse {
                observations: Some(Observations {
                    bridge: Some(BridgeData { seen: 3, total: 3 }),
                }),
            }))
            .mount(&mock_server)
            .await;

        let cancel = CancellationToken::new();
        let tool = ZeroConfTool::new(
            cancel.clone(),
            "BTC".to_string(),
            ZeroConfToolConfig {
                endpoint: mock_server.uri(),
                interval: None,
                max_retries: None,
            },
        );

        let rx = tool.check_transaction(&tx);
        assert!(rx.await.unwrap());

        cancel.cancel();

        assert!(tool.to_check.is_empty());
    }

    #[rstest]
    #[case(0, 0)]
    #[case(0, 3)]
    #[case(1, 3)]
    #[case(2, 3)]
    #[tokio::test]
    async fn test_check_transaction_rejected(#[case] seen: u64, #[case] total: u64) {
        let tx = parse_transaction_hex(&Type::Bitcoin, TX_HEX).unwrap();

        let mock_server = MockServer::start().await;
        Mock::given(method("GET"))
            .and(path(format!("/{}", tx.txid_hex()).as_str()))
            .respond_with(ResponseTemplate::new(200).set_body_json(ZeroConfResponse {
                observations: Some(Observations {
                    bridge: Some(BridgeData { seen, total }),
                }),
            }))
            .mount(&mock_server)
            .await;

        let cancel = CancellationToken::new();
        let tool = ZeroConfTool::new(
            cancel.clone(),
            "BTC".to_string(),
            ZeroConfToolConfig {
                endpoint: mock_server.uri(),
                interval: Some(50),
                max_retries: Some(3),
            },
        );

        let rx = tool.check_transaction(&tx);
        assert!(!rx.await.unwrap());

        cancel.cancel();

        assert!(tool.to_check.is_empty());
    }
}

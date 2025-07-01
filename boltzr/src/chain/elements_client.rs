use crate::chain::chain_client::ChainClient;
use crate::chain::elements::{ZeroConfCheck, ZeroConfTool};
use crate::chain::types::{NetworkInfo, RawTransactionVerbose};
use crate::chain::utils::{Outpoint, Transaction};
use crate::chain::{BaseClient, Client, LiquidConfig};
use crate::wallet::Network;
use async_trait::async_trait;
use std::collections::HashSet;
use std::sync::Arc;
use tokio::sync::broadcast::Receiver;
use tokio::sync::oneshot;
use tokio_util::sync::CancellationToken;
use tracing::{debug, info, instrument, warn};

pub const SYMBOL: &str = "L-BTC";

const TYPE: crate::chain::types::Type = crate::chain::types::Type::Elements;

#[derive(Clone)]
pub struct ElementsClient {
    network: Network,
    client: ChainClient,
    lowball_client: Option<ChainClient>,
    zero_conf_tool: Option<Arc<dyn ZeroConfCheck + Send + Sync>>,
}

impl ElementsClient {
    #[instrument(name = "ElementsClient::new", skip_all)]
    pub fn new(
        cancellation_token: CancellationToken,
        network: Network,
        config: LiquidConfig,
    ) -> anyhow::Result<Self> {
        let client = ChainClient::new(
            cancellation_token.clone(),
            TYPE,
            SYMBOL.to_string(),
            config.base,
        )?;
        let lowball_client = match config.lowball {
            Some(lowball_config) => Some(ChainClient::new(
                cancellation_token.clone(),
                TYPE,
                SYMBOL.to_string(),
                lowball_config,
            )?),
            None => {
                debug!("No {} lowball client configured", SYMBOL);
                None
            }
        };

        Ok(Self {
            network,
            client,
            lowball_client,
            zero_conf_tool: config.zero_conf_tool.map(|config| {
                Arc::new(ZeroConfTool::new(
                    cancellation_token,
                    SYMBOL.to_string(),
                    config,
                )) as Arc<dyn ZeroConfCheck + Send + Sync>
            }),
        })
    }

    fn wallet_client(&self) -> &ChainClient {
        match &self.lowball_client {
            Some(lowball) => lowball,
            None => &self.client,
        }
    }

    #[cfg(test)]
    pub fn set_network(&mut self, network: Network) {
        self.network = network;
    }
}

#[async_trait]
impl BaseClient for ElementsClient {
    fn kind(&self) -> String {
        "Elements client".to_string()
    }

    fn symbol(&self) -> String {
        SYMBOL.to_string()
    }

    async fn connect(&mut self) -> anyhow::Result<()> {
        self.client.connect().await?;

        if let Some(mut lowball_client) = self.lowball_client.clone() {
            info!("Connecting to {} lowball client", SYMBOL);
            lowball_client.connect().await?;
            self.lowball_client = Some(lowball_client);
        }

        Ok(())
    }
}

#[async_trait]
impl Client for ElementsClient {
    async fn scan_mempool(
        &self,
        relevant_inputs: &HashSet<Outpoint>,
        relevant_outputs: &HashSet<Vec<u8>>,
    ) -> anyhow::Result<Vec<Transaction>> {
        self.wallet_client()
            .scan_mempool(relevant_inputs, relevant_outputs)
            .await
    }

    async fn network_info(&self) -> anyhow::Result<NetworkInfo> {
        self.wallet_client().network_info().await
    }

    async fn estimate_fee(&self) -> anyhow::Result<f64> {
        self.wallet_client().estimate_fee().await
    }

    async fn raw_transaction_verbose(&self, tx_id: &str) -> anyhow::Result<RawTransactionVerbose> {
        self.wallet_client().raw_transaction_verbose(tx_id).await
    }

    fn zero_conf_safe(&self, transaction: &Transaction) -> oneshot::Receiver<bool> {
        if self.network == Network::Regtest {
            let (tx, rx) = oneshot::channel();
            tx.send(true).unwrap();
            return rx;
        }

        match &self.zero_conf_tool {
            Some(tool) => tool.check_transaction(transaction),
            None => self.wallet_client().zero_conf_safe(transaction),
        }
    }

    fn tx_receiver(&self) -> Receiver<(Transaction, bool)> {
        self.wallet_client().tx_receiver()
    }
}

#[cfg(test)]
pub mod test {
    use super::*;
    use crate::chain::elements_client::ElementsClient;
    use crate::chain::types::{RpcParam, Type};
    use crate::chain::utils::parse_transaction_hex;
    use crate::chain::{Config, LiquidConfig};
    use mockall::mock;
    use rstest::rstest;
    use serial_test::serial;
    use std::sync::OnceLock;

    mock! {
        pub ZeroConfTool {}

        impl ZeroConfCheck for ZeroConfTool {
            fn check_transaction(&self, transaction: &Transaction) -> oneshot::Receiver<bool>;
        }
    }

    pub fn get_client() -> (ElementsClient, Config) {
        let config = Config {
            host: "127.0.0.1".to_string(),
            port: 18_884,
            cookie: None,
            user: Some("boltz".to_string()),
            password: Some("anoVB0m1KvX0SmpPxvaLVADg0UQVLQTEx3jCD3qtuRI".to_string()),
            mempool_space: None,
        };

        static CLIENT: OnceLock<(ElementsClient, Config)> = OnceLock::new();
        CLIENT
            .get_or_init(|| {
                (
                    ElementsClient::new(
                        CancellationToken::new(),
                        Network::Regtest,
                        LiquidConfig {
                            base: config.clone(),
                            lowball: Some(config.clone()),
                            zero_conf_tool: None,
                        },
                    )
                    .unwrap(),
                    config,
                )
            })
            .clone()
    }

    async fn send_transaction(client: &ElementsClient) -> Transaction {
        let tx_id = client
            .wallet_client()
            .client
            .request::<String>(
                "sendtoaddress",
                Some(vec![
                    RpcParam::Str(
                        client
                            .wallet_client()
                            .client
                            .request::<String>("getnewaddress", None)
                            .await
                            .unwrap(),
                    ),
                    RpcParam::Float(0.21),
                ]),
            )
            .await
            .unwrap();

        parse_transaction_hex(
            &Type::Elements,
            &client
                .wallet_client()
                .client
                .request::<String>("getrawtransaction", Some(vec![RpcParam::Str(tx_id)]))
                .await
                .unwrap(),
        )
        .unwrap()
    }

    async fn generate_block(client: &ElementsClient) {
        client
            .wallet_client()
            .client
            .request::<serde_json::Value>(
                "generatetoaddress",
                Some(vec![
                    RpcParam::Int(1),
                    RpcParam::Str(
                        client
                            .wallet_client()
                            .client
                            .request::<String>("getnewaddress", None)
                            .await
                            .unwrap(),
                    ),
                ]),
            )
            .await
            .unwrap();
    }

    #[tokio::test]
    async fn test_wallet_client() {
        let cancellation_token = CancellationToken::new();

        let (_, config) = get_client();
        let client = ElementsClient::new(
            cancellation_token.clone(),
            Network::Regtest,
            LiquidConfig {
                base: config.clone(),
                lowball: None,
                zero_conf_tool: None,
            },
        )
        .unwrap();
        assert!(client.lowball_client.clone().is_none());
        assert_eq!(client.wallet_client().clone(), client.client);

        let mut config_lowball = config.clone();
        config_lowball.port = 123;
        let client = ElementsClient::new(
            cancellation_token.clone(),
            Network::Regtest,
            LiquidConfig {
                base: config,
                lowball: Some(config_lowball),
                zero_conf_tool: None,
            },
        )
        .unwrap();
        assert!(client.lowball_client.clone().is_some());
        assert_eq!(
            client.wallet_client().clone(),
            client.lowball_client.unwrap()
        );

        cancellation_token.cancel();
    }

    #[tokio::test]
    async fn test_get_fees_smart_fee() {
        let (client, _) = get_client();
        let fees = client.estimate_fee().await.unwrap();
        assert_eq!(fees, 0.1);
    }

    #[tokio::test]
    #[serial(LBTC)]
    async fn test_zero_conf_safe_regtest() {
        let (client, _) = get_client();
        assert_eq!(client.network, Network::Regtest);

        let tx = send_transaction(&client).await;
        let zero_conf_safe = client.zero_conf_safe(&tx);

        let received = zero_conf_safe.await.unwrap();
        assert!(received);

        generate_block(&client).await;
    }

    #[tokio::test]
    #[serial(LBTC)]
    async fn test_zero_conf_safe_not_regtest() {
        let (mut client, _) = get_client();
        client.network = Network::Testnet;

        let tx = send_transaction(&client).await;
        let zero_conf_safe = client.zero_conf_safe(&tx);

        let received = zero_conf_safe.await.unwrap();
        assert!(!received);

        generate_block(&client).await;
    }

    #[rstest]
    #[case(true)]
    #[case(false)]
    #[tokio::test]
    #[serial(LBTC)]
    async fn test_zero_conf_safe_tool(#[case] expected: bool) {
        let (mut client, _) = get_client();
        client.network = Network::Testnet;

        let mut tool = MockZeroConfTool::new();
        tool.expect_check_transaction()
            .times(1)
            .returning(move |_| {
                let (tx, rx) = oneshot::channel();
                tx.send(expected).unwrap();
                rx
            });

        client.zero_conf_tool = Some(Arc::new(tool));

        let tx = send_transaction(&client).await;
        let zero_conf_safe = client.zero_conf_safe(&tx);

        let received = zero_conf_safe.await.unwrap();
        assert_eq!(received, expected);

        generate_block(&client).await;
    }
}

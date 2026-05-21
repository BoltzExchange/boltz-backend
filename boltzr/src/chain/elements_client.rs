use crate::chain::chain_client::ChainClient;
use crate::chain::elements::{ZeroConfCheck, zero_conf_tool};
use crate::chain::types::{
    BlockchainInfo, NetworkInfo, RawTransactionVerbose, SignRawTransactionResponse, Type,
    UnspentOutput,
};
use crate::chain::utils::{Block, Outpoint, Transaction};
use crate::chain::{BaseClient, Client, LiquidConfig, Transactions};
use crate::db::helpers::chain_tip::ChainTipHelper;
use crate::wallet::Network;
use async_trait::async_trait;
use boltz_cache::Cache;
use std::collections::HashSet;
use std::sync::Arc;
use tokio::sync::broadcast::Receiver;
use tokio::sync::oneshot;
use tokio_util::sync::CancellationToken;
use tracing::instrument;

pub const SYMBOL: &str = "L-BTC";

const TYPE: Type = Type::Elements;

const DEFAULT_ADDRESS_TYPE: &str = "blech32";

#[derive(Clone)]
pub struct ElementsClient {
    network: Network,
    client: ChainClient,
    zero_conf_tool: Option<Arc<dyn ZeroConfCheck + Send + Sync>>,
}

impl ElementsClient {
    #[instrument(name = "ElementsClient::new", skip_all)]
    pub fn new(
        cancellation_token: CancellationToken,
        network: Network,
        cache: Cache,
        config: LiquidConfig,
    ) -> anyhow::Result<Self> {
        let client = ChainClient::new(
            cancellation_token.clone(),
            cache,
            TYPE,
            network,
            SYMBOL.to_string(),
            config.base,
        )?;

        let zero_conf_tool = match config.zero_conf_tool {
            Some(zero_conf_config) => Some(zero_conf_tool::new(
                cancellation_token,
                SYMBOL.to_string(),
                zero_conf_config,
            )?),
            None => None,
        };

        Ok(Self {
            network,
            client,
            zero_conf_tool,
        })
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
        Ok(())
    }
}

#[async_trait]
impl Client for ElementsClient {
    fn chain_type(&self) -> Type {
        TYPE
    }

    fn network(&self) -> Network {
        self.network
    }

    async fn rescan(
        &self,
        chain_tip_repo: Arc<dyn ChainTipHelper + Send + Sync>,
        start_height: u64,
        relevant_inputs: &HashSet<Outpoint>,
        relevant_outputs: &HashSet<Vec<u8>>,
    ) -> anyhow::Result<u64> {
        self.client
            .rescan(
                chain_tip_repo,
                start_height,
                relevant_inputs,
                relevant_outputs,
            )
            .await
    }

    async fn scan_mempool(
        &self,
        relevant_inputs: &HashSet<Outpoint>,
        relevant_outputs: &HashSet<Vec<u8>>,
    ) -> anyhow::Result<()> {
        self.client
            .scan_mempool(relevant_inputs, relevant_outputs)
            .await
    }

    async fn network_info(&self) -> anyhow::Result<NetworkInfo> {
        self.client.network_info().await
    }

    async fn blockchain_info(&self) -> anyhow::Result<BlockchainInfo> {
        self.client.blockchain_info().await
    }

    async fn estimate_fee(&self) -> anyhow::Result<f64> {
        self.client.estimate_fee().await
    }

    async fn raw_transaction(&self, tx_id: &str) -> anyhow::Result<String> {
        self.client.raw_transaction(tx_id).await
    }

    async fn raw_transaction_verbose(&self, tx_id: &str) -> anyhow::Result<RawTransactionVerbose> {
        self.client.raw_transaction_verbose(tx_id).await
    }

    async fn send_raw_transaction(&self, tx: &str) -> anyhow::Result<String> {
        self.client.send_raw_transaction(tx).await
    }

    async fn list_unspent(&self, wallet: Option<&str>) -> anyhow::Result<Vec<UnspentOutput>> {
        self.client.list_unspent(wallet).await
    }

    async fn get_new_address(
        &self,
        wallet: Option<&str>,
        label: &str,
        address_type: Option<&str>,
    ) -> anyhow::Result<String> {
        self.client
            .get_new_address(
                wallet,
                label,
                Some(address_type.unwrap_or(DEFAULT_ADDRESS_TYPE)),
            )
            .await
    }

    async fn dump_blinding_key(
        &self,
        wallet: Option<&str>,
        address: &str,
    ) -> anyhow::Result<String> {
        self.client.dump_blinding_key(wallet, address).await
    }

    async fn sign_raw_transaction_with_wallet(
        &self,
        wallet: Option<&str>,
        tx: &str,
    ) -> anyhow::Result<SignRawTransactionResponse> {
        self.client
            .sign_raw_transaction_with_wallet(wallet, tx)
            .await
    }

    #[cfg(test)]
    async fn request_wallet(
        &self,
        wallet: Option<&str>,
        method: &str,
        params: Option<&[crate::chain::types::RpcParam<'_>]>,
    ) -> anyhow::Result<serde_json::Value> {
        self.client.request_wallet(wallet, method, params).await
    }

    fn zero_conf_safe(&self, transaction: &Transaction) -> oneshot::Receiver<bool> {
        if self.network == Network::Regtest {
            let (tx, rx) = oneshot::channel();
            let _ = tx.send(true);
            return rx;
        }

        match &self.zero_conf_tool {
            Some(tool) => tool.check_transaction(transaction),
            None => self.client.zero_conf_safe(transaction),
        }
    }

    fn tx_receiver(&self) -> Receiver<(Transactions, bool)> {
        self.client.tx_receiver()
    }

    fn block_receiver(&self) -> Receiver<(u64, Block)> {
        self.client.block_receiver()
    }
}

#[cfg(test)]
pub mod test {
    use super::*;
    use crate::chain::elements_client::ElementsClient;
    use crate::chain::types::{RpcParam, Type};
    use crate::chain::utils::Transaction;
    use crate::chain::{Config, LiquidConfig};
    use boltz_cache::{Cache, MemCache};
    use mockall::mock;
    use rstest::rstest;
    use serial_test::serial;
    use std::sync::OnceLock;

    const ELEMENTS_TX_HEX: &str = include_str!("../../fixtures/elements-tx.txt");

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
            user: Some("regtest".to_string()),
            password: Some("regtest".to_string()),
            wallet: Some("regtest".to_string()),
            ..Default::default()
        };

        static CLIENT: OnceLock<(ElementsClient, Config)> = OnceLock::new();
        CLIENT
            .get_or_init(|| {
                (
                    ElementsClient::new(
                        CancellationToken::new(),
                        Network::Regtest,
                        Cache::Memory(MemCache::new()),
                        LiquidConfig {
                            base: config.clone(),
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
            .client
            .client
            .request_wallet::<String>(
                None,
                "sendtoaddress",
                Some(&[
                    RpcParam::Str(
                        &client
                            .client
                            .client
                            .request_wallet::<String>(None, "getnewaddress", None)
                            .await
                            .unwrap(),
                    ),
                    RpcParam::Float(0.21),
                ]),
            )
            .await
            .unwrap();

        Transaction::parse_hex(
            &Type::Elements,
            &client
                .client
                .client
                .request::<String>("getrawtransaction", Some(&[RpcParam::Str(&tx_id)]))
                .await
                .unwrap(),
        )
        .unwrap()
    }

    async fn generate_block(client: &ElementsClient) {
        client
            .client
            .client
            .request_wallet::<serde_json::Value>(
                None,
                "generatetoaddress",
                Some(&[
                    RpcParam::Int(1),
                    RpcParam::Str(
                        &client
                            .client
                            .client
                            .request_wallet::<String>(None, "getnewaddress", None)
                            .await
                            .unwrap(),
                    ),
                ]),
            )
            .await
            .unwrap();
    }

    #[tokio::test]
    async fn test_chain_type() {
        let (client, _) = get_client();
        assert_eq!(client.chain_type(), Type::Elements);
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

        let tx = Transaction::parse_hex(&Type::Elements, ELEMENTS_TX_HEX).unwrap();
        let zero_conf_safe = client.zero_conf_safe(&tx);

        let received = zero_conf_safe.await.unwrap();
        assert_eq!(received, expected);
    }
}

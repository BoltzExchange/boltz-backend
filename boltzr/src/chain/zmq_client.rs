use crate::{
    chain::{
        Config,
        types::{Type, ZmqNotification},
        utils::{Block, Transaction},
    },
    wallet::Network,
};
use tokio::sync::broadcast::{self, Sender};
use tokio::time::{Duration, timeout};
use tracing::{debug, error, info, warn};
use zeromq::{Socket, SocketRecv, SubSocket, ZmqError, ZmqMessage};

pub const ZMQ_TX_CHANNEL_SIZE: usize = 1024 * 16;
pub const ZMQ_BLOCK_CHANNEL_SIZE: usize = 1024;

const ZMQ_RECONNECT_DELAY_SECONDS: u64 = 1;

const ZMQ_INACTIVITY_TIMEOUT_BLOCK_SECONDS: u64 = 60 * 60;
const ZMQ_INACTIVITY_TIMEOUT_TRANSACTION_SECONDS: u64 = 5 * 60;

#[derive(Debug, Clone)]
pub struct ZmqClient {
    client_type: Type,
    network: Network,
    config: Config,

    pub block_sender: Sender<Block>,
    pub tx_sender: Sender<Transaction>,
}

impl ZmqClient {
    pub fn new(client_type: Type, network: Network, config: Config) -> ZmqClient {
        ZmqClient {
            client_type,
            network,
            config,
            tx_sender: broadcast::channel::<Transaction>(ZMQ_TX_CHANNEL_SIZE).0,
            block_sender: broadcast::channel::<Block>(ZMQ_BLOCK_CHANNEL_SIZE).0,
        }
    }

    pub async fn connect(&self, notifications: &[ZmqNotification]) -> anyhow::Result<()> {
        self.subscribe_raw_tx(notifications).await?;
        self.subscribe_raw_block(notifications).await?;

        Ok(())
    }

    async fn subscribe_raw_tx(&self, notifications: &[ZmqNotification]) -> anyhow::Result<()> {
        let raw_tx = match Self::find_notification("pubrawtx", notifications) {
            Some(data) => data,
            None => return Err(anyhow::anyhow!("pubrawtx ZMQ missing")),
        };

        let tx_sender = self.tx_sender.clone();
        let client_type = self.client_type;

        self.subscribe(
            raw_tx,
            "rawtx",
            if self.network != Network::Regtest {
                Some(ZMQ_INACTIVITY_TIMEOUT_TRANSACTION_SECONDS)
            } else {
                None
            },
            move |msg| {
                // No need to send transactions if no one is listening
                if tx_sender.receiver_count() == 0 {
                    return;
                }

                let tx_bytes = match msg.get(1) {
                    Some(tx_bytes) => tx_bytes,
                    None => {
                        warn!("{client_type} ZMQ client received a malformed message");
                        return;
                    }
                };

                let tx = match Transaction::parse(&client_type, tx_bytes) {
                    Ok(tx) => tx,
                    Err(e) => {
                        warn!("{client_type} ZMQ client could not parse transaction: {e}");
                        return;
                    }
                };

                if let Err(e) = tx_sender.send(tx) {
                    warn!("{client_type} ZMQ client could not send transaction to channel: {e}");
                }
            },
        )
        .await?;

        Ok(())
    }

    async fn subscribe_raw_block(&self, notifications: &[ZmqNotification]) -> anyhow::Result<()> {
        let raw_block = match Self::find_notification("pubrawblock", notifications) {
            Some(data) => data,
            None => return Err(anyhow::anyhow!("pubrawblock ZMQ missing")),
        };

        let block_sender = self.block_sender.clone();
        let client_type = self.client_type;

        self.subscribe(
            raw_block,
            "rawblock",
            if self.network != Network::Regtest {
                Some(ZMQ_INACTIVITY_TIMEOUT_BLOCK_SECONDS)
            } else {
                None
            },
            move |msg| {
                // No need to send blocks if no one is listening
                if block_sender.receiver_count() == 0 {
                    return;
                }

                let block_bytes = match msg.get(1) {
                    Some(block_bytes) => block_bytes,
                    None => {
                        warn!("{client_type} ZMQ client received a malformed message");
                        return;
                    }
                };

                let block = match Block::parse(&client_type, block_bytes) {
                    Ok(block) => block,
                    Err(e) => {
                        warn!("{client_type} ZMQ client could not parse block: {e}");
                        return;
                    }
                };

                if let Err(e) = block_sender.send(block) {
                    warn!("{client_type} ZMQ client could not send block to channel: {e}");
                }
            },
        )
        .await?;

        Ok(())
    }

    async fn subscribe<F>(
        &self,
        notification: &ZmqNotification,
        subscription: &str,
        inactivity_timeout: Option<u64>,
        handler: F,
    ) -> Result<(), ZmqError>
    where
        F: Fn(ZmqMessage) + Send + 'static,
    {
        let address = self.replace_zmq_address_wildcard(&notification.address);

        let mut socket = self.create_socket(&address, subscription).await?;

        let subscription = subscription.to_string();
        let self_cp = self.clone();

        tokio::spawn(async move {
            loop {
                let inactivity_timeout = inactivity_timeout.map(Duration::from_secs);

                loop {
                    let recv_fut = socket.recv();
                    let result = if let Some(dur) = inactivity_timeout {
                        match timeout(dur, recv_fut).await {
                            Ok(r) => r,
                            Err(_) => {
                                warn!(
                                    "ZMQ {} {subscription} timed out after {:?} of inactivity",
                                    self_cp.client_type, dur
                                );
                                break;
                            }
                        }
                    } else {
                        recv_fut.await
                    };

                    match result {
                        Ok(recv) => handler(recv),
                        Err(e) => {
                            error!(
                                "ZMQ {} {subscription} error receiving data: {e}",
                                self_cp.client_type
                            );
                            break;
                        }
                    }
                }

                loop {
                    let reconnect_delay = Duration::from_secs(ZMQ_RECONNECT_DELAY_SECONDS);
                    info!(
                        "ZMQ {} {subscription} disconnected; reconnecting in {:?}",
                        self_cp.client_type, reconnect_delay
                    );
                    tokio::time::sleep(reconnect_delay).await;

                    socket = match self_cp.create_socket(&address, &subscription).await {
                        Ok(socket) => socket,
                        Err(e) => {
                            error!(
                                "ZMQ {} {subscription} error reconnecting: {e}",
                                self_cp.client_type
                            );
                            continue;
                        }
                    };
                    break;
                }
            }
        });

        Ok(())
    }

    fn replace_zmq_address_wildcard(&self, address: &str) -> String {
        address.replace("0.0.0.0", &self.config.host)
    }

    async fn create_socket(
        &self,
        address: &str,
        subscription: &str,
    ) -> Result<SubSocket, ZmqError> {
        debug!(
            "Connecting to {subscription} {} ZMQ: {address}",
            self.client_type
        );

        let mut socket = SubSocket::new();
        socket.connect(address).await?;
        socket.subscribe(subscription).await?;

        Ok(socket)
    }

    fn find_notification<'a>(
        to_find: &str,
        notifications: &'a [ZmqNotification],
    ) -> Option<&'a ZmqNotification> {
        notifications
            .iter()
            .find(|elem| elem.notification_type == to_find)
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use std::sync::{
        Arc,
        atomic::{AtomicU64, Ordering},
    };
    use zeromq::{PubSocket, SocketSend, ZmqMessage};

    #[tokio::test]
    async fn test_subscribe() {
        let zmq_client = ZmqClient::new(
            Type::Bitcoin,
            Network::Mainnet,
            Config {
                host: "127.0.0.1".to_string(),
                port: 28332,
                ..Default::default()
            },
        );

        let address = "tcp://127.0.0.1:28332";

        let mut socket = PubSocket::new();
        socket.bind(address).await.unwrap();

        let subscription = "rawtx";
        let message = "test";

        let received_count = Arc::new(AtomicU64::new(0));

        let received_count_cp = received_count.clone();
        zmq_client
            .subscribe(
                &ZmqNotification {
                    notification_type: "pubrawtx".to_string(),
                    address: address.to_string(),
                },
                subscription,
                None,
                move |msg| {
                    assert_eq!(msg.get(0).unwrap(), subscription);
                    assert_eq!(msg.get(1).unwrap(), message);
                    received_count_cp.fetch_add(1, Ordering::SeqCst);
                },
            )
            .await
            .unwrap();

        tokio::time::sleep(Duration::from_millis(100)).await;

        let mut msg: ZmqMessage = subscription.into();
        msg.push_back(message.into());
        socket.send(msg).await.unwrap();

        tokio::time::sleep(Duration::from_millis(100)).await;

        assert_eq!(received_count.load(Ordering::SeqCst), 1);

        socket.close().await;
    }

    #[tokio::test]
    async fn test_subscribe_inactivity_timeout() {
        let zmq_client = ZmqClient::new(
            Type::Bitcoin,
            Network::Mainnet,
            Config {
                host: "127.0.0.1".to_string(),
                port: 28332,
                ..Default::default()
            },
        );

        let address = "tcp://127.0.0.1:28333";

        let mut socket = PubSocket::new();
        socket.bind(address).await.unwrap();

        let subscription = "rawtx";
        let message = "test";

        let received_count = Arc::new(AtomicU64::new(0));

        let received_count_cp = received_count.clone();
        zmq_client
            .subscribe(
                &ZmqNotification {
                    notification_type: "pubrawtx".to_string(),
                    address: address.to_string(),
                },
                subscription,
                Some(1),
                move |msg| {
                    assert_eq!(msg.get(0).unwrap(), subscription);
                    assert_eq!(msg.get(1).unwrap(), message);
                    received_count_cp.fetch_add(1, Ordering::SeqCst);
                },
            )
            .await
            .unwrap();

        tokio::time::sleep(Duration::from_millis(2_500)).await;

        let mut msg: ZmqMessage = subscription.into();
        msg.push_back(message.into());
        socket.send(msg).await.unwrap();

        tokio::time::sleep(Duration::from_millis(100)).await;

        assert_eq!(received_count.load(Ordering::SeqCst), 1);

        socket.close().await;
    }

    #[test]
    fn test_replace_zmq_address_wildcard() {
        let zmq_client = ZmqClient::new(
            Type::Bitcoin,
            Network::Mainnet,
            Config {
                host: "127.0.0.1".to_string(),
                port: 28332,
                ..Default::default()
            },
        );
        assert_eq!(
            zmq_client.replace_zmq_address_wildcard("0.0.0.0:28332"),
            "127.0.0.1:28332"
        );
    }

    #[test]
    fn test_find_notification() {
        let notifications = vec![
            ZmqNotification {
                notification_type: "unknown".to_string(),
                address: "0.0.0.0:28333".to_string(),
            },
            ZmqNotification {
                notification_type: "pubrawtx".to_string(),
                address: "0.0.0.0:28332".to_string(),
            },
        ];

        assert_eq!(
            ZmqClient::find_notification("pubrawtx", &notifications),
            Some(&notifications[1])
        );
        assert_eq!(
            ZmqClient::find_notification("pubrawblock", &notifications),
            None
        );
    }
}

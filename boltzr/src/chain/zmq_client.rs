use crate::{
    chain::{
        Config,
        types::{Type, ZmqNotification},
        utils::Transaction,
    },
    wallet::Network,
};
use tokio::sync::broadcast::{self, Sender};
use tokio::time::{Duration, timeout};
use tracing::{debug, error, info, warn};
use zeromq::{Socket, SocketRecv, SubSocket, ZmqError, ZmqMessage};

pub const ZMQ_TX_CHANNEL_SIZE: usize = 1024 * 16;

const ZMQ_INACTIVITY_TIMEOUT_SECONDS: u64 = 60;
const ZMQ_RECONNECT_DELAY_SECONDS: u64 = 1;

#[derive(Debug, Clone)]
pub struct ZmqClient {
    client_type: Type,
    network: Network,
    config: Config,
    pub tx_sender: Sender<Transaction>,
}

impl ZmqClient {
    pub fn new(client_type: Type, network: Network, config: Config) -> ZmqClient {
        let (tx_sender, _) = broadcast::channel::<Transaction>(ZMQ_TX_CHANNEL_SIZE);

        ZmqClient {
            client_type,
            network,
            config,
            tx_sender,
        }
    }

    pub async fn connect(&self, notifications: Vec<ZmqNotification>) -> anyhow::Result<()> {
        let raw_tx = match Self::find_notification("pubrawtx", notifications.clone()) {
            Some(data) => data,
            None => return Err(anyhow::anyhow!("pubrawtx ZMQ missing")),
        };

        let tx_sender = self.tx_sender.clone();
        let client_type = self.client_type;

        self.subscribe(raw_tx, "rawtx", move |msg| {
            // No need to send transactions if no one is listening
            if tx_sender.receiver_count() == 0 {
                return;
            }

            let tx_bytes = msg.get(1).unwrap().to_vec();
            let tx: Transaction = match Transaction::parse(&client_type, &tx_bytes) {
                Ok(tx) => tx,
                Err(e) => {
                    warn!("{client_type} ZMQ client could not parse transaction: {e}");
                    return;
                }
            };

            if let Err(e) = tx_sender.send(tx) {
                warn!("{client_type} ZMQ client could not send transaction to channel: {e}");
            }
        })
        .await?;

        Ok(())
    }

    async fn subscribe<F>(
        &self,
        notification: ZmqNotification,
        subscription: &str,
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
                // On regtest we don't need inactivity timeouts
                let duration = Duration::from_secs(if self_cp.network != Network::Regtest {
                    ZMQ_INACTIVITY_TIMEOUT_SECONDS
                } else {
                    u64::MAX
                });

                loop {
                    match timeout(duration, socket.recv()).await {
                        Ok(Ok(recv)) => {
                            handler(recv);
                        }
                        Ok(Err(e)) => {
                            error!(
                                "ZMQ {} {subscription} error receiving data: {e}",
                                self_cp.client_type
                            );
                            break;
                        }
                        Err(_) => {
                            warn!(
                                "ZMQ {} {subscription} timed out after {:?} of inactivity",
                                self_cp.client_type, duration
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

    fn find_notification(
        to_find: &str,
        notifications: Vec<ZmqNotification>,
    ) -> Option<ZmqNotification> {
        notifications
            .into_iter()
            .find(|elem| elem.notification_type == to_find)
    }
}

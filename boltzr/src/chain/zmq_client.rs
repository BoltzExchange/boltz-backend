use crate::chain::{Config, types::ZmqNotification};
use crate::chain::{
    types::Type,
    utils::{Transaction, parse_transaction},
};
use tokio::sync::broadcast::{self, Sender};
use tracing::{debug, error, warn};
use zeromq::{Socket, SocketRecv, ZmqError, ZmqMessage};

#[derive(Debug, Clone)]
pub struct ZmqClient {
    client_type: Type,
    config: Config,
    pub tx_sender: Sender<Transaction>,
}

impl ZmqClient {
    pub fn new(client_type: Type, config: Config) -> ZmqClient {
        let (tx_sender, _) = broadcast::channel::<Transaction>(1024);

        ZmqClient {
            client_type,
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
        let client_type = self.client_type.clone();

        self.subscribe(raw_tx, "rawtx", move |msg| {
            let tx_bytes = msg.get(1).unwrap().to_vec();
            let tx: Transaction = match parse_transaction(&client_type, &tx_bytes) {
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
        debug!(
            "Connecting to {} {} ZMQ at {}",
            subscription, self.client_type, address
        );

        let mut socket = zeromq::SubSocket::new();
        socket.connect(&address).await?;

        socket.subscribe(subscription).await?;

        tokio::spawn(async move {
            loop {
                match socket.recv().await {
                    Ok(recv) => {
                        handler(recv);
                    }
                    Err(e) => {
                        error!("Error receiving data: {}", e);
                        break;
                    }
                }
            }
        });

        Ok(())
    }

    fn replace_zmq_address_wildcard(&self, address: &str) -> String {
        address.replace("0.0.0.0", &self.config.host)
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

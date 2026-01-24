use std::time::Duration;
use tokio::sync::mpsc;
use tracing::{trace, warn};

const SEND_TIMEOUT: Duration = Duration::from_secs(5);

/// Sends updates through an mpsc channel with a timeout to prevent blocking.
/// Returns silently on error (channel closed) or timeout, logging warnings as appropriate.
pub async fn send_with_timeout<T: Send + 'static>(tx: mpsc::Sender<Vec<T>>, updates: Vec<T>) {
    if updates.is_empty() {
        return;
    }

    match tokio::time::timeout(SEND_TIMEOUT, tx.send(updates)).await {
        Ok(Ok(())) => {}
        Ok(Err(err)) => {
            trace!("Error sending update: {}", err);
        }
        Err(_) => {
            warn!("Timeout sending update");
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_send_with_timeout_success() {
        let (tx, mut rx) = mpsc::channel::<Vec<String>>(16);

        send_with_timeout(tx, vec!["test".to_string()]).await;

        let received = rx.recv().await.unwrap();
        assert_eq!(received, vec!["test".to_string()]);
    }

    #[tokio::test]
    async fn test_send_with_timeout_empty_updates() {
        let (tx, mut rx) = mpsc::channel::<Vec<String>>(16);

        send_with_timeout(tx, vec![]).await;

        // Channel should be empty since we didn't send anything
        assert!(rx.try_recv().is_err());
    }

    #[tokio::test]
    async fn test_send_with_timeout_channel_closed() {
        let (tx, rx) = mpsc::channel::<Vec<String>>(16);
        drop(rx); // Close the receiver

        // Should not panic
        send_with_timeout(tx, vec!["test".to_string()]).await;
    }
}

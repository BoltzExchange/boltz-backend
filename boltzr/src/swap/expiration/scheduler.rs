use crate::swap::expiration::ExpirationChecker;
use tokio_util::sync::CancellationToken;
use tracing::{error, info};

pub struct Scheduler<T>
where
    T: ExpirationChecker,
{
    cancellation_token: CancellationToken,
    expiration_checker: T,
}

impl<T> Scheduler<T>
where
    T: ExpirationChecker,
{
    pub fn new(cancellation_token: CancellationToken, expiration_checker: T) -> Self {
        Self {
            cancellation_token,
            expiration_checker,
        }
    }

    pub async fn start(&self) {
        info!(
            "Checking {} every {:#?}",
            self.expiration_checker.name(),
            self.expiration_checker.interval()
        );

        let mut interval = tokio::time::interval_at(
            tokio::time::Instant::now() + self.expiration_checker.interval(),
            self.expiration_checker.interval(),
        );

        loop {
            tokio::select! {
                _ = interval.tick() => {},
                _ = self.cancellation_token.cancelled() => {
                    break;
                }
            }

            if let Err(err) = self.expiration_checker.check() {
                error!(
                    "Checking {} failed: {}",
                    self.expiration_checker.name(),
                    err
                );
            }
        }
    }
}

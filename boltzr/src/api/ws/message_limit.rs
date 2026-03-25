use serde::{Deserialize, Serialize};
use std::fmt::{Display, Formatter};
use tokio::time::{Duration, Instant};

const MESSAGE_LIMIT_WINDOW: Duration = Duration::from_secs(60);
pub const MESSAGE_LIMIT_EXCEEDED_REASON: &str = "message rate limit exceeded";

#[derive(Deserialize, Serialize, PartialEq, Clone, Debug)]
pub struct MessageLimitConfig {
    #[serde(rename = "messagesPerMinutePerConnection")]
    pub messages_per_minute_per_connection: u32,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct MessageLimitExceeded;

impl Display for MessageLimitExceeded {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", MESSAGE_LIMIT_EXCEEDED_REASON)
    }
}

#[derive(Debug, Clone)]
pub struct MessageRateLimiter {
    config: MessageLimitConfig,
    window_started_at: Instant,
    message_count: u32,
}

impl MessageRateLimiter {
    pub fn new(config: MessageLimitConfig, now: Instant) -> Self {
        Self {
            config,
            window_started_at: now,
            message_count: 0,
        }
    }

    pub fn try_acquire(&mut self, now: Instant) -> Result<(), MessageLimitExceeded> {
        if now.duration_since(self.window_started_at) >= MESSAGE_LIMIT_WINDOW {
            self.window_started_at = now;
            self.message_count = 0;
        }

        if self.message_count >= self.config.messages_per_minute_per_connection {
            return Err(MessageLimitExceeded);
        }

        self.message_count += 1;
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn create_limiter(limit: u32) -> MessageRateLimiter {
        MessageRateLimiter::new(
            MessageLimitConfig {
                messages_per_minute_per_connection: limit,
            },
            Instant::now(),
        )
    }

    #[test]
    fn allows_messages_under_limit() {
        let now = Instant::now();
        let mut limiter = create_limiter(2);

        assert!(limiter.try_acquire(now).is_ok());
        assert!(limiter.try_acquire(now + Duration::from_secs(30)).is_ok());
    }

    #[test]
    fn rejects_messages_over_limit() {
        let now = Instant::now();
        let mut limiter = create_limiter(1);

        assert!(limiter.try_acquire(now).is_ok());
        assert_eq!(
            limiter.try_acquire(now + Duration::from_secs(1)),
            Err(MessageLimitExceeded)
        );
    }

    #[test]
    fn resets_window_after_a_minute() {
        let now = Instant::now();
        let mut limiter = create_limiter(1);

        assert!(limiter.try_acquire(now).is_ok());
        assert_eq!(
            limiter.try_acquire(now + Duration::from_secs(1)),
            Err(MessageLimitExceeded)
        );
        assert!(limiter.try_acquire(now + Duration::from_secs(61)).is_ok());
    }
}

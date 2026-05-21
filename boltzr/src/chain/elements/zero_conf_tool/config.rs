use serde::{Deserialize, Serialize};

#[derive(Deserialize, Serialize, PartialEq, Debug, Clone)]
pub struct ZeroConfToolConfig {
    pub endpoint: String,

    /// HTTP transport: poll cadence in milliseconds between sweeps.
    pub interval: Option<u64>,

    /// HTTP transport: per-transaction retry cap before client-side reject.
    pub max_retries: Option<u64>,

    /// WebSocket transport: per-transaction wall-time deadline in seconds
    /// before client-side reject. Ignored by the HTTP transport.
    pub deadline_secs: Option<u64>,

    /// WebSocket transport: proactively replace the connection after this many
    /// seconds. Set to 0 to disable. Ignored by the HTTP transport.
    pub rotation_interval_secs: Option<u64>,
}

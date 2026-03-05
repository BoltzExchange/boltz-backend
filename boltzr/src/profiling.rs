use crate::config::GlobalConfig;
use pyroscope::PyroscopeAgent;
use pyroscope::backend::{BackendConfig, PprofConfig, pprof_backend};
use pyroscope::pyroscope::{PyroscopeAgentBuilder, PyroscopeAgentRunning, PyroscopeConfig};
use tracing::{error, info, warn};

pub fn start(config: &GlobalConfig) -> Option<PyroscopeAgent<PyroscopeAgentRunning>> {
    let endpoint = match &config.profiling_endpoint {
        Some(endpoint) => endpoint,
        None => {
            warn!("Not enabling profiler because it was not configured");
            return None;
        }
    };

    let pyroscope_defaults = PyroscopeConfig::default();
    let sample_rate = pyroscope_defaults.sample_rate;
    let backend = pprof_backend(PprofConfig { sample_rate }, BackendConfig::default());
    let agent = PyroscopeAgentBuilder::new(
        endpoint,
        crate::utils::get_name(&crate::utils::get_network(&config.network)),
        sample_rate,
        pyroscope_defaults.spy_name,
        pyroscope_defaults.spy_version,
        backend,
    )
    .tags(vec![("version", crate::utils::built_info::PKG_VERSION)])
    .build();

    let err = match agent {
        Ok(agent) => match agent.start() {
            Ok(agent) => {
                info!("Enabling profiler");
                return Some(agent);
            }
            Err(err) => err,
        },
        Err(err) => err,
    };
    error!("Could not create profiler: {}", err);
    None
}

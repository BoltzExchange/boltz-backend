use crate::config::GlobalConfig;
use pyroscope::PyroscopeAgent;
use pyroscope::pyroscope::PyroscopeAgentRunning;
use pyroscope_pprofrs::{PprofConfig, pprof_backend};
use tracing::{error, info, warn};

pub fn start(config: &GlobalConfig) -> Option<PyroscopeAgent<PyroscopeAgentRunning>> {
    let endpoint = match &config.profiling_endpoint {
        Some(endpoint) => endpoint,
        None => {
            warn!("Not enabling profiler because it was not configured");
            return None;
        }
    };

    let backend = pprof_backend(PprofConfig::new().sample_rate(100));
    let agent = PyroscopeAgent::builder(
        endpoint,
        &crate::utils::get_name(&crate::utils::get_network(&config.network)),
    )
    .backend(backend)
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

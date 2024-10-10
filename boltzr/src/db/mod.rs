use diesel::r2d2::ConnectionManager;
use diesel_migrations::{embed_migrations, EmbeddedMigrations, MigrationHarness};
use serde::{Deserialize, Serialize};
use std::error::Error;
use std::time::Duration;
use tracing::{debug, debug_span, info, instrument, trace};

pub mod helpers;
pub mod models;
pub mod schema;

pub const MIGRATIONS: EmbeddedMigrations = embed_migrations!("./migrations");

#[cfg(feature = "otel")]
type Connection = diesel_tracing::pg::InstrumentedPgConnection;

#[cfg(not(feature = "otel"))]
type Connection = diesel::PgConnection;

pub type Pool = r2d2::Pool<ConnectionManager<Connection>>;

#[derive(Deserialize, Serialize, PartialEq, Clone, Debug)]
pub struct Config {
    pub host: String,
    pub port: u16,
    pub database: String,
    pub username: String,
    pub password: String,
}

#[instrument(name = "db::connect", skip(config))]
pub fn connect(config: Config) -> Result<Pool, Box<dyn Error + Send + Sync>> {
    debug!("Connecting to PostgreSQL database");
    let manager: ConnectionManager<Connection> = ConnectionManager::new(format!(
        "postgresql://{}:{}@{}:{}/{}",
        config.username, config.password, config.host, config.port, config.database
    ));
    let pool = Pool::builder()
        .connection_timeout(Duration::from_secs(5))
        .build(manager)?;

    info!("Connected to database");

    let migration_span = debug_span!("migrations");
    let _span = migration_span.enter();
    debug!("Running migrations");
    let mut con = pool.get()?;
    con.run_pending_migrations(MIGRATIONS)?;

    trace!("Ran migrations");

    Ok(pool)
}

use diesel::r2d2::ConnectionManager;
use diesel::PgConnection;
use diesel_migrations::{embed_migrations, EmbeddedMigrations, MigrationHarness};
use r2d2::Pool;
use serde::{Deserialize, Serialize};
use std::error::Error;
use tracing::{debug, info, trace};

pub mod helpers;
pub mod models;
mod schema;

pub const MIGRATIONS: EmbeddedMigrations = embed_migrations!("./migrations");

#[derive(Deserialize, Serialize, PartialEq, Clone, Debug)]
pub struct Config {
    pub host: String,
    pub port: u16,
    pub database: String,
    pub username: String,
    pub password: String,
}

// TODO: test

pub fn connect(
    config: Config,
) -> Result<Pool<ConnectionManager<PgConnection>>, Box<dyn Error + Send + Sync>> {
    debug!("Connecting to PostgreSQL database");
    let manager: ConnectionManager<PgConnection> = ConnectionManager::new(format!(
        "postgresql://{}:{}@{}:{}/{}",
        config.username, config.password, config.host, config.port, config.database
    ));
    let pool = Pool::builder().build(manager)?;

    info!("Connected to database");

    debug!("Running migrations");
    let mut con = pool.get()?;
    con.run_pending_migrations(MIGRATIONS)?;

    trace!("Ran migrations");

    Ok(pool)
}

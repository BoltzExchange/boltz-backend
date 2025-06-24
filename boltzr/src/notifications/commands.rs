use crate::backup::Backup;
use crate::db::Pool;
use crate::db::helpers::offer::OfferHelper;
use async_trait::async_trait;
use std::collections::HashMap;
use std::future::Future;
use std::pin::Pin;
use std::sync::Arc;
use tracing::debug;

type Result = anyhow::Result<(bool, Option<String>)>;

#[async_trait]
pub trait CommandHandler {
    async fn handle_message(&self, message: &str) -> Result;
}

struct State {
    pool: Pool,
    backup: Option<Backup>,
}

type ExecutorResult = Pin<Box<dyn Future<Output = Result> + Send + 'static>>;
type Executor = Box<dyn Fn(Arc<State>, Vec<String>) -> ExecutorResult + Send + Sync + 'static>;

struct Command {
    description: String,
    executor: Executor,
}

#[derive(Clone)]
pub struct Commands {
    state: Arc<State>,
    executors: Arc<HashMap<String, Command>>,
}

impl Commands {
    pub fn new(pool: Pool, backup: Option<Backup>) -> Self {
        let mut executors: HashMap<String, Command> = HashMap::new();
        executors.insert(
            "offerinfo".to_string(),
            Command {
                description: "shows information about a BOLT12 offer".to_string(),
                executor: Box::new(|state, args| Box::pin(offer_info(state, args))),
            },
        );

        if backup.is_some() {
            executors.insert(
                "backup".to_string(),
                Command {
                    description: "backups the backend database".to_string(),
                    executor: Box::new(|state, args| Box::pin(upload_backup(state, args))),
                },
            );
        }

        Commands {
            executors: Arc::new(executors),
            state: Arc::new(State { pool, backup }),
        }
    }

    fn parse_message(message: &str) -> (String, Vec<String>) {
        let mut split = message.split_whitespace().collect::<Vec<&str>>();
        let command = split.first().unwrap_or(&"").to_lowercase();

        let args = (if !split.is_empty() {
            split.remove(0);
            split
        } else {
            Vec::new()
        })
        .into_iter()
        .map(|s| s.to_string())
        .collect();

        (command, args)
    }
}

#[async_trait]
impl CommandHandler for Commands {
    async fn handle_message(&self, message: &str) -> Result {
        let (command, args) = Self::parse_message(message);

        if let Some(cmd) = self.executors.get(command.as_str()) {
            debug!("Executing command: {}", command);
            return (cmd.executor)(self.state.clone(), args).await;
        }

        if command == "help" {
            let msg = format!(
                "Commands:\n{}",
                self.executors
                    .iter()
                    .map(|(c, cmd)| format!("- **{}**: {}", c, cmd.description))
                    .collect::<Vec<_>>()
                    .join("\n")
            );

            // We want to send the message but still forward it to Node.js
            return Ok((false, Some(msg.to_string())));
        }

        Ok((false, None))
    }
}

async fn offer_info(state: Arc<State>, args: Vec<String>) -> Result {
    if args.is_empty() {
        return Ok((true, Some("Please provide an offer".to_string())));
    }

    let offer = crate::db::helpers::offer::OfferHelperDatabase::new(state.pool.clone())
        .get_offer(&args[0])?;

    Ok((
        true,
        match offer {
            Some(offer) => Some(format!("```{}```", serde_json::to_string_pretty(&offer)?)),
            None => Some("Offer not found".to_string()),
        },
    ))
}

async fn upload_backup(state: Arc<State>, _args: Vec<String>) -> Result {
    if let Some(backup) = &state.backup {
        backup.database_backup().await?;
        return Ok((true, Some("Backed up backend database".to_string())));
    }

    Ok((false, None))
}

#[cfg(test)]
mod test {
    use crate::notifications::commands::Commands;

    #[test]
    fn test_parse_message_empty() {
        let msg = "";
        let (cmd, args) = Commands::parse_message(msg);

        assert_eq!(cmd, "");
        assert!(args.is_empty());
    }

    #[test]
    fn test_parse_message_no_args() {
        let msg = "help";
        let (cmd, args) = Commands::parse_message(msg);

        assert_eq!(cmd, "help");
        assert!(args.is_empty());
    }

    #[test]
    fn test_parse_message_args() {
        let msg = "help with some commands";
        let (cmd, args) = Commands::parse_message(msg);

        assert_eq!(cmd, "help");
        assert_eq!(args, vec!["with", "some", "commands"]);
    }

    #[test]
    fn test_parse_message_args_whitespace() {
        let msg = "help     with ";
        let (cmd, args) = Commands::parse_message(msg);

        assert_eq!(cmd, "help");
        assert_eq!(args, vec!["with"]);
    }
}

use anyhow::Result;
use clap::{Parser, Subcommand};
use rand::Rng;

mod scan_locked;
mod serde;
mod validators;

#[derive(Parser)]
#[command(version, about, long_about = None)]
#[command(propagate_version = true)]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    #[command(about = "Hash the input with SHA256")]
    HashSha256 {
        #[arg(value_parser = validators::hex_valid)]
        input: String,
    },
    #[command(about = "Scan for funds locked in a swap contract")]
    LockedInContract {
        #[arg(value_parser = validators::address_valid)]
        address: String,
        start_height: u64,
        #[arg(short, long, default_value_t = String::from("http://127.0.0.1:4444"), value_parser = validators::url_valid)]
        rpc_url: String,
        #[arg(short, long, default_value_t = 10_000)]
        scan_interval: u64,
    },
    #[command(about = "Generate a new keypair")]
    NewKeys,
    #[command(about = "Generate a new preimage")]
    NewPreimage,
}

#[tokio::main]
async fn main() {
    let cli = Cli::parse();

    if let Err(e) = run_command(cli).await {
        eprintln!("Error: {e}");
        std::process::exit(1);
    }
}

async fn run_command(cli: Cli) -> Result<()> {
    match &cli.command {
        Commands::HashSha256 { input } => {
            let hash = bitcoin_hashes::Sha256::hash(&alloy::hex::decode(input)?);
            println!("{}", alloy::hex::encode(hash));
        }
        Commands::LockedInContract {
            address,
            start_height,
            rpc_url,
            scan_interval,
        } => {
            scan_locked::scan_locked_in_contract(rpc_url, address, start_height, scan_interval)
                .await?;
        }
        Commands::NewKeys => {
            let secret_key = bitcoin::secp256k1::SecretKey::new(&mut rand::thread_rng());
            let public_key = secret_key.public_key(&bitcoin::key::Secp256k1::signing_only());

            println!(
                "{}",
                serde_json::to_string_pretty(&serde_json::json!({
                    "public_key": public_key.to_string(),
                    "private_key": alloy::hex::encode(secret_key.secret_bytes()),
                }))?
            );
        }
        Commands::NewPreimage => {
            let mut preimage = [0u8; 32];
            rand::thread_rng().fill(&mut preimage);
            let hash = bitcoin_hashes::Sha256::hash(&preimage);

            println!(
                "{}",
                serde_json::to_string_pretty(&serde_json::json!({
                    "preimage": alloy::hex::encode(preimage),
                    "hash": alloy::hex::encode(hash),
                }))?
            );
        }
    }

    Ok(())
}

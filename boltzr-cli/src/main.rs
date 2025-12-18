use ::serde::Serialize;
use anyhow::Result;
use boltz_core::Network;
use clap::{Parser, Subcommand};
use rand::Rng;

mod parsers;
mod scan_locked;
mod serde;
mod tx;
mod validators;

#[derive(Serialize)]
struct Transaction {
    transaction: String,
}

#[derive(Parser)]
#[command(version, about, long_about = None)]
#[command(propagate_version = true)]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    #[command(about = "Claims a HTLC UTXO")]
    Claim {
        #[arg(value_parser = parsers::parse_network)]
        network: Network,
        #[arg(value_parser = parsers::parse_hex)]
        preimage: parsers::HexBytes,
        #[arg(value_parser = parsers::parse_hex)]
        private_key: parsers::HexBytes,
        swap_tree_or_redeem_script: String,
        #[arg(value_parser = parsers::parse_hex)]
        raw_transaction: parsers::HexBytes,
        destination_address: String,
        fee_per_vbyte: f64,
        #[arg(short, long, value_parser = parsers::parse_hex)]
        blinding_key: Option<parsers::HexBytes>,
    },
    #[command(about = "Refunds a HTLC UTXO")]
    Refund {
        #[arg(value_parser = parsers::parse_network)]
        network: Network,
        timeout_block_height: u32,
        #[arg(value_parser = parsers::parse_hex)]
        private_key: parsers::HexBytes,
        swap_tree_or_redeem_script: String,
        #[arg(value_parser = parsers::parse_hex)]
        raw_transaction: parsers::HexBytes,
        destination_address: String,
        fee_per_vbyte: f64,
        #[arg(short, long, value_parser = parsers::parse_hex)]
        blinding_key: Option<parsers::HexBytes>,
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
    #[command(about = "Hash the input with SHA256")]
    HashSha256 {
        #[arg(value_parser = parsers::parse_hex)]
        input: parsers::HexBytes,
    },
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
    match cli.command {
        Commands::Claim {
            network,
            preimage,
            private_key,
            swap_tree_or_redeem_script,
            raw_transaction,
            destination_address,
            fee_per_vbyte,
            blinding_key,
        } => {
            let claim_tx = tx::claim_utxo(
                network,
                preimage.0,
                private_key.0,
                &swap_tree_or_redeem_script,
                raw_transaction.0,
                &destination_address,
                fee_per_vbyte,
                blinding_key.map(|key| key.0),
            )?;
            println!(
                "{}",
                serde_json::to_string_pretty(&Transaction {
                    transaction: alloy::hex::encode(claim_tx.serialize()),
                })?
            );
        }
        Commands::Refund {
            network,
            timeout_block_height,
            private_key,
            swap_tree_or_redeem_script,
            raw_transaction,
            destination_address,
            fee_per_vbyte,
            blinding_key,
        } => {
            let refund_tx = tx::refund_utxo(
                network,
                timeout_block_height,
                private_key.0,
                &swap_tree_or_redeem_script,
                raw_transaction.0,
                &destination_address,
                fee_per_vbyte,
                blinding_key.map(|key| key.0),
            )?;
            println!(
                "{}",
                serde_json::to_string_pretty(&Transaction {
                    transaction: alloy::hex::encode(refund_tx.serialize()),
                })?
            );
        }
        Commands::LockedInContract {
            address,
            start_height,
            rpc_url,
            scan_interval,
        } => {
            scan_locked::scan_locked_in_contract(&rpc_url, &address, start_height, scan_interval)
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
        Commands::HashSha256 { input } => {
            let hash = bitcoin_hashes::Sha256::hash(&input.0);
            println!("{}", alloy::hex::encode(hash));
        }
    }

    Ok(())
}

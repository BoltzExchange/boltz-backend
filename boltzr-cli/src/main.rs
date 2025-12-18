use ::serde::Serialize;
use anyhow::Result;
use boltz_core::Network;
use clap::{Parser, Subcommand};
use rand::Rng;
use std::path::PathBuf;

mod grpc;
mod parsers;
mod scan_locked;
mod serde;
mod tx;
mod validators;

#[derive(Serialize)]
struct Transaction {
    transaction: String,
}

#[derive(Serialize)]
struct Keys {
    public_key: String,
    private_key: String,
}

#[derive(Serialize)]
struct UnblindedOutput {
    value: u64,
    asset: String,
    is_lbtc: bool,
    script: String,
}

#[derive(Clone, Parser)]
#[command(version, about, long_about = None)]
#[command(propagate_version = true)]
struct Cli {
    #[command(subcommand)]
    command: Commands,

    #[arg(short, long, default_value = "127.0.0.1")]
    grpc_host: String,
    #[arg(short = 'p', long, default_value_t = 9000)]
    grpc_port: u16,
    #[arg(short = 'c', long, default_value = "~/.boltz/certificates")]
    grpc_certificates: PathBuf,
    #[arg(short = 'd', long, default_value_t = false)]
    grpc_disable_ssl: bool,
}

#[derive(Clone, Subcommand)]
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
        #[arg(short, long, default_value = "http://127.0.0.1:4444", value_parser = validators::url_valid)]
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
    #[command(about = "Hash the input with HASH160 (SHA256 followed by RIPEMD160)")]
    HashHash160 {
        #[arg(value_parser = parsers::parse_hex)]
        input: parsers::HexBytes,
    },
    #[command(about = "Gets information about the Boltz instance")]
    GetInfo {},
    #[command(about = "Adds a new referral ID to the database")]
    AddReferral {
        id: String,
        fee_share: u32,
        routing_node: Option<String>,
    },
    #[command(about = "Skips the safety checks and allows cooperative refunds for a swap")]
    AllowRefund { id: String },
    #[command(about = "Calculates the fee of a transaction")]
    CalculateTransactionFee { symbol: String, id: String },
    #[command(about = "Check a transaction and let it run through the backend again")]
    CheckTransaction { symbol: String, id: String },
    #[command(about = "Sets the CLN threshold for a swap type")]
    ClnThreshold {
        swap_type: parsers::SwapType,
        threshold: parsers::Amount,
    },
    #[command(about = "Derives the blinding key for an address")]
    DeriveBlindingKeys { address: String },
    #[command(about = "Derives a keypair from the index of the HD wallet")]
    DeriveKeys { symbol: String, index: u32 },
    #[command(about = "Gets an address of a specified wallet")]
    GetAddress { symbol: String, label: String },
    #[command(about = "Gets the balances of all wallets")]
    GetBalance {},
    #[command(about = "Gets the label of a transaction")]
    GetLabel { id: String },
    #[command(about = "Gets the pending EVM transactions")]
    PendingEvmTransactions {},
    #[command(about = "Gets referral information")]
    GetReferrals { id: Option<String> },
    #[command(about = "Gets the pending sweeps")]
    PendingSweeps {},
    #[command(about = "Rescans the chain of a symbol")]
    Rescan {
        symbol: String,
        start_height: u64,
        #[arg(short, long, default_value_t = false)]
        include_mempool: bool,
    },
    #[command(about = "Sends coins from an internal wallet")]
    SendCoins {
        symbol: String,
        address: String,
        #[arg(help = "amount to send or 'all' to send the whole balance of the wallet")]
        amount: parsers::AmountOrAll,
        label: String,
        #[arg(
            short,
            long,
            help = "sat/vbyte or gas price in gwei that should be paid as fee"
        )]
        fee: u32,
    },
    #[command(about = "Sets the log level")]
    SetLogLevel { level: parsers::LogLevel },
    #[command(about = "Sets the status of a swap")]
    SetSwapStatus { id: String, status: String },
    #[command(about = "Stops the backend")]
    Stop {},
    #[command(about = "Sweeps all deferred swap claims")]
    SweepSwaps { symbol: Option<String> },
    #[command(about = "Unblinds the outputs of an Elements transaction")]
    UnblindOutputs {
        #[arg(help = "id of the transaction to unblind")]
        id: Option<String>,
        #[arg(long, help = "raw hex of the transaction to unblind")]
        hex: Option<String>,
    },
    #[command(about = "Clears the swap update cache")]
    DevClearSwapUpdateCache { id: Option<String> },
    #[command(about = "Toggles cooperative swap signatures")]
    DevToggleCooperative {
        #[arg(short, long, default_value_t = false)]
        disabled: bool,
    },
    #[command(about = "Dumps the heap of the daemon into a file")]
    DevHeapDump { path: Option<String> },
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
            print_pretty(&Transaction {
                transaction: alloy::hex::encode(claim_tx.serialize()),
            })?;
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
            print_pretty(&Transaction {
                transaction: alloy::hex::encode(refund_tx.serialize()),
            })?;
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

            print_pretty(&Keys {
                public_key: public_key.to_string(),
                private_key: alloy::hex::encode(secret_key.secret_bytes()),
            })?;
        }
        Commands::NewPreimage => {
            let mut preimage = [0u8; 32];
            rand::thread_rng().fill(&mut preimage);
            let hash = bitcoin_hashes::Sha256::hash(&preimage);

            print_pretty(&serde_json::json!({
                "preimage": alloy::hex::encode(preimage),
                "hash": alloy::hex::encode(hash),
            }))?;
        }
        Commands::HashSha256 { input } => {
            let hash = bitcoin_hashes::Sha256::hash(&input.0);
            println!("{}", alloy::hex::encode(hash));
        }
        Commands::HashHash160 { input } => {
            let hash = bitcoin_hashes::Hash160::hash(&input.0);
            println!("{}", alloy::hex::encode(hash));
        }
        Commands::GetInfo {} => {
            let response = get_grpc_client(&cli).await?.get_info().await?;
            print_pretty(&response)?;
        }
        Commands::AddReferral {
            ref id,
            fee_share,
            ref routing_node,
        } => {
            let response = get_grpc_client(&cli)
                .await?
                .add_referral(id.to_string(), fee_share, routing_node.clone())
                .await?;
            print_pretty(&response)?;
        }
        Commands::AllowRefund { ref id } => {
            let response = get_grpc_client(&cli)
                .await?
                .allow_refund(id.to_string())
                .await?;
            print_pretty(&response)?;
        }
        Commands::CalculateTransactionFee { ref symbol, ref id } => {
            let response = get_grpc_client(&cli)
                .await?
                .calculate_transaction_fee(symbol.to_string(), id.to_string())
                .await?;
            print_pretty(&response)?;
        }
        Commands::CheckTransaction { ref symbol, ref id } => {
            let response = get_grpc_client(&cli)
                .await?
                .check_transaction(symbol.to_string(), id.to_string())
                .await?;
            print_pretty(&response)?;
        }
        Commands::ClnThreshold {
            swap_type,
            threshold,
        } => {
            let response = get_grpc_client(&cli)
                .await?
                .cln_threshold(swap_type, threshold.0)
                .await?;
            print_pretty(&response)?;
        }
        Commands::DeriveBlindingKeys { ref address } => {
            let response = get_grpc_client(&cli)
                .await?
                .derive_blinding_keys(address.to_string())
                .await?;
            print_pretty(&Keys {
                public_key: response.public_key,
                private_key: response.private_key,
            })?;
        }
        Commands::DeriveKeys { ref symbol, index } => {
            let response = get_grpc_client(&cli)
                .await?
                .derive_keys(symbol.to_string(), index)
                .await?;
            print_pretty(&Keys {
                public_key: response.public_key,
                private_key: response.private_key,
            })?;
        }
        Commands::GetAddress {
            ref symbol,
            ref label,
        } => {
            let response = get_grpc_client(&cli)
                .await?
                .get_address(symbol.to_string(), label.to_string())
                .await?;
            println!("{}", response.address);
        }
        Commands::GetBalance {} => {
            let response = get_grpc_client(&cli).await?.get_balance().await?;
            print_pretty(&response)?;
        }
        Commands::GetLabel { ref id } => {
            let response = get_grpc_client(&cli)
                .await?
                .get_label(id.to_string())
                .await?;
            print_pretty(&response)?;
        }
        Commands::PendingEvmTransactions {} => {
            let response = get_grpc_client(&cli)
                .await?
                .get_pending_evm_transactions()
                .await?;
            print_pretty(&response.transactions)?;
        }
        Commands::GetReferrals { ref id } => {
            let response = get_grpc_client(&cli)
                .await?
                .get_referrals(id.clone())
                .await?;
            print_pretty(&response.referral)?;
        }
        Commands::PendingSweeps {} => {
            let response = get_grpc_client(&cli).await?.get_pending_sweeps().await?;
            print_pretty(&response.pending_sweeps)?;
        }
        Commands::Rescan {
            ref symbol,
            start_height,
            include_mempool,
        } => {
            let response = get_grpc_client(&cli)
                .await?
                .rescan(symbol.to_string(), start_height, include_mempool)
                .await?;
            print_pretty(&response)?;
        }
        Commands::SendCoins {
            ref symbol,
            ref address,
            amount,
            ref label,
            fee,
        } => {
            let response = get_grpc_client(&cli)
                .await?
                .send_coins(
                    symbol.to_string(),
                    address.to_string(),
                    amount,
                    label.to_string(),
                    fee,
                )
                .await?;
            print_pretty(&response)?;
        }
        Commands::SetLogLevel { level } => {
            let response = get_grpc_client(&cli).await?.set_log_level(level).await?;
            print_pretty(&response)?;
        }
        Commands::SetSwapStatus { ref id, ref status } => {
            let response = get_grpc_client(&cli)
                .await?
                .set_swap_status(id.to_string(), status.to_string())
                .await?;
            print_pretty(&response)?;
        }
        Commands::Stop {} => {
            let response = get_grpc_client(&cli).await?.stop().await?;
            print_pretty(&response)?;
        }
        Commands::SweepSwaps { ref symbol } => {
            let response = get_grpc_client(&cli)
                .await?
                .sweep_swaps(symbol.clone())
                .await?;
            print_pretty(&response.claimed_symbols)?;
        }
        Commands::UnblindOutputs { ref id, ref hex } => {
            let response = get_grpc_client(&cli)
                .await?
                .unblind_outputs(id.clone(), hex.clone())
                .await?;
            print_pretty(
                &response
                    .outputs
                    .into_iter()
                    .map(|output| UnblindedOutput {
                        value: output.value,
                        asset: alloy::hex::encode(output.asset),
                        is_lbtc: output.is_lbtc,
                        script: alloy::hex::encode(output.script),
                    })
                    .collect::<Vec<UnblindedOutput>>(),
            )?;
        }
        Commands::DevClearSwapUpdateCache { ref id } => {
            let response = get_grpc_client(&cli)
                .await?
                .dev_clear_swap_update_cache(id.clone())
                .await?;
            print_pretty(&response)?;
        }
        Commands::DevToggleCooperative { disabled } => {
            let response = get_grpc_client(&cli)
                .await?
                .dev_disable_cooperative(disabled)
                .await?;
            print_pretty(&response)?;
        }
        Commands::DevHeapDump { ref path } => {
            let response = get_grpc_client(&cli)
                .await?
                .dev_heap_dump(path.clone())
                .await?;
            print_pretty(&response)?;
        }
    }

    Ok(())
}

async fn get_grpc_client(cli: &Cli) -> Result<grpc::BoltzClient> {
    grpc::BoltzClient::new(
        &cli.grpc_host,
        cli.grpc_port,
        if cli.grpc_disable_ssl {
            None
        } else {
            Some(cli.grpc_certificates.clone())
        },
    )
    .await
}

fn print_pretty<T: Serialize>(value: &T) -> Result<()> {
    println!("{}", serde_json::to_string_pretty(value)?);
    Ok(())
}

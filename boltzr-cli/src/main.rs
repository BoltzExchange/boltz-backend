use ::serde::Serialize;
use anyhow::Result;
use clap::{Parser, Subcommand};
use rand::Rng;
use std::path::PathBuf;

mod evm;
mod grpc;
mod parsers;
mod serde;
mod tx;
mod utils;
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

#[derive(Serialize)]
struct Referral {
    id: String,
    config: Option<serde_json::Value>,
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
    #[command(about = "Transaction tools")]
    Tx {
        #[command(subcommand)]
        command: TxCommands,
    },
    #[command(about = "EVM commands")]
    Evm {
        #[command(subcommand)]
        command: EvmCommands,

        #[arg(short, long, default_value = "0x5FbDB2315678afecb367f032d93F642f64180aa3", value_parser = parsers::parse_alloy_address)]
        contract: alloy::primitives::Address,
        #[arg(short, long, default_value = "http://127.0.0.1:8545", value_parser = validators::url_valid)]
        rpc_url: String,
        #[arg(short, long, default_value = "~/.boltz")]
        seed_folder: PathBuf,
        #[arg(short, long, value_parser = parsers::parse_hex_fixed_bytes)]
        private_key: Option<alloy::primitives::FixedBytes<32>>,
    },
    #[command(about = "Utility tools", alias = "t")]
    Tools {
        #[command(subcommand)]
        command: ToolsCommands,
    },
    #[command(about = "Gets information about the Boltz instance")]
    GetInfo {},
    #[command(about = "Wallet commands", alias = "w")]
    Wallet {
        #[command(subcommand)]
        command: WalletCommands,
    },
    #[command(about = "Referral commands")]
    Referral {
        #[command(subcommand)]
        command: ReferralCommands,
    },
    #[command(about = "Swap commands")]
    Swap {
        #[command(subcommand)]
        command: SwapCommands,
    },
    #[command(about = "Rescans the chain of a symbol")]
    Rescan {
        symbol: String,
        start_height: u64,
        #[arg(short, long, default_value_t = false)]
        include_mempool: bool,
    },
    #[command(about = "Stops the backend")]
    Stop {},
    #[command(about = "Development commands")]
    Dev {
        #[command(subcommand)]
        command: DevCommands,
    },
}

#[derive(Clone, Subcommand)]
enum DevCommands {
    #[command(about = "Clears the swap update cache")]
    ClearSwapUpdateCache { id: Option<String> },
    #[command(about = "Toggles cooperative swap signatures")]
    ToggleCooperative {
        #[arg(short, long, default_value_t = false)]
        disabled: bool,
    },
    #[command(about = "Dumps the heap of the daemon into a file")]
    HeapDump { path: Option<String> },
    #[command(about = "Sets the log level")]
    SetLogLevel { level: parsers::LogLevel },
}

#[derive(Clone, Subcommand)]
enum ToolsCommands {
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
}

#[derive(Clone, Subcommand)]
enum TxCommands {
    #[command(about = "Claims a HTLC UTXO")]
    Claim {
        network: parsers::Network,
        #[arg(value_parser = parsers::parse_hex_fixed_bytes)]
        preimage: alloy::primitives::FixedBytes<32>,
        #[arg(value_parser = parsers::parse_hex_fixed_bytes)]
        private_key: alloy::primitives::FixedBytes<32>,
        swap_tree_or_redeem_script: String,
        #[arg(value_parser = parsers::parse_hex)]
        raw_transaction: parsers::HexBytes,
        destination_address: String,
        fee_per_vbyte: f64,
        #[arg(short, long, value_parser = parsers::parse_hex_fixed_bytes)]
        blinding_key: Option<alloy::primitives::FixedBytes<32>>,
    },
    #[command(about = "Refunds a HTLC UTXO")]
    Refund {
        network: parsers::Network,
        timeout_block_height: u32,
        #[arg(value_parser = parsers::parse_hex_fixed_bytes)]
        private_key: alloy::primitives::FixedBytes<32>,
        swap_tree_or_redeem_script: String,
        #[arg(value_parser = parsers::parse_hex)]
        raw_transaction: parsers::HexBytes,
        destination_address: String,
        fee_per_vbyte: f64,
        #[arg(short, long, value_parser = parsers::parse_hex_fixed_bytes)]
        blinding_key: Option<alloy::primitives::FixedBytes<32>>,
    },
}

#[derive(Clone, Subcommand)]
enum WalletCommands {
    #[command(about = "Calculates the fee of a transaction")]
    CalculateTransactionFee { symbol: String, id: String },
    #[command(about = "Check a transaction and let it run through the backend again")]
    CheckTransaction { symbol: String, id: String },
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
    #[command(about = "Unblinds the outputs of an Elements transaction")]
    UnblindOutputs {
        #[arg(help = "id of the transaction to unblind")]
        id: Option<String>,
        #[arg(long, help = "raw hex of the transaction to unblind")]
        hex: Option<String>,
    },
}

#[derive(Clone, Subcommand)]
enum EvmCommands {
    #[command(about = "Prints the address of the signer")]
    Address {},
    #[command(about = "Sends a transaction")]
    Send {
        #[arg(value_parser = parsers::parse_alloy_address)]
        to: alloy::primitives::Address,
        amount: parsers::Amount,
    },
    #[command(about = "Locks Ether in EtherSwap")]
    Lock {
        #[arg(value_parser = parsers::parse_hex_fixed_bytes)]
        preimage_hash: alloy::primitives::FixedBytes<32>,
        amount: parsers::Amount,
        #[arg(value_parser = parsers::parse_alloy_address)]
        claim_address: alloy::primitives::Address,
        timelock: u64,
    },
    #[command(about = "Claims Ether from EtherSwap")]
    Claim {
        #[arg(value_parser = parsers::parse_hex_fixed_bytes)]
        preimage: alloy::primitives::FixedBytes<32>,
        #[arg(short, long, default_value_t = 0)]
        query_start_height: u64,
    },
    #[command(about = "Refunds Ether from EtherSwap")]
    Refund {
        #[arg(value_parser = parsers::parse_hex_fixed_bytes)]
        preimage_hash: alloy::primitives::FixedBytes<32>,
        #[arg(short, long, default_value_t = 0)]
        query_start_height: u64,
    },
    #[command(about = "Mines the specified number of blocks on Anvil")]
    Mine { blocks: u64 },
    #[command(about = "Scan for funds locked in a swap contract")]
    LockedInContract {
        start_height: u64,
        #[arg(short, long, default_value_t = 10_000)]
        scan_interval: u64,
    },
}

#[derive(Clone, Subcommand)]
enum ReferralCommands {
    #[command(about = "Adds a new referral ID to the database")]
    Add {
        id: String,
        fee_share: u32,
        routing_node: Option<String>,
    },
    #[command(about = "Sets the configuration of a referral")]
    SetConfig {
        id: String,
        #[arg(value_parser = parsers::parse_json_object)]
        config: Option<serde_json::Value>,
    },
    #[command(about = "Gets referral information")]
    Get { id: Option<String> },
}

#[derive(Clone, Subcommand)]
enum SwapCommands {
    #[command(about = "Skips the safety checks and allows cooperative refunds for a swap")]
    AllowRefund { id: String },
    #[command(about = "Sets the CLN threshold for a swap type")]
    ClnThreshold {
        swap_type: parsers::SwapType,
        threshold: parsers::Amount,
    },
    #[command(about = "Gets the pending sweeps")]
    PendingSweeps {},
    #[command(about = "Sets the status of a swap")]
    SetStatus { id: String, status: String },
    #[command(about = "Sweeps all deferred swap claims")]
    Sweep { symbol: Option<String> },
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
        Commands::Tx { ref command } => match command {
            TxCommands::Claim {
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
                    network.into(),
                    preimage.0,
                    private_key.0,
                    swap_tree_or_redeem_script,
                    raw_transaction.0.clone(),
                    destination_address,
                    *fee_per_vbyte,
                    blinding_key.as_ref().map(|key| key.0),
                )?;
                print_pretty(&Transaction {
                    transaction: alloy::hex::encode(claim_tx.serialize()),
                })?;
            }
            TxCommands::Refund {
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
                    network.into(),
                    *timeout_block_height,
                    private_key.0,
                    swap_tree_or_redeem_script,
                    raw_transaction.0.clone(),
                    destination_address,
                    *fee_per_vbyte,
                    blinding_key.as_ref().map(|key| key.0),
                )?;
                print_pretty(&Transaction {
                    transaction: alloy::hex::encode(refund_tx.serialize()),
                })?;
            }
        },
        Commands::Evm {
            contract,
            rpc_url,
            seed_folder,
            private_key,
            ref command,
        } => {
            // Specified private key takes precedence over seed folder
            let keys = if let Some(private_key) = private_key {
                evm::Keys::PrivateKey(private_key)
            } else {
                evm::Keys::SeedPath(seed_folder)
            };

            match command {
                EvmCommands::Address {} => {
                    let (_, signer) = evm::get_provider(&rpc_url, keys)?;
                    println!("{}", signer.address());
                }
                EvmCommands::Send { to, amount } => {
                    let tx_hash = evm::send_transaction(&rpc_url, keys, *to, *amount).await?;
                    println!("{}", tx_hash);
                }
                EvmCommands::Lock {
                    preimage_hash,
                    amount,
                    claim_address,
                    timelock,
                } => {
                    let tx_hash = evm::lock_ether(
                        &rpc_url,
                        keys,
                        contract,
                        *preimage_hash,
                        *amount,
                        *claim_address,
                        *timelock,
                    )
                    .await?;
                    println!("{}", tx_hash);
                }
                EvmCommands::Claim {
                    preimage,
                    query_start_height,
                } => {
                    let tx_hash =
                        evm::claim_ether(&rpc_url, keys, contract, *preimage, *query_start_height)
                            .await?;
                    println!("{}", tx_hash);
                }
                EvmCommands::Refund {
                    preimage_hash,
                    query_start_height,
                } => {
                    let tx_hash = evm::refund_ether(
                        &rpc_url,
                        keys,
                        contract,
                        *preimage_hash,
                        *query_start_height,
                    )
                    .await?;
                    println!("{}", tx_hash);
                }
                EvmCommands::Mine { blocks } => {
                    evm::mine(&rpc_url, keys, *blocks).await?;
                }
                EvmCommands::LockedInContract {
                    start_height,
                    scan_interval,
                } => {
                    evm::scan_locked_in_contract(&rpc_url, contract, *start_height, *scan_interval)
                        .await?;
                }
            }
        }
        Commands::Tools { ref command } => match command {
            ToolsCommands::NewKeys => {
                let secret_key = bitcoin::secp256k1::SecretKey::new(&mut rand::thread_rng());
                let public_key = secret_key.public_key(&bitcoin::key::Secp256k1::signing_only());

                print_pretty(&Keys {
                    public_key: public_key.to_string(),
                    private_key: alloy::hex::encode(secret_key.secret_bytes()),
                })?;
            }
            ToolsCommands::NewPreimage => {
                let mut preimage = [0u8; 32];
                rand::thread_rng().fill(&mut preimage);
                let hash = bitcoin_hashes::Sha256::hash(&preimage);

                print_pretty(&serde_json::json!({
                    "preimage": alloy::hex::encode(preimage),
                    "hash": alloy::hex::encode(hash),
                }))?;
            }
            ToolsCommands::HashSha256 { input } => {
                let hash = bitcoin_hashes::Sha256::hash(&input.0);
                println!("{}", alloy::hex::encode(hash));
            }
            ToolsCommands::HashHash160 { input } => {
                let hash = bitcoin_hashes::Hash160::hash(&input.0);
                println!("{}", alloy::hex::encode(hash));
            }
        },
        Commands::GetInfo {} => {
            let response = get_grpc_client(&cli).await?.get_info().await?;
            print_pretty(&response)?;
        }
        Commands::Wallet { ref command } => match command {
            WalletCommands::CalculateTransactionFee { symbol, id } => {
                let response = get_grpc_client(&cli)
                    .await?
                    .calculate_transaction_fee(symbol.to_string(), id.to_string())
                    .await?;
                print_pretty(&response)?;
            }
            WalletCommands::CheckTransaction { symbol, id } => {
                let response = get_grpc_client(&cli)
                    .await?
                    .check_transaction(symbol.to_string(), id.to_string())
                    .await?;
                print_pretty(&response)?;
            }
            WalletCommands::DeriveBlindingKeys { address } => {
                let response = get_grpc_client(&cli)
                    .await?
                    .derive_blinding_keys(address.to_string())
                    .await?;
                print_pretty(&Keys {
                    public_key: response.public_key,
                    private_key: response.private_key,
                })?;
            }
            WalletCommands::DeriveKeys { symbol, index } => {
                let response = get_grpc_client(&cli)
                    .await?
                    .derive_keys(symbol.to_string(), *index)
                    .await?;
                print_pretty(&Keys {
                    public_key: response.public_key,
                    private_key: response.private_key,
                })?;
            }
            WalletCommands::GetAddress { symbol, label } => {
                let response = get_grpc_client(&cli)
                    .await?
                    .get_address(symbol.to_string(), label.to_string())
                    .await?;
                println!("{}", response.address);
            }
            WalletCommands::GetBalance {} => {
                let response = get_grpc_client(&cli).await?.get_balance().await?;
                print_pretty(&response)?;
            }
            WalletCommands::GetLabel { id } => {
                let response = get_grpc_client(&cli)
                    .await?
                    .get_label(id.to_string())
                    .await?;
                print_pretty(&response)?;
            }
            WalletCommands::PendingEvmTransactions {} => {
                let response = get_grpc_client(&cli)
                    .await?
                    .get_pending_evm_transactions()
                    .await?;
                print_pretty(&response.transactions)?;
            }
            WalletCommands::SendCoins {
                symbol,
                address,
                amount,
                label,
                fee,
            } => {
                let response = get_grpc_client(&cli)
                    .await?
                    .send_coins(
                        symbol.to_string(),
                        address.to_string(),
                        *amount,
                        label.to_string(),
                        *fee,
                    )
                    .await?;
                print_pretty(&response)?;
            }
            WalletCommands::UnblindOutputs { id, hex } => {
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
        },
        Commands::Referral { ref command } => match command {
            ReferralCommands::Add {
                id,
                fee_share,
                routing_node,
            } => {
                let response = get_grpc_client(&cli)
                    .await?
                    .add_referral(id.to_string(), *fee_share, routing_node.clone())
                    .await?;
                print_pretty(&response)?;
            }
            ReferralCommands::SetConfig { id, config } => {
                let response = get_grpc_client(&cli)
                    .await?
                    .set_referral(
                        id.to_string(),
                        config.as_ref().map(serde_json::to_string).transpose()?,
                    )
                    .await?;
                print_pretty(&response)?;
            }
            ReferralCommands::Get { id } => {
                let response = get_grpc_client(&cli)
                    .await?
                    .get_referrals(id.clone())
                    .await?;
                print_pretty(
                    &response
                        .referral
                        .into_iter()
                        .map(|r| -> Result<Referral> {
                            Ok(Referral {
                                id: r.id,
                                config: r
                                    .config
                                    .as_deref()
                                    .map(serde_json::from_str)
                                    .transpose()?,
                            })
                        })
                        .collect::<Result<Vec<Referral>>>()?,
                )?;
            }
        },
        Commands::Swap { ref command } => match command {
            SwapCommands::AllowRefund { id } => {
                let response = get_grpc_client(&cli)
                    .await?
                    .allow_refund(id.to_string())
                    .await?;
                print_pretty(&response)?;
            }
            SwapCommands::ClnThreshold {
                swap_type,
                threshold,
            } => {
                let response = get_grpc_client(&cli)
                    .await?
                    .cln_threshold(*swap_type, threshold.0)
                    .await?;
                print_pretty(&response)?;
            }
            SwapCommands::PendingSweeps {} => {
                let response = get_grpc_client(&cli).await?.get_pending_sweeps().await?;
                print_pretty(&response.pending_sweeps)?;
            }
            SwapCommands::SetStatus { id, status } => {
                let response = get_grpc_client(&cli)
                    .await?
                    .set_swap_status(id.to_string(), status.to_string())
                    .await?;
                print_pretty(&response)?;
            }
            SwapCommands::Sweep { symbol } => {
                let response = get_grpc_client(&cli)
                    .await?
                    .sweep_swaps(symbol.clone())
                    .await?;
                print_pretty(&response.claimed_symbols)?;
            }
        },
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
        Commands::Stop {} => {
            let response = get_grpc_client(&cli).await?.stop().await?;
            print_pretty(&response)?;
        }
        Commands::Dev { ref command } => match command {
            DevCommands::ClearSwapUpdateCache { id } => {
                let response = get_grpc_client(&cli)
                    .await?
                    .dev_clear_swap_update_cache(id.clone())
                    .await?;
                print_pretty(&response)?;
            }
            DevCommands::ToggleCooperative { disabled } => {
                let response = get_grpc_client(&cli)
                    .await?
                    .dev_disable_cooperative(*disabled)
                    .await?;
                print_pretty(&response)?;
            }
            DevCommands::HeapDump { path } => {
                let response = get_grpc_client(&cli)
                    .await?
                    .dev_heap_dump(path.clone())
                    .await?;
                print_pretty(&response)?;
            }
            DevCommands::SetLogLevel { level } => {
                let response = get_grpc_client(&cli).await?.set_log_level(*level).await?;
                print_pretty(&response)?;
            }
        },
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

use crate::chain::Client;
use crate::chain::types::UnspentOutput;
use crate::currencies::Currencies;
use crate::db::Pool;
use crate::db::helpers::payjoin::{
    PayjoinReceiverSessionHelper, PayjoinReceiverSessionHelperDatabase,
};
use crate::db::models::{NewPayjoinReceiverSession, NewPayjoinReceiverSessionEvent};
use crate::wallet::Network;
use anyhow::{Context, Result, anyhow};
use payjoin::ImplementationError;
use payjoin::bitcoin::Transaction;
use payjoin::bitcoin::consensus::encode::{deserialize, serialize_hex};
use payjoin::bitcoin::psbt::Input;
use payjoin::bitcoin::{Address, Amount, OutPoint, Psbt, TxIn, TxOut, Txid};
use payjoin::persist::{OptionalTransitionOutcome, SessionPersister};
use payjoin::receive::v2::{
    Initialized, MaybeInputsOwned, MaybeInputsSeen, Monitor, OutputsUnknown, PayjoinProposal,
    ProvisionalProposal, ReceiveSession, Receiver, ReceiverBuilder, SessionEvent, SessionOutcome,
    UncheckedOriginalPayload, WantsFeeRange, WantsInputs, WantsOutputs, replay_event_log,
};
use std::env;
use std::error::Error;
use std::fmt;
use std::future::Future;
use std::str::FromStr;
use std::sync::{Arc, Mutex};
use std::time::Duration;
use tracing::{debug, error, info, instrument, warn};

const OHTTP_RELAY: &str = "https://pj.benalleng.com";
const OHTTP_RELAYS: [&str; 5] = [
    OHTTP_RELAY,
    "https://pj.bobspacebkk.com",
    "https://payjoin.achow101.com",
    "https://lets.payjo.in",
    "https://pj.sms4sats.com",
];
const DIRECTORY: &str = "https://payjo.in";

#[derive(Clone)]
pub struct PayjoinManager {
    repo: Arc<PayjoinReceiverSessionHelperDatabase>,
    currencies: Currencies,
}

impl PayjoinManager {
    pub fn new(pool: Pool, currencies: Currencies) -> Self {
        Self {
            repo: Arc::new(PayjoinReceiverSessionHelperDatabase::new(pool)),
            currencies,
        }
    }

    #[instrument(name = "payjoin::get_payjoin_uri", skip_all)]
    pub async fn get_payjoin_uri(
        &self,
        address: String,
        satoshis: Option<u64>,
        label: Option<String>,
        swap_id: Option<String>,
    ) -> Result<String> {
        let address = Address::from_str(&address)
            .context("invalid Bitcoin address")?
            .assume_checked();
        let (btc_chain, network) = self.btc_chain()?;
        let amount = satoshis.map(Amount::from_sat);
        let amount_sats = satoshis
            .map(i64::try_from)
            .transpose()
            .map_err(|_| anyhow!("satoshis value exceeds i64 range"))?;
        let swap_id = normalize_swap_id(swap_id)?;
        if let Some(swap_id) = &swap_id {
            if self
                .repo
                .get_active_by_swap_id(swap_id)
                .context("failed to check active payjoin receiver session for swap")?
                .is_some()
            {
                return Err(anyhow!(
                    "active payjoin receiver session already exists for swap {swap_id}"
                ));
            }
            if self
                .repo
                .get_by_swap_id(swap_id)
                .context("failed to check payjoin receiver session for swap")?
                .is_some()
            {
                return Err(anyhow!(
                    "payjoin receiver session already exists for swap {swap_id}"
                ));
            }
        }

        let session = self
            .repo
            .create_receiver_session(&NewPayjoinReceiverSession {
                swapId: swap_id,
                address: address.to_string(),
                amountSats: amount_sats,
                label: label.clone(),
            })
            .context("failed to create payjoin receiver session")?;
        let persister = ReceiverPersister {
            repo: self.repo.clone(),
            session_id: session.id,
        };

        let directory = payjoin_directory();
        let ohttp_keys = fetch_ohttp_keys(&directory)
            .await
            .context("failed to fetch payjoin OHTTP keys")?;
        let mut builder = ReceiverBuilder::new(address.clone(), directory.as_str(), ohttp_keys)
            .context("failed to build payjoin receiver")?;
        if let Some(amount) = amount {
            builder = builder.with_amount(amount);
        }

        let receiver = builder
            .build()
            .save(&persister)
            .context("failed to persist payjoin receiver creation event")?;
        let mut uri = receiver.pj_uri();
        uri.label = label.map(Into::into);
        let uri = uri.to_string();

        tokio::spawn(poll_for_sender_proposal(
            self.repo.clone(),
            btc_chain,
            address,
            network,
            persister.session_id,
        ));

        Ok(uri)
    }

    fn btc_chain(&self) -> Result<(Arc<dyn Client + Send + Sync>, payjoin::bitcoin::Network)> {
        let btc = self
            .currencies
            .get("BTC")
            .ok_or_else(|| anyhow!("BTC currency not configured"))?;
        let chain = btc
            .chain
            .clone()
            .ok_or_else(|| anyhow!("BTC chain client not configured"))?;

        Ok((chain, bitcoin_network(btc.network)))
    }
}

fn normalize_swap_id(swap_id: Option<String>) -> Result<Option<String>> {
    let swap_id = swap_id.map(|value| value.trim().to_string());
    match swap_id {
        Some(value) if value.is_empty() => Err(anyhow!("swap_id cannot be empty")),
        other => Ok(other),
    }
}

async fn poll_for_sender_proposal(
    repo: Arc<PayjoinReceiverSessionHelperDatabase>,
    btc_chain: Arc<dyn Client + Send + Sync>,
    receiver_address: Address,
    network: payjoin::bitcoin::Network,
    session_id: i64,
) {
    if let Err(err) =
        try_poll_for_sender_proposal(repo, btc_chain, receiver_address, network, session_id).await
    {
        error!(
            session_id = %session_id,
            "Payjoin receiver polling stopped: {err:#}"
        );
    }
}

async fn try_poll_for_sender_proposal(
    repo: Arc<PayjoinReceiverSessionHelperDatabase>,
    btc_chain: Arc<dyn Client + Send + Sync>,
    receiver_address: Address,
    network: payjoin::bitcoin::Network,
    session_id: i64,
) -> Result<()> {
    let persister = ReceiverPersister { repo, session_id };
    let (session, _) =
        replay_event_log(&persister).context("failed to replay payjoin receiver event log")?;

    match session {
        ReceiveSession::Initialized(receiver) => {
            poll_initialized_receiver(receiver, &persister, btc_chain, receiver_address, network)
                .await
        }
        ReceiveSession::UncheckedOriginalPayload(receiver) => {
            process_unchecked_original_payload(
                receiver,
                &persister,
                btc_chain,
                receiver_address,
                network,
            )
            .await
        }
        ReceiveSession::MaybeInputsOwned(receiver) => {
            check_inputs_not_owned(receiver, &persister, btc_chain, receiver_address, network).await
        }
        ReceiveSession::MaybeInputsSeen(receiver) => {
            check_no_inputs_seen_before(receiver, &persister, btc_chain, receiver_address, network)
                .await
        }
        ReceiveSession::OutputsUnknown(receiver) => {
            identify_receiver_outputs(receiver, &persister, btc_chain, receiver_address, network)
                .await
        }
        ReceiveSession::WantsOutputs(receiver) => {
            commit_outputs(receiver, &persister, btc_chain).await
        }
        ReceiveSession::WantsInputs(receiver) => {
            contribute_inputs(receiver, &persister, btc_chain).await
        }
        ReceiveSession::WantsFeeRange(receiver) => {
            apply_fee_range(receiver, &persister, btc_chain).await
        }
        ReceiveSession::ProvisionalProposal(receiver) => {
            finalize_proposal(receiver, &persister, btc_chain).await
        }
        ReceiveSession::PayjoinProposal(receiver) => {
            submit_payjoin_proposal(receiver, &persister, btc_chain).await
        }
        ReceiveSession::Monitor(receiver) => monitor_payment(receiver, &persister, btc_chain).await,
        ReceiveSession::Closed(outcome) => stop_at_closed_session(&persister, &outcome),
        other => Err(anyhow!(
            "payjoin receiver session is not in a pollable state: {:?}",
            other
        )),
    }
}

async fn poll_initialized_receiver(
    mut receiver: Receiver<Initialized>,
    persister: &ReceiverPersister,
    btc_chain: Arc<dyn Client + Send + Sync>,
    receiver_address: Address,
    network: payjoin::bitcoin::Network,
) -> Result<()> {
    loop {
        let ohttp_relay = payjoin_ohttp_relay();
        let (req, context) = receiver
            .create_poll_request(ohttp_relay.as_str())
            .context("failed to create payjoin receiver poll request")?;
        let response = post_request(req).await?;
        let body = response
            .bytes()
            .await
            .context("failed to read poll response")?;

        match receiver
            .process_response(body.as_ref(), context)
            .save(persister)
            .context("failed to process payjoin receiver poll response")?
        {
            OptionalTransitionOutcome::Progress(_) => {
                info!(
                    session_id = %persister.session_id,
                    "Payjoin receiver persisted sender proposal"
                );
                let (session, _) = replay_event_log(persister)
                    .context("failed to replay payjoin receiver event log after polling")?;
                let ReceiveSession::UncheckedOriginalPayload(receiver) = session else {
                    return Err(anyhow!(
                        "payjoin receiver replayed to unexpected state after polling: {:?}",
                        session
                    ));
                };

                return process_unchecked_original_payload(
                    receiver,
                    persister,
                    btc_chain,
                    receiver_address,
                    network,
                )
                .await;
            }
            OptionalTransitionOutcome::Stasis(current_receiver) => {
                receiver = current_receiver;
                tokio::time::sleep(Duration::from_secs(1)).await;
            }
        }
    }
}

async fn process_unchecked_original_payload(
    receiver: Receiver<UncheckedOriginalPayload>,
    persister: &ReceiverPersister,
    btc_chain: Arc<dyn Client + Send + Sync>,
    receiver_address: Address,
    network: payjoin::bitcoin::Network,
) -> Result<()> {
    let chain = btc_chain.clone();
    let receiver = receiver
        .check_broadcast_suitability(None, |tx| {
            let tx_hex = serialize_hex(tx);
            let results = block_on(async { chain.test_mempool_accept(&[tx_hex]).await })
                .map_err(implementation_error)?;

            Ok(results.first().is_some_and(|result| result.allowed))
        })
        .save(persister)
        .context("failed to persist payjoin broadcast suitability check")?;

    check_inputs_not_owned(receiver, persister, btc_chain, receiver_address, network).await
}

async fn check_inputs_not_owned(
    receiver: Receiver<MaybeInputsOwned>,
    persister: &ReceiverPersister,
    btc_chain: Arc<dyn Client + Send + Sync>,
    receiver_address: Address,
    network: payjoin::bitcoin::Network,
) -> Result<()> {
    let chain = btc_chain.clone();
    let receiver = receiver
        .check_inputs_not_owned(&mut |script| {
            let address = Address::from_script(script, network).map_err(implementation_error)?;
            let address_info = block_on(async { chain.address_info(&address.to_string()).await })
                .map_err(implementation_error)?;

            Ok(address_info.is_mine)
        })
        .save(persister)
        .context("failed to persist payjoin input ownership check")?;

    check_no_inputs_seen_before(receiver, persister, btc_chain, receiver_address, network).await
}

async fn check_no_inputs_seen_before(
    receiver: Receiver<MaybeInputsSeen>,
    persister: &ReceiverPersister,
    btc_chain: Arc<dyn Client + Send + Sync>,
    receiver_address: Address,
    network: payjoin::bitcoin::Network,
) -> Result<()> {
    let receiver = receiver
        .check_no_inputs_seen_before(&mut |_outpoint| {
            // TODO: replace with DB-backed seen-input tracking before enabling full proposal flow.
            Ok(false)
        })
        .save(persister)
        .context("failed to persist payjoin seen-input check")?;

    identify_receiver_outputs(receiver, persister, btc_chain, receiver_address, network).await
}

async fn identify_receiver_outputs(
    receiver: Receiver<OutputsUnknown>,
    persister: &ReceiverPersister,
    btc_chain: Arc<dyn Client + Send + Sync>,
    receiver_address: Address,
    network: payjoin::bitcoin::Network,
) -> Result<()> {
    let receiver = receiver
        .identify_receiver_outputs(&mut |script| {
            let address = Address::from_script(script, network).map_err(implementation_error)?;
            Ok(address == receiver_address)
        })
        .save(persister)
        .context("failed to persist payjoin receiver output identification")?;

    commit_outputs(receiver, persister, btc_chain).await
}

async fn commit_outputs(
    receiver: Receiver<WantsOutputs>,
    persister: &ReceiverPersister,
    btc_chain: Arc<dyn Client + Send + Sync>,
) -> Result<()> {
    let receiver = receiver
        .commit_outputs()
        .save(persister)
        .context("failed to persist payjoin output commit")?;

    contribute_inputs(receiver, persister, btc_chain).await
}

async fn contribute_inputs(
    receiver: Receiver<WantsInputs>,
    persister: &ReceiverPersister,
    btc_chain: Arc<dyn Client + Send + Sync>,
) -> Result<()> {
    let selected = select_contribution_input(receiver.clone(), btc_chain.clone())
        .await
        .context("failed to select payjoin contribution input")?;
    let receiver = receiver
        .contribute_inputs(vec![selected])
        .context("failed to contribute payjoin input")?
        .commit_inputs()
        .save(persister)
        .context("failed to persist payjoin input commit")?;

    apply_fee_range(receiver, persister, btc_chain).await
}

async fn select_contribution_input(
    receiver: Receiver<WantsInputs>,
    btc_chain: Arc<dyn Client + Send + Sync>,
) -> Result<payjoin::receive::InputPair> {
    let mut candidates = btc_chain
        .list_unspent(None)
        .await
        .context("failed to list BTC wallet UTXOs")?
        .into_iter()
        .map(input_pair_from_unspent)
        .collect::<Result<Vec<_>>>()?;
    candidates.sort_by_key(|(amount, _)| *amount);

    for (_, input) in candidates {
        if receiver
            .clone()
            .contribute_inputs(vec![input.clone()])
            .is_ok()
        {
            return Ok(input);
        }
    }

    Err(anyhow!("no BTC wallet UTXO could be contributed"))
}

fn input_pair_from_unspent(utxo: UnspentOutput) -> Result<(u64, payjoin::receive::InputPair)> {
    let amount = Amount::from_btc(utxo.amount).context("invalid BTC UTXO amount")?;
    let address = Address::from_str(&utxo.address)
        .context("invalid BTC UTXO address")?
        .assume_checked();
    let txout = TxOut {
        value: amount,
        script_pubkey: address.script_pubkey(),
    };
    let outpoint = OutPoint {
        txid: Txid::from_str(&utxo.txid).context("invalid BTC UTXO txid")?,
        vout: utxo.vout,
    };
    let txin = TxIn {
        previous_output: outpoint,
        ..Default::default()
    };
    let psbtin = Input {
        witness_utxo: Some(txout.clone()),
        ..Default::default()
    };
    let input = if txout.script_pubkey.is_p2wpkh() {
        payjoin::receive::InputPair::new_p2wpkh(txout, outpoint)
    } else if txout.script_pubkey.is_p2tr() {
        payjoin::receive::InputPair::new_p2tr_keyspend(txout, outpoint)
    } else {
        payjoin::receive::InputPair::new(txin, psbtin, None)
    }
    .context("invalid BTC UTXO input pair")?;

    Ok((amount.to_sat(), input))
}

async fn apply_fee_range(
    receiver: Receiver<WantsFeeRange>,
    persister: &ReceiverPersister,
    btc_chain: Arc<dyn Client + Send + Sync>,
) -> Result<()> {
    let receiver = receiver
        .apply_fee_range(None, None)
        .save(persister)
        .context("failed to persist payjoin fee-range application")?;

    finalize_proposal(receiver, persister, btc_chain).await
}

async fn finalize_proposal(
    receiver: Receiver<ProvisionalProposal>,
    persister: &ReceiverPersister,
    btc_chain: Arc<dyn Client + Send + Sync>,
) -> Result<()> {
    let chain = btc_chain.clone();
    let receiver = receiver
        .finalize_proposal(|psbt| sign_payjoin_psbt(psbt, chain.clone()))
        .save(persister)
        .context("failed to persist finalized payjoin proposal")?;

    submit_payjoin_proposal(receiver, persister, btc_chain).await
}

async fn submit_payjoin_proposal(
    receiver: Receiver<PayjoinProposal>,
    persister: &ReceiverPersister,
    btc_chain: Arc<dyn Client + Send + Sync>,
) -> Result<()> {
    let ohttp_relay = payjoin_ohttp_relay();
    let (req, context) = receiver
        .create_post_request(ohttp_relay.as_str())
        .context("failed to create payjoin proposal post request")?;
    let response = post_request(req).await?;
    let body = response
        .bytes()
        .await
        .context("failed to read payjoin proposal post response")?;
    let receiver = receiver
        .process_response(body.as_ref(), context)
        .save(persister)
        .context("failed to persist posted payjoin proposal")?;

    monitor_payment(receiver, persister, btc_chain).await
}

async fn monitor_payment(
    mut receiver: Receiver<Monitor>,
    persister: &ReceiverPersister,
    btc_chain: Arc<dyn Client + Send + Sync>,
) -> Result<()> {
    info!(
        session_id = %persister.session_id,
        "Payjoin receiver monitor started"
    );

    let detected_payjoin_txid = Arc::new(Mutex::new(None::<Txid>));

    loop {
        let chain = btc_chain.clone();
        let detected_payjoin_txid = detected_payjoin_txid.clone();
        match receiver
            .check_payment(|txid| {
                let transaction =
                    block_on(async { lookup_btc_transaction(chain.clone(), txid).await })
                        .map_err(implementation_error)?;
                if transaction.is_some() {
                    let mut detected = detected_payjoin_txid.lock().map_err(|_| {
                        implementation_error("failed to lock detected payjoin txid")
                    })?;
                    *detected = Some(txid);
                }

                Ok(transaction)
            })
            .save(persister)
        {
            Ok(OptionalTransitionOutcome::Progress(())) => {
                let outcome = replay_closed_outcome(persister)?.ok_or_else(|| {
                    anyhow!("payjoin receiver monitor closed without replayable outcome")
                })?;
                if matches!(outcome, SessionOutcome::Success(_)) {
                    let detected_txid = detected_payjoin_txid
                        .lock()
                        .map_err(|_| anyhow!("failed to lock detected payjoin txid"))?
                        .to_owned();
                    if let Some(txid) = detected_txid {
                        persister
                            .repo
                            .set_payjoin_transaction_id(persister.session_id, &txid.to_string())
                            .context("failed to persist payjoin transaction id")?;
                    } else {
                        warn!(
                            session_id = %persister.session_id,
                            "Payjoin receiver closed successfully without a captured payjoin txid"
                        );
                    }
                }
                log_closed_outcome(persister.session_id, &outcome);
                return Ok(());
            }
            Ok(OptionalTransitionOutcome::Stasis(current_receiver)) => {
                receiver = current_receiver;
                debug!(
                    session_id = %persister.session_id,
                    "Payjoin receiver payment still pending"
                );
                tokio::time::sleep(Duration::from_secs(5)).await;
            }
            Err(err) => {
                error!(
                    session_id = %persister.session_id,
                    "Payjoin receiver monitor recoverable error: {err}"
                );
                return Err(anyhow!("failed to check payjoin payment status: {err}"));
            }
        }
    }
}

async fn lookup_btc_transaction(
    btc_chain: Arc<dyn Client + Send + Sync>,
    txid: Txid,
) -> Result<Option<Transaction>> {
    let raw_tx = match btc_chain.raw_transaction(&txid.to_string()).await {
        Ok(raw_tx) => raw_tx,
        Err(err) if is_transaction_not_found(&err) => {
            match btc_chain.wallet_transaction_hex(&txid.to_string()).await {
                Ok(raw_tx) => raw_tx,
                Err(err) if is_transaction_not_found(&err) => return Ok(None),
                Err(err) => return Err(err).context("failed to query Bitcoin wallet transaction"),
            }
        }
        Err(err) => return Err(err).context("failed to query Bitcoin transaction"),
    };
    let bytes = hex::decode(raw_tx).context("failed to decode Bitcoin transaction hex")?;
    let tx =
        deserialize::<Transaction>(&bytes).context("failed to deserialize Bitcoin transaction")?;

    Ok(Some(tx))
}

fn is_transaction_not_found(err: &anyhow::Error) -> bool {
    let msg = err.to_string().to_ascii_lowercase();
    msg.contains("no such mempool")
        || msg.contains("no such transaction")
        || msg.contains("non-wallet transaction")
        || msg.contains("not found")
}

fn replay_closed_outcome(persister: &ReceiverPersister) -> Result<Option<SessionOutcome>> {
    let (session, _) =
        replay_event_log(persister).context("failed to replay payjoin receiver closed event")?;

    Ok(match session {
        ReceiveSession::Closed(outcome) => Some(outcome),
        _ => None,
    })
}

fn stop_at_closed_session(persister: &ReceiverPersister, outcome: &SessionOutcome) -> Result<()> {
    log_closed_outcome(persister.session_id, outcome);
    Ok(())
}

fn log_closed_outcome(session_id: i64, outcome: &SessionOutcome) {
    match outcome {
        SessionOutcome::Success(_) => {
            info!(
                session_id = %session_id,
                "Payjoin receiver payjoin payment detected"
            );
        }
        SessionOutcome::FallbackBroadcasted => {
            info!(
                session_id = %session_id,
                "Payjoin receiver fallback/original transaction detected"
            );
        }
        SessionOutcome::PayjoinProposalSent => {
            info!(
                session_id = %session_id,
                "Payjoin receiver session closed; proposal sent but payment cannot be monitored"
            );
        }
        SessionOutcome::Aborted => {
            error!(
                session_id = %session_id,
                outcome = ?outcome,
                "Payjoin receiver session closed with terminal error"
            );
        }
    }
    info!(
        session_id = %session_id,
        outcome = ?outcome,
        "Payjoin receiver session closed/completed"
    );
}

fn sign_payjoin_psbt(
    psbt: &Psbt,
    btc_chain: Arc<dyn Client + Send + Sync>,
) -> std::result::Result<Psbt, ImplementationError> {
    let processed = block_on(async { btc_chain.process_psbt(&psbt.to_string()).await })
        .map_err(implementation_error)?;

    Psbt::from_str(&processed.psbt).map_err(implementation_error)
}

fn payjoin_directory() -> String {
    env::var("BOLTZ_PAYJOIN_DIRECTORY").unwrap_or_else(|_| DIRECTORY.to_string())
}

fn payjoin_ohttp_relays() -> Vec<String> {
    env::var("BOLTZ_PAYJOIN_OHTTP_RELAYS")
        .map(|relays| {
            relays
                .split(',')
                .map(str::trim)
                .filter(|relay| !relay.is_empty())
                .map(str::to_string)
                .collect::<Vec<_>>()
        })
        .ok()
        .filter(|relays| !relays.is_empty())
        .unwrap_or_else(|| OHTTP_RELAYS.iter().map(|relay| relay.to_string()).collect())
}

fn payjoin_ohttp_relay() -> String {
    payjoin_ohttp_relays()
        .into_iter()
        .next()
        .unwrap_or_else(|| OHTTP_RELAY.to_string())
}

async fn fetch_ohttp_keys(directory: &str) -> Result<payjoin::OhttpKeys> {
    let mut errors = Vec::new();

    for relay in payjoin_ohttp_relays() {
        match payjoin::io::fetch_ohttp_keys(relay.as_str(), directory).await {
            Ok(keys) => return Ok(keys),
            Err(error) => {
                warn!(
                    relay = relay.as_str(),
                    error = %error,
                    "Failed to fetch Payjoin OHTTP keys from relay"
                );
                errors.push(format!("{relay}: {error}"));
            }
        }
    }

    Err(anyhow!(
        "all configured Payjoin OHTTP relays failed: {}",
        errors.join("; ")
    ))
}

async fn post_request(req: payjoin::Request) -> Result<reqwest::Response> {
    let http = reqwest::Client::builder()
        .http1_only()
        .build()
        .context("failed to build payjoin HTTP client")?;

    Ok(http
        .post(req.url)
        .header("Content-Type", req.content_type)
        .body(req.body)
        .send()
        .await
        .context("failed to send payjoin HTTP request")?
        .error_for_status()
        .context("payjoin HTTP request returned an error status")?)
}

fn block_on<F: Future>(future: F) -> F::Output {
    tokio::task::block_in_place(|| tokio::runtime::Handle::current().block_on(future))
}

fn implementation_error(error: impl fmt::Display) -> ImplementationError {
    ImplementationError::new(std::io::Error::other(error.to_string()))
}

fn bitcoin_network(network: Network) -> payjoin::bitcoin::Network {
    match network {
        Network::Mainnet => payjoin::bitcoin::Network::Bitcoin,
        Network::Testnet => payjoin::bitcoin::Network::Testnet,
        Network::Signet => payjoin::bitcoin::Network::Signet,
        Network::Regtest => payjoin::bitcoin::Network::Regtest,
    }
}

#[derive(Clone, Debug)]
struct ReceiverPersister {
    repo: Arc<PayjoinReceiverSessionHelperDatabase>,
    session_id: i64,
}

impl SessionPersister for ReceiverPersister {
    type InternalStorageError = ReceiverPersistenceError;
    type SessionEvent = SessionEvent;

    fn save_event(
        &self,
        event: Self::SessionEvent,
    ) -> std::result::Result<(), Self::InternalStorageError> {
        let event_data = serde_json::to_string(&event)?;
        self.repo
            .insert_receiver_session_event(&NewPayjoinReceiverSessionEvent {
                sessionId: self.session_id,
                eventData: event_data,
            })?;

        Ok(())
    }

    fn load(
        &self,
    ) -> std::result::Result<Box<dyn Iterator<Item = Self::SessionEvent>>, Self::InternalStorageError>
    {
        let events = self
            .repo
            .get_receiver_session_events(self.session_id)?
            .into_iter()
            .map(|event| serde_json::from_str(&event.eventData))
            .collect::<std::result::Result<Vec<Self::SessionEvent>, _>>()?;

        Ok(Box::new(events.into_iter()))
    }

    fn close(&self) -> std::result::Result<(), Self::InternalStorageError> {
        self.repo.close_receiver_session(self.session_id)?;
        Ok(())
    }
}

#[derive(Debug)]
struct ReceiverPersistenceError(anyhow::Error);

impl fmt::Display for ReceiverPersistenceError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        self.0.fmt(f)
    }
}

impl Error for ReceiverPersistenceError {}

impl From<anyhow::Error> for ReceiverPersistenceError {
    fn from(value: anyhow::Error) -> Self {
        Self(value)
    }
}

impl From<serde_json::Error> for ReceiverPersistenceError {
    fn from(value: serde_json::Error) -> Self {
        Self(value.into())
    }
}

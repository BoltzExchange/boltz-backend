use crate::chain::Client;
use crate::currencies::Currencies;
use crate::db::Pool;
use crate::db::helpers::payjoin::{
    PayjoinReceiverSessionHelper, PayjoinReceiverSessionHelperDatabase,
};
use crate::db::models::{NewPayjoinReceiverSession, NewPayjoinReceiverSessionEvent};
use crate::wallet::Network;
use anyhow::{Context, Result, anyhow};
use payjoin::ImplementationError;
use payjoin::bitcoin::consensus::encode::serialize_hex;
use payjoin::bitcoin::{Address, Amount};
use payjoin::persist::{OptionalTransitionOutcome, SessionPersister};
use payjoin::receive::v2::{
    Initialized, MaybeInputsOwned, MaybeInputsSeen, OutputsUnknown, ReceiveSession, Receiver,
    ReceiverBuilder, SessionEvent, UncheckedOriginalPayload, WantsOutputs, replay_event_log,
};
use std::error::Error;
use std::fmt;
use std::future::Future;
use std::str::FromStr;
use std::sync::Arc;
use std::time::Duration;
use tracing::{error, info, instrument};

const OHTTP_RELAY: &str = "https://pj.bobspacebkk.com";
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

        let session = self
            .repo
            .create_receiver_session(&NewPayjoinReceiverSession {
                address: address.to_string(),
                amountSats: amount_sats,
                label: label.clone(),
            })
            .context("failed to create payjoin receiver session")?;
        let persister = ReceiverPersister {
            repo: self.repo.clone(),
            session_id: session.id,
        };

        let ohttp_keys = payjoin::io::fetch_ohttp_keys(OHTTP_RELAY, DIRECTORY)
            .await
            .context("failed to fetch payjoin OHTTP keys")?;
        let mut builder = ReceiverBuilder::new(address.clone(), DIRECTORY, ohttp_keys)
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
            identify_receiver_outputs(receiver, &persister, receiver_address, network).await
        }
        ReceiveSession::WantsOutputs(_) => stop_at_wants_outputs(&persister),
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
        let (req, context) = receiver
            .create_poll_request(OHTTP_RELAY)
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
    _btc_chain: Arc<dyn Client + Send + Sync>,
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

    identify_receiver_outputs(receiver, persister, receiver_address, network).await
}

async fn identify_receiver_outputs(
    receiver: Receiver<OutputsUnknown>,
    persister: &ReceiverPersister,
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

    stop_at_wants_outputs(persister)?;
    let _receiver: Receiver<WantsOutputs> = receiver;
    Ok(())
}

fn stop_at_wants_outputs(persister: &ReceiverPersister) -> Result<()> {
    info!(
        session_id = %persister.session_id,
        "Payjoin receiver reached WantsOutputs; stopping before input contribution"
    );
    Ok(())
}

async fn post_request(req: payjoin::Request) -> Result<reqwest::Response> {
    Ok(reqwest::Client::new()
        .post(req.url)
        .body(req.body)
        .header("Content-Type", req.content_type)
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

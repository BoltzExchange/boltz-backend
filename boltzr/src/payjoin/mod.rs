use crate::db::Pool;
use crate::db::helpers::payjoin::{
    PayjoinReceiverSessionHelper, PayjoinReceiverSessionHelperDatabase,
};
use crate::db::models::{NewPayjoinReceiverSession, NewPayjoinReceiverSessionEvent};
use anyhow::{Context, Result, anyhow};
use payjoin::bitcoin::{Address, Amount};
use payjoin::persist::{OptionalTransitionOutcome, SessionPersister};
use payjoin::receive::v2::{
    Initialized, ReceiveSession, Receiver, ReceiverBuilder, SessionEvent, replay_event_log,
};
use std::error::Error;
use std::fmt;
use std::str::FromStr;
use std::sync::Arc;
use std::time::Duration;
use tracing::{error, info, instrument};

const OHTTP_RELAY: &str = "https://pj.bobspacebkk.com";
const DIRECTORY: &str = "https://payjo.in";

#[derive(Clone, Debug)]
pub struct PayjoinManager {
    repo: Arc<PayjoinReceiverSessionHelperDatabase>,
}

impl PayjoinManager {
    pub fn new(pool: Pool) -> Self {
        Self {
            repo: Arc::new(PayjoinReceiverSessionHelperDatabase::new(pool)),
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
        let mut builder = ReceiverBuilder::new(address, DIRECTORY, ohttp_keys)
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
            persister.session_id,
        ));

        Ok(uri)
    }
}

async fn poll_for_sender_proposal(
    repo: Arc<PayjoinReceiverSessionHelperDatabase>,
    session_id: i64,
) {
    if let Err(err) = try_poll_for_sender_proposal(repo, session_id).await {
        error!(
            session_id = %session_id,
            "Payjoin receiver polling stopped: {err:#}"
        );
    }
}

async fn try_poll_for_sender_proposal(
    repo: Arc<PayjoinReceiverSessionHelperDatabase>,
    session_id: i64,
) -> Result<()> {
    let persister = ReceiverPersister { repo, session_id };
    let (session, _) =
        replay_event_log(&persister).context("failed to replay payjoin receiver event log")?;

    match session {
        ReceiveSession::Initialized(receiver) => {
            poll_initialized_receiver(receiver, &persister).await
        }
        ReceiveSession::UncheckedOriginalPayload(_) => {
            info!(
                session_id = %session_id,
                "Payjoin receiver already has a sender proposal"
            );
            Ok(())
        }
        other => Err(anyhow!(
            "payjoin receiver session is not in a pollable state: {:?}",
            other
        )),
    }
}

async fn poll_initialized_receiver(
    mut receiver: Receiver<Initialized>,
    persister: &ReceiverPersister,
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
                return Ok(());
            }
            OptionalTransitionOutcome::Stasis(current_receiver) => {
                receiver = current_receiver;
                tokio::time::sleep(Duration::from_secs(1)).await;
            }
        }
    }
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

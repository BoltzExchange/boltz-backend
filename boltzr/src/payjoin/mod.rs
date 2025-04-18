use anyhow::{Result, anyhow};
use bitcoin::{Address, Amount};
use payjoin::{
    OhttpKeys,
    persist::NoopPersister,
    receive::{ImplementationError, v2::*},
};
use tracing::log::{debug, info, trace};

use payjoin::bitcoin::consensus::encode::serialize_hex;

use std::str::FromStr;

mod wallet;

const OHTTP_RELAY: &str = "https://pj.bobspacebkk.com";
const DIRECTORY: &str = "https://payjo.in";

pub struct PayjoinManager {
    ohttp_keys: OhttpKeys,
}

impl PayjoinManager {
    pub async fn new() -> Result<Self> {
        let ohttp_keys = payjoin::io::fetch_ohttp_keys(OHTTP_RELAY, DIRECTORY).await?;
        Ok(Self { ohttp_keys })
    }

    /// Initialize a payjoin from a gRPC request
    ///
    /// Return the Payjoin Uri as a string
    pub async fn receive_payjoin_adapter<'a>(
        &self,
        address: String,
        sats: Option<u64>,
        label: Option<String>,
    ) -> Result<String> {
        let address = Address::from_str(&address)?.assume_checked();
        let amount = sats.map(|s| Amount::from_sat(s));
        let pj_uri = self.receive_payjoin(address, amount, label).await?;
        Ok(pj_uri.to_string())
    }

    /// Receive a payjoin request and return the Payjoin Uri
    async fn receive_payjoin<'a>(
        &self,
        address: Address,
        amount: Option<Amount>,
        label: Option<String>,
    ) -> Result<payjoin::PjUri<'a>> {
        let token = NewReceiver::new(address.clone(), DIRECTORY, self.ohttp_keys.clone(), None)
            .expect("Failed to create receiver")
            .persist(&mut payjoin::persist::NoopPersister)
            .expect("Failed to persist receiver");

        let receiver =
            Receiver::load(token, &mut NoopPersister).expect("Failed to create receiver");

        let pj_uri = pj_uri_with_extras(&receiver, amount, label)?;
        tokio::spawn(spawn_payjoin_receiver(receiver, address));
        info!("Request Payjoin by sharing this Payjoin Uri: \n{}", pj_uri);
        Ok(pj_uri)
    }
}

fn pj_uri_with_extras<'a>(
    receiver: &Receiver,
    amount: Option<bitcoin::Amount>,
    label: Option<String>,
) -> Result<payjoin::PjUri<'a>> {
    let mut pj_uri = receiver.pj_uri();
    pj_uri.amount = amount;
    pj_uri.label = label.map(|l| l.into());
    Ok(pj_uri)
}

async fn spawn_payjoin_receiver<'a>(mut receiver: Receiver, address: Address) -> Result<()> {
    info!("Receive session established");
    let receiver = long_poll_fallback(&mut receiver).await?;

    info!(
        "Fallback transaction received. Consider broadcasting this to get paid if the Payjoin fails:"
    );
    info!(
        "{}",
        serialize_hex(&receiver.extract_tx_to_schedule_broadcast())
    );
    let mut payjoin_proposal = match process_v2_proposal(receiver.clone(), address) {
        Ok(proposal) => proposal,
        Err(payjoin::receive::Error::ReplyToSender(e)) => {
            todo!("Handle recoverable error")
            // return Err(
            //     handle_recoverable_error(e, receiver, &self.config.v2()?.ohttp_relay).await
            // );
        }
        Err(e) => return Err(e.into()),
    };
    let (req, ohttp_ctx) = payjoin_proposal
        .extract_req(OHTTP_RELAY)
        .map_err(|e| anyhow!("v2 req extraction failed {}", e))?;
    info!("Got a request from the sender. Responding with a Payjoin proposal.");
    let res = post_request(req).await?;
    payjoin_proposal
        .process_res(&res.bytes().await?, ohttp_ctx)
        .map_err(|e| anyhow!("Failed to deserialize response {}", e))?;
    let payjoin_psbt = payjoin_proposal.psbt().clone();
    info!(
        "Response successful. Watch mempool for successful Payjoin. TXID: {}",
        payjoin_psbt
            .extract_tx_unchecked_fee_rate()
            .clone()
            .compute_txid()
    );
    //self.db.clear_recv_session()?;
    Ok(())
}

async fn long_poll_fallback(receiver: &mut Receiver) -> Result<UncheckedProposal> {
    loop {
        let (req, context) = receiver.extract_req(OHTTP_RELAY)?;
        println!("Polling receive request...");
        let ohttp_response = post_request(req).await?;
        let proposal = receiver
            .process_res(ohttp_response.bytes().await?.to_vec().as_slice(), context)
            .map_err(|_| anyhow!("GET fallback failed"))?;
        debug!("got response");
        if let Some(proposal) = proposal {
            break Ok(proposal);
        }
    }
}

async fn post_request(req: payjoin::Request) -> Result<reqwest::Response> {
    Ok(reqwest::Client::new()
        .post(req.url)
        .body(req.body)
        .header("Content-Type", req.content_type)
        .send()
        .await?)
}

fn process_v2_proposal(
    proposal: UncheckedProposal,
    address: Address,
) -> Result<PayjoinProposal, payjoin::receive::Error> {
    // TODO get wallet from self
    let wallet = wallet::BitcoindWallet::new().expect("Failed to create wallet");

    // in a payment processor where the sender could go offline, this is where you schedule to broadcast the original_tx
    let _to_broadcast_in_failure_case = proposal.extract_tx_to_schedule_broadcast();

    // Receive Check 1: Can Broadcast
    let proposal =
        proposal.check_broadcast_suitability(None, |tx| Ok(wallet.can_broadcast(tx)?))?;
    trace!("check1");

    // Receive Check 2: receiver can't sign for proposal inputs
    let proposal =
        proposal.check_inputs_not_owned(|input| Ok(wallet.is_mine(input, address.clone())?))?;
    trace!("check2");

    // Receive Check 3: have we seen this input before? More of a check for non-interactive i.e. payment processor receivers.
    let payjoin = proposal.check_no_inputs_seen_before(|input| {
        // TODO check db if input seen before
        Ok(false)
    })?;
    trace!("check3");

    let wants_inputs = payjoin
        .identify_receiver_outputs(|output_script| {
            Ok(wallet.is_mine(output_script, address.clone())?)
        })?
        .commit_outputs();

    let provisional_payjoin = try_contributing_inputs(wants_inputs.clone(), &wallet)
        .expect("Failed to try contributing inputs");

    let payjoin_proposal = provisional_payjoin.finalize_proposal(
        |psbt| Ok(wallet.process_psbt(psbt)?),
        None,
        None, // TODO max fee rate
    )?;
    let payjoin_proposal_psbt = payjoin_proposal.psbt();
    debug!(
        "Receiver's Payjoin proposal PSBT Rsponse: {:#?}",
        payjoin_proposal_psbt
    );
    Ok(payjoin_proposal)
}

/// Try to contribute a boltz backend input to the payjoin
/// TODO depend on wallet as argument
fn try_contributing_inputs(
    payjoin: WantsInputs,
    wallet: &wallet::BitcoindWallet,
) -> Result<ProvisionalProposal, ImplementationError> {
    let candidate_inputs = wallet.list_unspent()?;

    let selected_input = payjoin
        .try_preserving_privacy(candidate_inputs)
        .map_err(ImplementationError::from)?;

    Ok(payjoin
        .contribute_inputs(vec![selected_input])
        .map_err(ImplementationError::from)?
        .commit_inputs())
}

use crate::chain::Client;
use crate::currencies::{Currencies, Currency};
use anyhow::{Result, anyhow};
use bitcoin::{Address, Amount, Network, Psbt};
use payjoin::bitcoin::consensus::encode::serialize_hex;
use payjoin::receive::InputPair;
use payjoin::{
    OhttpKeys,
    persist::NoopPersister,
    receive::{ImplementationError, v2::*},
};
use std::sync::Arc;
use std::{str::FromStr, sync::mpsc};
use tracing::log::{debug, info};

const OHTTP_RELAY: &str = "https://pj.bobspacebkk.com";
const DIRECTORY: &str = "https://payjo.in";

pub struct PayjoinManager {
    ohttp_keys: OhttpKeys,
    btc: Currency,
}

impl PayjoinManager {
    pub async fn new(currencies: Currencies) -> Result<Self> {
        let ohttp_keys = payjoin::io::fetch_ohttp_keys(OHTTP_RELAY, DIRECTORY).await?;
        let btc = match currencies.get("BTC") {
            Some(cur) => Ok(cur.clone()),
            None => Err(anyhow!("BTC currency not configured")),
        }?;
        Ok(Self { ohttp_keys, btc })
    }

    /// Initialize a payjoin from a gRPC request
    ///
    /// Return the Payjoin Uri as a string
    pub async fn receive_payjoin_adapter(
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
        tokio::spawn(spawn_payjoin_receiver(receiver, address, self.btc.clone()));
        info!("Request Payjoin by sharing this Payjoin Uri: \n{}", pj_uri);
        Ok(pj_uri)
    }
}

fn pj_uri_with_extras<'a>(
    receiver: &Receiver,
    amount: Option<Amount>,
    label: Option<String>,
) -> Result<payjoin::PjUri<'a>> {
    let mut pj_uri = receiver.pj_uri();
    pj_uri.amount = amount;
    pj_uri.label = label.map(|l| l.into());
    Ok(pj_uri)
}

async fn spawn_payjoin_receiver(
    mut receiver: Receiver,
    address: Address,
    btc: Currency,
) -> Result<()> {
    info!("Receive session established");
    let receiver = long_poll_fallback(&mut receiver).await?;

    info!(
        "Fallback transaction received. Consider broadcasting this to get paid if the Payjoin fails:"
    );
    info!(
        "{}",
        serialize_hex(&receiver.extract_tx_to_schedule_broadcast())
    );
    let (tx, rx) = mpsc::channel();

    tokio::task::spawn_blocking(move || {
        let res = process_v2_proposal(
            receiver.clone(),
            address,
            btc.chain.expect(""),
            btc.network.bitcoin(),
        );
        tx.send(res).expect("rx dropped prematurely")
    });

    let mut payjoin_proposal = match rx.recv().expect("tx dropped prematurely") {
        Ok(proposal) => proposal,
        Err(payjoin::receive::Error::ReplyToSender(e)) => {
            dbg!(e);
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

/// Block on an async future using the current tokio runtime.
/// This simplifies converting async calls to synchronous contexts.
fn block_on<F: Future>(future: F) -> F::Output {
    tokio::runtime::Handle::current().block_on(future)
}

fn process_v2_proposal(
    proposal: UncheckedProposal,
    receive_address: Address,
    client: Arc<Box<dyn Client + Send + Sync>>,
    network: Network,
) -> Result<PayjoinProposal, payjoin::receive::Error> {
    // in a payment processor where the sender could go offline, this is where you schedule to broadcast the original_tx
    let _to_broadcast_in_failure_case = proposal.extract_tx_to_schedule_broadcast();

    // Receive Check 1: Can Broadcast
    let proposal = proposal.check_broadcast_suitability(None, |tx| {
        let mempool_results =
            block_on(async { client.test_mempool_accept(vec![serialize_hex(tx)]).await })?;
        match mempool_results.first() {
            Some(result) => Ok(result.allowed),
            None => Err("No mempool results returned on broadcast check".into()),
        }
    })?;

    // Receive Check 2: receiver can't sign for proposal inputs
    let proposal = proposal.check_inputs_not_owned(|input| {
        let address = Address::from_script(input, network)?.to_string();
        Ok(block_on(async { client.address_info(address).await })?
            .is_mine
            .unwrap_or(false))
    })?;

    // Receive Check 3: have we seen this input before? More of a check for non-interactive i.e. payment processor receivers.
    let payjoin = proposal.check_no_inputs_seen_before(|_| {
        // TODO check db if input seen before
        Ok(false)
    })?;

    let wants_inputs = payjoin
        .identify_receiver_outputs(|output_script| {
            // Check outputs directly against the swap lockup address.
            // It's important that this matches specifically the lockup address for the
            // corresponding swap and not just "any owned address".
            let address = Address::from_script(output_script, network)?;
            Ok(address == receive_address)
        })?
        .commit_outputs();

    let provisional_payjoin =
        block_on(async { try_contributing_inputs(wants_inputs.clone(), client.clone()).await })
            .map_err(|e| payjoin::receive::ReplyableError::Implementation(e))?;

    let payjoin_proposal = provisional_payjoin.finalize_proposal(
        |psbt| {
            Ok(Psbt::from_str(
                &block_on(async { client.process_psbt(psbt.to_string()).await })?.psbt,
            )?)
        },
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
async fn try_contributing_inputs(
    payjoin: WantsInputs,
    client: Arc<Box<dyn Client + Send + Sync>>,
) -> Result<ProvisionalProposal, ImplementationError> {
    let candidate_inputs = client
        .list_unspent()
        .await?
        .into_iter()
        .map(input_pair_from_list_unspent);

    let selected_input = payjoin
        .try_preserving_privacy(candidate_inputs)
        .map_err(ImplementationError::from)?;

    Ok(payjoin
        .contribute_inputs(vec![selected_input])
        .map_err(ImplementationError::from)?
        .commit_inputs())
}

fn input_pair_from_list_unspent(utxo: crate::chain::types::ListUnspent) -> InputPair {
    use bitcoin::psbt::Input;
    use bitcoin::{OutPoint, TxIn, TxOut};

    let psbtin = Input {
        // NOTE: non_witness_utxo is not necessary because bitcoin-cli always supplies
        // witness_utxo, even for non-witness inputs
        witness_utxo: Some(TxOut {
            value: utxo.amount,
            script_pubkey: utxo.script_pub_key.clone(),
        }),
        redeem_script: utxo.redeem_script.clone(),
        witness_script: utxo.witness_script.clone(),
        ..Default::default()
    };
    let txin = TxIn {
        previous_output: OutPoint {
            txid: utxo.txid,
            vout: utxo.vout,
        },
        ..Default::default()
    };
    InputPair::new(txin, psbtin).expect("Input pair should be valid")
}

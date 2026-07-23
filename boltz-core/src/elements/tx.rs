use crate::{
    consts::{ECDSA_BYTES_TO_GRIND, PREIMAGE_DUMMY, STUB_SCHNORR_SIGNATURE_LENGTH},
    elements::{InputDetail, scripts::TreeError},
    target_fee::{FeeError, FeeTarget, target_fee},
    utils::{Destination, InputType, OutputType},
};
use bitcoin::Witness;
use elements::{
    Address, AssetId, BlockHash, EcdsaSighashType, LockTime, RangeProofMessage, SchnorrSig,
    SchnorrSighashType, Script, Sequence, Sighash, SurjectionInput, Transaction, TxIn, TxOut,
    TxOutSecrets, TxOutWitness,
    confidential::{Asset, AssetBlindingFactor, Nonce, Value, ValueBlindingFactor},
    hashes::{Hash, sha256},
    opcodes::all::{OP_PUSHBYTES_0, OP_RETURN},
    script::Builder,
    secp256k1_zkp::{
        Keypair, Message, PublicKey, Secp256k1, SecretKey, Signing, Verification, rand,
    },
    sighash::{Prevouts, SighashCache},
    taproot::LeafVersion,
};

const SIGHASH_TYPE_LEGACY: EcdsaSighashType = EcdsaSighashType::All;
const SIGHASH_TYPE_TAPROOT: SchnorrSighashType = SchnorrSighashType::Default;

const DUMMY_BLINDED_OUTPUT: u64 = 1;

/// Errors returned by Elements [`construct_tx`].
#[derive(Debug, thiserror::Error)]
#[non_exhaustive]
pub enum TxError {
    /// The selected fee is larger than the sum of (unblinded) input values.
    #[error("fee is greater than input sum")]
    FeeExceedsInputs,
    /// The explicit outputs sum to more than the inputs (before fee).
    #[error("output sum is greater than input sum")]
    OutputsExceedInputs,
    /// The relative fee rate is non-finite or negative.
    #[error("invalid fee rate")]
    InvalidFeeRate,
    /// Called with an empty `inputs` slice.
    #[error("inputs must not be empty")]
    EmptyInputs,
    /// An internal output index was out of range during blinding (a builder-state bug).
    #[error("output index {0} out of range")]
    OutputIndexOutOfBounds(usize),
    /// Inputs span more than one asset (only single-asset spends are supported here).
    #[error("all inputs must have the same asset")]
    MixedAssets,
    /// The named confidential input did not carry a blinding key.
    #[error("input {0} has no blinding key")]
    MissingBlindingKey(usize),
    /// The named explicit input did not expose its asset.
    #[error("input {0} has no explicit asset")]
    MissingExplicitAsset(usize),
    /// The named explicit input did not expose its value.
    #[error("input {0} has no explicit value")]
    MissingExplicitValue(usize),
    /// The Taproot builder could not finalize the script tree for the named input.
    #[error("could not finalize taproot builder for input {0}")]
    TaprootFinalize(usize),
    /// No control block was found for the named input's spend leaf.
    #[error("could not create control block for input {0}")]
    ControlBlock(usize),
    /// A swap [`Tree`](crate::elements::Tree) operation failed.
    #[error(transparent)]
    Tree(#[from] TreeError),
    /// Failed to convert a height/time value into a [`LockTime`].
    #[error(transparent)]
    LockTime(#[from] elements::locktime::Error),
    /// Failed to compute a sighash.
    #[error(transparent)]
    Sighash(#[from] elements::sighash::Error),
    /// Failed to parse an Elements address.
    #[error(transparent)]
    Address(#[from] elements::AddressError),
    /// Failed to unblind a confidential input.
    #[error(transparent)]
    Unblind(#[from] elements::UnblindError),
    /// Failed to construct a confidential output (range proof, surjection proof, ...).
    #[error(transparent)]
    Confidential(#[from] elements::ConfidentialTxOutError),
    /// A secp256k1 (upstream) operation failed.
    #[error(transparent)]
    Secp(#[from] elements::secp256k1_zkp::UpstreamError),
    /// A secp256k1-zkp operation (range proof, surjection proof) failed.
    #[error(transparent)]
    SecpZkp(#[from] elements::secp256k1_zkp::Error),
}

impl From<FeeError> for TxError {
    fn from(e: FeeError) -> Self {
        match e {
            FeeError::InvalidFeeRate => TxError::InvalidFeeRate,
        }
    }
}

#[derive(Debug, Copy, Clone)]
pub(crate) struct ExplicitOutput {
    pub(crate) asset: AssetId,
    pub(crate) amount: u64,
}

#[derive(Debug, Copy, Clone)]
pub(crate) enum UnblindedOutput {
    Unblinded(TxOutSecrets),
    Explicit(ExplicitOutput),
}

impl UnblindedOutput {
    pub(crate) fn amount(&self) -> u64 {
        match self {
            UnblindedOutput::Unblinded(sec) => sec.value,
            UnblindedOutput::Explicit(out) => out.amount,
        }
    }

    pub(crate) fn asset(&self) -> AssetId {
        match self {
            UnblindedOutput::Unblinded(sec) => sec.asset,
            UnblindedOutput::Explicit(out) => out.asset,
        }
    }
}

impl From<UnblindedOutput> for SurjectionInput {
    fn from(val: UnblindedOutput) -> Self {
        match val {
            UnblindedOutput::Unblinded(sec) => sec.into(),
            UnblindedOutput::Explicit(out) => SurjectionInput::Known {
                asset: out.asset,
                asset_bf: AssetBlindingFactor::zero(),
            },
        }
    }
}

impl From<&UnblindedOutput> for (u64, AssetBlindingFactor, ValueBlindingFactor) {
    fn from(val: &UnblindedOutput) -> Self {
        match val {
            UnblindedOutput::Unblinded(sec) => (sec.value, sec.asset_bf, sec.value_bf),
            UnblindedOutput::Explicit(out) => (
                out.amount,
                AssetBlindingFactor::zero(),
                ValueBlindingFactor::zero(),
            ),
        }
    }
}

/// Build, sign, and finalize an Elements transaction spending `inputs`
/// to `destination`, paying `fee` for chain `genesis_hash`.
///
/// Confidential inputs are unblinded with their `blinding_key`, the
/// asset-blinding factors of explicit outputs are zeroed, and the
/// resulting outputs (excluding any explicit fee output) are blinded
/// when paying to a confidential address. Returns the signed
/// transaction and the fee that was actually charged, in satoshis.
///
/// All inputs must share a single asset id; this function does not
/// support multi-asset spends. See
/// [`construct_asset_rescue`](crate::elements::construct_asset_rescue)
/// for the dual-asset (rescue + L-BTC) flow.
#[must_use = "ignoring the result discards the constructed transaction"]
pub fn construct_tx<C: Signing + Verification>(
    secp: &Secp256k1<C>,
    genesis_hash: BlockHash,
    mut inputs: Vec<InputDetail>,
    destination: &Destination<&Address>,
    fee: FeeTarget,
) -> Result<(Transaction, u64), TxError> {
    // BIP69: sort inputs by (outpoint.txid asc, outpoint.vout asc).
    inputs.sort_by(|a, b| {
        bip69_txid_cmp(
            a.outpoint.txid.as_byte_array(),
            b.outpoint.txid.as_byte_array(),
        )
        .then(a.outpoint.vout.cmp(&b.outpoint.vout))
    });
    let inputs = inputs.as_slice();

    let unblinded = unblind_outputs(secp, inputs)?;
    let asset_id = unblinded.first().ok_or(TxError::EmptyInputs)?.asset();
    if !unblinded.iter().all(|input| input.asset() == asset_id) {
        return Err(TxError::MixedAssets);
    }

    target_fee(fee, |fee, is_fee_estimation| {
        construct_raw(
            secp,
            genesis_hash,
            inputs,
            &unblinded,
            asset_id,
            destination,
            fee,
            is_fee_estimation,
        )
    })
}

fn bip69_txid_cmp(a: &[u8; 32], b: &[u8; 32]) -> std::cmp::Ordering {
    // Hash newtypes expose internal bytes; BIP69 compares conventional txid byte order.
    a.iter().rev().cmp(b.iter().rev())
}

// TODO: claim covenant support

#[allow(clippy::too_many_arguments)]
fn construct_raw<C: Signing + Verification>(
    secp: &Secp256k1<C>,
    genesis_hash: BlockHash,
    inputs: &[InputDetail],
    unblinded: &[UnblindedOutput],
    asset_id: AssetId,
    destination: &Destination<&Address>,
    fee: u64,
    is_fee_estimation: bool,
) -> Result<Transaction, TxError> {
    let mut tx = Transaction {
        version: 2,
        lock_time: if let Some(lock_time) = inputs
            .iter()
            .filter_map(|input| match input.input_type {
                InputType::Refund(lock_time) => Some(lock_time),
                _ => None,
            })
            .max()
        {
            LockTime::from_height(lock_time)?
        } else {
            LockTime::ZERO
        },
        input: inputs
            .iter()
            .map(|input| TxIn {
                previous_output: input.outpoint,
                sequence: Sequence::ENABLE_RBF_NO_LOCKTIME,
                ..Default::default()
            })
            .collect(),
        output: blind_outputs(
            secp,
            unblinded,
            asset_id,
            destination,
            fee,
            is_fee_estimation,
        )?,
    };

    let prevouts: Vec<&TxOut> = inputs.iter().map(|input| &input.tx_out).collect();
    let prevouts = Prevouts::All(&prevouts);

    let sighash_cache = tx.clone();
    let mut sighash_cache = SighashCache::new(&sighash_cache);

    for ((i, input), tx_in) in inputs.iter().enumerate().zip(tx.input.iter_mut()) {
        match &input.output_type {
            OutputType::Legacy(witness_script) => {
                let sighash = sighash_cache.legacy_sighash(i, witness_script, SIGHASH_TYPE_LEGACY);

                let mut script_sig =
                    Builder::new().push_slice(&legacy_signature(secp, &sighash, &input.keys)?);

                match input.input_type {
                    InputType::Claim(preimage) => {
                        script_sig = script_sig.push_slice(&preimage);
                    }
                    InputType::Refund(_) => {
                        script_sig = script_sig.push_slice(&PREIMAGE_DUMMY);
                    }
                };

                tx_in.script_sig = script_sig
                    .push_slice(witness_script.as_bytes())
                    .into_script();
            }
            OutputType::Compatibility(witness_script) => {
                let nested = Builder::new()
                    .push_opcode(OP_PUSHBYTES_0)
                    .push_slice(sha256::Hash::hash(witness_script.as_bytes()).as_ref());

                tx_in.script_sig = Builder::new()
                    .push_slice(nested.into_script().as_bytes())
                    .into_script();
            }
            _ => {}
        };

        match &input.output_type {
            OutputType::Taproot(None) => {
                tx_in.witness.script_witness = stubbed_cooperative_witness().to_vec();
            }
            OutputType::Taproot(Some(uncooperative)) => {
                let leaf = if let InputType::Claim(_) = input.input_type {
                    &uncooperative.tree.claim_leaf
                } else {
                    &uncooperative.tree.refund_leaf
                };

                let leaf_hash = leaf.leaf_hash()?;

                let sighash = sighash_cache.taproot_script_spend_signature_hash(
                    i,
                    &prevouts,
                    leaf_hash,
                    SIGHASH_TYPE_TAPROOT,
                    genesis_hash,
                )?;

                let sig = SchnorrSig {
                    hash_ty: SIGHASH_TYPE_TAPROOT,
                    sig: secp.sign_schnorr(
                        &Message::from_digest_slice(sighash.as_raw_hash().as_ref())?,
                        &input.keys,
                    ),
                };

                let control_block = uncooperative
                    .tree
                    .build()?
                    .finalize(secp, uncooperative.internal_key)
                    .map_err(|_| TxError::TaprootFinalize(i))?
                    .control_block(&(
                        leaf.output.clone(),
                        LeafVersion::from_u8(leaf.version).map_err(TreeError::Taproot)?,
                    ))
                    .ok_or(TxError::ControlBlock(i))?;

                let mut witness = Witness::new();
                witness.push(sig.to_vec());

                if let InputType::Claim(preimage) = input.input_type {
                    witness.push(preimage);
                }

                witness.push(leaf.output.as_bytes());
                witness.push(control_block.serialize());

                tx_in.witness.script_witness = witness.to_vec();
            }
            OutputType::SegwitV0(witness_script) | OutputType::Compatibility(witness_script) => {
                let sighash = sighash_cache.segwitv0_sighash(
                    i,
                    witness_script,
                    input.tx_out.value,
                    SIGHASH_TYPE_LEGACY,
                );

                let mut witness = Witness::new();
                witness.push(legacy_signature(secp, &sighash, &input.keys)?);

                if let InputType::Claim(preimage) = input.input_type {
                    witness.push(preimage);
                } else {
                    witness.push(PREIMAGE_DUMMY);
                }

                witness.push(witness_script.as_bytes());

                tx_in.witness.script_witness = witness.to_vec();
            }
            _ => {}
        }
    }

    Ok(tx)
}

fn unblind_outputs<C: Verification>(
    secp: &Secp256k1<C>,
    inputs: &[InputDetail],
) -> Result<Vec<UnblindedOutput>, TxError> {
    let mut unblinded = Vec::with_capacity(inputs.len());

    for (i, input) in inputs.iter().enumerate() {
        if input.tx_out.value.is_confidential() {
            if let Some(blinding_key) = input.blinding_key {
                let sec = input.tx_out.unblind(secp, blinding_key.secret_key())?;
                unblinded.push(UnblindedOutput::Unblinded(sec));
            } else {
                return Err(TxError::MissingBlindingKey(i));
            }
        } else {
            unblinded.push(UnblindedOutput::Explicit(ExplicitOutput {
                asset: input
                    .tx_out
                    .asset
                    .explicit()
                    .ok_or(TxError::MissingExplicitAsset(i))?,
                amount: input
                    .tx_out
                    .value
                    .explicit()
                    .ok_or(TxError::MissingExplicitValue(i))?,
            }));
        }
    }

    Ok(unblinded)
}

fn blind_outputs<C: Signing>(
    secp: &Secp256k1<C>,
    unblinded: &[UnblindedOutput],
    asset_id: AssetId,
    destination: &Destination<&Address>,
    fee: u64,
    is_fee_estimation: bool,
) -> Result<Vec<TxOut>, TxError> {
    let mut input_sum = unblinded.iter().map(|input| input.amount()).sum::<u64>();

    // We need a blinded dummy output if there is some blinded input and none of our outputs are blinded
    let needs_dummy_output = unblinded.iter().any(|i| match i {
        UnblindedOutput::Unblinded(_) => true,
        UnblindedOutput::Explicit(_) => false,
    }) && match destination {
        Destination::Single(address) => !address.is_blinded(),
        Destination::Multiple(outputs) => {
            !outputs.change.is_blinded()
                && !outputs
                    .outputs
                    .iter()
                    .any(|(address, _)| address.is_blinded())
        }
    };

    if needs_dummy_output {
        input_sum -= DUMMY_BLINDED_OUTPUT;
    }

    // Collect output intents up front so we can BIP69-sort them by
    // (amount asc, scriptPubKey bytes asc) before any blinding work. Once
    // built in sorted order, `last_to_blind` is just the last blinded
    // entry encountered by the build loop.
    let mut intents: Vec<(u64, elements::Script, Option<PublicKey>)> = Vec::new();

    if needs_dummy_output {
        let stub_script = Builder::new().push_opcode(OP_RETURN).into_script();
        let blinding_pubkey = Some(SecretKey::new(&mut rand::thread_rng()).public_key(secp));
        intents.push((DUMMY_BLINDED_OUTPUT, stub_script, blinding_pubkey));
    }

    match destination {
        Destination::Single(address) => {
            let amount = input_sum
                .checked_sub(fee)
                .ok_or(TxError::FeeExceedsInputs)?;
            intents.push((amount, address.script_pubkey(), address.blinding_pubkey));
        }
        Destination::Multiple(destination) => {
            let output_sum = destination
                .outputs
                .iter()
                .map(|output| output.1)
                .sum::<u64>();

            if output_sum
                + fee
                + match needs_dummy_output {
                    true => DUMMY_BLINDED_OUTPUT,
                    false => 0,
                }
                > input_sum
            {
                return Err(TxError::OutputsExceedInputs);
            }

            for (address, amount) in destination.outputs {
                intents.push((*amount, address.script_pubkey(), address.blinding_pubkey));
            }

            let sweep_amount = input_sum - fee - output_sum;
            intents.push((
                sweep_amount,
                destination.change.script_pubkey(),
                destination.change.blinding_pubkey,
            ));
        }
    }

    intents.sort_by(|a, b| a.0.cmp(&b.0).then(a.1.as_bytes().cmp(b.1.as_bytes())));

    let asset_bf = AssetBlindingFactor::new(&mut rand::thread_rng());

    let mut last_to_blind = None;
    let mut outputs = Vec::with_capacity(intents.len() + 1);

    for (amount, script, blinding_pubkey) in &intents {
        let (blinded, asset_bf, value_bf, output) = create_output(
            secp,
            unblinded,
            (asset_id, asset_bf),
            script,
            *blinding_pubkey,
            *amount,
            is_fee_estimation,
            None,
        )?;

        if blinded {
            last_to_blind = Some((outputs.len(), *amount, script.clone(), *blinding_pubkey));
        }

        outputs.push((*amount, asset_bf, value_bf, output));
    }

    outputs.push((
        fee,
        AssetBlindingFactor::zero(),
        ValueBlindingFactor::zero(),
        TxOut::new_fee(fee, asset_id),
    ));

    if let Some((index, amount, script, blinding_pubkey)) = last_to_blind {
        let (_, asset_bf, value_bf, output) = create_output(
            secp,
            unblinded,
            (asset_id, asset_bf),
            &script,
            blinding_pubkey,
            amount,
            is_fee_estimation,
            Some(
                &outputs
                    .iter()
                    .enumerate()
                    .filter(|(i, _)| *i != index)
                    .map(|(_, (amount, asset_bf, value_bf, _))| (*amount, *asset_bf, *value_bf))
                    .collect::<Vec<_>>(),
            ),
        )?;

        *outputs
            .get_mut(index)
            .ok_or(TxError::OutputIndexOutOfBounds(index))? = (amount, asset_bf, value_bf, output);
    }

    Ok(outputs
        .into_iter()
        .map(|(_, _, _, output)| output)
        .collect())
}

#[allow(clippy::too_many_arguments)]
pub(crate) fn create_output<C: Signing>(
    secp: &Secp256k1<C>,
    unblinded: &[UnblindedOutput],
    asset: (AssetId, AssetBlindingFactor),
    script_pubkey: &Script,
    blinding_pubkey: Option<PublicKey>,
    amount: u64,
    is_fee_estimation: bool,
    last_blinding_params: Option<&[(u64, AssetBlindingFactor, ValueBlindingFactor)]>,
) -> Result<(bool, AssetBlindingFactor, ValueBlindingFactor, TxOut), TxError> {
    // When we are just creating the transaction for the fee estimation,
    // we can skip blinding because Discount CT gives the blinding a 100% discount
    if !is_fee_estimation && let Some(blinding_key) = blinding_pubkey {
        let value_bf = match last_blinding_params {
            Some(params) => ValueBlindingFactor::last(
                secp,
                amount,
                asset.1,
                &unblinded.iter().map(|i| i.into()).collect::<Vec<_>>(),
                params,
            ),
            None => ValueBlindingFactor::new(&mut rand::thread_rng()),
        };
        let (blinded_value, nonce, range_proof) = Value::Explicit(amount).blind(
            secp,
            value_bf,
            blinding_key,
            SecretKey::new(&mut rand::thread_rng()),
            script_pubkey,
            &RangeProofMessage {
                asset: asset.0,
                bf: asset.1,
            },
        )?;

        let (blinded_asset, asset_surjection_proof) =
            Asset::Explicit(asset.0).blind(&mut rand::thread_rng(), secp, asset.1, unblinded)?;

        Ok((
            true,
            asset.1,
            value_bf,
            TxOut {
                nonce,
                asset: blinded_asset,
                value: blinded_value,
                script_pubkey: script_pubkey.clone(),
                witness: TxOutWitness {
                    surjection_proof: Some(Box::new(asset_surjection_proof)),
                    rangeproof: Some(Box::new(range_proof)),
                },
            },
        ))
    } else {
        Ok((
            false,
            AssetBlindingFactor::zero(),
            ValueBlindingFactor::zero(),
            TxOut {
                asset: Asset::Explicit(asset.0),
                value: Value::Explicit(amount),
                script_pubkey: script_pubkey.clone(),
                nonce: Nonce::Null,
                witness: TxOutWitness::default(),
            },
        ))
    }
}

fn legacy_signature<C: Signing>(
    secp: &Secp256k1<C>,
    sighash: &Sighash,
    keys: &Keypair,
) -> Result<Vec<u8>, TxError> {
    let mut sig = secp
        .sign_ecdsa_grind_r(
            &Message::from_digest_slice(sighash.as_raw_hash().as_ref())?,
            &keys.secret_key(),
            ECDSA_BYTES_TO_GRIND,
        )
        .serialize_der()
        .to_vec();
    sig.push(SIGHASH_TYPE_LEGACY.as_u32() as u8);

    Ok(sig)
}

fn stubbed_cooperative_witness() -> Witness {
    let mut witness = Witness::new();
    // Stub because we don't want to create cooperative signatures here
    // but still be able to have an accurate size estimation
    witness.push([0; STUB_SCHNORR_SIGNATURE_LENGTH]);
    witness
}

#[cfg(test)]
pub mod tests {
    use super::*;
    use crate::{
        client::{RpcBlock, RpcClient, RpcParam},
        detect_preimage,
        elements::{
            Tree, UncooperativeDetails, reverse_script, reverse_tree, swap_script, swap_tree,
        },
        utils::Outputs,
    };
    use bitcoin::{Amount, hashes::Hash, key::rand::RngCore};
    use elements::pset::serialize::Serialize;
    use elements::{
        AddressParams, OutPoint, Script, Txid, hashes::hash160, secp256k1_zkp::PublicKey,
        secp256k1_zkp::XOnlyPublicKey, taproot::TaprootSpendInfo,
    };
    use rstest::rstest;
    use serial_test::serial;
    use std::str::FromStr;

    pub const FUNDING_AMOUNT: u64 = 100_000;
    const MAX_BLINDING_RETRIES: usize = 3;

    // There is some variance in the proof sizes of Elements transactions
    fn assert_within_one_percent(actual: u64, expected: u64) {
        let tolerance = expected / 100;
        let lower_bound = expected.saturating_sub(tolerance);
        let upper_bound = expected.saturating_add(tolerance);

        assert!(actual >= lower_bound && actual <= upper_bound);
    }

    fn reverse_tree_without_covenant(
        preimage_hash: hash160::Hash,
        claim_key: &XOnlyPublicKey,
        refund_key: &XOnlyPublicKey,
        lock_time: LockTime,
    ) -> Tree {
        reverse_tree(preimage_hash, claim_key, refund_key, lock_time, None)
    }

    pub fn mine_block(client: &RpcClient) {
        client
            .request::<serde_json::Value>(
                "generatetoaddress",
                Some(&[
                    RpcParam::Int(1),
                    RpcParam::Str(&get_destination(client, true, None).to_string()),
                ]),
            )
            .unwrap();
    }

    fn get_block_height(client: &RpcClient) -> u32 {
        client.request::<u32>("getblockcount", None).unwrap()
    }

    pub fn get_genesis_hash(client: &RpcClient) -> BlockHash {
        let block_hash = client
            .request::<String>("getblockhash", Some(&[RpcParam::Int(0)]))
            .unwrap();

        let block = client
            .request::<RpcBlock>("getblock", Some(&[RpcParam::Str(&block_hash)]))
            .unwrap();
        BlockHash::from_str(&block.hash).unwrap()
    }

    fn verify_output_blinded(tx: &Transaction, vout: usize, expect_blinded: bool) -> bool {
        match tx.output.get(vout) {
            Some(output) => output.value.is_confidential() == expect_blinded,
            None => false,
        }
    }

    pub fn fund_address(
        client: &RpcClient,
        address: &Address,
        asset: Option<&str>,
        expect_blinded: Option<bool>,
    ) -> (Transaction, usize) {
        // Sometimes, Elements does not blind, so we give it a couple tries
        for _ in 0..MAX_BLINDING_RETRIES {
            let tx = client
                .request::<String>(
                    "sendtoaddress",
                    Some(&[
                        RpcParam::Str(&address.to_string()),
                        RpcParam::Float(Amount::from_sat(FUNDING_AMOUNT).to_btc()),
                        RpcParam::Null,
                        RpcParam::Null,
                        RpcParam::Null,
                        RpcParam::Null,
                        RpcParam::Null,
                        RpcParam::Null,
                        RpcParam::Null,
                        RpcParam::StrOption(asset),
                    ]),
                )
                .unwrap();

            let tx = client
                .request::<String>("getrawtransaction", Some(&[RpcParam::Str(&tx)]))
                .unwrap();

            let tx: Transaction = elements::encode::deserialize(&hex::decode(tx).unwrap()).unwrap();

            let vout_index = tx
                .output
                .iter()
                .position(|output| output.script_pubkey == address.script_pubkey())
                .unwrap();

            if let Some(expect_blinded) = expect_blinded {
                if verify_output_blinded(&tx, vout_index, expect_blinded) {
                    return (tx, vout_index);
                }
            } else {
                return (tx, vout_index);
            }
        }

        panic!(
            "Failed to create {}blinded output after {} attempts",
            if expect_blinded.unwrap() { "" } else { "un" },
            MAX_BLINDING_RETRIES
        );
    }

    pub fn address_blinding_key(client: &RpcClient, address: String) -> String {
        client
            .request::<String>("dumpblindingkey", Some(&[RpcParam::Str(&address)]))
            .unwrap()
    }

    pub fn send_raw_transaction(client: &RpcClient, tx: &Transaction) -> Txid {
        let res = client
            .request::<String>(
                "sendrawtransaction",
                Some(&[RpcParam::Str(&hex::encode(tx.serialize()))]),
            )
            .unwrap();

        Txid::from_str(&res).unwrap()
    }

    pub fn get_destination(client: &RpcClient, blind: bool, address_type: Option<&str>) -> Address {
        let address = Address::from_str(
            &client
                .request::<String>(
                    "getnewaddress",
                    Some(&[RpcParam::Null, RpcParam::StrOption(address_type)]),
                )
                .unwrap(),
        )
        .unwrap();

        if blind {
            address
        } else {
            // Ditch the blinder
            Address::from_script(&address.script_pubkey(), None, &AddressParams::ELEMENTS).unwrap()
        }
    }

    fn output_amount<C: Verification>(
        secp: &Secp256k1<C>,
        client: &RpcClient,
        address: &Address,
        output: &TxOut,
    ) -> u64 {
        match output.value {
            Value::Explicit(amount) => amount,
            Value::Confidential(_) => {
                output
                    .unblind(
                        secp,
                        SecretKey::from_str(&address_blinding_key(client, address.to_string()))
                            .unwrap(),
                    )
                    .unwrap()
                    .value
            }
            _ => unreachable!(),
        }
    }

    fn fund_taproot<
        C: Signing + Verification,
        T: FnOnce(hash160::Hash, &XOnlyPublicKey, &XOnlyPublicKey, LockTime) -> Tree,
    >(
        secp: &Secp256k1<C>,
        client: &RpcClient,
        lock_time: Option<u32>,
        create_tree: T,
        blind: bool,
    ) -> (Keypair, Tree, TaprootSpendInfo, InputDetail) {
        let mut preimage = [0; 32];
        rand::thread_rng().fill_bytes(&mut preimage);

        let claim_keys = Keypair::new(secp, &mut rand::thread_rng());
        let refund_keys = Keypair::new(secp, &mut rand::thread_rng());

        let tree = create_tree(
            hash160::Hash::hash(&preimage),
            &claim_keys.x_only_public_key().0,
            &refund_keys.x_only_public_key().0,
            LockTime::from_height(lock_time.unwrap_or(10_000)).unwrap(),
        );

        let keys = Keypair::new(secp, &mut rand::thread_rng());
        let tweak = tree
            .build()
            .unwrap()
            .finalize(secp, keys.x_only_public_key().0)
            .unwrap();

        let address = Address::p2tr_tweaked(
            tweak.output_key(),
            if blind { Some(keys.public_key()) } else { None },
            &AddressParams::ELEMENTS,
        );

        mine_block(client);
        let (funding_tx, vout_index) = fund_address(client, &address, None, Some(blind));

        (
            keys,
            tree,
            tweak,
            InputDetail {
                input_type: if let Some(lock_time) = lock_time {
                    InputType::Refund(lock_time)
                } else {
                    InputType::Claim(preimage)
                },
                output_type: OutputType::Taproot(None),
                outpoint: OutPoint::new(funding_tx.txid(), vout_index as u32),
                tx_out: funding_tx.output[vout_index].clone(),
                blinding_key: Some(keys),
                keys: if lock_time.is_none() {
                    claim_keys
                } else {
                    refund_keys
                },
            },
        )
    }

    fn fund_segwit_v0<
        C: Signing + Verification,
        T: FnOnce(hash160::Hash, &PublicKey, &PublicKey, LockTime) -> Script,
    >(
        secp: &Secp256k1<C>,
        client: &RpcClient,
        lock_time: Option<u32>,
        create_script: T,
        blind: bool,
    ) -> (Keypair, InputDetail) {
        let mut preimage = [0; 32];
        rand::thread_rng().fill_bytes(&mut preimage);

        let claim_keys = Keypair::new(secp, &mut rand::thread_rng());
        let refund_keys = Keypair::new(secp, &mut rand::thread_rng());

        let script = create_script(
            hash160::Hash::hash(&preimage),
            &claim_keys.public_key(),
            &refund_keys.public_key(),
            LockTime::from_height(lock_time.unwrap_or(10_000)).unwrap(),
        );

        let blinding_keys = Keypair::new(secp, &mut rand::thread_rng());
        let address = Address::p2wsh(
            &script,
            if blind {
                Some(blinding_keys.public_key())
            } else {
                None
            },
            &AddressParams::ELEMENTS,
        );

        mine_block(client);
        let (funding_tx, vout_index) = fund_address(client, &address, None, Some(blind));

        (
            blinding_keys,
            InputDetail {
                input_type: if let Some(lock_time) = lock_time {
                    InputType::Refund(lock_time)
                } else {
                    InputType::Claim(preimage)
                },
                output_type: OutputType::SegwitV0(script),
                outpoint: OutPoint::new(funding_tx.txid(), vout_index as u32),
                tx_out: funding_tx.output[vout_index].clone(),
                blinding_key: Some(blinding_keys),
                keys: if lock_time.is_none() {
                    claim_keys
                } else {
                    refund_keys
                },
            },
        )
    }

    fn fund_compatibility<
        C: Signing + Verification,
        T: FnOnce(hash160::Hash, &PublicKey, &PublicKey, LockTime) -> Script,
    >(
        secp: &Secp256k1<C>,
        client: &RpcClient,
        lock_time: Option<u32>,
        create_script: T,
        blind: bool,
    ) -> (Keypair, InputDetail) {
        let mut preimage = [0; 32];
        rand::thread_rng().fill_bytes(&mut preimage);

        let claim_keys = Keypair::new(secp, &mut rand::thread_rng());
        let refund_keys = Keypair::new(secp, &mut rand::thread_rng());

        let script = create_script(
            hash160::Hash::hash(&preimage),
            &claim_keys.public_key(),
            &refund_keys.public_key(),
            LockTime::from_height(lock_time.unwrap_or(10_000)).unwrap(),
        );

        let nested_script = Builder::new()
            .push_opcode(OP_PUSHBYTES_0)
            .push_slice(bitcoin::hashes::sha256::Hash::hash(script.as_bytes()).as_byte_array());

        let blinding_keys = Keypair::new(secp, &mut rand::thread_rng());
        let address = Address::p2sh(
            &nested_script.into_script(),
            if blind {
                Some(blinding_keys.public_key())
            } else {
                None
            },
            &AddressParams::ELEMENTS,
        );

        mine_block(client);
        let (funding_tx, vout_index) = fund_address(client, &address, None, Some(blind));

        (
            blinding_keys,
            InputDetail {
                input_type: if let Some(lock_time) = lock_time {
                    InputType::Refund(lock_time)
                } else {
                    InputType::Claim(preimage)
                },
                output_type: OutputType::Compatibility(script),
                outpoint: OutPoint::new(funding_tx.txid(), vout_index as u32),
                tx_out: funding_tx.output[vout_index].clone(),
                blinding_key: Some(blinding_keys),
                keys: if lock_time.is_none() {
                    claim_keys
                } else {
                    refund_keys
                },
            },
        )
    }

    fn fund_legacy<
        C: Signing + Verification,
        T: FnOnce(hash160::Hash, &PublicKey, &PublicKey, LockTime) -> Script,
    >(
        secp: &Secp256k1<C>,
        client: &RpcClient,
        lock_time: Option<u32>,
        create_script: T,
        blind: bool,
    ) -> (Keypair, InputDetail) {
        let mut preimage = [0; 32];
        rand::thread_rng().fill_bytes(&mut preimage);

        let claim_keys = Keypair::new(secp, &mut rand::thread_rng());
        let refund_keys = Keypair::new(secp, &mut rand::thread_rng());

        let script = create_script(
            hash160::Hash::hash(&preimage),
            &claim_keys.public_key(),
            &refund_keys.public_key(),
            LockTime::from_height(lock_time.unwrap_or(10_000)).unwrap(),
        );

        let blinding_keys = Keypair::new(secp, &mut rand::thread_rng());
        let address = Address::p2sh(
            &script,
            if blind {
                Some(blinding_keys.public_key())
            } else {
                None
            },
            &AddressParams::ELEMENTS,
        );

        mine_block(client);
        let (funding_tx, vout_index) = fund_address(client, &address, None, Some(blind));

        (
            blinding_keys,
            InputDetail {
                input_type: if let Some(lock_time) = lock_time {
                    InputType::Refund(lock_time)
                } else {
                    InputType::Claim(preimage)
                },
                output_type: OutputType::Legacy(script),
                outpoint: OutPoint::new(funding_tx.txid(), vout_index as u32),
                tx_out: funding_tx.output[vout_index].clone(),
                blinding_key: Some(blinding_keys),
                keys: if lock_time.is_none() {
                    claim_keys
                } else {
                    refund_keys
                },
            },
        )
    }

    #[rstest]
    #[case::swap_tree_blinded(swap_tree, true, true)]
    #[case::swap_tree_unblinded(swap_tree, false, false)]
    #[case::swap_tree_unblinded_input(swap_tree, false, true)]
    #[case::swap_tree_unblinded_output(swap_tree, true, false)]
    #[case::reverse_tree_blinded(reverse_tree_without_covenant, true, true)]
    #[case::reverse_tree_unblinded(reverse_tree_without_covenant, false, false)]
    #[case::reverse_tree_unblinded_input(reverse_tree_without_covenant, false, true)]
    #[case::reverse_tree_unblinded_output(reverse_tree_without_covenant, true, false)]
    #[serial(Elements)]
    fn test_taproot_claim_cooperative(
        #[case] create_tree: impl FnOnce(
            hash160::Hash,
            &XOnlyPublicKey,
            &XOnlyPublicKey,
            LockTime,
        ) -> Tree,
        #[case] blind_input: bool,
        #[case] blind_output: bool,
    ) {
        let client = RpcClient::new_elements_regtest();
        let secp = Secp256k1::new();
        let (keys, _, tweak, input) = fund_taproot(&secp, &client, None, create_tree, blind_input);

        let destination = get_destination(&client, blind_output, None);

        let fee = 100;
        let (mut tx, _) = construct_tx(
            &secp,
            get_genesis_hash(&client),
            vec![input.clone()],
            &Destination::Single(&destination),
            FeeTarget::Absolute(fee),
        )
        .unwrap();

        let has_dummy_output = blind_input && !blind_output;
        assert_eq!(tx.output.len(), if has_dummy_output { 3 } else { 2 });
        assert_eq!(
            tx.output[if has_dummy_output { 1 } else { 0 }].script_pubkey,
            destination.script_pubkey()
        );
        assert_eq!(
            tx.output[if has_dummy_output { 2 } else { 1 }].value,
            Value::Explicit(fee)
        );

        let sighash = SighashCache::new(&tx)
            .taproot_key_spend_signature_hash(
                0,
                &Prevouts::All(std::slice::from_ref(&input.tx_out)),
                SIGHASH_TYPE_TAPROOT,
                get_genesis_hash(&client),
            )
            .unwrap();

        let keys = keys
            .add_xonly_tweak(&secp, &tweak.tap_tweak().to_scalar())
            .unwrap();

        let sig = SchnorrSig {
            hash_ty: SIGHASH_TYPE_TAPROOT,
            sig: secp.sign_schnorr(
                &Message::from_digest_slice(sighash.as_raw_hash().as_ref()).unwrap(),
                &keys,
            ),
        };

        let mut witness = Witness::new();
        witness.push(sig.serialize());

        tx.input[0].witness.script_witness = witness.to_vec();

        let broadcast = send_raw_transaction(&client, &tx);
        assert_eq!(broadcast, tx.txid());
    }

    #[rstest]
    #[case::swap_tree_blinded(swap_tree, true, true)]
    #[case::swap_tree_unblinded(swap_tree, false, false)]
    #[case::swap_tree_unblinded_input(swap_tree, false, true)]
    #[case::swap_tree_unblinded_output(swap_tree, true, false)]
    #[case::reverse_tree_blinded(reverse_tree_without_covenant, true, true)]
    #[case::reverse_tree_unblinded(reverse_tree_without_covenant, false, false)]
    #[case::reverse_tree_unblinded_input(reverse_tree_without_covenant, false, true)]
    #[case::reverse_tree_unblinded_output(reverse_tree_without_covenant, true, false)]
    #[serial(Elements)]
    fn test_taproot_claim_uncooperative(
        #[case] create_tree: impl FnOnce(
            hash160::Hash,
            &XOnlyPublicKey,
            &XOnlyPublicKey,
            LockTime,
        ) -> Tree,
        #[case] blind_input: bool,
        #[case] blind_output: bool,
    ) {
        let client = RpcClient::new_elements_regtest();
        let secp = Secp256k1::new();
        let (keys, tree, _, mut input) =
            fund_taproot(&secp, &client, None, create_tree, blind_input);

        input.output_type = OutputType::Taproot(Some(UncooperativeDetails {
            tree,
            internal_key: keys.x_only_public_key().0,
        }));

        let destination = get_destination(&client, blind_output, None);

        let fee = 100;
        let (tx, _) = construct_tx(
            &secp,
            get_genesis_hash(&client),
            vec![input.clone()],
            &Destination::Single(&destination),
            FeeTarget::Absolute(fee),
        )
        .unwrap();

        let InputType::Claim(expected_preimage) = input.input_type else {
            unreachable!()
        };
        assert_eq!(
            detect_preimage(
                &tx.input[0],
                bitcoin::hashes::sha256::Hash::hash(&expected_preimage).as_byte_array(),
            )
            .unwrap(),
            expected_preimage,
        );

        let broadcast = send_raw_transaction(&client, &tx);
        assert_eq!(broadcast, tx.txid());
    }

    #[rstest]
    #[case::swap_tree_blinded(swap_tree, true, true)]
    #[case::swap_tree_unblinded(swap_tree, false, false)]
    #[case::swap_tree_unblinded_input(swap_tree, false, true)]
    #[case::swap_tree_unblinded_output(swap_tree, true, false)]
    #[case::reverse_tree_blinded(reverse_tree_without_covenant, true, true)]
    #[case::reverse_tree_unblinded(reverse_tree_without_covenant, false, false)]
    #[case::reverse_tree_unblinded_input(reverse_tree_without_covenant, false, true)]
    #[case::reverse_tree_unblinded_output(reverse_tree_without_covenant, true, false)]
    #[serial(Elements)]
    fn test_taproot_refund_uncooperative(
        #[case] create_tree: impl FnOnce(
            hash160::Hash,
            &XOnlyPublicKey,
            &XOnlyPublicKey,
            LockTime,
        ) -> Tree,
        #[case] blind_input: bool,
        #[case] blind_output: bool,
    ) {
        let client = RpcClient::new_elements_regtest();
        let secp = Secp256k1::new();
        let (keys, tree, _, mut input) = fund_taproot(
            &secp,
            &client,
            Some(get_block_height(&client)),
            create_tree,
            blind_input,
        );

        input.output_type = OutputType::Taproot(Some(UncooperativeDetails {
            tree,
            internal_key: keys.x_only_public_key().0,
        }));

        let destination = get_destination(&client, blind_output, None);

        let fee = 100;
        let (tx, _) = construct_tx(
            &secp,
            get_genesis_hash(&client),
            vec![input.clone()],
            &Destination::Single(&destination),
            FeeTarget::Absolute(fee),
        )
        .unwrap();

        let broadcast = send_raw_transaction(&client, &tx);
        assert_eq!(broadcast, tx.txid());
    }

    #[rstest]
    #[case::swap_script_blinded(swap_script, true, true)]
    #[case::swap_script_unblinded(swap_script, false, false)]
    #[case::swap_script_unblinded_input(swap_script, false, true)]
    #[case::swap_script_unblinded_output(swap_script, true, false)]
    #[case::reverse_script_blinded(reverse_script, true, true)]
    #[case::reverse_script_unblinded(reverse_script, false, false)]
    #[case::reverse_script_unblinded_input(reverse_script, false, true)]
    #[case::reverse_script_unblinded_output(reverse_script, true, false)]
    #[serial(Elements)]
    fn test_segwit_v0_claim(
        #[case] create_script: impl FnOnce(hash160::Hash, &PublicKey, &PublicKey, LockTime) -> Script,
        #[case] blind_input: bool,
        #[case] blind_output: bool,
    ) {
        let client = RpcClient::new_elements_regtest();
        let secp = Secp256k1::new();
        let (_, input) = fund_segwit_v0(&secp, &client, None, create_script, blind_input);

        let destination = get_destination(&client, blind_output, None);

        let fee = 100;
        let (tx, _) = construct_tx(
            &secp,
            get_genesis_hash(&client),
            vec![input.clone()],
            &Destination::Single(&destination),
            FeeTarget::Absolute(fee),
        )
        .unwrap();

        let InputType::Claim(expected_preimage) = input.input_type else {
            unreachable!()
        };
        assert_eq!(
            detect_preimage(
                &tx.input[0],
                bitcoin::hashes::sha256::Hash::hash(&expected_preimage).as_byte_array(),
            )
            .unwrap(),
            expected_preimage,
        );

        let broadcast = send_raw_transaction(&client, &tx);
        assert_eq!(broadcast, tx.txid());
    }

    #[rstest]
    #[case::swap_script_blinded(swap_script, true, true)]
    #[case::swap_script_unblinded(swap_script, false, false)]
    #[case::swap_script_unblinded_input(swap_script, false, true)]
    #[case::swap_script_unblinded_output(swap_script, true, false)]
    #[case::reverse_script_blinded(reverse_script, true, true)]
    #[case::reverse_script_unblinded(reverse_script, false, false)]
    #[case::reverse_script_unblinded_input(reverse_script, false, true)]
    #[case::reverse_script_unblinded_output(reverse_script, true, false)]
    #[serial(Elements)]
    fn test_segwit_v0_refund(
        #[case] create_script: impl FnOnce(hash160::Hash, &PublicKey, &PublicKey, LockTime) -> Script,
        #[case] blind_input: bool,
        #[case] blind_output: bool,
    ) {
        let client = RpcClient::new_elements_regtest();
        let secp = Secp256k1::new();
        let (_, input) = fund_segwit_v0(
            &secp,
            &client,
            Some(get_block_height(&client)),
            create_script,
            blind_input,
        );

        let destination = get_destination(&client, blind_output, None);

        let fee = 100;
        let (tx, _) = construct_tx(
            &secp,
            get_genesis_hash(&client),
            vec![input.clone()],
            &Destination::Single(&destination),
            FeeTarget::Absolute(fee),
        )
        .unwrap();

        let broadcast = send_raw_transaction(&client, &tx);
        assert_eq!(broadcast, tx.txid());
    }

    #[rstest]
    #[case::swap_script_blinded(swap_script, true, true)]
    #[case::swap_script_unblinded(swap_script, false, false)]
    #[case::swap_script_unblinded_input(swap_script, false, true)]
    #[case::swap_script_unblinded_output(swap_script, true, false)]
    #[case::reverse_script_blinded(reverse_script, true, true)]
    #[case::reverse_script_unblinded(reverse_script, false, false)]
    #[case::reverse_script_unblinded_input(reverse_script, false, true)]
    #[case::reverse_script_unblinded_output(reverse_script, true, false)]
    #[serial(Elements)]
    fn test_compatibility_claim(
        #[case] create_script: impl FnOnce(hash160::Hash, &PublicKey, &PublicKey, LockTime) -> Script,
        #[case] blind_input: bool,
        #[case] blind_output: bool,
    ) {
        let client = RpcClient::new_elements_regtest();
        let secp = Secp256k1::new();
        let (_, input) = fund_compatibility(&secp, &client, None, create_script, blind_input);

        let destination = get_destination(&client, blind_output, None);

        let fee = 100;
        let (tx, _) = construct_tx(
            &secp,
            get_genesis_hash(&client),
            vec![input.clone()],
            &Destination::Single(&destination),
            FeeTarget::Absolute(fee),
        )
        .unwrap();

        let InputType::Claim(expected_preimage) = input.input_type else {
            unreachable!()
        };
        assert_eq!(
            detect_preimage(
                &tx.input[0],
                bitcoin::hashes::sha256::Hash::hash(&expected_preimage).as_byte_array(),
            )
            .unwrap(),
            expected_preimage,
        );

        let broadcast = send_raw_transaction(&client, &tx);
        assert_eq!(broadcast, tx.txid());
    }

    #[rstest]
    #[case::swap_script_blinded(swap_script, true, true)]
    #[case::swap_script_unblinded(swap_script, false, false)]
    #[case::swap_script_unblinded_input(swap_script, false, true)]
    #[case::swap_script_unblinded_output(swap_script, true, false)]
    #[case::reverse_script_blinded(reverse_script, true, true)]
    #[case::reverse_script_unblinded(reverse_script, false, false)]
    #[case::reverse_script_unblinded_input(reverse_script, false, true)]
    #[case::reverse_script_unblinded_output(reverse_script, true, false)]
    #[serial(Elements)]
    fn test_compatibility_refund(
        #[case] create_script: impl FnOnce(hash160::Hash, &PublicKey, &PublicKey, LockTime) -> Script,
        #[case] blind_input: bool,
        #[case] blind_output: bool,
    ) {
        let client = RpcClient::new_elements_regtest();
        let secp = Secp256k1::new();
        let (_, input) = fund_compatibility(
            &secp,
            &client,
            Some(get_block_height(&client)),
            create_script,
            blind_input,
        );

        let destination = get_destination(&client, blind_output, None);

        let fee = 100;
        let (tx, _) = construct_tx(
            &secp,
            get_genesis_hash(&client),
            vec![input.clone()],
            &Destination::Single(&destination),
            FeeTarget::Absolute(fee),
        )
        .unwrap();

        let broadcast = send_raw_transaction(&client, &tx);
        assert_eq!(broadcast, tx.txid());
    }

    #[rstest]
    #[case::swap_script_blinded(swap_script, true, true)]
    #[case::swap_script_unblinded(swap_script, false, false)]
    #[case::swap_script_unblinded_input(swap_script, false, true)]
    #[case::swap_script_unblinded_output(swap_script, true, false)]
    #[case::reverse_script_blinded(reverse_script, true, true)]
    #[case::reverse_script_unblinded(reverse_script, false, false)]
    #[case::reverse_script_unblinded_input(reverse_script, false, true)]
    #[case::reverse_script_unblinded_output(reverse_script, true, false)]
    #[serial(Elements)]
    fn test_legacy_claim(
        #[case] create_script: impl FnOnce(hash160::Hash, &PublicKey, &PublicKey, LockTime) -> Script,
        #[case] blind_input: bool,
        #[case] blind_output: bool,
    ) {
        let client = RpcClient::new_elements_regtest();
        let secp = Secp256k1::new();
        let (_, input) = fund_legacy(&secp, &client, None, create_script, blind_input);

        let destination = get_destination(&client, blind_output, None);

        let fee = 100;
        let (tx, _) = construct_tx(
            &secp,
            get_genesis_hash(&client),
            vec![input.clone()],
            &Destination::Single(&destination),
            FeeTarget::Absolute(fee),
        )
        .unwrap();

        let InputType::Claim(expected_preimage) = input.input_type else {
            unreachable!()
        };
        assert_eq!(
            detect_preimage(
                &tx.input[0],
                bitcoin::hashes::sha256::Hash::hash(&expected_preimage).as_byte_array(),
            )
            .unwrap(),
            expected_preimage,
        );

        let broadcast = send_raw_transaction(&client, &tx);
        assert_eq!(broadcast, tx.txid());
    }

    #[rstest]
    #[case::swap_script_blinded(swap_script, true, true)]
    #[case::swap_script_unblinded(swap_script, false, false)]
    #[case::swap_script_unblinded_input(swap_script, false, true)]
    #[case::swap_script_unblinded_output(swap_script, true, false)]
    #[case::reverse_script_blinded(reverse_script, true, true)]
    #[case::reverse_script_unblinded(reverse_script, false, false)]
    #[case::reverse_script_unblinded_input(reverse_script, false, true)]
    #[case::reverse_script_unblinded_output(reverse_script, true, false)]
    #[serial(Elements)]
    fn test_legacy_refund(
        #[case] create_script: impl FnOnce(hash160::Hash, &PublicKey, &PublicKey, LockTime) -> Script,
        #[case] blind_input: bool,
        #[case] blind_output: bool,
    ) {
        let client = RpcClient::new_elements_regtest();
        let secp = Secp256k1::new();
        let (_, input) = fund_legacy(
            &secp,
            &client,
            Some(get_block_height(&client)),
            create_script,
            blind_input,
        );

        let destination = get_destination(&client, blind_output, None);

        let fee = 100;
        let (tx, _) = construct_tx(
            &secp,
            get_genesis_hash(&client),
            vec![input.clone()],
            &Destination::Single(&destination),
            FeeTarget::Absolute(fee),
        )
        .unwrap();

        let broadcast = send_raw_transaction(&client, &tx);
        assert_eq!(broadcast, tx.txid());
    }

    #[rstest]
    #[case::blinded(true, true)]
    #[case::unblinded(false, false)]
    #[case::unblinded_inputs(false, true)]
    #[case::unblinded_output(true, false)]
    #[serial(Elements)]
    fn test_multiple_inputs(#[case] blind_input: bool, #[case] blind_output: bool) {
        let client = RpcClient::new_elements_regtest();
        let secp = Secp256k1::new();

        let mut inputs = Vec::new();

        let (keys, tree, _, mut input) = fund_taproot(&secp, &client, None, swap_tree, blind_input);
        input.output_type = OutputType::Taproot(Some(UncooperativeDetails {
            tree,
            internal_key: keys.x_only_public_key().0,
        }));
        inputs.push(input);

        let (keys, tree, _, mut input) = fund_taproot(
            &secp,
            &client,
            None,
            reverse_tree_without_covenant,
            blind_input,
        );
        input.output_type = OutputType::Taproot(Some(UncooperativeDetails {
            tree,
            internal_key: keys.x_only_public_key().0,
        }));
        inputs.push(input);

        inputs.push(fund_segwit_v0(&secp, &client, None, swap_script, blind_input).1);
        inputs.push(fund_segwit_v0(&secp, &client, None, reverse_script, blind_input).1);
        inputs.push(fund_compatibility(&secp, &client, None, swap_script, blind_input).1);
        inputs.push(fund_compatibility(&secp, &client, None, reverse_script, blind_input).1);
        inputs.push(fund_legacy(&secp, &client, None, swap_script, blind_input).1);
        inputs.push(fund_legacy(&secp, &client, None, reverse_script, blind_input).1);

        let destination = get_destination(&client, blind_output, None);

        let fee = 4.0;
        let (tx, _) = construct_tx(
            &secp,
            get_genesis_hash(&client),
            inputs.clone(),
            &Destination::Single(&destination),
            FeeTarget::Relative(fee),
        )
        .unwrap();

        let has_dummy_output = blind_input && !blind_output;
        assert_eq!(tx.output.len(), if has_dummy_output { 3 } else { 2 });
        assert_within_one_percent(
            tx.output[if has_dummy_output { 2 } else { 1 }]
                .value
                .explicit()
                .unwrap(),
            fee as u64 * (tx.discount_vsize() as u64 + inputs.len() as u64),
        );

        let broadcast = send_raw_transaction(&client, &tx);
        assert_eq!(broadcast, tx.txid());
    }

    #[rstest]
    #[case::blinded_output(true)]
    #[case::unblinded_output(false)]
    #[serial(Elements)]
    fn test_multiple_mixed_inputs(#[case] blind_output: bool) {
        let client = RpcClient::new_elements_regtest();
        let secp = Secp256k1::new();

        let mut inputs = Vec::new();

        let (keys, tree, _, mut input) = fund_taproot(&secp, &client, None, swap_tree, true);
        input.output_type = OutputType::Taproot(Some(UncooperativeDetails {
            tree,
            internal_key: keys.x_only_public_key().0,
        }));
        inputs.push(input);

        let (keys, tree, _, mut input) =
            fund_taproot(&secp, &client, None, reverse_tree_without_covenant, false);
        input.output_type = OutputType::Taproot(Some(UncooperativeDetails {
            tree,
            internal_key: keys.x_only_public_key().0,
        }));
        inputs.push(input);

        inputs.push(fund_segwit_v0(&secp, &client, None, swap_script, true).1);
        inputs.push(fund_segwit_v0(&secp, &client, None, reverse_script, false).1);
        inputs.push(fund_compatibility(&secp, &client, None, swap_script, true).1);
        inputs.push(fund_compatibility(&secp, &client, None, reverse_script, false).1);
        inputs.push(fund_legacy(&secp, &client, None, swap_script, true).1);
        inputs.push(fund_legacy(&secp, &client, None, reverse_script, false).1);

        let destination = get_destination(&client, blind_output, None);

        let fee = 4.0;
        let (tx, _) = construct_tx(
            &secp,
            get_genesis_hash(&client),
            inputs.clone(),
            &Destination::Single(&destination),
            FeeTarget::Relative(fee),
        )
        .unwrap();

        assert_eq!(tx.output.len(), if blind_output { 2 } else { 3 });
        assert_within_one_percent(
            tx.output[if blind_output { 1 } else { 2 }]
                .value
                .explicit()
                .unwrap(),
            fee as u64 * (tx.discount_vsize() as u64 + inputs.len() as u64),
        );

        let broadcast = send_raw_transaction(&client, &tx);
        assert_eq!(broadcast, tx.txid());
    }

    #[rstest]
    #[case::blinded(true, true)]
    #[case::unblinded(false, false)]
    #[case::unblinded_inputs(false, true)]
    #[case::unblinded_output(true, false)]
    #[serial(Elements)]
    fn test_multiple_outputs(#[case] blind_input: bool, #[case] blind_output: bool) {
        let client = RpcClient::new_elements_regtest();
        let secp = Secp256k1::new();

        let mut inputs = Vec::new();

        let (keys, tree, _, mut input) = fund_taproot(&secp, &client, None, swap_tree, blind_input);
        input.output_type = OutputType::Taproot(Some(UncooperativeDetails {
            tree,
            internal_key: keys.x_only_public_key().0,
        }));
        inputs.push(input);

        inputs.push(fund_segwit_v0(&secp, &client, None, swap_script, blind_input).1);

        let change = get_destination(&client, blind_output, None);
        let outputs = [
            (&get_destination(&client, blind_output, None), 21_000),
            (&get_destination(&client, blind_output, None), 12_123),
        ];

        let fee = 500;
        let (tx, _) = construct_tx(
            &secp,
            get_genesis_hash(&client),
            inputs.clone(),
            &Destination::Multiple(Outputs {
                change: &change,
                outputs: &outputs,
            }),
            FeeTarget::Absolute(fee),
        )
        .unwrap();

        let dummy_output = blind_input && !blind_output;

        assert_eq!(
            tx.output.len(),
            outputs.len() + if dummy_output { 3 } else { 2 }
        );

        // BIP69 sorts non-fee outputs by (amount asc, scriptPubKey bytes asc):
        // dummy(1) < outputs[1](12_123) < outputs[0](21_000) < change. The fee output
        // remains last by Elements consensus.
        let small_idx = if dummy_output { 1 } else { 0 };
        let large_idx = if dummy_output { 2 } else { 1 };
        let change_idx = if dummy_output { 3 } else { 2 };
        let fee_idx = if dummy_output { 4 } else { 3 };

        assert_eq!(
            tx.output[small_idx].script_pubkey,
            outputs[1].0.script_pubkey()
        );
        assert_eq!(
            output_amount(&secp, &client, outputs[1].0, &tx.output[small_idx]),
            outputs[1].1
        );

        assert_eq!(
            tx.output[large_idx].script_pubkey,
            outputs[0].0.script_pubkey()
        );
        assert_eq!(
            output_amount(&secp, &client, outputs[0].0, &tx.output[large_idx]),
            outputs[0].1
        );

        assert_eq!(tx.output[change_idx].script_pubkey, change.script_pubkey());
        assert_eq!(
            output_amount(&secp, &client, &change, &tx.output[change_idx]),
            (FUNDING_AMOUNT * inputs.len() as u64)
                - outputs[0].1
                - outputs[1].1
                - fee
                - if dummy_output {
                    DUMMY_BLINDED_OUTPUT
                } else {
                    0
                }
        );

        assert!(tx.output[fee_idx].is_fee());
        assert_eq!(tx.output[fee_idx].value, Value::Explicit(fee));

        assert_eq!(send_raw_transaction(&client, &tx), tx.txid());
    }

    #[test]
    fn test_construct_tx_empty_inputs() {
        let secp = Secp256k1::new();
        let address = Address::from_str("el1qqvhpw75zjc2hhvk9g0cgv3e75azcct4sduxdv9rwpzxauwmw46chnlxjjwhk0jw2fny2jpgp8etz8j6wsqd7qk89rmtyucc52").unwrap();

        let result = construct_tx(
            &secp,
            BlockHash::all_zeros(),
            Vec::new(),
            &Destination::Single(&address),
            FeeTarget::Absolute(0),
        );

        assert!(matches!(result.unwrap_err(), TxError::EmptyInputs));
    }

    #[test]
    fn test_unblind_outputs_asset_consistency() {
        use elements::secp256k1_zkp::{Generator, RangeProof};

        let secp = Secp256k1::new();

        let keys = Keypair::new(&secp, &mut rand::thread_rng());
        let blinding = Keypair::new(&secp, &mut rand::thread_rng());

        let lbtc = AssetId::from_slice(&[1u8; 32]).unwrap();
        let worthless = AssetId::from_slice(&[2u8; 32]).unwrap();
        let amount = 100_000u64;
        let script_pubkey = Script::new();

        let build = |committed_asset: AssetId, message_asset: AssetId| -> InputDetail {
            let asset_bf = AssetBlindingFactor::new(&mut rand::thread_rng());
            let value_bf = ValueBlindingFactor::new(&mut rand::thread_rng());

            let asset_gen =
                Generator::new_blinded(&secp, committed_asset.into_tag(), asset_bf.into_inner());
            let value_commitment = Value::new_confidential(&secp, amount, asset_gen, value_bf);

            let (nonce, shared_secret) = Nonce::with_ephemeral_sk(
                &secp,
                SecretKey::new(&mut rand::thread_rng()),
                &blinding.public_key(),
            );

            let rangeproof = RangeProof::new(
                &secp,
                TxOut::RANGEPROOF_MIN_VALUE,
                value_commitment.commitment().unwrap(),
                amount,
                value_bf.into_inner(),
                &RangeProofMessage {
                    asset: message_asset,
                    bf: asset_bf,
                }
                .to_bytes(),
                script_pubkey.as_bytes(),
                shared_secret,
                TxOut::RANGEPROOF_EXP_SHIFT,
                TxOut::RANGEPROOF_MIN_PRIV_BITS,
                asset_gen,
            )
            .unwrap();

            InputDetail {
                input_type: InputType::Claim([0; 32]),
                output_type: OutputType::Taproot(None),
                outpoint: OutPoint::default(),
                tx_out: TxOut {
                    asset: Asset::Confidential(asset_gen),
                    value: value_commitment,
                    script_pubkey: script_pubkey.clone(),
                    nonce,
                    witness: TxOutWitness {
                        surjection_proof: None,
                        rangeproof: Some(Box::new(rangeproof)),
                    },
                },
                blinding_key: Some(blinding),
                keys,
            }
        };

        let genuine = unblind_outputs(&secp, &[build(lbtc, lbtc)]).unwrap();
        match &genuine[0] {
            UnblindedOutput::Unblinded(secrets) => {
                assert_eq!(secrets.asset, lbtc);
                assert_eq!(secrets.value, amount);
            }
            _ => panic!("expected unblinded output"),
        }

        let forged = unblind_outputs(&secp, &[build(worthless, lbtc)]);
        assert!(matches!(forged.unwrap_err(), TxError::Unblind(_)));
    }

    #[test]
    fn test_blind_outputs_fee_too_high() {
        let secp = Secp256k1::new();
        let address = Address::from_str("el1qqvhpw75zjc2hhvk9g0cgv3e75azcct4sduxdv9rwpzxauwmw46chnlxjjwhk0jw2fny2jpgp8etz8j6wsqd7qk89rmtyucc52").unwrap();

        let asset_id = AssetId::from_slice(&[1u8; 32]).unwrap();

        let amount = 1000;
        let unblinded = [UnblindedOutput::Explicit(ExplicitOutput {
            asset: asset_id,
            amount,
        })];

        let fee = amount + 1;
        let result = blind_outputs(
            &secp,
            &unblinded,
            asset_id,
            &Destination::Single(&address),
            fee,
            false,
        );

        assert!(matches!(result.unwrap_err(), TxError::FeeExceedsInputs));
    }

    #[test]
    fn test_blind_outputs_output_sum_too_high() {
        let secp = Secp256k1::new();
        let change = Address::from_str("el1qqtc467jwn6epm0868exzkpw30w8snldp54k7s3fgv8wwg88va6sjlk4e0xu9syzwd69tru24xf36a5ansq0fu4h9fauf3sqgh").unwrap();
        let dest = Address::from_str("el1qqtc467jwn6epm0868exzkpw30w8snldp54k7s3fgv8wwg88va6sjlk4e0xu9syzwd69tru24xf36a5ansq0fu4h9fauf3sqgh").unwrap();

        let asset_id = AssetId::from_slice(&[1u8; 32]).unwrap();

        let amount = 1000;
        let unblinded = [UnblindedOutput::Explicit(ExplicitOutput {
            asset: asset_id,
            amount,
        })];

        let fee = 100;
        let outputs = [(&dest, amount - fee + 1)];
        let result = blind_outputs(
            &secp,
            &unblinded,
            asset_id,
            &Destination::Multiple(Outputs {
                change: &change,
                outputs: &outputs,
            }),
            fee,
            false,
        );

        assert!(matches!(result.unwrap_err(), TxError::OutputsExceedInputs));
    }

    #[test]
    fn test_bip69_blind_outputs_sort() {
        let secp = Secp256k1::new();
        let asset_id = AssetId::from_slice(&[1u8; 32]).unwrap();

        let change = Address::from_str("el1qqtc467jwn6epm0868exzkpw30w8snldp54k7s3fgv8wwg88va6sjlk4e0xu9syzwd69tru24xf36a5ansq0fu4h9fauf3sqgh").unwrap();
        let change = Address::from_script(
            &change.script_pubkey(),
            None,
            &elements::AddressParams::ELEMENTS,
        )
        .unwrap();
        let dest = Address::from_str("el1qqvhpw75zjc2hhvk9g0cgv3e75azcct4sduxdv9rwpzxauwmw46chnlxjjwhk0jw2fny2jpgp8etz8j6wsqd7qk89rmtyucc52").unwrap();
        let dest = Address::from_script(
            &dest.script_pubkey(),
            None,
            &elements::AddressParams::ELEMENTS,
        )
        .unwrap();

        let unblinded = [UnblindedOutput::Explicit(ExplicitOutput {
            asset: asset_id,
            amount: 1_000_000,
        })];

        let fee = 1_000u64;
        let outputs = [(&dest, 200_000u64), (&dest, 30_000u64)];
        let result = blind_outputs(
            &secp,
            &unblinded,
            asset_id,
            &Destination::Multiple(Outputs {
                change: &change,
                outputs: &outputs,
            }),
            fee,
            false,
        )
        .unwrap();

        let non_fee: Vec<u64> = result
            .iter()
            .take(result.len() - 1)
            .map(|o| o.value.explicit().unwrap())
            .collect();
        let expected_non_fee = [30_000u64, 200_000u64, 1_000_000 - 200_000 - 30_000 - fee];
        assert_eq!(non_fee, expected_non_fee);

        assert!(result.last().unwrap().is_fee());
        assert_eq!(result.last().unwrap().value, Value::Explicit(fee));
    }

    #[test]
    fn test_create_output_fee_estimation() {
        let secp = Secp256k1::new();
        let asset_id = AssetId::from_slice(&[1u8; 32]).unwrap();

        let unblinded = [UnblindedOutput::Explicit(ExplicitOutput {
            asset: asset_id,
            amount: 1000,
        })];

        let asset_bf = AssetBlindingFactor::new(&mut rand::thread_rng());
        let blinding_key = SecretKey::new(&mut rand::thread_rng()).public_key(&secp);
        let script_pubkey = Builder::new().push_opcode(OP_RETURN).into_script();

        let amount = 500;

        // When is_fee_estimation is true, blinding should be skipped
        let (blinded, asset_bf_out, value_bf_out, output) = create_output(
            &secp,
            &unblinded,
            (asset_id, asset_bf),
            &script_pubkey,
            Some(blinding_key),
            amount,
            true,
            None,
        )
        .unwrap();

        assert!(!blinded);
        assert_eq!(asset_bf_out, AssetBlindingFactor::zero());
        assert_eq!(value_bf_out, ValueBlindingFactor::zero());
        assert_eq!(output.value, Value::Explicit(amount));
        assert_eq!(output.asset, Asset::Explicit(asset_id));
    }

    #[test]
    fn test_bip69_input_sort() {
        let secp = Secp256k1::new();
        let asset_id = AssetId::from_slice(&[1u8; 32]).unwrap();

        let destination = Address::from_str("el1qqvhpw75zjc2hhvk9g0cgv3e75azcct4sduxdv9rwpzxauwmw46chnlxjjwhk0jw2fny2jpgp8etz8j6wsqd7qk89rmtyucc52").unwrap();
        let destination =
            Address::from_script(&destination.script_pubkey(), None, &AddressParams::ELEMENTS)
                .unwrap();

        // BIP69 input examples from transaction
        // 0a6a357e2f7796444e02638749d9611c008b253fb55f5dc88b739b230ed0c4c3.
        let bip69_input_vector = [
            (
                "0e53ec5dfb2cb8a71fec32dc9a634a35b7e24799295ddd5278217822e0b31f57",
                0,
            ),
            (
                "26aa6e6d8b9e49bb0630aac301db6757c02e3619feb4ee0eea81eb1672947024",
                1,
            ),
            (
                "28e0fdd185542f2c6ea19030b0796051e7772b6026dd5ddccd7a2f93b73e6fc2",
                0,
            ),
            (
                "381de9b9ae1a94d9c17f6a08ef9d341a5ce29e2e60c36a52d333ff6203e58d5d",
                1,
            ),
            (
                "3b8b2f8efceb60ba78ca8bba206a137f14cb5ea4035e761ee204302d46b98de2",
                0,
            ),
            (
                "402b2c02411720bf409eff60d05adad684f135838962823f3614cc657dd7bc0a",
                1,
            ),
            (
                "54ffff182965ed0957dba1239c27164ace5a73c9b62a660c74b7b7f15ff61e7a",
                1,
            ),
            (
                "643e5f4e66373a57251fb173151e838ccd27d279aca882997e005016bb53d5aa",
                0,
            ),
            (
                "6c1d56f31b2de4bfc6aaea28396b333102b1f600da9c6d6149e96ca43f1102b1",
                1,
            ),
            (
                "7a1de137cbafb5c70405455c49c5104ca3057a1f1243e6563bb9245c9c88c191",
                0,
            ),
            (
                "7d037ceb2ee0dc03e82f17be7935d238b35d1deabf953a892a4507bfbeeb3ba4",
                1,
            ),
            (
                "a5e899dddb28776ea9ddac0a502316d53a4a3fca607c72f66c470e0412e34086",
                0,
            ),
            (
                "b4112b8f900a7ca0c8b0e7c4dfad35c6be5f6be46b3458974988e1cdb2fa61b8",
                0,
            ),
            (
                "bafd65e3c7f3f9fdfdc1ddb026131b278c3be1af90a4a6ffa78c4658f9ec0c85",
                0,
            ),
            (
                "de0411a1e97484a2804ff1dbde260ac19de841bebad1880c782941aca883b4e9",
                1,
            ),
            (
                "f0a130a84912d03c1d284974f563c5949ac13f8342b8112edff52971599e6a45",
                0,
            ),
            (
                "f320832a9d2e2452af63154bc687493484a0e7745ebd3aaf9ca19eb80834ad60",
                0,
            ),
        ];
        // BIP69 equal-txid tie-breaker example from transaction
        // 28204cad1d7fc1d199e8ef4fa22f182de6258a3eaafe1bbe56ebdcacd3069a5f.
        let bip69_tie_breaker_txid =
            Txid::from_str("35288d269cee1941eaebb2ea85e32b42cdb2b04284a56d8b14dcc3f5c65d6055")
                .unwrap();

        let keys = Keypair::new(&secp, &mut rand::thread_rng());
        let make_input = |txid: Txid, vout: u32| InputDetail {
            input_type: InputType::Claim([0; 32]),
            output_type: OutputType::Taproot(None),
            outpoint: OutPoint::new(txid, vout),
            tx_out: TxOut {
                asset: Asset::Explicit(asset_id),
                value: Value::Explicit(50_000),
                script_pubkey: destination.script_pubkey(),
                nonce: Nonce::Null,
                witness: TxOutWitness::default(),
            },
            blinding_key: None,
            keys,
        };

        let expected_order: Vec<_> = bip69_input_vector
            .iter()
            .map(|(txid, vout)| OutPoint::new(Txid::from_str(txid).unwrap(), *vout))
            .collect();

        let inputs = bip69_input_vector
            .iter()
            .rev()
            .map(|(txid, vout)| make_input(Txid::from_str(txid).unwrap(), *vout))
            .collect();

        let (tx, _) = construct_tx(
            &secp,
            BlockHash::all_zeros(),
            inputs,
            &Destination::Single(&destination),
            FeeTarget::Absolute(1_000),
        )
        .unwrap();

        let actual_order: Vec<_> = tx.input.iter().map(|i| i.previous_output).collect();
        assert_eq!(actual_order, expected_order);

        let tie_breaker_inputs = vec![
            make_input(bip69_tie_breaker_txid, 1),
            make_input(bip69_tie_breaker_txid, 0),
        ];

        let (tx, _) = construct_tx(
            &secp,
            BlockHash::all_zeros(),
            tie_breaker_inputs,
            &Destination::Single(&destination),
            FeeTarget::Absolute(1_000),
        )
        .unwrap();

        let expected_order = [
            OutPoint::new(bip69_tie_breaker_txid, 0),
            OutPoint::new(bip69_tie_breaker_txid, 1),
        ];
        let actual_order: Vec<_> = tx.input.iter().map(|i| i.previous_output).collect();
        assert_eq!(actual_order, expected_order);
    }
}

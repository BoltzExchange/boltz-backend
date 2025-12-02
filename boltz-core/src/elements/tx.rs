use crate::{
    consts::{ECDSA_BYTES_TO_GRIND, PREIMAGE_DUMMY, STUB_SCHNORR_SIGNATURE_LENGTH},
    elements::InputDetail,
    target_fee::{FeeTarget, target_fee},
    utils::{Destination, InputType, OutputType},
};
use anyhow::Result;
use bitcoin::Witness;
use elements::{
    Address, AssetId, BlockHash, EcdsaSighashType, LockTime, RangeProofMessage, SchnorrSig,
    SchnorrSighashType, Script, Sequence, Sighash, SurjectionInput, Transaction, TxIn, TxOut,
    TxOutSecrets, TxOutWitness,
    confidential::{Asset, AssetBlindingFactor, Nonce, Value, ValueBlindingFactor},
    hashes::{Hash, sha256},
    opcodes::all::{OP_PUSHBYTES_0, OP_RETURN},
    pset::serialize::Serialize,
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

#[derive(Debug, Copy, Clone)]
pub struct ExplicitOutput {
    pub asset: AssetId,
    pub amount: u64,
}

#[derive(Debug, Copy, Clone)]
pub enum UnblindedOutput {
    Unblinded(TxOutSecrets),
    Explicit(ExplicitOutput),
}

impl UnblindedOutput {
    pub fn amount(&self) -> u64 {
        match self {
            UnblindedOutput::Unblinded(sec) => sec.value,
            UnblindedOutput::Explicit(out) => out.amount,
        }
    }

    pub fn asset(&self) -> AssetId {
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

pub fn construct_tx<C: Signing + Verification>(
    secp: &Secp256k1<C>,
    genesis_hash: BlockHash,
    inputs: &[&InputDetail],
    destination: &Destination<&Address>,
    fee: FeeTarget,
) -> Result<(Transaction, u64)> {
    let unblinded = unblind_outputs(secp, inputs)?;
    if !unblinded
        .iter()
        .all(|input| input.asset() == unblinded[0].asset())
    {
        return Err(anyhow::anyhow!("all inputs must have the same asset"));
    }

    target_fee(fee, |fee, is_fee_estimation| {
        construct_raw(
            secp,
            genesis_hash,
            inputs,
            &unblinded,
            destination,
            fee,
            is_fee_estimation,
        )
    })
}

// TODO: claim covenant support

fn construct_raw<C: Signing + Verification>(
    secp: &Secp256k1<C>,
    genesis_hash: BlockHash,
    inputs: &[&InputDetail],
    unblinded: &[UnblindedOutput],
    destination: &Destination<&Address>,
    fee: u64,
    is_fee_estimation: bool,
) -> Result<Transaction> {
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
        output: blind_outputs(secp, unblinded, destination, fee, is_fee_estimation)?,
    };

    let prevouts = inputs
        .iter()
        .map(|input| input.tx_out.clone())
        .collect::<Vec<_>>();
    let prevouts = Prevouts::All(&prevouts);

    let sighash_cache = tx.clone();
    let mut sighash_cache = SighashCache::new(&sighash_cache);

    for (i, input) in inputs.iter().enumerate() {
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
                    InputType::Cooperative => {
                        return Err(anyhow::anyhow!(
                            "cooperative input spend cant be used for legacy outputs"
                        ));
                    }
                };

                tx.input[i].script_sig = script_sig
                    .push_slice(&witness_script.serialize())
                    .into_script();
            }
            OutputType::Compatibility(witness_script) => {
                let nested = Builder::new()
                    .push_opcode(OP_PUSHBYTES_0)
                    .push_slice(sha256::Hash::hash(witness_script.as_bytes()).as_ref());

                tx.input[i].script_sig = Builder::new()
                    .push_slice(nested.into_script().as_bytes())
                    .into_script();
            }
            _ => {}
        };

        match &input.output_type {
            OutputType::Taproot(None) => {
                tx.input[i].witness.script_witness = stubbed_cooperative_witness().to_vec();
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
                    .finalize(secp, uncooperative.internal_key)?
                    .control_block(&(leaf.output.clone(), LeafVersion::from_u8(leaf.version)?))
                    .ok_or(anyhow::anyhow!(
                        "could not create control block for input {}",
                        i
                    ))?;

                let mut witness = Witness::new();
                witness.push(sig.to_vec());

                if let InputType::Claim(preimage) = input.input_type {
                    witness.push(preimage);
                }

                witness.push(leaf.output.as_bytes());
                witness.push(control_block.serialize());

                tx.input[i].witness.script_witness = witness.to_vec();
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

                tx.input[i].witness.script_witness = witness.to_vec();
            }
            _ => {}
        }
    }

    Ok(tx)
}

fn unblind_outputs<C: Verification>(
    secp: &Secp256k1<C>,
    inputs: &[&InputDetail],
) -> Result<Vec<UnblindedOutput>> {
    let mut unblinded = Vec::with_capacity(inputs.len());

    for (i, input) in inputs.iter().enumerate() {
        if input.tx_out.value.is_confidential() {
            if let Some(blinding_key) = input.blinding_key {
                let sec = input.tx_out.unblind(secp, blinding_key.secret_key())?;
                unblinded.push(UnblindedOutput::Unblinded(sec));
            } else {
                return Err(anyhow::anyhow!("input {i} has no blinding key"));
            }
        } else {
            unblinded.push(UnblindedOutput::Explicit(ExplicitOutput {
                asset: if let Some(asset_id) = input.tx_out.asset.explicit() {
                    asset_id
                } else {
                    return Err(anyhow::anyhow!("input {i} has no explicit asset"));
                },
                amount: if let Some(amount) = input.tx_out.value.explicit() {
                    amount
                } else {
                    return Err(anyhow::anyhow!("input {i} has no explicit value"));
                },
            }));
        }
    }

    Ok(unblinded)
}

fn blind_outputs<C: Signing>(
    secp: &Secp256k1<C>,
    unblinded: &[UnblindedOutput],
    destination: &Destination<&Address>,
    fee: u64,
    is_fee_estimation: bool,
) -> Result<Vec<TxOut>> {
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

    let asset_id = unblinded[0].asset();
    let asset_bf = AssetBlindingFactor::new(&mut rand::thread_rng());

    let mut last_to_blind = None;
    let mut outputs = Vec::new();

    if needs_dummy_output {
        input_sum -= DUMMY_BLINDED_OUTPUT;

        let stub_script = Builder::new().push_opcode(OP_RETURN).into_script();
        let blinding_pubkey = Some(SecretKey::new(&mut rand::thread_rng()).public_key(secp));

        let (_, asset_bf, value_bf, output) = create_output(
            secp,
            unblinded,
            (asset_id, asset_bf),
            &stub_script,
            blinding_pubkey,
            DUMMY_BLINDED_OUTPUT,
            is_fee_estimation,
            None,
        )?;

        last_to_blind = Some((
            outputs.len(),
            DUMMY_BLINDED_OUTPUT,
            stub_script,
            blinding_pubkey,
        ));
        outputs.push((input_sum, asset_bf, value_bf, output));
    }

    match destination {
        Destination::Single(address) => {
            let amount = input_sum
                .checked_sub(fee)
                .ok_or(anyhow::anyhow!("fee is greater than input sum"))?;

            let (blinded, asset_bf, value_bf, output) = create_output(
                secp,
                unblinded,
                (asset_id, asset_bf),
                &address.script_pubkey(),
                address.blinding_pubkey,
                amount,
                is_fee_estimation,
                None,
            )?;

            if blinded {
                last_to_blind = Some((
                    outputs.len(),
                    amount,
                    address.script_pubkey(),
                    address.blinding_pubkey,
                ));
            }

            outputs.push((amount, asset_bf, value_bf, output));
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
                return Err(anyhow::anyhow!("output sum is greater than input sum"));
            }

            for (address, amount) in destination.outputs {
                let (blinded, asset_bf, value_bf, output) = create_output(
                    secp,
                    unblinded,
                    (asset_id, asset_bf),
                    &address.script_pubkey(),
                    address.blinding_pubkey,
                    *amount,
                    is_fee_estimation,
                    None,
                )?;

                if blinded {
                    last_to_blind = Some((
                        outputs.len(),
                        *amount,
                        address.script_pubkey(),
                        address.blinding_pubkey,
                    ));
                }

                outputs.push((*amount, asset_bf, value_bf, output));
            }

            let sweep_amount = input_sum - fee - output_sum;
            let (blinded, asset_bf, value_bf, output) = create_output(
                secp,
                unblinded,
                (asset_id, asset_bf),
                &destination.change.script_pubkey(),
                destination.change.blinding_pubkey,
                sweep_amount,
                is_fee_estimation,
                None,
            )?;

            if blinded {
                last_to_blind = Some((
                    outputs.len(),
                    sweep_amount,
                    destination.change.script_pubkey(),
                    destination.change.blinding_pubkey,
                ));
            }

            outputs.push((sweep_amount, asset_bf, value_bf, output));
        }
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

        outputs[index] = (amount, asset_bf, value_bf, output);
    }

    Ok(outputs
        .into_iter()
        .map(|(_, _, _, output)| output)
        .collect())
}

#[allow(clippy::too_many_arguments)]
pub fn create_output<C: Signing>(
    secp: &Secp256k1<C>,
    unblinded: &[UnblindedOutput],
    asset: (AssetId, AssetBlindingFactor),
    script_pubkey: &Script,
    blinding_pubkey: Option<PublicKey>,
    amount: u64,
    is_fee_estimation: bool,
    last_blinding_params: Option<&[(u64, AssetBlindingFactor, ValueBlindingFactor)]>,
) -> Result<(bool, AssetBlindingFactor, ValueBlindingFactor, TxOut)> {
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
) -> Result<Vec<u8>> {
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
    use elements::{
        AddressParams, OutPoint, Script, Txid, hashes::hash160, secp256k1_zkp::PublicKey,
        secp256k1_zkp::XOnlyPublicKey, taproot::TaprootSpendInfo,
    };
    use rstest::rstest;
    use serial_test::serial;
    use std::str::FromStr;

    pub const FUNDING_AMOUNT: u64 = 100_000;

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

    pub fn fund_address(
        client: &RpcClient,
        address: &Address,
        asset: Option<&str>,
    ) -> (Transaction, usize) {
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

        (tx, vout_index)
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
        let (funding_tx, vout_index) = fund_address(client, &address, None);

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
        let (funding_tx, vout_index) = fund_address(client, &address, None);

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
        let (funding_tx, vout_index) = fund_address(client, &address, None);

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
        let (funding_tx, vout_index) = fund_address(client, &address, None);

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
            &[&input],
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
            &[&input],
            &Destination::Single(&destination),
            FeeTarget::Absolute(fee),
        )
        .unwrap();

        assert_eq!(
            detect_preimage(&tx.input[0]).unwrap(),
            if let InputType::Claim(preimage) = input.input_type {
                preimage
            } else {
                unreachable!()
            }
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
            &[&input],
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
            &[&input],
            &Destination::Single(&destination),
            FeeTarget::Absolute(fee),
        )
        .unwrap();

        assert_eq!(
            detect_preimage(&tx.input[0]).unwrap(),
            if let InputType::Claim(preimage) = input.input_type {
                preimage
            } else {
                unreachable!()
            }
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
            &[&input],
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
            &[&input],
            &Destination::Single(&destination),
            FeeTarget::Absolute(fee),
        )
        .unwrap();

        assert_eq!(
            detect_preimage(&tx.input[0]).unwrap(),
            if let InputType::Claim(preimage) = input.input_type {
                preimage
            } else {
                unreachable!()
            }
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
            &[&input],
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
            &[&input],
            &Destination::Single(&destination),
            FeeTarget::Absolute(fee),
        )
        .unwrap();

        assert_eq!(
            detect_preimage(&tx.input[0]).unwrap(),
            if let InputType::Claim(preimage) = input.input_type {
                preimage
            } else {
                unreachable!()
            }
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
            &[&input],
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
            inputs.iter().collect::<Vec<_>>().as_slice(),
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
            inputs.iter().collect::<Vec<_>>().as_slice(),
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
            inputs.iter().collect::<Vec<_>>().as_slice(),
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

        assert_eq!(
            tx.output[if dummy_output { 1 } else { 0 }].script_pubkey,
            outputs[0].0.script_pubkey()
        );
        assert_eq!(
            output_amount(
                &secp,
                &client,
                outputs[0].0,
                &tx.output[if dummy_output { 1 } else { 0 }]
            ),
            outputs[0].1
        );

        assert_eq!(
            tx.output[if dummy_output { 2 } else { 1 }].script_pubkey,
            outputs[1].0.script_pubkey()
        );
        assert_eq!(
            output_amount(
                &secp,
                &client,
                outputs[1].0,
                &tx.output[if dummy_output { 2 } else { 1 }]
            ),
            outputs[1].1
        );

        assert_eq!(
            tx.output[if dummy_output { 3 } else { 2 }].script_pubkey,
            change.script_pubkey()
        );
        assert_eq!(
            output_amount(
                &secp,
                &client,
                &change,
                &tx.output[if dummy_output { 3 } else { 2 }]
            ),
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

        assert!(tx.output[if dummy_output { 4 } else { 3 }].is_fee());
        assert_eq!(
            tx.output[if dummy_output { 4 } else { 3 }].value,
            Value::Explicit(fee)
        );

        assert_eq!(send_raw_transaction(&client, &tx), tx.txid());
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
            &Destination::Single(&address),
            fee,
            false,
        );

        assert!(result.is_err());
        assert_eq!(
            result.unwrap_err().to_string(),
            "fee is greater than input sum"
        );
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
            &Destination::Multiple(Outputs {
                change: &change,
                outputs: &outputs,
            }),
            fee,
            false,
        );

        assert!(result.is_err());
        assert_eq!(
            result.unwrap_err().to_string(),
            "output sum is greater than input sum"
        );
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
}

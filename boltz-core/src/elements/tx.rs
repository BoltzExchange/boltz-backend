use crate::{
    consts::{ECDSA_BYTES_TO_GRIND, PREIMAGE_DUMMY, STUB_SCHNORR_SIGNATURE_LENGTH},
    elements::InputDetail,
    target_fee::{FeeTarget, target_fee},
    utils::{InputType, OutputType},
};
use anyhow::Result;
use bitcoin::Witness;
use elements::{
    Address, AssetId, BlockHash, EcdsaSighashType, LockTime, RangeProofMessage, SchnorrSig,
    SchnorrSighashType, Sequence, Sighash, SurjectionInput, Transaction, TxIn, TxOut, TxOutSecrets,
    TxOutWitness,
    confidential::{Asset, AssetBlindingFactor, Nonce, Value, ValueBlindingFactor},
    hashes::sha256,
    opcodes::all::{OP_PUSHBYTES_0, OP_RETURN},
    pset::serialize::Serialize,
    script::Builder,
    secp256k1_zkp::{Keypair, Message, Secp256k1, SecretKey, Signing, Verification, rand},
    sighash::{Prevouts, SighashCache},
    taproot::LeafVersion,
};

const SIGHASH_TYPE_LEGACY: EcdsaSighashType = EcdsaSighashType::All;
const SIGHASH_TYPE_TAPROOT: SchnorrSighashType = SchnorrSighashType::Default;

const DUMMY_BLINDED_OUTPUT: u64 = 1;

#[derive(Debug, Copy, Clone)]
struct ExplicitOutput {
    asset: AssetId,
    amount: u64,
}

#[derive(Debug, Copy, Clone)]
enum UnblindedOutput {
    Unblinded(TxOutSecrets),
    Explicit(ExplicitOutput),
}

impl UnblindedOutput {
    fn amount(&self) -> u64 {
        match self {
            UnblindedOutput::Unblinded(sec) => sec.value,
            UnblindedOutput::Explicit(out) => out.amount,
        }
    }

    fn asset(&self) -> AssetId {
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
    destination: &Address,
    fee: FeeTarget,
) -> Result<Transaction> {
    let unblinded = unblind_outputs(secp, inputs)?;
    if !unblinded
        .iter()
        .all(|input| input.asset() == unblinded[0].asset())
    {
        return Err(anyhow::anyhow!("all inputs must have the same asset"));
    }

    target_fee(fee, |fee| {
        construct_raw(secp, genesis_hash, inputs, &unblinded, destination, fee)
    })
}

// TODO: claim covenant support

fn construct_raw<C: Signing + Verification>(
    secp: &Secp256k1<C>,
    genesis_hash: BlockHash,
    inputs: &[&InputDetail],
    unblinded: &[UnblindedOutput],
    destination: &Address,
    fee: u64,
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
        output: blind_outputs(secp, unblinded, destination, fee)?,
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
                };

                tx.input[i].script_sig = script_sig
                    .push_slice(&witness_script.serialize())
                    .into_script();
            }
            OutputType::Compatibility(witness_script) => {
                let nested = Builder::new()
                    .push_opcode(OP_PUSHBYTES_0)
                    .push_slice(sha256::Hash::const_hash(witness_script.as_bytes()).as_ref());

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
    let mut secrets = Vec::with_capacity(inputs.len());

    for (i, input) in inputs.iter().enumerate() {
        if input.tx_out.value.is_confidential() {
            if let Some(blinding_key) = input.blinding_key {
                let sec = input.tx_out.unblind(secp, blinding_key.secret_key())?;
                secrets.push(UnblindedOutput::Unblinded(sec));
            } else {
                return Err(anyhow::anyhow!("input {i} has no blinding key"));
            }
        } else {
            secrets.push(UnblindedOutput::Explicit(ExplicitOutput {
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

    Ok(secrets)
}

fn blind_outputs<C: Signing>(
    secp: &Secp256k1<C>,
    unblinded: &[UnblindedOutput],
    destination: &Address,
    fee: u64,
) -> Result<Vec<TxOut>> {
    let asset_bf = AssetBlindingFactor::new(&mut rand::thread_rng());
    let mut output_value = unblinded.iter().map(|input| input.amount()).sum::<u64>() - fee;

    let mut outputs = Vec::new();
    let asset_id = unblinded[0].asset();

    if let Some(blinding_key) = destination.blinding_pubkey {
        let value_bf = ValueBlindingFactor::last(
            secp,
            output_value,
            asset_bf,
            &unblinded.iter().map(|i| i.into()).collect::<Vec<_>>(),
            &[(
                fee,
                AssetBlindingFactor::zero(),
                ValueBlindingFactor::zero(),
            )],
        );

        let (blinded_value, nonce, range_proof) = Value::Explicit(output_value).blind(
            secp,
            value_bf,
            blinding_key,
            SecretKey::new(&mut rand::thread_rng()),
            &destination.script_pubkey(),
            &RangeProofMessage {
                asset: asset_id,
                bf: asset_bf,
            },
        )?;

        let (blinded_asset, asset_surjection_proof) =
            Asset::Explicit(asset_id).blind(&mut rand::thread_rng(), secp, asset_bf, unblinded)?;

        outputs.push(TxOut {
            nonce,
            asset: blinded_asset,
            value: blinded_value,
            script_pubkey: destination.script_pubkey(),
            witness: TxOutWitness {
                surjection_proof: Some(Box::new(asset_surjection_proof)),
                rangeproof: Some(Box::new(range_proof)),
            },
        });
    } else {
        let has_blinded_inputs = unblinded.iter().any(|i| match i {
            UnblindedOutput::Unblinded(_) => true,
            UnblindedOutput::Explicit(_) => false,
        });

        if has_blinded_inputs {
            output_value -= DUMMY_BLINDED_OUTPUT;

            let value_bf = ValueBlindingFactor::last(
                secp,
                DUMMY_BLINDED_OUTPUT,
                asset_bf,
                &unblinded.iter().map(|i| i.into()).collect::<Vec<_>>(),
                &[
                    (
                        output_value,
                        AssetBlindingFactor::zero(),
                        ValueBlindingFactor::zero(),
                    ),
                    (
                        fee,
                        AssetBlindingFactor::zero(),
                        ValueBlindingFactor::zero(),
                    ),
                ],
            );

            let stub_script = Builder::new().push_opcode(OP_RETURN).into_script();

            let (blinded_value, nonce, range_proof) = Value::Explicit(DUMMY_BLINDED_OUTPUT).blind(
                secp,
                value_bf,
                SecretKey::new(&mut rand::thread_rng()).public_key(secp),
                SecretKey::new(&mut rand::thread_rng()),
                &stub_script,
                &RangeProofMessage {
                    asset: asset_id,
                    bf: asset_bf,
                },
            )?;

            let (blinded_asset, asset_surjection_proof) = Asset::Explicit(asset_id).blind(
                &mut rand::thread_rng(),
                secp,
                asset_bf,
                unblinded,
            )?;

            outputs.push(TxOut {
                nonce,
                asset: blinded_asset,
                value: blinded_value,
                script_pubkey: stub_script,
                witness: TxOutWitness {
                    surjection_proof: Some(Box::new(asset_surjection_proof)),
                    rangeproof: Some(Box::new(range_proof)),
                },
            });
        }

        outputs.push(TxOut {
            asset: Asset::Explicit(asset_id),
            value: Value::Explicit(output_value),
            script_pubkey: destination.script_pubkey(),
            nonce: Nonce::Null,
            witness: TxOutWitness::default(),
        });
    }

    outputs.push(TxOut::new_fee(fee, asset_id));

    Ok(outputs)
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
mod tests {
    use super::*;
    use crate::{
        client::{RpcBlock, RpcClient, RpcParam},
        detect_preimage,
        elements::{
            Tree, UncooperativeDetails, reverse_script, reverse_tree, swap_script, swap_tree,
        },
    };
    use bitcoin::{hashes::Hash, key::rand::RngCore};
    use elements::{
        AddressParams, OutPoint, Script, Txid, hashes::hash160, secp256k1_zkp::PublicKey,
        secp256k1_zkp::XOnlyPublicKey, taproot::TaprootSpendInfo,
    };
    use rstest::rstest;
    use serial_test::serial;
    use std::str::FromStr;

    fn reverse_tree_without_covenant(
        preimage_hash: hash160::Hash,
        claim_key: &XOnlyPublicKey,
        refund_key: &XOnlyPublicKey,
        lock_time: LockTime,
    ) -> Tree {
        reverse_tree(preimage_hash, claim_key, refund_key, lock_time, None)
    }

    fn mine_block(client: &RpcClient) {
        client
            .request::<serde_json::Value>(
                "generatetoaddress",
                Some(vec![
                    RpcParam::Int(1),
                    RpcParam::Str(get_destination(client, true).to_string()),
                ]),
            )
            .unwrap();
    }

    fn get_block_height(client: &RpcClient) -> u32 {
        client.request::<u32>("getblockcount", None).unwrap()
    }

    fn get_genesis_hash(client: &RpcClient) -> BlockHash {
        let block_hash = client
            .request::<String>("getblockhash", Some(vec![RpcParam::Int(0)]))
            .unwrap();

        let block = client
            .request::<RpcBlock>("getblock", Some(vec![RpcParam::Str(block_hash)]))
            .unwrap();
        BlockHash::from_str(&block.hash).unwrap()
    }

    fn fund_address(client: &RpcClient, address: &Address, amount: u64) -> (Transaction, usize) {
        let tx = client
            .request::<String>(
                "sendtoaddress",
                Some(vec![
                    RpcParam::Str(address.to_string()),
                    RpcParam::Int(amount as i64),
                ]),
            )
            .unwrap();

        let tx = client
            .request::<String>("getrawtransaction", Some(vec![RpcParam::Str(tx)]))
            .unwrap();

        let tx: Transaction = elements::encode::deserialize(&hex::decode(tx).unwrap()).unwrap();

        let vout_index = tx
            .output
            .iter()
            .position(|output| output.script_pubkey == address.script_pubkey())
            .unwrap();

        (tx, vout_index)
    }

    fn send_raw_transaction(client: &RpcClient, tx: &Transaction) -> Txid {
        let res = client
            .request::<String>(
                "sendrawtransaction",
                Some(vec![RpcParam::Str(hex::encode(tx.serialize()))]),
            )
            .unwrap();

        Txid::from_str(&res).unwrap()
    }

    fn get_destination(client: &RpcClient, blind: bool) -> Address {
        let address =
            Address::from_str(&client.request::<String>("getnewaddress", None).unwrap()).unwrap();

        if blind {
            address
        } else {
            // Ditch the blinder
            Address::from_script(&address.script_pubkey(), None, &AddressParams::ELEMENTS).unwrap()
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
        let (funding_tx, vout_index) = fund_address(client, &address, 1);

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
        let (funding_tx, vout_index) = fund_address(client, &address, 1);

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
        let (funding_tx, vout_index) = fund_address(client, &address, 1);

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
        let (funding_tx, vout_index) = fund_address(client, &address, 1);

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

        let destination = get_destination(&client, blind_output);

        let fee = 100;
        let mut tx = construct_tx(
            &secp,
            get_genesis_hash(&client),
            &[&input],
            &destination,
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
                &Prevouts::All(&[input.tx_out.clone()]),
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

        let destination = get_destination(&client, blind_output);

        let fee = 100;
        let tx = construct_tx(
            &secp,
            get_genesis_hash(&client),
            &[&input],
            &destination,
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

        let destination = get_destination(&client, blind_output);

        let fee = 100;
        let tx = construct_tx(
            &secp,
            get_genesis_hash(&client),
            &[&input],
            &destination,
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

        let destination = get_destination(&client, blind_output);

        let fee = 100;
        let tx = construct_tx(
            &secp,
            get_genesis_hash(&client),
            &[&input],
            &destination,
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

        let destination = get_destination(&client, blind_output);

        let fee = 100;
        let tx = construct_tx(
            &secp,
            get_genesis_hash(&client),
            &[&input],
            &destination,
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

        let destination = get_destination(&client, blind_output);

        let fee = 100;
        let tx = construct_tx(
            &secp,
            get_genesis_hash(&client),
            &[&input],
            &destination,
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

        let destination = get_destination(&client, blind_output);

        let fee = 100;
        let tx = construct_tx(
            &secp,
            get_genesis_hash(&client),
            &[&input],
            &destination,
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

        let destination = get_destination(&client, blind_output);

        let fee = 100;
        let tx = construct_tx(
            &secp,
            get_genesis_hash(&client),
            &[&input],
            &destination,
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

        let destination = get_destination(&client, blind_output);

        let fee = 100;
        let tx = construct_tx(
            &secp,
            get_genesis_hash(&client),
            &[&input],
            &destination,
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

        let destination = get_destination(&client, blind_output);

        let fee = 4.0;
        let tx = construct_tx(
            &secp,
            get_genesis_hash(&client),
            inputs.iter().collect::<Vec<_>>().as_slice(),
            &destination,
            FeeTarget::Relative(fee),
        )
        .unwrap();

        let has_dummy_output = blind_input && !blind_output;
        assert_eq!(tx.output.len(), if has_dummy_output { 3 } else { 2 });
        assert_eq!(
            tx.output[if has_dummy_output { 2 } else { 1 }].value,
            Value::Explicit(fee as u64 * (tx.discount_vsize() as u64 + inputs.len() as u64))
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

        let destination = get_destination(&client, blind_output);

        let fee = 4.0;
        let tx = construct_tx(
            &secp,
            get_genesis_hash(&client),
            inputs.iter().collect::<Vec<_>>().as_slice(),
            &destination,
            FeeTarget::Relative(fee),
        )
        .unwrap();

        assert_eq!(tx.output.len(), if blind_output { 2 } else { 3 });
        assert_eq!(
            tx.output[if blind_output { 1 } else { 2 }].value,
            Value::Explicit(fee as u64 * (tx.discount_vsize() as u64 + inputs.len() as u64))
        );

        let broadcast = send_raw_transaction(&client, &tx);
        assert_eq!(broadcast, tx.txid());
    }
}

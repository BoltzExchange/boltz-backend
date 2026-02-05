use crate::{
    bitcoin::InputDetail,
    consts::{ECDSA_BYTES_TO_GRIND, PREIMAGE_DUMMY, STUB_SCHNORR_SIGNATURE_LENGTH},
    target_fee::{FeeTarget, target_fee},
    utils::{COOPERATIVE_INPUT_ERROR, Destination, InputType, OutputType},
};
use anyhow::Result;
use bitcoin::{
    Address, Amount, EcdsaSighashType, ScriptBuf, Sequence, TapSighashType, TxIn, TxOut, Witness,
    absolute::LockTime,
    ecdsa,
    hashes::{Hash, sha256, sha256d},
    key::Keypair,
    opcodes::OP_0,
    script::{Builder, PushBytesBuf},
    secp256k1::{Message, Secp256k1, Signing, Verification},
    sighash::{Prevouts, SighashCache},
    taproot::{self, LeafVersion},
    transaction::{Transaction, Version},
};

const SIGHASH_TYPE_LEGACY: EcdsaSighashType = EcdsaSighashType::All;
const SIGHASH_TYPE_TAPROOT: TapSighashType = TapSighashType::Default;

pub fn construct_tx<C: Signing + Verification>(
    secp: &Secp256k1<C>,
    inputs: &[&InputDetail],
    destination: &Destination<&Address>,
    fee: FeeTarget,
) -> Result<(Transaction, u64)> {
    target_fee(fee, |fee, _is_fee_estimation| {
        construct_raw(secp, inputs, destination, Amount::from_sat(fee))
    })
}

pub fn construct_raw<C: Signing + Verification>(
    secp: &Secp256k1<C>,
    inputs: &[&InputDetail],
    destination: &Destination<&Address>,
    fee: Amount,
) -> Result<Transaction> {
    let input_sum = inputs
        .iter()
        .map(|input| input.tx_out.value)
        .sum::<Amount>();

    let output = match destination {
        Destination::Single(address) => vec![TxOut {
            value: input_sum
                .checked_sub(fee)
                .ok_or(anyhow::anyhow!("fee is greater than input sum"))?,
            script_pubkey: address.script_pubkey(),
        }],
        Destination::Multiple(outputs) => {
            let output_sum = outputs
                .outputs
                .iter()
                .map(|output| Amount::from_sat(output.1))
                .sum::<Amount>();

            if output_sum + fee > input_sum {
                return Err(anyhow::anyhow!("output sum is greater than input sum"));
            }

            let mut res = Vec::with_capacity(outputs.outputs.len() + 1);

            for (address, amount) in outputs.outputs {
                res.push(TxOut {
                    value: Amount::from_sat(*amount),
                    script_pubkey: address.script_pubkey(),
                });
            }

            res.push(TxOut {
                value: input_sum - fee - output_sum,
                script_pubkey: outputs.change.script_pubkey(),
            });

            res
        }
    };

    let mut tx = Transaction {
        version: Version::TWO,
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
                script_sig: ScriptBuf::new(),
                sequence: Sequence::ENABLE_RBF_NO_LOCKTIME,
                witness: Witness::new(),
            })
            .collect(),
        output,
    };

    let prevouts = inputs
        .iter()
        .map(|input| input.tx_out.clone())
        .collect::<Vec<_>>();
    let prevouts = Prevouts::All(&prevouts);

    let mut sighash_cache = SighashCache::new(tx.clone());

    for (i, input) in inputs.iter().enumerate() {
        match &input.output_type {
            OutputType::Legacy(witness_script) => {
                let sighash = sighash_cache.legacy_signature_hash(
                    i,
                    witness_script,
                    SIGHASH_TYPE_LEGACY.to_u32(),
                )?;

                let mut script_sig = ScriptBuf::new();
                script_sig.push_slice(
                    legacy_signature(secp, &sighash.as_raw_hash(), &input.keys)?.serialize(),
                );

                match input.input_type {
                    InputType::Claim(preimage) => {
                        script_sig.push_slice(preimage);
                    }
                    InputType::Refund(_) => {
                        script_sig.push_slice(PREIMAGE_DUMMY);
                    }
                    InputType::Cooperative => {
                        return Err(anyhow::anyhow!(
                            "legacy outputs cannot be spent cooperatively"
                        ));
                    }
                };

                script_sig.push_slice(PushBytesBuf::try_from(witness_script.clone().into_bytes())?);

                tx.input[i].script_sig = script_sig;
            }
            OutputType::Compatibility(witness_script) => {
                let nested = Builder::new()
                    .push_opcode(OP_0)
                    .push_slice(sha256::Hash::hash(witness_script.as_bytes()).as_byte_array());
                let nested = PushBytesBuf::try_from(nested.into_bytes())?;

                tx.input[i].script_sig = Builder::new().push_slice(nested).into_script();
            }
            _ => {}
        };

        match &input.output_type {
            OutputType::Taproot(None) => {
                tx.input[i].witness = stubbed_cooperative_witness();
            }
            OutputType::Taproot(Some(uncooperative)) => {
                let leaf = match input.input_type {
                    InputType::Claim(_) => &uncooperative.tree.claim_leaf,
                    InputType::Refund(_) => &uncooperative.tree.refund_leaf,
                    InputType::Cooperative => {
                        return Err(anyhow::anyhow!(
                            "legacy outputs cannot be spent cooperatively"
                        ));
                    }
                };

                let leaf_hash = leaf.leaf_hash()?;

                let sighash = sighash_cache.taproot_script_spend_signature_hash(
                    i,
                    &prevouts,
                    leaf_hash,
                    SIGHASH_TYPE_TAPROOT,
                )?;

                let sig = taproot::Signature {
                    sighash_type: SIGHASH_TYPE_TAPROOT,
                    signature: secp.sign_schnorr(
                        &Message::from_digest_slice(sighash.as_raw_hash().as_byte_array())?,
                        &input.keys,
                    ),
                };

                let control_block = uncooperative
                    .tree
                    .build()?
                    .finalize(secp, uncooperative.internal_key)
                    .map_err(|e| {
                        anyhow::anyhow!(
                            "could not finalize taproot builder for input {}: {:?}",
                            i,
                            e
                        )
                    })?
                    .control_block(&(
                        leaf.output.clone(),
                        LeafVersion::from_consensus(leaf.version)?,
                    ))
                    .ok_or(anyhow::anyhow!(
                        "could not create control block for input {}",
                        i
                    ))?;

                let mut witness = Witness::new();

                witness.push(sig.serialize());

                if let InputType::Claim(preimage) = input.input_type {
                    witness.push(preimage);
                }

                witness.push(leaf.output.as_bytes());
                witness.push(control_block.serialize());

                tx.input[i].witness = witness;
            }
            OutputType::SegwitV0(witness_script) | OutputType::Compatibility(witness_script) => {
                let sighash = sighash_cache.p2wsh_signature_hash(
                    i,
                    witness_script,
                    input.tx_out.value,
                    SIGHASH_TYPE_LEGACY,
                )?;

                let mut witness = Witness::new();
                witness
                    .push(legacy_signature(secp, &sighash.as_raw_hash(), &input.keys)?.serialize());

                match input.input_type {
                    InputType::Claim(preimage) => {
                        witness.push(preimage);
                    }
                    InputType::Refund(_) => {
                        witness.push(PREIMAGE_DUMMY);
                    }
                    InputType::Cooperative => {
                        return Err(anyhow::anyhow!(COOPERATIVE_INPUT_ERROR));
                    }
                };

                witness.push(witness_script.as_bytes());

                tx.input[i].witness = witness;
            }
            _ => {}
        }
    }

    Ok(tx)
}

fn stubbed_cooperative_witness() -> Witness {
    let mut witness = Witness::new();
    // Stub because we don't want to create cooperative signatures here
    // but still be able to have an accurate size estimation
    witness.push([0; STUB_SCHNORR_SIGNATURE_LENGTH]);
    witness
}

fn legacy_signature<C: Signing>(
    secp: &Secp256k1<C>,
    sighash: &&sha256d::Hash,
    keys: &Keypair,
) -> Result<ecdsa::Signature> {
    Ok(ecdsa::Signature {
        sighash_type: SIGHASH_TYPE_LEGACY,
        signature: secp.sign_ecdsa_grind_r(
            &Message::from_digest_slice(sighash.as_byte_array())?,
            &keys.secret_key(),
            ECDSA_BYTES_TO_GRIND,
        ),
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{
        bitcoin::{
            Tree, UncooperativeDetails, reverse_script, reverse_tree, swap_script, swap_tree,
        },
        client::{RpcClient, RpcParam},
        detect_preimage,
        utils::Outputs,
    };
    use bitcoin::{
        OutPoint, Txid, XOnlyPublicKey,
        hashes::hash160,
        key::{Keypair, rand::RngCore},
        secp256k1::{PublicKey, Signing, Verification, rand},
        taproot::TaprootSpendInfo,
    };
    use elements::pset::serialize::Serialize;
    use rstest::rstest;
    use serial_test::serial;
    use std::str::FromStr;

    const FUNDING_AMOUNT: u64 = 100_000;

    fn fund_address(node: &RpcClient, address: &Address) -> (Transaction, usize) {
        node.request::<serde_json::Value>(
            "generatetoaddress",
            Some(&[RpcParam::Int(1), RpcParam::Str(&address.to_string())]),
        )
        .unwrap();

        let funding_tx = node
            .request::<String>(
                "sendtoaddress",
                Some(&[
                    RpcParam::Str(&address.to_string()),
                    RpcParam::Float(Amount::from_sat(FUNDING_AMOUNT).to_btc()),
                ]),
            )
            .unwrap();

        let tx = node
            .request::<String>("getrawtransaction", Some(&[RpcParam::Str(&funding_tx)]))
            .unwrap();

        let tx: Transaction = bitcoin::consensus::deserialize(&hex::decode(tx).unwrap()).unwrap();

        let vout_index = tx
            .output
            .iter()
            .position(|output| output.script_pubkey == address.script_pubkey())
            .unwrap();

        (tx, vout_index)
    }

    fn get_block_height(client: &RpcClient) -> u32 {
        client.request::<u32>("getblockcount", None).unwrap()
    }

    fn get_destination(node: &RpcClient) -> Address {
        let address = node.request::<String>("getnewaddress", None).unwrap();

        Address::from_str(&address).unwrap().assume_checked()
    }

    fn send_raw_transaction(node: &RpcClient, tx: &Transaction) -> Txid {
        let txid = node
            .request::<String>(
                "sendrawtransaction",
                Some(&[RpcParam::Str(&hex::encode(tx.serialize()))]),
            )
            .unwrap();

        Txid::from_str(&txid).unwrap()
    }

    fn fund_taproot<
        C: Signing + Verification,
        T: FnOnce(hash160::Hash, &XOnlyPublicKey, &XOnlyPublicKey, LockTime) -> Tree,
    >(
        secp: &Secp256k1<C>,
        node: &RpcClient,
        lock_time: Option<u32>,
        create_tree: T,
    ) -> (Keypair, Tree, TaprootSpendInfo, InputDetail) {
        let mut preimage = [0; 32];
        rand::thread_rng().try_fill_bytes(&mut preimage).unwrap();

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

        let address = Address::p2tr_tweaked(tweak.output_key(), bitcoin::network::Network::Regtest);
        let (funding_tx, vout_index) = fund_address(node, &address);

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
                outpoint: OutPoint::new(funding_tx.compute_txid(), vout_index as u32),
                tx_out: funding_tx.tx_out(vout_index).unwrap().clone(),
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
        T: FnOnce(hash160::Hash, &PublicKey, &PublicKey, LockTime) -> ScriptBuf,
    >(
        secp: &Secp256k1<C>,
        node: &RpcClient,
        lock_time: Option<u32>,
        create_script: T,
    ) -> InputDetail {
        let mut preimage = [0; 32];
        rand::thread_rng().try_fill_bytes(&mut preimage).unwrap();

        let claim_keys = Keypair::new(secp, &mut rand::thread_rng());
        let refund_keys = Keypair::new(secp, &mut rand::thread_rng());

        let script = create_script(
            hash160::Hash::hash(&preimage),
            &claim_keys.public_key(),
            &refund_keys.public_key(),
            LockTime::from_height(lock_time.unwrap_or(10_000)).unwrap(),
        );

        let address = Address::p2wsh(script.as_script(), bitcoin::network::Network::Regtest);
        let (funding_tx, vout_index) = fund_address(node, &address);

        InputDetail {
            input_type: if let Some(lock_time) = lock_time {
                InputType::Refund(lock_time)
            } else {
                InputType::Claim(preimage)
            },
            output_type: OutputType::SegwitV0(script),
            outpoint: OutPoint::new(funding_tx.compute_txid(), vout_index as u32),
            tx_out: funding_tx.tx_out(vout_index).unwrap().clone(),
            keys: if lock_time.is_none() {
                claim_keys
            } else {
                refund_keys
            },
        }
    }

    fn fund_compatibility<
        C: Signing + Verification,
        T: FnOnce(hash160::Hash, &PublicKey, &PublicKey, LockTime) -> ScriptBuf,
    >(
        secp: &Secp256k1<C>,
        node: &RpcClient,
        lock_time: Option<u32>,
        create_script: T,
    ) -> InputDetail {
        let mut preimage = [0; 32];
        rand::thread_rng().try_fill_bytes(&mut preimage).unwrap();

        let claim_keys = Keypair::new(secp, &mut rand::thread_rng());
        let refund_keys = Keypair::new(secp, &mut rand::thread_rng());

        let script = create_script(
            hash160::Hash::hash(&preimage),
            &claim_keys.public_key(),
            &refund_keys.public_key(),
            LockTime::from_height(lock_time.unwrap_or(10_000)).unwrap(),
        );

        let nested_script = Builder::new()
            .push_opcode(OP_0)
            .push_slice(bitcoin::hashes::sha256::Hash::hash(script.as_bytes()).as_byte_array());

        let address = Address::p2sh(
            nested_script.as_script(),
            bitcoin::network::Network::Regtest,
        )
        .unwrap();
        let (funding_tx, vout_index) = fund_address(node, &address);

        InputDetail {
            input_type: if let Some(lock_time) = lock_time {
                InputType::Refund(lock_time)
            } else {
                InputType::Claim(preimage)
            },
            output_type: OutputType::Compatibility(script),
            outpoint: OutPoint::new(funding_tx.compute_txid(), vout_index as u32),
            tx_out: funding_tx.tx_out(vout_index).unwrap().clone(),
            keys: if lock_time.is_none() {
                claim_keys
            } else {
                refund_keys
            },
        }
    }

    fn fund_legacy<
        C: Signing + Verification,
        T: FnOnce(hash160::Hash, &PublicKey, &PublicKey, LockTime) -> ScriptBuf,
    >(
        secp: &Secp256k1<C>,
        node: &RpcClient,
        lock_time: Option<u32>,
        create_script: T,
    ) -> InputDetail {
        let mut preimage = [0; 32];
        rand::thread_rng().try_fill_bytes(&mut preimage).unwrap();

        let claim_keys = Keypair::new(secp, &mut rand::thread_rng());
        let refund_keys = Keypair::new(secp, &mut rand::thread_rng());

        let script = create_script(
            hash160::Hash::hash(&preimage),
            &claim_keys.public_key(),
            &refund_keys.public_key(),
            LockTime::from_height(lock_time.unwrap_or(10_000)).unwrap(),
        );

        let address =
            Address::p2sh(script.as_script(), bitcoin::network::Network::Regtest).unwrap();
        let (funding_tx, vout_index) = fund_address(node, &address);

        InputDetail {
            input_type: if let Some(lock_time) = lock_time {
                InputType::Refund(lock_time)
            } else {
                InputType::Claim(preimage)
            },
            output_type: OutputType::Legacy(script),
            outpoint: OutPoint::new(funding_tx.compute_txid(), vout_index as u32),
            tx_out: funding_tx.tx_out(vout_index).unwrap().clone(),
            keys: if lock_time.is_none() {
                claim_keys
            } else {
                refund_keys
            },
        }
    }

    #[rstest]
    #[case::swap_tree(swap_tree)]
    #[case::reverse_tree(reverse_tree)]
    #[serial(Bitcoin)]
    fn test_taproot_claim_cooperative(
        #[case] create_tree: impl FnOnce(
            hash160::Hash,
            &XOnlyPublicKey,
            &XOnlyPublicKey,
            LockTime,
        ) -> Tree,
    ) {
        let node = RpcClient::new_bitcoin_regtest();
        let secp = Secp256k1::new();
        let (keys, _, tweak, input) = fund_taproot(&secp, &node, None, create_tree);

        let destination = get_destination(&node);

        let fee = 1_000;
        let (mut tx, _) = construct_tx(
            &secp,
            &[&input],
            &Destination::Single(&destination),
            FeeTarget::Absolute(fee),
        )
        .unwrap();

        assert_eq!(tx.output.len(), 1);
        assert_eq!(tx.output[0].script_pubkey, destination.script_pubkey());
        assert_eq!(
            tx.output[0].value,
            input.tx_out.value - Amount::from_sat(fee)
        );

        let sighash = SighashCache::new(tx.clone())
            .taproot_key_spend_signature_hash(
                0,
                &Prevouts::All(std::slice::from_ref(&input.tx_out)),
                SIGHASH_TYPE_TAPROOT,
            )
            .unwrap();

        let keys = keys
            .add_xonly_tweak(&secp, &tweak.tap_tweak().to_scalar())
            .unwrap();

        let sig = taproot::Signature {
            sighash_type: SIGHASH_TYPE_TAPROOT,
            signature: secp.sign_schnorr(
                &Message::from_digest_slice(sighash.as_raw_hash().as_byte_array()).unwrap(),
                &keys,
            ),
        };

        let mut witness = Witness::new();
        witness.push(sig.serialize());

        tx.input[0].witness = witness;

        assert_eq!(send_raw_transaction(&node, &tx), tx.compute_txid());
    }

    #[rstest]
    #[case::swap_tree(swap_tree)]
    #[case::reverse_tree(reverse_tree)]
    #[serial(Bitcoin)]
    fn test_taproot_claim_uncooperative(
        #[case] create_tree: impl FnOnce(
            hash160::Hash,
            &XOnlyPublicKey,
            &XOnlyPublicKey,
            LockTime,
        ) -> Tree,
    ) {
        let node = RpcClient::new_bitcoin_regtest();
        let secp = Secp256k1::new();
        let (keys, tree, _, mut input) = fund_taproot(&secp, &node, None, create_tree);

        input.output_type = OutputType::Taproot(Some(UncooperativeDetails {
            tree,
            internal_key: keys.x_only_public_key().0,
        }));

        let destination = get_destination(&node);

        let fee = 1_000;
        let (tx, _) = construct_tx(
            &secp,
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

        assert_eq!(tx.output.len(), 1);
        assert_eq!(tx.output[0].script_pubkey, destination.script_pubkey());
        assert_eq!(
            tx.output[0].value,
            input.tx_out.value - Amount::from_sat(fee)
        );

        assert_eq!(send_raw_transaction(&node, &tx), tx.compute_txid());
    }

    #[rstest]
    #[case::swap_tree(swap_tree)]
    #[case::reverse_tree(reverse_tree)]
    #[serial(Bitcoin)]
    fn test_taproot_refund_uncooperative(
        #[case] create_tree: impl FnOnce(
            hash160::Hash,
            &XOnlyPublicKey,
            &XOnlyPublicKey,
            LockTime,
        ) -> Tree,
    ) {
        let node = RpcClient::new_bitcoin_regtest();
        let secp = Secp256k1::new();
        let (keys, tree, _, mut input) =
            fund_taproot(&secp, &node, Some(get_block_height(&node)), create_tree);

        input.output_type = OutputType::Taproot(Some(UncooperativeDetails {
            tree,
            internal_key: keys.x_only_public_key().0,
        }));

        let destination = get_destination(&node);

        let fee = 1_000;
        let (tx, _) = construct_tx(
            &secp,
            &[&input],
            &Destination::Single(&destination),
            FeeTarget::Absolute(fee),
        )
        .unwrap();

        assert_eq!(tx.output.len(), 1);
        assert_eq!(tx.output[0].script_pubkey, destination.script_pubkey());
        assert_eq!(
            tx.output[0].value,
            input.tx_out.value - Amount::from_sat(fee)
        );

        assert_eq!(send_raw_transaction(&node, &tx), tx.compute_txid());
    }

    #[rstest]
    #[case::swap_tree(swap_tree)]
    #[case::reverse_tree(reverse_tree)]
    #[serial(Bitcoin)]
    fn test_taproot_claim_cooperative_relative_fee(
        #[case] create_tree: impl FnOnce(
            hash160::Hash,
            &XOnlyPublicKey,
            &XOnlyPublicKey,
            LockTime,
        ) -> Tree,
    ) {
        let node = RpcClient::new_bitcoin_regtest();
        let secp = Secp256k1::new();
        let (keys, _, tweak, input) = fund_taproot(&secp, &node, None, create_tree);

        let destination = get_destination(&node);

        let fee_rate = 3.0;
        let (mut tx, fee) = construct_tx(
            &secp,
            &[&input],
            &Destination::Single(&destination),
            FeeTarget::Relative(fee_rate),
        )
        .unwrap();

        assert_eq!(tx.output.len(), 1);
        assert_eq!(tx.output[0].script_pubkey, destination.script_pubkey());

        let sighash = SighashCache::new(tx.clone())
            .taproot_key_spend_signature_hash(
                0,
                &Prevouts::All(std::slice::from_ref(&input.tx_out)),
                SIGHASH_TYPE_TAPROOT,
            )
            .unwrap();

        let keys = keys
            .add_xonly_tweak(&secp, &tweak.tap_tweak().to_scalar())
            .unwrap();

        let sig = taproot::Signature {
            sighash_type: SIGHASH_TYPE_TAPROOT,
            signature: secp.sign_schnorr(
                &Message::from_digest_slice(sighash.as_raw_hash().as_byte_array()).unwrap(),
                &keys,
            ),
        };

        let mut witness = Witness::new();
        witness.push(sig.serialize());

        tx.input[0].witness = witness;

        assert_eq!(
            tx.output[0].value,
            input.tx_out.value - Amount::from_sat(fee)
        );

        assert_eq!(send_raw_transaction(&node, &tx), tx.compute_txid());
    }

    #[rstest]
    #[case::swap_tree(swap_tree)]
    #[case::reverse_tree(reverse_tree)]
    #[serial(Bitcoin)]
    fn test_taproot_claim_uncooperative_relative_fee(
        #[case] create_tree: impl FnOnce(
            hash160::Hash,
            &XOnlyPublicKey,
            &XOnlyPublicKey,
            LockTime,
        ) -> Tree,
    ) {
        let node = RpcClient::new_bitcoin_regtest();
        let secp = Secp256k1::new();
        let (keys, tree, _, mut input) = fund_taproot(&secp, &node, None, create_tree);

        input.output_type = OutputType::Taproot(Some(UncooperativeDetails {
            tree,
            internal_key: keys.x_only_public_key().0,
        }));

        let destination = get_destination(&node);

        let fee_rate = 3.0;
        let (tx, fee) = construct_tx(
            &secp,
            &[&input],
            &Destination::Single(&destination),
            FeeTarget::Relative(fee_rate),
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

        assert_eq!(tx.output.len(), 1);
        assert_eq!(tx.output[0].script_pubkey, destination.script_pubkey());
        assert_eq!(
            tx.output[0].value,
            input.tx_out.value - Amount::from_sat(fee)
        );

        assert_eq!(send_raw_transaction(&node, &tx), tx.compute_txid());
    }

    #[rstest]
    #[case::swap_script(swap_script)]
    #[case::reverse_script(reverse_script)]
    #[serial(Bitcoin)]
    fn test_segwit_v0_claim(
        #[case] create_script: impl FnOnce(hash160::Hash, &PublicKey, &PublicKey, LockTime) -> ScriptBuf,
    ) {
        let node = RpcClient::new_bitcoin_regtest();
        let secp = Secp256k1::new();
        let input = fund_segwit_v0(&secp, &node, None, create_script);

        let destination = get_destination(&node);

        let fee = 1_000;
        let (tx, _) = construct_tx(
            &secp,
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

        assert_eq!(tx.output.len(), 1);
        assert_eq!(tx.output[0].script_pubkey, destination.script_pubkey());
        assert_eq!(
            tx.output[0].value,
            input.tx_out.value - Amount::from_sat(fee)
        );

        assert_eq!(send_raw_transaction(&node, &tx), tx.compute_txid());
    }

    #[rstest]
    #[case::swap_script(swap_script)]
    #[case::reverse_script(reverse_script)]
    #[serial(Bitcoin)]
    fn test_segwit_v0_refund(
        #[case] create_script: impl FnOnce(hash160::Hash, &PublicKey, &PublicKey, LockTime) -> ScriptBuf,
    ) {
        let node = RpcClient::new_bitcoin_regtest();
        let secp = Secp256k1::new();
        let input = fund_segwit_v0(&secp, &node, Some(get_block_height(&node)), create_script);

        let destination = get_destination(&node);

        let fee = 1_000;
        let (tx, _) = construct_tx(
            &secp,
            &[&input],
            &Destination::Single(&destination),
            FeeTarget::Absolute(fee),
        )
        .unwrap();

        assert_eq!(tx.output.len(), 1);
        assert_eq!(tx.output[0].script_pubkey, destination.script_pubkey());
        assert_eq!(
            tx.output[0].value,
            input.tx_out.value - Amount::from_sat(fee)
        );

        assert_eq!(send_raw_transaction(&node, &tx), tx.compute_txid());
    }

    #[rstest]
    #[case::swap_script(swap_script)]
    #[case::reverse_script(reverse_script)]
    #[serial(Bitcoin)]
    fn test_compatibility_claim(
        #[case] create_script: impl FnOnce(hash160::Hash, &PublicKey, &PublicKey, LockTime) -> ScriptBuf,
    ) {
        let node = RpcClient::new_bitcoin_regtest();
        let secp = Secp256k1::new();
        let input = fund_compatibility(&secp, &node, None, create_script);

        let destination = get_destination(&node);

        let fee = 1_000;
        let (tx, _) = construct_tx(
            &secp,
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

        assert_eq!(tx.output.len(), 1);
        assert_eq!(tx.output[0].script_pubkey, destination.script_pubkey());
        assert_eq!(
            tx.output[0].value,
            input.tx_out.value - Amount::from_sat(fee)
        );

        assert_eq!(send_raw_transaction(&node, &tx), tx.compute_txid());
    }

    #[rstest]
    #[case::swap_script(swap_script)]
    #[case::reverse_script(reverse_script)]
    #[serial(Bitcoin)]
    fn test_compatibility_refund(
        #[case] create_script: impl FnOnce(hash160::Hash, &PublicKey, &PublicKey, LockTime) -> ScriptBuf,
    ) {
        let node = RpcClient::new_bitcoin_regtest();
        let secp = Secp256k1::new();
        let input = fund_compatibility(&secp, &node, Some(get_block_height(&node)), create_script);

        let destination = get_destination(&node);

        let fee = 1_000;
        let (tx, _) = construct_tx(
            &secp,
            &[&input],
            &Destination::Single(&destination),
            FeeTarget::Absolute(fee),
        )
        .unwrap();

        assert_eq!(tx.output.len(), 1);
        assert_eq!(tx.output[0].script_pubkey, destination.script_pubkey());
        assert_eq!(
            tx.output[0].value,
            input.tx_out.value - Amount::from_sat(fee)
        );

        assert_eq!(send_raw_transaction(&node, &tx), tx.compute_txid());
    }

    #[rstest]
    #[case::swap_script(swap_script)]
    #[case::reverse_script(reverse_script)]
    #[serial(Bitcoin)]
    fn test_legacy_claim(
        #[case] create_script: impl FnOnce(hash160::Hash, &PublicKey, &PublicKey, LockTime) -> ScriptBuf,
    ) {
        let node = RpcClient::new_bitcoin_regtest();
        let secp = Secp256k1::new();
        let input = fund_legacy(&secp, &node, None, create_script);

        let destination = get_destination(&node);

        let fee = 1_000;
        let (tx, _) = construct_tx(
            &secp,
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

        assert_eq!(tx.output.len(), 1);
        assert_eq!(tx.output[0].script_pubkey, destination.script_pubkey());
        assert_eq!(
            tx.output[0].value,
            input.tx_out.value - Amount::from_sat(fee)
        );

        assert_eq!(send_raw_transaction(&node, &tx), tx.compute_txid());
    }

    #[rstest]
    #[case::swap_script(swap_script)]
    #[case::reverse_script(reverse_script)]
    #[serial(Bitcoin)]
    fn test_legacy_refund(
        #[case] create_script: impl FnOnce(hash160::Hash, &PublicKey, &PublicKey, LockTime) -> ScriptBuf,
    ) {
        let node = RpcClient::new_bitcoin_regtest();
        let secp = Secp256k1::new();
        let input = fund_legacy(&secp, &node, Some(get_block_height(&node)), create_script);

        let destination = get_destination(&node);

        let fee = 1_000;
        let (tx, _) = construct_tx(
            &secp,
            &[&input],
            &Destination::Single(&destination),
            FeeTarget::Absolute(fee),
        )
        .unwrap();

        assert_eq!(tx.output.len(), 1);
        assert_eq!(tx.output[0].script_pubkey, destination.script_pubkey());
        assert_eq!(
            tx.output[0].value,
            input.tx_out.value - Amount::from_sat(fee)
        );

        assert_eq!(send_raw_transaction(&node, &tx), tx.compute_txid());
    }

    #[test]
    #[serial(Bitcoin)]
    fn test_multiple_inputs() {
        let node = RpcClient::new_bitcoin_regtest();
        let secp = Secp256k1::new();

        let mut inputs = Vec::new();

        let (keys, tree, _, mut input) = fund_taproot(&secp, &node, None, swap_tree);
        input.output_type = OutputType::Taproot(Some(UncooperativeDetails {
            tree,
            internal_key: keys.x_only_public_key().0,
        }));
        inputs.push(input);

        let (keys, tree, _, mut input) = fund_taproot(&secp, &node, None, reverse_tree);
        input.output_type = OutputType::Taproot(Some(UncooperativeDetails {
            tree,
            internal_key: keys.x_only_public_key().0,
        }));
        inputs.push(input);

        inputs.push(fund_segwit_v0(&secp, &node, None, swap_script));
        inputs.push(fund_segwit_v0(&secp, &node, None, reverse_script));
        inputs.push(fund_compatibility(&secp, &node, None, swap_script));
        inputs.push(fund_compatibility(&secp, &node, None, reverse_script));
        inputs.push(fund_legacy(&secp, &node, None, swap_script));
        inputs.push(fund_legacy(&secp, &node, None, reverse_script));

        let destination = get_destination(&node);

        let fee_rate = 4.0;
        let (tx, fee) = construct_tx(
            &secp,
            inputs.iter().collect::<Vec<_>>().as_slice(),
            &Destination::Single(&destination),
            FeeTarget::Relative(fee_rate),
        )
        .unwrap();

        assert_eq!(tx.output.len(), 1);
        assert_eq!(tx.output[0].script_pubkey, destination.script_pubkey());
        assert_eq!(
            tx.output[0].value,
            inputs.iter().map(|i| i.tx_out.value).sum::<Amount>() - Amount::from_sat(fee)
        );

        assert_eq!(send_raw_transaction(&node, &tx), tx.compute_txid());
    }

    #[test]
    #[serial(Bitcoin)]
    fn test_multiple_outputs() {
        let node = RpcClient::new_bitcoin_regtest();
        let secp = Secp256k1::new();

        let mut inputs = Vec::new();

        let (keys, tree, _, mut input) = fund_taproot(&secp, &node, None, swap_tree);
        input.output_type = OutputType::Taproot(Some(UncooperativeDetails {
            tree,
            internal_key: keys.x_only_public_key().0,
        }));
        inputs.push(input);
        inputs.push(fund_segwit_v0(&secp, &node, None, swap_script));

        let change = get_destination(&node);
        let outputs = [
            (&get_destination(&node), 21_000),
            (&get_destination(&node), 12_123),
        ];

        let fee = 500;
        let (tx, _) = construct_tx(
            &secp,
            inputs.iter().collect::<Vec<_>>().as_slice(),
            &Destination::Multiple(Outputs {
                change: &change,
                outputs: &outputs,
            }),
            FeeTarget::Absolute(fee),
        )
        .unwrap();

        assert_eq!(tx.output.len(), outputs.len() + 1);

        assert_eq!(tx.output[0].script_pubkey, outputs[0].0.script_pubkey());
        assert_eq!(tx.output[0].value, Amount::from_sat(outputs[0].1));

        assert_eq!(tx.output[1].script_pubkey, outputs[1].0.script_pubkey());
        assert_eq!(tx.output[1].value, Amount::from_sat(outputs[1].1));

        assert_eq!(tx.output[2].script_pubkey, change.script_pubkey());
        assert_eq!(
            tx.output[2].value,
            Amount::from_sat(FUNDING_AMOUNT * inputs.len() as u64)
                - Amount::from_sat(outputs[0].1)
                - Amount::from_sat(outputs[1].1)
                - Amount::from_sat(fee)
        );

        assert_eq!(send_raw_transaction(&node, &tx), tx.compute_txid());
    }

    #[test]
    fn test_construct_raw_fee_too_high() {
        let secp = Secp256k1::new();
        let address =
            Address::from_str("bcrt1p70dqezlrn37f043fmc6m45uzflaqe6678q9ludu8ryr9s5rsn0gs3qh0vd")
                .unwrap()
                .assume_checked();

        let amount = Amount::from_sat(1000);

        let keys = Keypair::new(&secp, &mut rand::thread_rng());
        let input = InputDetail {
            input_type: InputType::Claim([0; 32]),
            output_type: OutputType::Legacy(ScriptBuf::new()),
            outpoint: OutPoint::null(),
            tx_out: TxOut {
                value: amount,
                script_pubkey: ScriptBuf::new(),
            },
            keys,
        };

        let fee = Amount::from_sat(amount.to_sat() + 1);
        let result = construct_raw(&secp, &[&input], &Destination::Single(&address), fee);

        assert!(result.is_err());
        assert_eq!(
            result.unwrap_err().to_string(),
            "fee is greater than input sum"
        );
    }

    #[test]
    fn test_construct_raw_output_sum_too_high() {
        let secp = Secp256k1::new();
        let change =
            Address::from_str("bcrt1p70dqezlrn37f043fmc6m45uzflaqe6678q9ludu8ryr9s5rsn0gs3qh0vd")
                .unwrap()
                .assume_checked();
        let dest =
            Address::from_str("bcrt1ptpycrkuwevk69j9kjnsyynk562mlafc08zh5q69seftaxr6r692sprm2p2")
                .unwrap()
                .assume_checked();

        let amount = Amount::from_sat(1000);

        let keys = Keypair::new(&secp, &mut rand::thread_rng());
        let input = InputDetail {
            input_type: InputType::Claim([0; 32]),
            output_type: OutputType::Legacy(ScriptBuf::new()),
            outpoint: OutPoint::null(),
            tx_out: TxOut {
                value: amount,
                script_pubkey: ScriptBuf::new(),
            },
            keys,
        };

        let fee = Amount::from_sat(100);
        let outputs = [(&dest, amount.to_sat() - fee.to_sat() + 1)];
        let result = construct_raw(
            &secp,
            &[&input],
            &Destination::Multiple(Outputs {
                change: &change,
                outputs: &outputs,
            }),
            fee,
        );

        assert!(result.is_err());
        assert_eq!(
            result.unwrap_err().to_string(),
            "output sum is greater than input sum"
        );
    }
}

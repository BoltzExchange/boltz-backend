use crate::{
    bitcoin::InputDetail,
    target_fee::{FeeTarget, target_fee},
    utils::OutputType,
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

const ECDSA_BYTES_TO_GRIND: usize = 2;

const PREIMAGE_DUMMY: [u8; 0] = [];

pub fn construct_tx<C: Signing + Verification>(
    secp: &Secp256k1<C>,
    inputs: &[&InputDetail],
    destination: &Address,
    fee: FeeTarget,
) -> Result<Transaction> {
    target_fee(fee, |fee| {
        construct_raw(secp, inputs, destination, Amount::from_sat(fee))
    })
}

pub fn construct_raw<C: Signing + Verification>(
    secp: &Secp256k1<C>,
    inputs: &[&InputDetail],
    destination: &Address,
    fee: Amount,
) -> Result<Transaction> {
    let total_amount = inputs.iter().map(|input| input.amount).sum::<Amount>();

    let mut tx = Transaction {
        version: Version::TWO,
        input: inputs
            .iter()
            .map(|input| TxIn {
                previous_output: input.outpoint,
                script_sig: ScriptBuf::new(),
                sequence: Sequence::ENABLE_RBF_NO_LOCKTIME,
                witness: Witness::new(),
            })
            .collect(),
        output: vec![TxOut {
            value: total_amount - fee,
            script_pubkey: destination.script_pubkey(),
        }],
        lock_time: if let Some(lock_time) = inputs
            .iter()
            .filter_map(|input| input.timeout_block_height)
            .max()
        {
            LockTime::from_height(lock_time)?
        } else {
            LockTime::ZERO
        },
    };

    let prevouts = inputs
        .iter()
        .map(|input| input.tx_out.clone())
        .collect::<Vec<_>>();
    let prevouts = Prevouts::All(&prevouts);

    let mut sighash_cache = SighashCache::new(tx.clone());

    for (i, input) in inputs.iter().enumerate() {
        if input.output_type == OutputType::Legacy {
            let witness_script = get_witness_script(i, input)?;

            let sighash = sighash_cache.legacy_signature_hash(
                i,
                witness_script,
                SIGHASH_TYPE_LEGACY.to_u32(),
            )?;

            let mut script_sig = ScriptBuf::new();
            script_sig.push_slice(
                legacy_signature(secp, &sighash.as_raw_hash(), &input.keys)?.serialize(),
            );

            if let Some(preimage) = input.preimage {
                script_sig.push_slice(preimage);
            } else {
                script_sig.push_slice(PREIMAGE_DUMMY);
            }

            script_sig.push_slice(PushBytesBuf::try_from(witness_script.clone().into_bytes())?);

            tx.input[i].script_sig = script_sig;
        } else if input.output_type == OutputType::Compatibility {
            let witness_script = get_witness_script(i, input)?;

            let nested = Builder::new()
                .push_opcode(OP_0)
                .push_slice(sha256::Hash::hash(witness_script.as_bytes()).as_byte_array());
            let nested = PushBytesBuf::try_from(nested.into_bytes())?;

            tx.input[i].script_sig = Builder::new().push_slice(nested).into_script();
        }

        if input.output_type == OutputType::Taproot {
            if let Some(uncooperative) = &input.uncooperative {
                let leaf = if input.preimage.is_some() {
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

                if let Some(preimage) = input.preimage {
                    witness.push(preimage);
                }

                witness.push(leaf.output.as_bytes());
                witness.push(control_block.serialize());

                tx.input[i].witness = witness;
            } else {
                tx.input[i].witness = stubbed_cooperative_witness();
            }
        } else if input.output_type == OutputType::SegwitV0
            || input.output_type == OutputType::Compatibility
        {
            let witness_script = get_witness_script(i, input)?;

            let sighash = sighash_cache.p2wsh_signature_hash(
                i,
                witness_script,
                input.amount,
                SIGHASH_TYPE_LEGACY,
            )?;

            let mut witness = Witness::new();
            witness.push(legacy_signature(secp, &sighash.as_raw_hash(), &input.keys)?.serialize());

            if let Some(preimage) = input.preimage {
                witness.push(preimage);
            } else {
                witness.push(PREIMAGE_DUMMY);
            }

            witness.push(witness_script.as_bytes());

            tx.input[i].witness = witness;
        }
    }

    Ok(tx)
}

fn stubbed_cooperative_witness() -> Witness {
    let mut witness = Witness::new();
    // Stub because we don't want to create cooperative signatures here
    // but still be able to have an accurate size estimation
    witness.push([0; 64]);
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

fn get_witness_script(index: usize, input: &InputDetail) -> Result<&ScriptBuf> {
    match &input.witness_script {
        Some(witness_script) => Ok(witness_script),
        None => Err(anyhow::anyhow!(
            "witness script is missing for input {}",
            index
        )),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{
        bitcoin::{
            Tree, UncooperativeDetails, reverse_script, reverse_tree, swap_script, swap_tree,
        },
        detect_preimage,
    };
    use bitcoin::{
        OutPoint, XOnlyPublicKey,
        hashes::hash160,
        key::{Keypair, rand::RngCore},
        secp256k1::{PublicKey, Signing, Verification, rand},
        taproot::TaprootSpendInfo,
    };
    use corepc_node::Node;
    use rstest::rstest;

    fn setup_node() -> Node {
        let node = corepc_node::Node::new(corepc_node::exe_path().unwrap()).unwrap();
        node.client
            .generate_to_address(
                102,
                &node
                    .client
                    .get_new_address(None, None)
                    .unwrap()
                    .address()
                    .unwrap()
                    .assume_checked(),
            )
            .unwrap();

        node
    }

    fn fund_address(node: &Node, address: &Address) -> (Amount, Transaction, usize) {
        let funding_amount = Amount::from_sat(100_000);
        let funding_tx = node
            .client
            .send_to_address(address, funding_amount)
            .unwrap();

        let funding_tx = node
            .client
            .get_raw_transaction(funding_tx.txid().unwrap())
            .unwrap()
            .transaction()
            .unwrap();

        let vout_index = funding_tx
            .output
            .iter()
            .position(|output| output.script_pubkey == address.script_pubkey())
            .unwrap();

        (funding_amount, funding_tx, vout_index)
    }

    fn get_destination(node: &Node) -> Address {
        node.client
            .get_new_address(None, None)
            .unwrap()
            .address()
            .unwrap()
            .assume_checked()
    }

    fn fund_taproot<
        C: Signing + Verification,
        T: FnOnce(hash160::Hash, &XOnlyPublicKey, &XOnlyPublicKey, LockTime) -> Tree,
    >(
        secp: &Secp256k1<C>,
        node: &Node,
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
        let (funding_amount, funding_tx, vout_index) = fund_address(node, &address);

        (
            keys,
            tree,
            tweak,
            InputDetail {
                output_type: OutputType::Taproot,
                outpoint: OutPoint::new(funding_tx.compute_txid(), vout_index as u32),
                tx_out: funding_tx.tx_out(vout_index).unwrap().clone(),
                amount: funding_amount,
                preimage: if lock_time.is_none() {
                    Some(preimage)
                } else {
                    None
                },
                timeout_block_height: lock_time,
                keys: if lock_time.is_none() {
                    claim_keys
                } else {
                    refund_keys
                },
                witness_script: None,
                uncooperative: None,
            },
        )
    }

    fn fund_segwit_v0<
        C: Signing + Verification,
        T: FnOnce(hash160::Hash, &PublicKey, &PublicKey, LockTime) -> ScriptBuf,
    >(
        secp: &Secp256k1<C>,
        node: &Node,
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
        let (funding_amount, funding_tx, vout_index) = fund_address(node, &address);

        InputDetail {
            output_type: OutputType::SegwitV0,
            outpoint: OutPoint::new(funding_tx.compute_txid(), vout_index as u32),
            tx_out: funding_tx.tx_out(vout_index).unwrap().clone(),
            amount: funding_amount,
            preimage: if lock_time.is_none() {
                Some(preimage)
            } else {
                None
            },
            timeout_block_height: lock_time,
            keys: if lock_time.is_none() {
                claim_keys
            } else {
                refund_keys
            },
            witness_script: Some(script),
            uncooperative: None,
        }
    }

    fn fund_compatibility<
        C: Signing + Verification,
        T: FnOnce(hash160::Hash, &PublicKey, &PublicKey, LockTime) -> ScriptBuf,
    >(
        secp: &Secp256k1<C>,
        node: &Node,
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
        let (funding_amount, funding_tx, vout_index) = fund_address(node, &address);

        InputDetail {
            output_type: OutputType::Compatibility,
            outpoint: OutPoint::new(funding_tx.compute_txid(), vout_index as u32),
            tx_out: funding_tx.tx_out(vout_index).unwrap().clone(),
            amount: funding_amount,
            preimage: if lock_time.is_none() {
                Some(preimage)
            } else {
                None
            },
            timeout_block_height: lock_time,
            keys: if lock_time.is_none() {
                claim_keys
            } else {
                refund_keys
            },
            witness_script: Some(script),
            uncooperative: None,
        }
    }

    fn fund_legacy<
        C: Signing + Verification,
        T: FnOnce(hash160::Hash, &PublicKey, &PublicKey, LockTime) -> ScriptBuf,
    >(
        secp: &Secp256k1<C>,
        node: &Node,
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
        let (funding_amount, funding_tx, vout_index) = fund_address(node, &address);

        InputDetail {
            output_type: OutputType::Legacy,
            outpoint: OutPoint::new(funding_tx.compute_txid(), vout_index as u32),
            tx_out: funding_tx.tx_out(vout_index).unwrap().clone(),
            amount: funding_amount,
            preimage: if lock_time.is_none() {
                Some(preimage)
            } else {
                None
            },
            timeout_block_height: lock_time,
            keys: if lock_time.is_none() {
                claim_keys
            } else {
                refund_keys
            },
            witness_script: Some(script),
            uncooperative: None,
        }
    }

    #[rstest]
    #[case::swap_tree(swap_tree)]
    #[case::reverse_tree(reverse_tree)]
    fn test_taproot_claim_cooperative(
        #[case] create_tree: impl FnOnce(
            hash160::Hash,
            &XOnlyPublicKey,
            &XOnlyPublicKey,
            LockTime,
        ) -> Tree,
    ) {
        let node = setup_node();
        let secp = Secp256k1::new();
        let (keys, _, tweak, input) = fund_taproot(&secp, &node, None, create_tree);

        let destination = get_destination(&node);

        let fee = 1_000;
        let mut tx =
            construct_tx(&secp, &[&input], &destination, FeeTarget::Absolute(fee)).unwrap();

        assert_eq!(tx.output.len(), 1);
        assert_eq!(tx.output[0].script_pubkey, destination.script_pubkey());
        assert_eq!(tx.output[0].value, input.amount - Amount::from_sat(fee));

        let sighash = SighashCache::new(tx.clone())
            .taproot_key_spend_signature_hash(
                0,
                &Prevouts::All(&[input.tx_out.clone()]),
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

        let broadcast = node.client.send_raw_transaction(&tx).unwrap();
        assert_eq!(broadcast.txid().unwrap(), tx.compute_txid());
    }

    #[rstest]
    #[case::swap_tree(swap_tree)]
    #[case::reverse_tree(reverse_tree)]
    fn test_taproot_claim_uncooperative(
        #[case] create_tree: impl FnOnce(
            hash160::Hash,
            &XOnlyPublicKey,
            &XOnlyPublicKey,
            LockTime,
        ) -> Tree,
    ) {
        let node = setup_node();
        let secp = Secp256k1::new();
        let (keys, tree, _, mut input) = fund_taproot(&secp, &node, None, create_tree);

        input.uncooperative = Some(UncooperativeDetails {
            tree,
            internal_key: keys.x_only_public_key().0,
        });

        let destination = get_destination(&node);

        let fee = 1_000;
        let tx = construct_tx(&secp, &[&input], &destination, FeeTarget::Absolute(fee)).unwrap();

        assert_eq!(
            detect_preimage(&tx.input[0]).unwrap(),
            input.preimage.unwrap()
        );

        assert_eq!(tx.output.len(), 1);
        assert_eq!(tx.output[0].script_pubkey, destination.script_pubkey());
        assert_eq!(tx.output[0].value, input.amount - Amount::from_sat(fee));

        let broadcast = node.client.send_raw_transaction(&tx).unwrap();
        assert_eq!(broadcast.txid().unwrap(), tx.compute_txid());
    }

    #[rstest]
    #[case::swap_tree(swap_tree)]
    #[case::reverse_tree(reverse_tree)]
    fn test_taproot_refund_uncooperative(
        #[case] create_tree: impl FnOnce(
            hash160::Hash,
            &XOnlyPublicKey,
            &XOnlyPublicKey,
            LockTime,
        ) -> Tree,
    ) {
        let node = setup_node();
        let blocks = node.client.get_blockchain_info().unwrap().blocks;
        let secp = Secp256k1::new();
        let (keys, tree, _, mut input) =
            fund_taproot(&secp, &node, Some(blocks as u32), create_tree);

        input.preimage = None;
        input.uncooperative = Some(UncooperativeDetails {
            tree,
            internal_key: keys.x_only_public_key().0,
        });

        let destination = get_destination(&node);

        let fee = 1_000;
        let tx = construct_tx(&secp, &[&input], &destination, FeeTarget::Absolute(fee)).unwrap();

        assert_eq!(tx.output.len(), 1);
        assert_eq!(tx.output[0].script_pubkey, destination.script_pubkey());
        assert_eq!(tx.output[0].value, input.amount - Amount::from_sat(fee));

        let broadcast = node.client.send_raw_transaction(&tx).unwrap();
        assert_eq!(broadcast.txid().unwrap(), tx.compute_txid());
    }

    #[rstest]
    #[case::swap_tree(swap_tree)]
    #[case::reverse_tree(reverse_tree)]
    fn test_taproot_claim_cooperative_relative_fee(
        #[case] create_tree: impl FnOnce(
            hash160::Hash,
            &XOnlyPublicKey,
            &XOnlyPublicKey,
            LockTime,
        ) -> Tree,
    ) {
        let node = setup_node();
        let secp = Secp256k1::new();
        let (keys, _, tweak, input) = fund_taproot(&secp, &node, None, create_tree);

        let destination = get_destination(&node);

        let fee = 3.0;
        let mut tx =
            construct_tx(&secp, &[&input], &destination, FeeTarget::Relative(fee)).unwrap();

        assert_eq!(tx.output.len(), 1);
        assert_eq!(tx.output[0].script_pubkey, destination.script_pubkey());

        let sighash = SighashCache::new(tx.clone())
            .taproot_key_spend_signature_hash(
                0,
                &Prevouts::All(&[input.tx_out.clone()]),
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
            input.amount - Amount::from_sat(fee as u64 * (tx.vsize() as u64 + 1))
        );

        let broadcast = node.client.send_raw_transaction(&tx).unwrap();
        assert_eq!(broadcast.txid().unwrap(), tx.compute_txid());
    }

    #[rstest]
    #[case::swap_tree(swap_tree)]
    #[case::reverse_tree(reverse_tree)]
    fn test_taproot_claim_uncooperative_relative_fee(
        #[case] create_tree: impl FnOnce(
            hash160::Hash,
            &XOnlyPublicKey,
            &XOnlyPublicKey,
            LockTime,
        ) -> Tree,
    ) {
        let node = setup_node();
        let secp = Secp256k1::new();
        let (keys, tree, _, mut input) = fund_taproot(&secp, &node, None, create_tree);

        input.uncooperative = Some(UncooperativeDetails {
            tree,
            internal_key: keys.x_only_public_key().0,
        });

        let destination = get_destination(&node);

        let fee = 3.0;
        let tx = construct_tx(&secp, &[&input], &destination, FeeTarget::Relative(fee)).unwrap();

        assert_eq!(
            detect_preimage(&tx.input[0]).unwrap(),
            input.preimage.unwrap()
        );

        assert_eq!(tx.output.len(), 1);
        assert_eq!(tx.output[0].script_pubkey, destination.script_pubkey());
        assert_eq!(
            tx.output[0].value,
            input.amount - Amount::from_sat(fee as u64 * (tx.vsize() as u64 + 1))
        );

        let broadcast = node.client.send_raw_transaction(&tx).unwrap();
        assert_eq!(broadcast.txid().unwrap(), tx.compute_txid());
    }

    #[rstest]
    #[case::swap_script(swap_script)]
    #[case::reverse_script(reverse_script)]
    fn test_segwit_v0_claim(
        #[case] create_script: impl FnOnce(hash160::Hash, &PublicKey, &PublicKey, LockTime) -> ScriptBuf,
    ) {
        let node = setup_node();
        let secp = Secp256k1::new();
        let input = fund_segwit_v0(&secp, &node, None, create_script);

        let destination = get_destination(&node);

        let fee = 1_000;
        let tx = construct_tx(&secp, &[&input], &destination, FeeTarget::Absolute(fee)).unwrap();

        assert_eq!(
            detect_preimage(&tx.input[0]).unwrap(),
            input.preimage.unwrap()
        );

        assert_eq!(tx.output.len(), 1);
        assert_eq!(tx.output[0].script_pubkey, destination.script_pubkey());
        assert_eq!(tx.output[0].value, input.amount - Amount::from_sat(fee));

        let broadcast = node.client.send_raw_transaction(&tx).unwrap();
        assert_eq!(broadcast.txid().unwrap(), tx.compute_txid());
    }

    #[rstest]
    #[case::swap_script(swap_script)]
    #[case::reverse_script(reverse_script)]
    fn test_segwit_v0_refund(
        #[case] create_script: impl FnOnce(hash160::Hash, &PublicKey, &PublicKey, LockTime) -> ScriptBuf,
    ) {
        let node = setup_node();
        let blocks = node.client.get_blockchain_info().unwrap().blocks;
        let secp = Secp256k1::new();
        let input = fund_segwit_v0(&secp, &node, Some(blocks as u32), create_script);

        let destination = get_destination(&node);

        let fee = 1_000;
        let tx = construct_tx(&secp, &[&input], &destination, FeeTarget::Absolute(fee)).unwrap();

        assert_eq!(tx.output.len(), 1);
        assert_eq!(tx.output[0].script_pubkey, destination.script_pubkey());
        assert_eq!(tx.output[0].value, input.amount - Amount::from_sat(fee));

        let broadcast = node.client.send_raw_transaction(&tx).unwrap();
        assert_eq!(broadcast.txid().unwrap(), tx.compute_txid());
    }

    #[rstest]
    #[case::swap_script(swap_script)]
    #[case::reverse_script(reverse_script)]
    fn test_compatibility_claim(
        #[case] create_script: impl FnOnce(hash160::Hash, &PublicKey, &PublicKey, LockTime) -> ScriptBuf,
    ) {
        let node = setup_node();
        let secp = Secp256k1::new();
        let input = fund_compatibility(&secp, &node, None, create_script);

        let destination = get_destination(&node);

        let fee = 1_000;
        let tx = construct_tx(&secp, &[&input], &destination, FeeTarget::Absolute(fee)).unwrap();

        assert_eq!(
            detect_preimage(&tx.input[0]).unwrap(),
            input.preimage.unwrap()
        );

        assert_eq!(tx.output.len(), 1);
        assert_eq!(tx.output[0].script_pubkey, destination.script_pubkey());
        assert_eq!(tx.output[0].value, input.amount - Amount::from_sat(fee));

        let broadcast = node.client.send_raw_transaction(&tx).unwrap();
        assert_eq!(broadcast.txid().unwrap(), tx.compute_txid());
    }

    #[rstest]
    #[case::swap_script(swap_script)]
    #[case::reverse_script(reverse_script)]
    fn test_compatibility_refund(
        #[case] create_script: impl FnOnce(hash160::Hash, &PublicKey, &PublicKey, LockTime) -> ScriptBuf,
    ) {
        let node = setup_node();
        let blocks = node.client.get_blockchain_info().unwrap().blocks;
        let secp = Secp256k1::new();
        let input = fund_compatibility(&secp, &node, Some(blocks as u32), create_script);

        let destination = get_destination(&node);

        let fee = 1_000;
        let tx = construct_tx(&secp, &[&input], &destination, FeeTarget::Absolute(fee)).unwrap();

        assert_eq!(tx.output.len(), 1);
        assert_eq!(tx.output[0].script_pubkey, destination.script_pubkey());
        assert_eq!(tx.output[0].value, input.amount - Amount::from_sat(fee));

        let broadcast = node.client.send_raw_transaction(&tx).unwrap();
        assert_eq!(broadcast.txid().unwrap(), tx.compute_txid());
    }

    #[rstest]
    #[case::swap_script(swap_script)]
    #[case::reverse_script(reverse_script)]
    fn test_legacy_claim(
        #[case] create_script: impl FnOnce(hash160::Hash, &PublicKey, &PublicKey, LockTime) -> ScriptBuf,
    ) {
        let node = setup_node();
        let secp = Secp256k1::new();
        let input = fund_legacy(&secp, &node, None, create_script);

        let destination = get_destination(&node);

        let fee = 1_000;
        let tx = construct_tx(&secp, &[&input], &destination, FeeTarget::Absolute(fee)).unwrap();

        assert_eq!(
            detect_preimage(&tx.input[0]).unwrap(),
            input.preimage.unwrap()
        );

        assert_eq!(tx.output.len(), 1);
        assert_eq!(tx.output[0].script_pubkey, destination.script_pubkey());
        assert_eq!(tx.output[0].value, input.amount - Amount::from_sat(fee));

        let broadcast = node.client.send_raw_transaction(&tx).unwrap();
        assert_eq!(broadcast.txid().unwrap(), tx.compute_txid());
    }

    #[rstest]
    #[case::swap_script(swap_script)]
    #[case::reverse_script(reverse_script)]
    fn test_legacy_refund(
        #[case] create_script: impl FnOnce(hash160::Hash, &PublicKey, &PublicKey, LockTime) -> ScriptBuf,
    ) {
        let node = setup_node();
        let blocks = node.client.get_blockchain_info().unwrap().blocks;
        let secp = Secp256k1::new();
        let input = fund_legacy(&secp, &node, Some(blocks as u32), create_script);

        let destination = get_destination(&node);

        let fee = 1_000;
        let tx = construct_tx(&secp, &[&input], &destination, FeeTarget::Absolute(fee)).unwrap();

        assert_eq!(tx.output.len(), 1);
        assert_eq!(tx.output[0].script_pubkey, destination.script_pubkey());
        assert_eq!(tx.output[0].value, input.amount - Amount::from_sat(fee));

        let broadcast = node.client.send_raw_transaction(&tx).unwrap();
        assert_eq!(broadcast.txid().unwrap(), tx.compute_txid());
    }
}

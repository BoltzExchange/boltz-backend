use crate::{
    bitcoin::ClaimDetail,
    target_fee::{FeeTarget, target_fee},
    utils::OutputType,
};
use anyhow::Result;
use bitcoin::{
    Address, Amount, EcdsaSighashType, ScriptBuf, Sequence, TapSighashType, TxIn, TxOut, Witness,
    absolute::LockTime,
    ecdsa,
    hashes::Hash,
    opcodes::{OP_0, all::OP_PUSHDATA1},
    script::{Builder, PushBytesBuf},
    secp256k1::{Message, Secp256k1, Signing, Verification},
    sighash::{Prevouts, SighashCache},
    taproot::{self, LeafVersion},
    transaction::{Transaction, Version},
};

const SIGHASH_TYPE_LEGACY: EcdsaSighashType = EcdsaSighashType::All;
const SIGHASH_TYPE_TAPROOT: TapSighashType = TapSighashType::Default;

const ECDSA_BYTES_TO_GRIND: usize = 1;

pub fn claim<C: Signing + Verification>(
    secp: &Secp256k1<C>,
    inputs: &[&ClaimDetail],
    destination: &Address,
    fee: FeeTarget,
) -> Result<Transaction> {
    target_fee(fee, |fee| {
        construct_claim(secp, inputs, destination, Amount::from_sat(fee))
    })
}

// TODO: non taproot testing
fn construct_claim<C: Signing + Verification>(
    secp: &Secp256k1<C>,
    inputs: &[&ClaimDetail],
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
        lock_time: LockTime::ZERO,
    };

    let prevouts = inputs
        .iter()
        .map(|input| input.tx_out.clone())
        .collect::<Vec<_>>();
    let prevouts = Prevouts::All(&prevouts);

    let mut sighash_cache = SighashCache::new(tx.clone());

    for (i, input) in inputs.iter().enumerate() {
        if input.output_type == OutputType::Legacy {
            let witness_script = match &input.witness_script {
                Some(witness_script) => witness_script,
                None => return Err(anyhow::anyhow!("witness script is missing for input {}", i)),
            };

            let sighash = sighash_cache.legacy_signature_hash(
                i,
                witness_script,
                SIGHASH_TYPE_LEGACY.to_u32(),
            )?;

            let sig = ecdsa::Signature {
                sighash_type: SIGHASH_TYPE_LEGACY,
                signature: secp.sign_ecdsa_grind_r(
                    &Message::from_digest_slice(sighash.as_raw_hash().as_byte_array())?,
                    &input.keys.secret_key(),
                    ECDSA_BYTES_TO_GRIND,
                ),
            };

            let witness_script = PushBytesBuf::try_from(witness_script.clone().into_bytes())?;

            let buf = Builder::new()
                .push_slice(sig.serialize())
                .push_slice(input.preimage)
                .push_opcode(OP_PUSHDATA1)
                .push_slice(witness_script);

            tx.input[i].script_sig = buf.into_script();
        } else if input.output_type == OutputType::Compatibility {
            let witness_script = match &input.witness_script {
                Some(witness_script) => witness_script,
                None => return Err(anyhow::anyhow!("witness script is missing for input {}", i)),
            };

            let nested = Builder::new().push_opcode(OP_0).push_slice(
                bitcoin::hashes::sha256::Hash::hash(witness_script.as_bytes()).as_byte_array(),
            );

            tx.input[i].script_sig = nested.into_script();
        }

        if input.output_type == OutputType::Taproot {
            if let Some(uncooperative) = &input.uncooperative {
                let leaf_hash = uncooperative.tree.claim_leaf.leaf_hash()?;

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
                    .map_err(|e| anyhow::anyhow!("could not finalize taproot builder: {:?}", e))?
                    .control_block(&(
                        uncooperative.tree.claim_leaf.output.clone(),
                        LeafVersion::from_consensus(uncooperative.tree.claim_leaf.version)?,
                    ))
                    .ok_or(anyhow::anyhow!("could not create control block"))?;

                let mut witness = Witness::new();

                witness.push(sig.serialize());
                witness.push(input.preimage);
                witness.push(uncooperative.tree.claim_leaf.output.as_bytes());
                witness.push(control_block.serialize());

                tx.input[i].witness = witness;
            } else {
                tx.input[i].witness = stubbed_cooperative_witness();
            }
        } else if input.output_type == OutputType::SegwitV0
            || input.output_type == OutputType::Compatibility
        {
            let witness_script = match &input.witness_script {
                Some(witness_script) => witness_script,
                None => return Err(anyhow::anyhow!("witness script is missing for input {}", i)),
            };

            let sighash = sighash_cache.p2wsh_signature_hash(
                i,
                witness_script,
                input.amount,
                SIGHASH_TYPE_LEGACY,
            )?;

            let sig = ecdsa::Signature {
                sighash_type: SIGHASH_TYPE_LEGACY,
                signature: secp.sign_ecdsa_grind_r(
                    &Message::from_digest_slice(sighash.as_raw_hash().as_byte_array())?,
                    &input.keys.secret_key(),
                    ECDSA_BYTES_TO_GRIND,
                ),
            };

            let mut witness = Witness::new();
            witness.push(sig.serialize());
            witness.push(input.preimage);
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

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{Tree, UncooperativeDetails, swap_tree};
    use bitcoin::{
        OutPoint,
        hashes::hash160,
        key::{Keypair, rand::RngCore},
        secp256k1::rand,
        taproot::TaprootSpendInfo,
    };
    use corepc_node::Node;

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

    fn get_destination(node: &Node) -> Address {
        node.client
            .get_new_address(None, None)
            .unwrap()
            .address()
            .unwrap()
            .assume_checked()
    }

    fn fund(node: &Node) -> (Keypair, Tree, TaprootSpendInfo, ClaimDetail) {
        let mut preimage = [0; 32];
        rand::thread_rng().try_fill_bytes(&mut preimage).unwrap();

        let secp = Secp256k1::new();
        let claim_keys = Keypair::new(&secp, &mut rand::thread_rng());

        let tree = swap_tree(
            hash160::Hash::hash(&preimage),
            &claim_keys.x_only_public_key().0,
            &Keypair::new(&secp, &mut rand::thread_rng())
                .x_only_public_key()
                .0,
            LockTime::from_height(123).unwrap(),
        );

        let keys = Keypair::new(&secp, &mut rand::thread_rng());
        let tweak = tree
            .build()
            .unwrap()
            .finalize(&secp, keys.x_only_public_key().0)
            .unwrap();

        let address = Address::p2tr_tweaked(tweak.output_key(), bitcoin::network::Network::Regtest);

        let funding_amount = Amount::from_sat(100_000);
        let funding_tx = node
            .client
            .send_to_address(&address, funding_amount)
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

        (
            keys,
            tree,
            tweak,
            ClaimDetail {
                output_type: OutputType::Taproot,
                outpoint: OutPoint::new(funding_tx.compute_txid(), vout_index as u32),
                tx_out: funding_tx.tx_out(vout_index).unwrap().clone(),
                amount: funding_amount,
                preimage,
                keys: claim_keys,
                witness_script: None,
                uncooperative: None,
            },
        )
    }

    #[test]
    fn test_taproot_claim_cooperative() {
        let node = setup_node();
        let (keys, _, tweak, input) = fund(&node);
        let secp = Secp256k1::new();

        let destination = get_destination(&node);

        let fee = 1_000;
        let mut tx = claim(&secp, &[&input], &destination, FeeTarget::Absolute(fee)).unwrap();

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

    #[test]
    fn test_taproot_claim_uncooperative() {
        let node = setup_node();
        let (keys, tree, _, mut input) = fund(&node);

        let secp = Secp256k1::new();
        input.uncooperative = Some(UncooperativeDetails {
            tree,
            internal_key: keys.x_only_public_key().0,
        });

        let destination = get_destination(&node);

        let fee = 1_000;
        let tx = claim(&secp, &[&input], &destination, FeeTarget::Absolute(fee)).unwrap();

        assert_eq!(tx.output.len(), 1);
        assert_eq!(tx.output[0].script_pubkey, destination.script_pubkey());
        assert_eq!(tx.output[0].value, input.amount - Amount::from_sat(fee));

        let broadcast = node.client.send_raw_transaction(&tx).unwrap();
        assert_eq!(broadcast.txid().unwrap(), tx.compute_txid());
    }

    #[test]
    fn test_taproot_claim_uncooperative_relative_fee() {
        let node = setup_node();
        let (keys, tree, _, mut input) = fund(&node);

        let secp = Secp256k1::new();
        input.uncooperative = Some(UncooperativeDetails {
            tree,
            internal_key: keys.x_only_public_key().0,
        });

        let destination = get_destination(&node);

        let fee = 3.0;
        let tx = claim(&secp, &[&input], &destination, FeeTarget::Relative(fee)).unwrap();

        assert_eq!(tx.output.len(), 1);
        assert_eq!(tx.output[0].script_pubkey, destination.script_pubkey());
        assert_eq!(
            tx.output[0].value,
            input.amount - Amount::from_sat(fee as u64 * (tx.vsize() as u64 + 1))
        );

        let broadcast = node.client.send_raw_transaction(&tx).unwrap();
        assert_eq!(broadcast.txid().unwrap(), tx.compute_txid());
    }
}

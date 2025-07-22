use crate::elements::{Tapleaf, Tree};
use elements::{
    LockTime,
    hashes::hash160,
    opcodes::all::{OP_CHECKSIG, OP_CHECKSIGVERIFY, OP_CLTV, OP_EQUALVERIFY, OP_HASH160},
    pset::serialize::Serialize,
    script::Builder,
    secp256k1_zkp::XOnlyPublicKey,
    taproot::TAPROOT_LEAF_TAPSCRIPT,
};

// TODO: test

pub fn swap_tree(
    preimage_hash: hash160::Hash,
    claim_pubkey: &XOnlyPublicKey,
    refund_pubkey: &XOnlyPublicKey,
    lock_time: LockTime,
) -> Tree {
    Tree {
        claim_leaf: Tapleaf {
            version: TAPROOT_LEAF_TAPSCRIPT,
            output: Builder::new()
                .push_opcode(OP_HASH160)
                .push_slice(&preimage_hash.serialize())
                .push_opcode(OP_EQUALVERIFY)
                .push_slice(&claim_pubkey.serialize())
                .push_opcode(OP_CHECKSIG)
                .into_script(),
        },
        refund_leaf: refund_leaf(refund_pubkey, lock_time),
        covenant_claim_leaf: None,
    }
}

pub fn refund_leaf(refund_pubkey: &XOnlyPublicKey, lock_time: LockTime) -> Tapleaf {
    Tapleaf {
        version: TAPROOT_LEAF_TAPSCRIPT,
        output: Builder::new()
            .push_slice(&refund_pubkey.serialize())
            .push_opcode(OP_CHECKSIGVERIFY)
            .push_int(lock_time.to_consensus_u32().into())
            .push_opcode(OP_CLTV)
            .into_script(),
    }
}

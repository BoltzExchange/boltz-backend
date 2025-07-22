use crate::elements::{
    Tapleaf, Tree,
    scripts::{
        introspection::{ClaimCovenantParams, PREIMAGE_SIZE, create_covenant_claim_leaf},
        swap_tree::refund_leaf,
    },
};
use elements::{
    LockTime,
    hashes::hash160,
    opcodes::all::{OP_CHECKSIG, OP_EQUALVERIFY, OP_HASH160, OP_SIZE},
    pset::serialize::Serialize,
    script::Builder,
    secp256k1_zkp::XOnlyPublicKey,
    taproot::TAPROOT_LEAF_TAPSCRIPT,
};

// TODO: test

pub fn reverse_tree(
    preimage_hash: hash160::Hash,
    claim_pubkey: &XOnlyPublicKey,
    refund_pubkey: &XOnlyPublicKey,
    lock_time: LockTime,
    claim_covenant_params: Option<&ClaimCovenantParams>,
) -> Tree {
    Tree {
        claim_leaf: Tapleaf {
            version: TAPROOT_LEAF_TAPSCRIPT,
            output: Builder::new()
                .push_opcode(OP_SIZE)
                .push_int(PREIMAGE_SIZE)
                .push_opcode(OP_EQUALVERIFY)
                .push_opcode(OP_HASH160)
                .push_slice(&preimage_hash.serialize())
                .push_opcode(OP_EQUALVERIFY)
                .push_slice(&claim_pubkey.serialize())
                .push_opcode(OP_CHECKSIG)
                .into_script(),
        },
        refund_leaf: refund_leaf(refund_pubkey, lock_time),
        covenant_claim_leaf: claim_covenant_params
            .map(|params| create_covenant_claim_leaf(preimage_hash, params)),
    }
}

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

#[cfg(test)]
mod tests {
    use super::*;
    use std::str::FromStr;

    #[test]
    fn test_swap_tree() {
        let claim_pubkey = XOnlyPublicKey::from_str(
            "50d47b462154253db0fcdc63323d50fffef708a4bdce34a34958c46051d1e997",
        )
        .unwrap();
        let refund_pubkey = XOnlyPublicKey::from_str(
            "6ecd3e58ebe0a558badb9a083a365530e1de168dfa410233433f2b2e3c7f4438",
        )
        .unwrap();

        let preimage_hash =
            hash160::Hash::from_str("0be3e65567f55ff6ac791bd4f65f672bcaf5f211").unwrap();

        let tree = swap_tree(
            preimage_hash,
            &claim_pubkey,
            &refund_pubkey,
            LockTime::from_height(123_321).unwrap(),
        );

        assert_eq!(tree.claim_leaf.version, 196);
        assert_eq!(
            hex::encode(tree.claim_leaf.output.as_bytes()),
            "a9140be3e65567f55ff6ac791bd4f65f672bcaf5f211882050d47b462154253db0fcdc63323d50fffef708a4bdce34a34958c46051d1e997ac"
        );

        assert_eq!(tree.refund_leaf.version, 196);
        assert_eq!(
            hex::encode(tree.refund_leaf.output.as_bytes()),
            "206ecd3e58ebe0a558badb9a083a365530e1de168dfa410233433f2b2e3c7f4438ad03b9e101b1"
        );
    }
}

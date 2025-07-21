use crate::bitcoin::scripts::{Tapleaf, Tree};
use bitcoin::{
    XOnlyPublicKey,
    absolute::LockTime,
    hashes::{Hash, hash160},
    opcodes::all::{OP_CHECKSIG, OP_CHECKSIGVERIFY, OP_CLTV, OP_EQUALVERIFY, OP_HASH160},
    script::Builder,
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
                .push_slice(preimage_hash.to_byte_array())
                .push_opcode(OP_EQUALVERIFY)
                .push_x_only_key(claim_pubkey)
                .push_opcode(OP_CHECKSIG)
                .into_script(),
        },
        refund_leaf: refund_leaf(refund_pubkey, lock_time),
    }
}

pub fn refund_leaf(refund_pubkey: &XOnlyPublicKey, lock_time: LockTime) -> Tapleaf {
    Tapleaf {
        version: TAPROOT_LEAF_TAPSCRIPT,
        output: Builder::new()
            .push_x_only_key(refund_pubkey)
            .push_opcode(OP_CHECKSIGVERIFY)
            .push_lock_time(lock_time)
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
            "814fe2b5ce0e3fe5787fade9a4357a743c4ce6de473e5f29daf42112e47db25a",
        )
        .unwrap();
        let refund_pubkey = XOnlyPublicKey::from_str(
            "0095b23ac89f523cdbcd791d3325ada7ddb30fd6134bb7fff22ba1e00414cb7d",
        )
        .unwrap();

        let preimage_hash =
            hash160::Hash::from_str("34e64e5b1373a872019ee2c7791cf4264d1079de").unwrap();

        let tree = swap_tree(
            preimage_hash,
            &claim_pubkey,
            &refund_pubkey,
            LockTime::from_height(123).unwrap(),
        );

        assert_eq!(tree.claim_leaf.version, 192);
        assert_eq!(
            hex::encode(tree.claim_leaf.output.to_bytes()),
            "a91434e64e5b1373a872019ee2c7791cf4264d1079de8820814fe2b5ce0e3fe5787fade9a4357a743c4ce6de473e5f29daf42112e47db25aac"
        );

        assert_eq!(tree.refund_leaf.version, 192);
        assert_eq!(
            hex::encode(tree.refund_leaf.output.to_bytes()),
            "200095b23ac89f523cdbcd791d3325ada7ddb30fd6134bb7fff22ba1e00414cb7dad017bb1"
        );
    }
}

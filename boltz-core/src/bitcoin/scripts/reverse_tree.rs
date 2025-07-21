use crate::bitcoin::scripts::{Tapleaf, Tree, swap_tree::refund_leaf};
use bitcoin::{
    XOnlyPublicKey,
    absolute::LockTime,
    hashes::{Hash, hash160},
    opcodes::all::{OP_CHECKSIG, OP_EQUALVERIFY, OP_HASH160, OP_SIZE},
    script::Builder,
    taproot::TAPROOT_LEAF_TAPSCRIPT,
};

pub fn reverse_tree(
    preimage_hash: hash160::Hash,
    claim_pubkey: &XOnlyPublicKey,
    refund_pubkey: &XOnlyPublicKey,
    lock_time: LockTime,
) -> Tree {
    Tree {
        claim_leaf: Tapleaf {
            version: TAPROOT_LEAF_TAPSCRIPT,
            output: Builder::new()
                .push_opcode(OP_SIZE)
                .push_int(32)
                .push_opcode(OP_EQUALVERIFY)
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

#[cfg(test)]
mod tests {
    use super::*;
    use std::str::FromStr;

    #[test]
    fn test_swap_tree() {
        let claim_pubkey = XOnlyPublicKey::from_str(
            "97f2ea5402afd2e90130e84d97e455f67493a956c20faedce32086516ef9f12e",
        )
        .unwrap();
        let refund_pubkey = XOnlyPublicKey::from_str(
            "fd5b65357aea1c11ecf8fc9dbddc36fdd448f87f387e04e0ed399eb8ac131b3c",
        )
        .unwrap();

        let preimage_hash =
            hash160::Hash::from_str("761de3d1f1f54cc8b3beec0a1ad03820a2e12b90").unwrap();

        let tree = reverse_tree(
            preimage_hash,
            &claim_pubkey,
            &refund_pubkey,
            LockTime::from_height(123).unwrap(),
        );

        assert_eq!(tree.claim_leaf.version, 192);
        assert_eq!(
            hex::encode(tree.claim_leaf.output.to_bytes()),
            "82012088a914761de3d1f1f54cc8b3beec0a1ad03820a2e12b90882097f2ea5402afd2e90130e84d97e455f67493a956c20faedce32086516ef9f12eac"
        );

        assert_eq!(tree.refund_leaf.version, 192);
        assert_eq!(
            hex::encode(tree.refund_leaf.output.to_bytes()),
            "20fd5b65357aea1c11ecf8fc9dbddc36fdd448f87f387e04e0ed399eb8ac131b3cad017bb1"
        );
    }
}

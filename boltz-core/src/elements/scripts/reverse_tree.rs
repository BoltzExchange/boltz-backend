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

#[cfg(test)]
mod tests {
    use super::*;
    use elements::{Address, AssetId};
    use std::str::FromStr;

    #[test]
    fn test_reverse_tree() {
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
            None,
        );

        assert_eq!(tree.claim_leaf.version, 196);
        assert_eq!(
            hex::encode(tree.claim_leaf.output.to_bytes()),
            "82012088a914761de3d1f1f54cc8b3beec0a1ad03820a2e12b90882097f2ea5402afd2e90130e84d97e455f67493a956c20faedce32086516ef9f12eac"
        );

        assert_eq!(tree.refund_leaf.version, 196);
        assert_eq!(
            hex::encode(tree.refund_leaf.output.to_bytes()),
            "20fd5b65357aea1c11ecf8fc9dbddc36fdd448f87f387e04e0ed399eb8ac131b3cad017bb1"
        );
    }

    #[test]
    fn test_reverse_tree_with_covenant() {
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
            Some(&ClaimCovenantParams {
                index: 0,
                output: Address::from_str(
                    "el1qqg6efpy0eentcmzxqts8c4rv9jxm67ryp3agu7qmql927fg32cy6x9y7xvzfj427erfk6g2fjpvx8lwtqdzszemvuyv7645tw",
                ).unwrap(),
                asset_id: AssetId::from_str("5ac9f65c0efcc4775e0baec4ec03abdde22473cd3cf33c0419ca290e0751b225").unwrap(),
                expected_amount: 123_321,
            }),
        );

        assert_eq!(tree.claim_leaf.version, 196);
        assert_eq!(
            hex::encode(tree.claim_leaf.output.to_bytes()),
            "82012088a914761de3d1f1f54cc8b3beec0a1ad03820a2e12b90882097f2ea5402afd2e90130e84d97e455f67493a956c20faedce32086516ef9f12eac"
        );

        assert_eq!(tree.refund_leaf.version, 196);
        assert_eq!(
            hex::encode(tree.refund_leaf.output.to_bytes()),
            "20fd5b65357aea1c11ecf8fc9dbddc36fdd448f87f387e04e0ed399eb8ac131b3cad017bb1"
        );

        assert_eq!(tree.covenant_claim_leaf.clone().unwrap().version, 196);
        assert_eq!(
            hex::encode(tree.covenant_claim_leaf.unwrap().output.as_bytes()),
            "82012088a914761de3d1f1f54cc8b3beec0a1ad03820a2e12b908800d1008814149e330499555ec8d36d2149905863fdcb0345018800ce51882025b251070e29ca19043cf33ccd7324e2ddab03ecc4ae0b5e77c4fc0e5cf6c95a8800cf7508b9e101000000000087"
        );
    }
}

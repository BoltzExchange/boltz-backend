use crate::bitcoin::scripts::utils::serializer;
use anyhow::Result;
use bitcoin::{
    ScriptBuf, TapLeafHash, XOnlyPublicKey,
    script::Instruction,
    taproot::{LeafVersion, TaprootBuilder},
};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Tapleaf {
    pub version: u8,
    #[serde(serialize_with = "serializer::serialize")]
    #[serde(deserialize_with = "serializer::deserialize")]
    pub output: ScriptBuf,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Tree {
    #[serde(rename = "claimLeaf")]
    pub claim_leaf: Tapleaf,
    #[serde(rename = "refundLeaf")]
    pub refund_leaf: Tapleaf,
}

impl Tapleaf {
    pub fn leaf_hash(&self) -> Result<TapLeafHash> {
        Ok(TapLeafHash::from_script(
            &self.output,
            LeafVersion::from_consensus(self.version)?,
        ))
    }
}

impl Tree {
    pub fn build(&self) -> Result<TaprootBuilder> {
        Ok(TaprootBuilder::new()
            .add_leaf_with_ver(
                1,
                self.claim_leaf.output.clone(),
                LeafVersion::from_consensus(self.claim_leaf.version)?,
            )?
            .add_leaf_with_ver(
                1,
                self.refund_leaf.output.clone(),
                LeafVersion::from_consensus(self.refund_leaf.version)?,
            )?)
    }

    pub fn claim_pubkey(&self) -> Result<XOnlyPublicKey> {
        match self.get_pubkey(&self.claim_leaf)? {
            Some(pubkey) => Ok(pubkey),
            None => Err(anyhow::anyhow!("claim leaf does not contain a public key")),
        }
    }

    pub fn refund_pubkey(&self) -> Result<XOnlyPublicKey> {
        match self.get_pubkey(&self.refund_leaf)? {
            Some(pubkey) => Ok(pubkey),
            None => Err(anyhow::anyhow!("refund leaf does not contain a public key")),
        }
    }

    fn get_pubkey(&self, leaf: &Tapleaf) -> Result<Option<XOnlyPublicKey>> {
        for instr in leaf.output.instructions().flatten() {
            if let Instruction::PushBytes(bytes) = instr {
                if bytes.len() != 32 {
                    continue;
                }

                return Ok(Some(XOnlyPublicKey::from_slice(bytes.as_bytes())?));
            }
        }

        Ok(None)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use bitcoin::{key::Keypair, secp256k1::Secp256k1, taproot::TAPROOT_LEAF_TAPSCRIPT};
    use hex::ToHex;
    use rstest::rstest;

    const TREE: &str = "{\"claimLeaf\":{\"version\":192,\"output\":\"a9140be3e65567f55ff6ac791bd4f65f672bcaf5f211882050d47b462154253db0fcdc63323d50fffef708a4bdce34a34958c46051d1e997ac\"},\"refundLeaf\":{\"version\":192,\"output\":\"206ecd3e58ebe0a558badb9a083a365530e1de168dfa410233433f2b2e3c7f4438ad03b9e101b1\"}}";
    const TREE_REVERSE: &str = "{\"claimLeaf\":{\"version\":192,\"output\":\"82012088a9140be3e65567f55ff6ac791bd4f65f672bcaf5f211882050d47b462154253db0fcdc63323d50fffef708a4bdce34a34958c46051d1e997ac\"},\"refundLeaf\":{\"version\":192,\"output\":\"206ecd3e58ebe0a558badb9a083a365530e1de168dfa410233433f2b2e3c7f4438ad03b9e101b1\"}}";

    #[rstest]
    #[case(TREE)]
    #[case(TREE_REVERSE)]
    fn test_tree_serialization(#[case] input: &str) {
        let tree: Tree = serde_json::from_str(input).unwrap();
        let serialized = serde_json::to_string(&tree).unwrap();
        assert_eq!(serialized, input);
    }

    #[rstest]
    #[case(
        TREE,
        "a9140be3e65567f55ff6ac791bd4f65f672bcaf5f211882050d47b462154253db0fcdc63323d50fffef708a4bdce34a34958c46051d1e997ac",
        "206ecd3e58ebe0a558badb9a083a365530e1de168dfa410233433f2b2e3c7f4438ad03b9e101b1"
    )]
    #[case(
        TREE_REVERSE,
        "82012088a9140be3e65567f55ff6ac791bd4f65f672bcaf5f211882050d47b462154253db0fcdc63323d50fffef708a4bdce34a34958c46051d1e997ac",
        "206ecd3e58ebe0a558badb9a083a365530e1de168dfa410233433f2b2e3c7f4438ad03b9e101b1"
    )]
    fn test_tree_deserialization(
        #[case] input: &str,
        #[case] claim_leaf: &str,
        #[case] refund_leaf: &str,
    ) {
        let tree: Tree = serde_json::from_str(input).unwrap();
        assert_eq!(tree.claim_leaf.version, TAPROOT_LEAF_TAPSCRIPT);
        assert_eq!(hex::encode(tree.claim_leaf.output.as_bytes()), claim_leaf);

        assert_eq!(tree.refund_leaf.version, TAPROOT_LEAF_TAPSCRIPT);
        assert_eq!(hex::encode(tree.refund_leaf.output.as_bytes()), refund_leaf);
    }

    #[rstest]
    #[case(
        TREE,
        "d7f72e04acac75db079fcd6b6288ce455f97a25259185a9553ae54fbdeecf726"
    )]
    #[case(
        TREE_REVERSE,
        "545007a443c37f3084fb36bb037453f206cc620db3121ecfd38f012094c5d74f"
    )]
    fn test_tree_hash(#[case] input: &str, #[case] expected: &str) {
        let tree: Tree = serde_json::from_str(input).unwrap();

        let secp = Secp256k1::new();
        let res = tree
            .build()
            .unwrap()
            .finalize(
                &secp,
                Keypair::from_seckey_str(
                    &secp,
                    "5cd44f736d1717efc1eeff23f615362f7a7d2e470bbf0edcbca3d17cce1d30ec",
                )
                .unwrap()
                .x_only_public_key()
                .0,
            )
            .unwrap();

        assert_eq!(
            hex::encode(res.merkle_root().unwrap().as_raw_hash()),
            expected
        );
    }

    #[rstest]
    #[case(
        TREE,
        "91e1bfa3e4a5a077f8591142a7c8025fb512251d9ea7c33d934457980c924f95"
    )]
    #[case(
        TREE_REVERSE,
        "60924aa6853775e0b269ca30bb8a36afe5087cdcb7adee8480f4daec74742688"
    )]
    fn test_leaf_hash(#[case] input: &str, #[case] expected: &str) {
        let tree: Tree = serde_json::from_str(input).unwrap();
        let leaf_hash = tree.claim_leaf.leaf_hash().unwrap();
        assert_eq!(leaf_hash.encode_hex::<String>(), expected);
    }

    #[rstest]
    #[case(TREE)]
    #[case(TREE_REVERSE)]
    fn test_claim_pubkey(#[case] input: &str) {
        let tree: Tree = serde_json::from_str(input).unwrap();
        let pubkey = tree.claim_pubkey().unwrap();
        assert_eq!(
            pubkey.to_string(),
            "50d47b462154253db0fcdc63323d50fffef708a4bdce34a34958c46051d1e997"
        );
    }

    #[rstest]
    #[case(TREE)]
    #[case(TREE_REVERSE)]
    fn test_refund_pubkey(#[case] input: &str) {
        let tree: Tree = serde_json::from_str(input).unwrap();
        let pubkey = tree.refund_pubkey().unwrap();
        assert_eq!(
            pubkey.to_string(),
            "6ecd3e58ebe0a558badb9a083a365530e1de168dfa410233433f2b2e3c7f4438"
        );
    }
}

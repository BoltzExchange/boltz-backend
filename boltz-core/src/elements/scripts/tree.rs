use crate::elements::scripts::utils::serializer;
use anyhow::Result;
use elements::{
    Script,
    script::Instruction,
    secp256k1_zkp::XOnlyPublicKey,
    taproot::{LeafVersion, TapLeafHash, TaprootBuilder},
};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Tapleaf {
    pub version: u8,
    #[serde(serialize_with = "serializer::serialize")]
    #[serde(deserialize_with = "serializer::deserialize")]
    pub output: Script,
}

impl Tapleaf {
    pub fn leaf_hash(&self) -> Result<TapLeafHash> {
        Ok(TapLeafHash::from_script(
            &self.output,
            LeafVersion::from_u8(self.version)?,
        ))
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Tree {
    #[serde(rename = "claimLeaf")]
    pub claim_leaf: Tapleaf,
    #[serde(rename = "refundLeaf")]
    pub refund_leaf: Tapleaf,
    #[serde(rename = "covenantClaimLeaf", skip_serializing_if = "Option::is_none")]
    pub covenant_claim_leaf: Option<Tapleaf>,
}

impl Tree {
    pub fn build(&self) -> Result<TaprootBuilder> {
        if let Some(covenant_claim_leaf) = &self.covenant_claim_leaf {
            Ok(TaprootBuilder::new()
                .add_leaf_with_ver(
                    1,
                    covenant_claim_leaf.output.clone(),
                    LeafVersion::from_u8(covenant_claim_leaf.version)?,
                )?
                .add_leaf_with_ver(
                    2,
                    self.claim_leaf.output.clone(),
                    LeafVersion::from_u8(self.claim_leaf.version)?,
                )?
                .add_leaf_with_ver(
                    2,
                    self.refund_leaf.output.clone(),
                    LeafVersion::from_u8(self.refund_leaf.version)?,
                )?)
        } else {
            Ok(TaprootBuilder::new()
                .add_leaf_with_ver(
                    1,
                    self.claim_leaf.output.clone(),
                    LeafVersion::from_u8(self.claim_leaf.version)?,
                )?
                .add_leaf_with_ver(
                    1,
                    self.refund_leaf.output.clone(),
                    LeafVersion::from_u8(self.refund_leaf.version)?,
                )?)
        }
    }

    pub fn claim_pubkey(&self) -> Result<XOnlyPublicKey> {
        for instr in self.claim_leaf.output.instructions() {
            match instr {
                Ok(Instruction::PushBytes(bytes)) => {
                    if bytes.len() != 32 {
                        continue;
                    }

                    return Ok(XOnlyPublicKey::from_slice(bytes)?);
                }
                _ => continue,
            }
        }

        Err(anyhow::anyhow!("claim leaf does not contain a public key"))
    }

    pub fn refund_pubkey(&self) -> Result<XOnlyPublicKey> {
        for instr in self.refund_leaf.output.instructions() {
            match instr {
                Ok(Instruction::PushBytes(bytes)) => {
                    return Ok(XOnlyPublicKey::from_slice(bytes)?);
                }
                _ => continue,
            }
        }

        Err(anyhow::anyhow!("refund leaf does not contain a public key"))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use elements::{
        secp256k1_zkp::{Keypair, Secp256k1},
        taproot::TAPROOT_LEAF_TAPSCRIPT,
    };
    use hex::ToHex;
    use rstest::rstest;

    const TREE: &str = "{\"claimLeaf\":{\"version\":196,\"output\":\"a9140be3e65567f55ff6ac791bd4f65f672bcaf5f211882050d47b462154253db0fcdc63323d50fffef708a4bdce34a34958c46051d1e997ac\"},\"refundLeaf\":{\"version\":196,\"output\":\"206ecd3e58ebe0a558badb9a083a365530e1de168dfa410233433f2b2e3c7f4438ad03b9e101b1\"}}";
    const TREE_REVERSE: &str = "{\"claimLeaf\":{\"version\":196,\"output\":\"82012088a9140be3e65567f55ff6ac791bd4f65f672bcaf5f211882050d47b462154253db0fcdc63323d50fffef708a4bdce34a34958c46051d1e997ac\"},\"refundLeaf\":{\"version\":196,\"output\":\"206ecd3e58ebe0a558badb9a083a365530e1de168dfa410233433f2b2e3c7f4438ad03b9e101b1\"}}";
    const TREE_CLAIM_CONVANT: &str = "{\"claimLeaf\":{\"version\":196,\"output\":\"82012088a9140be3e65567f55ff6ac791bd4f65f672bcaf5f211882050d47b462154253db0fcdc63323d50fffef708a4bdce34a34958c46051d1e997ac\"},\"refundLeaf\":{\"version\":196,\"output\":\"206ecd3e58ebe0a558badb9a083a365530e1de168dfa410233433f2b2e3c7f4438ad03b9e101b1\"},\"covenantClaimLeaf\":{\"version\":196,\"output\":\"82012088a9140be3e65567f55ff6ac791bd4f65f672bcaf5f2118800d100881430be45f57fb7efba91363a70d3103fddde7f4e488800ce51882025b251070e29ca19043cf33ccd7324e2ddab03ecc4ae0b5e77c4fc0e5cf6c95a8800cf7508102700000000000087\"}}";

    #[rstest]
    #[case(TREE)]
    #[case(TREE_REVERSE)]
    #[case(TREE_CLAIM_CONVANT)]
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
        "567045dc2a9134ca020a46bd5f609d98d4257a84595be743668be51379c0ad7e"
    )]
    #[case(
        TREE_REVERSE,
        "3c4fd46a60f455159551b5b39008f800e98c92ae8ede55092fa8d4852e1dcbca"
    )]
    #[case(
        TREE_CLAIM_CONVANT,
        "32b1f998a9d8831bce55a27e535333cd7fdfae501916f72b5ef2ff4a1619915b"
    )]
    fn test_tree_hash(#[case] input: &str, #[case] expected: &str) {
        let tree: Tree = serde_json::from_str(input).unwrap();
        println!("{:#?}", tree.build());

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
        "c91c1e98aa0fda18eff027468c54fe00c5cb9882ba8ef5163f2e8d85035b2b72"
    )]
    #[case(
        TREE_REVERSE,
        "f939ae11db94a2dfea763ae7db6f933401cf4108eddca0a0b8ad2447697cae28"
    )]
    fn test_leaf_hash(#[case] input: &str, #[case] expected: &str) {
        let tree: Tree = serde_json::from_str(input).unwrap();
        let leaf_hash = tree.claim_leaf.leaf_hash().unwrap();
        assert_eq!(leaf_hash.encode_hex::<String>(), expected);
    }

    #[rstest]
    #[case(TREE)]
    #[case(TREE_REVERSE)]
    #[case(TREE_CLAIM_CONVANT)]
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
    #[case(TREE_CLAIM_CONVANT)]
    fn test_refund_pubkey(#[case] input: &str) {
        let tree: Tree = serde_json::from_str(input).unwrap();
        let pubkey = tree.refund_pubkey().unwrap();
        assert_eq!(
            pubkey.to_string(),
            "6ecd3e58ebe0a558badb9a083a365530e1de168dfa410233433f2b2e3c7f4438"
        );
    }
}

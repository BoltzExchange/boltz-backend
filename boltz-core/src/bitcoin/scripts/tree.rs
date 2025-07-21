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

impl Tapleaf {
    pub fn leaf_hash(&self) -> anyhow::Result<TapLeafHash> {
        Ok(TapLeafHash::from_script(
            &self.output,
            LeafVersion::from_consensus(self.version)?,
        ))
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Tree {
    #[serde(rename = "claimLeaf")]
    pub claim_leaf: Tapleaf,
    #[serde(rename = "refundLeaf")]
    pub refund_leaf: Tapleaf,
}

impl Tree {
    pub fn build(&self) -> anyhow::Result<TaprootBuilder> {
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
        for instr in self.claim_leaf.output.instructions() {
            match instr {
                Ok(Instruction::PushBytes(bytes)) => {
                    if bytes.len() != 32 {
                        continue;
                    }

                    return Ok(XOnlyPublicKey::from_slice(bytes.as_bytes())?);
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
                    return Ok(XOnlyPublicKey::from_slice(bytes.as_bytes())?);
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
    use bitcoin::taproot::TAPROOT_LEAF_TAPSCRIPT;
    use hex::ToHex;

    const TREE: &str = "{\"claimLeaf\":{\"version\":192,\"output\":\"82012088a9145d18bcb450fab17b952b39a1d3c018b96ce962c6882058168e02b747e968a66e50b3596d7ca2e96108f1c6d9e7430457323e3ae5128bac\"},\"refundLeaf\":{\"version\":192,\"output\":\"203048a20d121c5c98db50f70cdba4db37443cac79fa0494bf31fb5c7468dbe0cdad0388d50db1\"}}";

    #[test]
    fn test_tree_serialization() {
        let tree: Tree = serde_json::from_str(TREE).unwrap();
        let serialized = serde_json::to_string(&tree).unwrap();
        assert_eq!(serialized, TREE);
    }

    #[test]
    fn test_tree_deserialization() {
        let tree: Tree = serde_json::from_str(TREE).unwrap();
        assert_eq!(tree.claim_leaf.version, TAPROOT_LEAF_TAPSCRIPT);
        assert_eq!(
            tree.claim_leaf.output.as_bytes(),
            &hex::decode(
                "82012088a9145d18bcb450fab17b952b39a1d3c018b96ce962c6882058168e02b747e968a66e50b3596d7ca2e96108f1c6d9e7430457323e3ae5128bac"
            ).unwrap()
        );

        assert_eq!(tree.refund_leaf.version, TAPROOT_LEAF_TAPSCRIPT);
        assert_eq!(
            tree.refund_leaf.output.as_bytes(),
            &hex::decode(
                "203048a20d121c5c98db50f70cdba4db37443cac79fa0494bf31fb5c7468dbe0cdad0388d50db1"
            )
            .unwrap()
        );
    }

    #[test]
    fn test_leaf_hash() {
        let tree: Tree = serde_json::from_str(TREE).unwrap();
        let leaf_hash = tree.claim_leaf.leaf_hash().unwrap();
        assert_eq!(
            leaf_hash.encode_hex::<String>(),
            "b41fb15392a85d64e836e635f6ec6647fc98334646ee67f866119e731bf7f414"
        );
    }

    #[test]
    fn test_claim_pubkey() {
        let tree: Tree = serde_json::from_str(TREE).unwrap();
        let pubkey = tree.claim_pubkey().unwrap();
        assert_eq!(
            pubkey.to_string(),
            "58168e02b747e968a66e50b3596d7ca2e96108f1c6d9e7430457323e3ae5128b"
        );
    }

    #[test]
    fn test_refund_pubkey() {
        let tree: Tree = serde_json::from_str(TREE).unwrap();
        let pubkey = tree.refund_pubkey().unwrap();
        assert_eq!(
            pubkey.to_string(),
            "3048a20d121c5c98db50f70cdba4db37443cac79fa0494bf31fb5c7468dbe0cd"
        );
    }
}

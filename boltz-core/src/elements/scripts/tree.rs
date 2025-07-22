use crate::elements::scripts::utils::serializer;
use anyhow::Result;
use elements::{
    Script,
    script::Instruction,
    secp256k1_zkp::XOnlyPublicKey,
    taproot::{LeafVersion, TapLeafHash, TaprootBuilder},
};
use serde::{Deserialize, Serialize};

// TODO: test

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Tapleaf {
    pub version: u8,
    #[serde(serialize_with = "serializer::serialize")]
    #[serde(deserialize_with = "serializer::deserialize")]
    pub output: Script,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Tree {
    #[serde(rename = "claimLeaf")]
    pub claim_leaf: Tapleaf,
    #[serde(rename = "refundLeaf")]
    pub refund_leaf: Tapleaf,
    #[serde(rename = "covenantClaimLeaf")]
    pub covenant_claim_leaf: Option<Tapleaf>,
}

impl Tapleaf {
    pub fn leaf_hash(&self) -> Result<TapLeafHash> {
        Ok(TapLeafHash::from_script(
            &self.output,
            LeafVersion::from_u8(self.version)?,
        ))
    }
}

impl Tree {
    pub fn build(&self) -> Result<TaprootBuilder> {
        if let Some(covenant_claim_leaf) = &self.covenant_claim_leaf {
            Ok(TaprootBuilder::new()
                .add_leaf_with_ver(
                    1,
                    self.claim_leaf.output.clone(),
                    LeafVersion::from_u8(self.claim_leaf.version)?,
                )?
                .add_leaf_with_ver(
                    2,
                    covenant_claim_leaf.output.clone(),
                    LeafVersion::from_u8(covenant_claim_leaf.version)?,
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

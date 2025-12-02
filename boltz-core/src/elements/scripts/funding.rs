use anyhow::Result;
use elements::{
    LockTime,
    script::Instruction,
    secp256k1_zkp::XOnlyPublicKey,
    taproot::{LeafVersion, TaprootBuilder},
};
use serde::{Deserialize, Serialize};

use crate::elements::{Tapleaf, scripts::swap_tree::refund_leaf};

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct FundingTree {
    #[serde(rename = "refundLeaf")]
    pub refund_leaf: Tapleaf,
}

impl FundingTree {
    pub fn new(refund_pubkey: &XOnlyPublicKey, lock_time: LockTime) -> Self {
        FundingTree {
            refund_leaf: refund_leaf(refund_pubkey, lock_time),
        }
    }

    pub fn build(&self) -> Result<TaprootBuilder> {
        Ok(TaprootBuilder::new().add_leaf_with_ver(
            0,
            self.refund_leaf.output.clone(),
            LeafVersion::from_u8(self.refund_leaf.version)?,
        )?)
    }

    pub fn refund_pubkey(&self) -> Result<XOnlyPublicKey> {
        for instr in self.refund_leaf.output.instructions().flatten() {
            if let Instruction::PushBytes(bytes) = instr {
                if bytes.len() != 32 {
                    continue;
                }

                return Ok(XOnlyPublicKey::from_slice(bytes)?);
            }
        }

        Err(anyhow::anyhow!("refund leaf does not contain a public key"))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use elements::secp256k1_zkp::{Keypair, Secp256k1, rand};

    #[test]
    fn test_funding_tree() {
        let secp = Secp256k1::new();
        let keypair = Keypair::new(&secp, &mut rand::thread_rng());
        let funding_tree = FundingTree::new(
            &keypair.x_only_public_key().0,
            LockTime::from_height(123).unwrap(),
        );
        let tree = funding_tree.build().unwrap();
        tree.finalize(&secp, keypair.x_only_public_key().0).unwrap();

        assert_eq!(
            funding_tree.refund_pubkey().unwrap().to_string(),
            keypair.x_only_public_key().0.to_string()
        );
    }
}

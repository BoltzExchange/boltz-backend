use std::str::FromStr;

use anyhow::Result;

use bitcoin::{
    TapTweakHash,
    absolute::LockTime,
    key::{Keypair, Secp256k1, TweakedPublicKey},
};
use boltz_core::{
    Musig,
    musig::{MusigBuilder, NoMessage, Unsigned},
    wrapper::FundingTree,
};
use diesel::{AsChangeset, Insertable, Queryable, Selectable};
use elements::schnorr::TapTweak;
use elements_miniscript::ToPublicKey;

use crate::chain::types::Type;

#[derive(Queryable, Selectable, Insertable, AsChangeset, PartialEq, Default, Clone, Debug)]
#[diesel(table_name = crate::db::schema::funding_addresses)]
pub struct FundingAddress {
    pub id: String,
    pub symbol: String,
    pub status: String,
    pub key_index: i32,
    pub their_public_key: Vec<u8>,
    pub tree: String,
    pub timeout_block_height: i32,
    pub lockup_transaction_id: Option<String>,
    pub lockup_transaction_vout: Option<i32>,
    pub lockup_amount: Option<i64>,
    pub swap_id: Option<String>,
    pub presigned_tx: Option<Vec<u8>>,
    pub created_at: chrono::NaiveDateTime,
}

impl FundingAddress {
    pub fn symbol_type(&self) -> Result<Type> {
        Type::from_str(&self.symbol)
    }

    pub fn parse_tree(&self) -> Result<FundingTree> {
        FundingTree::parse(self.symbol.parse()?, &self.tree)
    }

    pub fn init_tree(&mut self) -> Result<()> {
        self.tree = match self.symbol_type()? {
            Type::Bitcoin => serde_json::to_string(&boltz_core::bitcoin::FundingTree::new(
                &self.their_public_key()?.to_x_only_pubkey(),
                LockTime::from_height(self.timeout_block_height as u32)?,
            ))?,
            Type::Elements => {
                let pubkey =
                    elements::secp256k1_zkp::PublicKey::from_slice(&self.their_public_key)?;
                let x_only_key = elements::secp256k1_zkp::XOnlyPublicKey::from(pubkey);
                serde_json::to_string(&boltz_core::elements::FundingTree::new(
                    &x_only_key,
                    elements::LockTime::from_height(self.timeout_block_height as u32)?,
                ))?
            }
        };
        Ok(())
    }

    pub fn their_public_key(&self) -> Result<bitcoin::PublicKey> {
        bitcoin::PublicKey::from_slice(&self.their_public_key)
            .map_err(|_| anyhow::anyhow!("failed to parse their public key"))
    }

    pub fn script_pubkey(&self, our_key_pair: &Keypair) -> Result<Vec<u8>> {
        let tweaked_key = self.musig(our_key_pair)?.agg_pk().serialize();
        match self.symbol_type()? {
            Type::Bitcoin => Ok(bitcoin::ScriptBuf::new_p2tr_tweaked(
                TweakedPublicKey::dangerous_assume_tweaked(bitcoin::XOnlyPublicKey::from_slice(
                    &tweaked_key,
                )?),
            )
            .into_bytes()),
            Type::Elements => Ok(elements::Script::new_v1_p2tr_tweaked(
                elements::schnorr::UntweakedPublicKey::from_slice(&tweaked_key)?
                    .dangerous_assume_tweaked(),
            )
            .into_bytes()),
        }
    }

    pub fn musig(&self, our_key_pair: &Keypair) -> Result<MusigBuilder<NoMessage, Unsigned>> {
        let musig = Musig::setup(
            Musig::convert_keypair(our_key_pair.secret_key().secret_bytes())?,
            vec![
                Musig::convert_pub_key(&our_key_pair.public_key().serialize())?,
                Musig::convert_pub_key(&self.their_public_key()?.to_bytes())?,
            ],
        )
        .map_err(|_| anyhow::anyhow!("failed to create musig"))?;

        let internal_key = bitcoin::XOnlyPublicKey::from_slice(&musig.agg_pk().serialize())?;
        let secp = Secp256k1::new();

        let tweak = match self.parse_tree()? {
            FundingTree::Bitcoin(tree) => {
                let taproot_spend_info = tree
                    .build()?
                    .finalize(&secp, internal_key)
                    .map_err(|_| anyhow::anyhow!("failed to finalize taproot"))?;

                TapTweakHash::from_key_and_tweak(internal_key, taproot_spend_info.merkle_root())
                    .to_scalar()
            }
            FundingTree::Elements(tree) => {
                let taproot_spend_info = tree
                    .build()?
                    .finalize(&secp, internal_key)
                    .map_err(|_| anyhow::anyhow!("failed to finalize taproot"))?;

                elements::taproot::TapTweakHash::from_key_and_tweak(
                    internal_key,
                    taproot_spend_info.merkle_root(),
                )
                .to_scalar()
            }
        };

        musig.xonly_tweak_add(&Musig::convert_scalar_be(&tweak.to_be_bytes())?)
    }

    pub fn presigned_tx_hex(&self) -> Result<String> {
        Ok(hex::encode(self.presigned_tx.as_ref().ok_or_else(
            || anyhow::anyhow!("funding address has no presigned transaction"),
        )?))
    }
}

#[cfg(test)]
mod test {
    use super::*;

    fn create_funding_address() -> FundingAddress {
        // Use a valid compressed public key for testing
        FundingAddress {
            id: "id".to_string(),
            symbol: "BTC".to_string(),
            key_index: 0,
            their_public_key: hex::decode(
                "02a1633cafcc01ebfb6d78e39f687a1f0995c62fc95f51ead10a02ee0be551b5dc",
            )
            .unwrap(),
            timeout_block_height: 1000000,
            ..Default::default()
        }
    }

    #[test]
    fn test_tree_json() {
        let mut funding_address = create_funding_address();
        funding_address.init_tree().unwrap();
        let tree: boltz_core::bitcoin::FundingTree =
            serde_json::from_str(&funding_address.tree).unwrap();
        // The refund pubkey is the x-only version of the compressed public key
        assert_eq!(
            tree.refund_pubkey().unwrap().to_string(),
            "a1633cafcc01ebfb6d78e39f687a1f0995c62fc95f51ead10a02ee0be551b5dc"
        );
    }

    #[test]
    fn test_tree_json_round_trip() {
        let mut funding_address = create_funding_address();
        funding_address.init_tree().unwrap();
        let tree: boltz_core::bitcoin::FundingTree =
            serde_json::from_str(&funding_address.tree).unwrap();

        // The refund pubkey is the x-only version of the compressed public key
        assert_eq!(
            tree.refund_pubkey().unwrap().to_string(),
            "a1633cafcc01ebfb6d78e39f687a1f0995c62fc95f51ead10a02ee0be551b5dc"
        );

        // Verify JSON serialization round-trip
        let tree_json_again = serde_json::to_string(&tree).unwrap();
        assert_eq!(funding_address.tree, tree_json_again);
    }

    #[test]
    fn test_tree_json_format() {
        let mut funding_address = create_funding_address();
        funding_address.init_tree().unwrap();

        // Verify the JSON has the expected structure
        assert!(funding_address.tree.contains("refundLeaf"));
        assert!(funding_address.tree.contains("version"));
        assert!(funding_address.tree.contains("output"));

        // Parse and verify
        let parsed: serde_json::Value = serde_json::from_str(&funding_address.tree).unwrap();
        assert!(parsed.get("refundLeaf").is_some());
        assert!(parsed["refundLeaf"].get("version").is_some());
        assert!(parsed["refundLeaf"].get("output").is_some());
    }
}

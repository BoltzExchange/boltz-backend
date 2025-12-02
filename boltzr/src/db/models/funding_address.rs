use anyhow::Result;
use std::str::FromStr;

use bitcoin::{
    ScriptBuf, TapTweakHash,
    absolute::LockTime,
    key::{Keypair, Secp256k1, TweakedPublicKey},
    secp256k1::PublicKey,
};
use boltz_core::{
    Musig,
    bitcoin::FundingTree,
    musig::{MusigBuilder, NoMessage, Unsigned},
};
use diesel::{AsChangeset, Insertable, Queryable, Selectable};

#[derive(Queryable, Selectable, Insertable, AsChangeset, PartialEq, Default, Clone, Debug)]
#[diesel(table_name = crate::db::schema::funding_addresses)]
pub struct FundingAddress {
    pub id: String,
    pub symbol: String,
    pub status: String,
    pub key_index: i32,
    pub their_public_key: String,
    pub timeout_block_height: i32,
    pub lockup_transaction_id: Option<String>,
    pub lockup_transaction_vout: Option<i32>,
    pub lockup_amount: Option<i64>,
    pub swap_id: Option<String>,
    pub presigned_tx: Option<Vec<u8>>,
}

impl FundingAddress {
    pub fn tree(&self) -> Result<FundingTree> {
        Ok(FundingTree::new(
            &PublicKey::from_str(&self.their_public_key)?
                .x_only_public_key()
                .0,
            LockTime::from_height(self.timeout_block_height as u32)?,
        ))
    }

    pub fn their_public_key(&self) -> Result<bitcoin::PublicKey> {
        bitcoin::PublicKey::from_str(&self.their_public_key)
            .map_err(|_| anyhow::anyhow!("failed to parse their public key"))
    }

    pub fn script_pubkey(&self, our_key_pair: &Keypair) -> Result<ScriptBuf> {
        let internal_key = self.musig(&our_key_pair)?.agg_pk().serialize();
        Ok(bitcoin::ScriptBuf::new_p2tr_tweaked(
            TweakedPublicKey::dangerous_assume_tweaked(bitcoin::XOnlyPublicKey::from_slice(
                &internal_key,
            )?),
        ))
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

        let untweaked_internal_key =
            bitcoin::XOnlyPublicKey::from_slice(&musig.agg_pk().serialize())?;

        let tree_builder = self.tree()?.build()?;
        let secp = Secp256k1::new();
        let taproot_spend_info = tree_builder
            .finalize(&secp, untweaked_internal_key)
            .map_err(|_| anyhow::anyhow!("failed to finalize taproot"))?;

        let tweak = TapTweakHash::from_key_and_tweak(
            untweaked_internal_key,
            taproot_spend_info.merkle_root(),
        )
        .to_scalar();

        musig.xonly_tweak_add(&Musig::convert_scalar_be(&tweak.to_be_bytes())?)
    }

    pub fn presigned_tx_hex(&self) -> Result<String> {
        Ok(alloy::hex::encode(self.presigned_tx.clone().ok_or_else(
            || anyhow::anyhow!("funding address has no presigned transaction"),
        )?))
    }
}

#[cfg(test)]
mod test {
    use super::*;

    #[test]
    fn test_tree() {
        let funding_address = FundingAddress {
            id: "id".to_string(),
            symbol: "BTC".to_string(),
            key_index: 0,
            their_public_key: "030000000000000000000000000000000000000000000000000000000000000000"
                .to_string(),
            timeout_block_height: 1000000,
            ..Default::default()
        };
        let tree = funding_address.tree().unwrap();
        assert_eq!(
            tree.refund_pubkey().unwrap().to_string(),
            "030000000000000000000000000000000000000000000000000000000000000000"
        );
    }
}

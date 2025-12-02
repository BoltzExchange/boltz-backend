use anyhow::Result;
use elements::pset::serialize::Serialize;
use std::str::FromStr;

use bitcoin::{
    ScriptBuf, TapTweakHash, TxOut,
    absolute::LockTime,
    key::{Keypair, Secp256k1, TapTweak, TweakedPublicKey},
    secp256k1::{PublicKey, Scalar},
};
use boltz_core::{
    Musig,
    bitcoin::{FundingTree, InputDetail as BitcoinInputDetail},
    wrapper::{BitcoinParams, InputDetail, construct_tx},
};
use diesel::{AsChangeset, Insertable, Queryable, Selectable};

#[derive(Queryable, Selectable, Insertable, AsChangeset, PartialEq, Default, Clone, Debug)]
#[diesel(table_name = crate::db::schema::funding_addresses)]
pub struct FundingAddress {
    pub id: String,
    pub symbol: String,
    pub key_index: i32,
    pub their_public_key: String,
    pub timeout_block_height: i32,
    pub lockup_transaction_id: Option<String>,
    pub lockup_transaction_vout: Option<i32>,
    pub lockup_confirmed: bool,
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
        let internal_key = self.internal_key(&our_key_pair)?;
        let tweak = self.tap_tweak(&our_key_pair)?;
        let secp = Secp256k1::new();
        let tweaked_internal_key = internal_key.add_tweak(&secp, &tweak)?.0;
        Ok(bitcoin::ScriptBuf::new_p2tr_tweaked(
            TweakedPublicKey::dangerous_assume_tweaked(tweaked_internal_key),
        ))
    }

    pub fn musig(&self, our_key_pair: &Keypair, msg: [u8; 32]) -> Result<Musig> {
        Musig::new(
            Musig::convert_keypair(our_key_pair.secret_key().secret_bytes())?,
            vec![
                Musig::convert_pub_key(&our_key_pair.public_key().serialize())?,
                Musig::convert_pub_key(&self.their_public_key()?.to_bytes())?,
            ],
            msg,
        )
        .map_err(|_| anyhow::anyhow!("failed to create musig"))
    }

    pub fn tap_tweak(&self, our_key_pair: &Keypair) -> Result<Scalar> {
        let internal_key = self.internal_key(our_key_pair)?;

        // Build the taproot address
        let tree_builder = self.tree()?.build()?;
        let secp = Secp256k1::new();
        let taproot_spend_info = tree_builder
            .finalize(&secp, internal_key)
            .map_err(|_| anyhow::anyhow!("failed to finalize taproot"))?;

        let tweak =
            TapTweakHash::from_key_and_tweak(internal_key, taproot_spend_info.merkle_root())
                .to_scalar();
        Ok(tweak)
    }

    pub fn internal_key(&self, our_key_pair: &Keypair) -> Result<bitcoin::XOnlyPublicKey> {
        let internal_key_serialized = self.musig(our_key_pair, [0; 32])?.agg_pk().serialize();
        Ok(bitcoin::XOnlyPublicKey::from_slice(
            &internal_key_serialized,
        )?)
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

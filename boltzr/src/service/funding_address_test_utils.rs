#[cfg(test)]
pub mod test {
    use crate::cache::Cache;
    use crate::currencies::Currencies;
    use crate::db::helpers::chain_swap::test::MockChainSwapHelper;
    use crate::db::helpers::swap::test::MockSwapHelper;
    use crate::db::models::{ChainSwap, ChainSwapData, ChainSwapInfo, FundingAddress, Swap};
    use crate::service::funding_address_signer::{CooperativeDetails, FundingAddressSigner};
    use crate::swap::FundingAddressStatus;
    use bitcoin::key::Keypair;
    use bitcoin::secp256k1::{Secp256k1, rand};
    use bitcoin::{TapTweakHash, hex::FromHex};
    use boltz_core::PublicNonce;
    use boltz_core::musig::Musig;
    use boltz_core::utils::Chain;
    use std::str::FromStr;
    use std::sync::Arc;

    pub const TEST_SYMBOL: &str = "BTC";
    pub const TEST_SWAP_ID: &str = "test_swap_123";

    pub fn get_keypair() -> Keypair {
        let secp = Secp256k1::new();
        Keypair::new(&secp, &mut rand::thread_rng())
    }

    pub fn test_funding_address(id: &str, their_public_key: &[u8]) -> FundingAddress {
        let mut fa = FundingAddress {
            id: id.to_string(),
            symbol: TEST_SYMBOL.to_string(),
            status: FundingAddressStatus::Created.to_string(),
            key_index: 10,
            their_public_key: their_public_key.to_vec(),
            tree: String::new(),
            timeout_block_height: 1000,
            lockup_transaction_id: None,
            lockup_transaction_vout: None,
            lockup_amount: None,
            swap_id: None,
            presigned_tx: None,
        };
        fa.tree = fa.tree_json().unwrap();
        fa
    }

    pub fn test_funding_address_with_lockup(
        id: &str,
        their_public_key: &[u8],
        tx_id: &str,
        vout: i32,
        amount: i64,
    ) -> FundingAddress {
        let mut fa = FundingAddress {
            lockup_transaction_id: Some(tx_id.to_string()),
            lockup_transaction_vout: Some(vout),
            lockup_amount: Some(amount),
            ..test_funding_address(id, their_public_key)
        };
        fa.tree = fa.tree_json().unwrap();
        fa
    }

    pub fn test_swap(lockup_address: &str) -> Swap {
        Swap {
            id: TEST_SWAP_ID.to_string(),
            lockupAddress: lockup_address.to_string(),
            ..Default::default()
        }
    }

    pub fn test_chain_swap_info(lockup_address: &str) -> ChainSwapInfo {
        let swap = ChainSwap {
            id: TEST_SWAP_ID.to_string(),
            pair: "L-BTC/BTC".to_string(),
            status: "swap.created".to_string(),
            orderSide: 0,
            ..Default::default()
        };
        let data = vec![
            ChainSwapData {
                swapId: TEST_SWAP_ID.to_string(),
                symbol: "BTC".to_string(),
                lockupAddress: lockup_address.to_string(),
                ..Default::default()
            },
            ChainSwapData {
                swapId: TEST_SWAP_ID.to_string(),
                symbol: "L-BTC".to_string(),
                lockupAddress: "el1qq0test".to_string(),
                ..Default::default()
            },
        ];
        ChainSwapInfo::new(swap, data).unwrap()
    }

    pub fn create_signer(
        swap_helper: MockSwapHelper,
        chain_swap_helper: MockChainSwapHelper,
        currencies: Currencies,
    ) -> FundingAddressSigner {
        FundingAddressSigner::new(
            Arc::new(swap_helper),
            Arc::new(chain_swap_helper),
            currencies,
            Cache::Memory(crate::cache::MemCache::new()),
        )
    }

    pub fn client_sign(
        client_key_pair: &Keypair,
        server_key_pair: &Keypair,
        funding_address: &FundingAddress,
        details: &CooperativeDetails,
    ) -> (String, String) {
        let musig = Musig::setup(
            Musig::convert_keypair(client_key_pair.secret_key().secret_bytes()).unwrap(),
            vec![
                Musig::convert_pub_key(&server_key_pair.public_key().serialize()).unwrap(),
                Musig::convert_pub_key(&client_key_pair.public_key().serialize()).unwrap(),
            ],
        )
        .unwrap();

        let untweaked_internal_key =
            bitcoin::XOnlyPublicKey::from_slice(&musig.agg_pk().serialize()).unwrap();

        let secp = Secp256k1::new();
        let tree_json = funding_address.tree.clone();

        let tweak = match Chain::from_str(&funding_address.symbol).unwrap() {
            Chain::Bitcoin => {
                let tree =
                    serde_json::from_str::<boltz_core::bitcoin::FundingTree>(&tree_json).unwrap();
                let taproot_spend_info = tree
                    .build()
                    .unwrap()
                    .finalize(&secp, untweaked_internal_key)
                    .unwrap();
                TapTweakHash::from_key_and_tweak(
                    untweaked_internal_key,
                    taproot_spend_info.merkle_root(),
                )
                .to_scalar()
            }
            Chain::Elements => {
                let tree =
                    serde_json::from_str::<boltz_core::elements::FundingTree>(&tree_json).unwrap();
                let taproot_spend_info = tree
                    .build()
                    .unwrap()
                    .finalize(&secp, untweaked_internal_key)
                    .unwrap();
                elements::taproot::TapTweakHash::from_key_and_tweak(
                    untweaked_internal_key,
                    taproot_spend_info.merkle_root(),
                )
                .to_scalar()
            }
        };

        let musig = musig
            .xonly_tweak_add(&Musig::convert_scalar_be(&tweak.to_be_bytes()).unwrap())
            .unwrap();

        let musig = musig.message(
            Vec::from_hex(&details.transaction_hash)
                .unwrap()
                .try_into()
                .unwrap(),
        );

        let musig = musig.generate_nonce(&mut Musig::rng());
        let client_nonce = musig.pub_nonce().clone();

        let musig = musig
            .aggregate_nonces(vec![(
                Musig::convert_pub_key(&server_key_pair.public_key().serialize()).unwrap(),
                PublicNonce::from_str(&details.pub_nonce).unwrap(),
            )])
            .unwrap();
        let musig = musig.initialize_session().unwrap();
        let musig = musig.partial_sign().unwrap();
        let client_sig = musig.our_partial_signature();

        (client_nonce.to_string(), client_sig.to_string())
    }

    pub fn find_vout(symbol: &str, raw_tx: &[u8], script_pubkey: &Vec<u8>) -> i32 {
        match symbol {
            "L-BTC" => {
                let tx: elements::Transaction = elements::encode::deserialize(raw_tx).unwrap();
                tx.output
                    .iter()
                    .position(|out| out.script_pubkey.as_bytes() == script_pubkey)
                    .expect("funding address script not found in transaction outputs")
                    as i32
            }
            _ => {
                let tx: bitcoin::Transaction = bitcoin::consensus::deserialize(raw_tx).unwrap();
                tx.output
                    .iter()
                    .position(|out| out.script_pubkey.as_bytes() == script_pubkey)
                    .expect("funding address script not found in transaction outputs")
                    as i32
            }
        }
    }
}

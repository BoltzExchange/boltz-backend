#[cfg(test)]
pub mod test {
    use crate::cache::Cache;
    use crate::chain::Client;
    use crate::chain::types::RpcParam;
    use crate::currencies::Currencies;
    use crate::db::helpers::chain_swap::test::MockChainSwapHelper;
    use crate::db::helpers::swap::test::MockSwapHelper;
    use crate::db::models::{ChainSwap, ChainSwapData, ChainSwapInfo, FundingAddress, Swap};
    use crate::service::funding_address_signer::{
        CooperativeDetails, FundingAddressSigner, SetSignatureRequest,
    };
    use crate::swap::FundingAddressStatus;
    use bitcoin::hashes::Hash;
    use bitcoin::key::Keypair;
    use bitcoin::secp256k1::{Secp256k1, rand};
    use bitcoin::{TapTweakHash, hex::FromHex};
    use boltz_core::musig::Musig;
    use boltz_core::utils::Chain;
    use boltz_core::{Network, PublicNonce};
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
            ..Default::default()
        };
        fa.tree = fa.tree_json().unwrap();
        fa
    }

    pub fn test_funding_address_for_symbol(
        id: &str,
        symbol: &str,
        their_public_key: &[u8],
        timeout_block_height: i32,
    ) -> FundingAddress {
        let mut fa = test_funding_address(id, their_public_key);
        fa.symbol = symbol.to_string();
        fa.timeout_block_height = timeout_block_height;
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
        test_swap_with_timeout(lockup_address, 500)
    }

    pub fn test_swap_with_timeout(lockup_address: &str, timeout_block_height: i32) -> Swap {
        Swap {
            id: TEST_SWAP_ID.to_string(),
            lockupAddress: lockup_address.to_string(),
            timeoutBlockHeight: timeout_block_height,
            ..Default::default()
        }
    }

    pub fn test_chain_swap_info(lockup_address: &str) -> ChainSwapInfo {
        test_chain_swap_info_with_timeout(lockup_address, 500)
    }

    pub fn test_chain_swap_info_with_timeout(
        lockup_address: &str,
        timeout_block_height: i32,
    ) -> ChainSwapInfo {
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
                timeoutBlockHeight: timeout_block_height,
                ..Default::default()
            },
            ChainSwapData {
                swapId: TEST_SWAP_ID.to_string(),
                symbol: "L-BTC".to_string(),
                lockupAddress: "el1qq0test".to_string(),
                timeoutBlockHeight: timeout_block_height,
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
        let client_nonce = *musig.pub_nonce();

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

    pub fn create_swap_tree_json(
        chain_type: Chain,
        preimage_hash: &[u8; 20],
        claim_pubkey: &bitcoin::XOnlyPublicKey,
        refund_pubkey: &bitcoin::XOnlyPublicKey,
        timeout: u32,
    ) -> String {
        use bitcoin::hashes::hash160;

        let preimage_hash = hash160::Hash::from_byte_array(*preimage_hash);

        match chain_type {
            Chain::Bitcoin => {
                use bitcoin::absolute::LockTime;
                let tree = boltz_core::bitcoin::swap_tree(
                    preimage_hash,
                    claim_pubkey,
                    refund_pubkey,
                    LockTime::from_height(timeout).unwrap(),
                );
                serde_json::to_string(&tree).unwrap()
            }
            Chain::Elements => {
                use elements::LockTime;
                let claim_pubkey_elements =
                    elements::secp256k1_zkp::XOnlyPublicKey::from_slice(&claim_pubkey.serialize())
                        .unwrap();
                let refund_pubkey_elements =
                    elements::secp256k1_zkp::XOnlyPublicKey::from_slice(&refund_pubkey.serialize())
                        .unwrap();
                let tree = boltz_core::elements::swap_tree(
                    preimage_hash,
                    &claim_pubkey_elements,
                    &refund_pubkey_elements,
                    LockTime::from_height(timeout).unwrap(),
                );
                serde_json::to_string(&tree).unwrap()
            }
        }
    }

    /// Compute the swap lockup address from a swap tree and internal key.
    /// This is the actual address where the swap lockup output should be sent.
    /// Works for both Bitcoin and Elements/Liquid based on the `chain_type` parameter.
    pub fn compute_swap_lockup_address(
        chain_type: Chain,
        swap_tree_json: &str,
        internal_key: &bitcoin::XOnlyPublicKey,
    ) -> String {
        let secp = Secp256k1::new();

        match chain_type {
            Chain::Bitcoin => {
                let tree: boltz_core::bitcoin::Tree = serde_json::from_str(swap_tree_json).unwrap();
                let taproot_spend_info = tree
                    .build()
                    .unwrap()
                    .finalize(&secp, *internal_key)
                    .unwrap();
                let output_key = taproot_spend_info.output_key();

                bitcoin::Address::p2tr_tweaked(output_key, bitcoin::Network::Regtest).to_string()
            }
            Chain::Elements => {
                let tree: boltz_core::elements::Tree =
                    serde_json::from_str(swap_tree_json).unwrap();
                let internal_key_elements =
                    elements::secp256k1_zkp::XOnlyPublicKey::from_slice(&internal_key.serialize())
                        .unwrap();
                let taproot_spend_info = tree
                    .build()
                    .unwrap()
                    .finalize(&secp, internal_key_elements)
                    .unwrap();
                let output_key = taproot_spend_info.output_key();

                elements::Address::p2tr_tweaked(
                    output_key,
                    None,
                    &elements::AddressParams::ELEMENTS,
                )
                .to_string()
            }
        }
    }

    pub async fn fund_address(
        chain_client: &Arc<dyn Client + Send + Sync>,
        symbol: &str,
        address: &str,
        script_pubkey: &[u8],
    ) -> (String, i32, i64) {
        let amount = 100_000i64;
        let tx_id = chain_client
            .request_wallet(
                None,
                "sendtoaddress",
                Some(&[
                    RpcParam::Str(address),
                    RpcParam::Float(amount as f64 / 100_000_000.0),
                ]),
            )
            .await
            .unwrap()
            .as_str()
            .unwrap()
            .to_string();

        let _ = chain_client
            .request_wallet(
                None,
                "generatetoaddress",
                Some(&[RpcParam::Int(1), RpcParam::Str(address)]),
            )
            .await;

        let raw_tx_hex = chain_client.raw_transaction(&tx_id).await.unwrap();
        let raw_tx = alloy::hex::decode(&raw_tx_hex).unwrap();
        let vout = find_vout(symbol, &raw_tx, &script_pubkey.to_vec());

        (tx_id, vout, amount)
    }

    /// Create a presigned transaction for a funding address using the signer.
    /// This performs the full MuSig2 signing flow between client and server.
    pub async fn create_presigned_tx(
        signer: &FundingAddressSigner,
        funding_address: &mut FundingAddress,
        server_keypair: &Keypair,
        client_keypair: &Keypair,
        swap_id: &str,
    ) -> Vec<u8> {
        let details = signer
            .get_signing_details(funding_address, server_keypair, swap_id)
            .await
            .unwrap();

        let (client_nonce, client_sig) =
            client_sign(client_keypair, server_keypair, funding_address, &details);

        let request = SetSignatureRequest {
            id: funding_address.id.clone(),
            pub_nonce: client_nonce,
            partial_signature: client_sig,
        };

        let (tx, _) = signer
            .set_signature(funding_address, server_keypair, &request)
            .await
            .unwrap();

        tx.serialize().to_vec()
    }

    pub fn compute_preimage_hash(preimage: &[u8; 32]) -> [u8; 20] {
        bitcoin::hashes::hash160::Hash::hash(preimage).to_byte_array()
    }

    pub fn encode_funding_address(symbol: &str, script_pubkey: Vec<u8>) -> String {
        let chain_type = crate::chain::types::Type::from_str(symbol).unwrap();
        crate::chain::utils::encode_address(chain_type, script_pubkey, None, Network::Regtest)
            .unwrap()
    }
}

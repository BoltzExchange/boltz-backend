use crate::utils::TxIn;
use bitcoin::hashes::{Hash, sha256};

const PREIMAGE_SIZE: usize = 32;

/// Scan a transaction input for the 32-byte HTLC preimage whose SHA256
/// digest equals `preimage_hash`.
///
/// Inspects every witness stack item and then every data push from the
/// `scriptSig` (legacy / nested segwit), returning the first 32-byte
/// candidate that hashes to `preimage_hash`. Returns `None` when the
/// input reveals no matching preimage — a refund, a cooperative
/// (key-path) spend, or a claim of an unrelated swap.
///
/// Matching against the expected hash (rather than returning the first
/// 32-byte push) ensures an unrelated 32-byte item — an x-only public
/// key, a script hash, part of a signature — is never mistaken for the
/// preimage.
pub fn detect_preimage<T: TxIn>(input: &T, preimage_hash: &[u8; 32]) -> Option<[u8; 32]> {
    input
        .witness()
        .into_iter()
        .chain(input.script_sig_pushed_bytes())
        .find_map(|candidate| match_preimage(&candidate, preimage_hash))
}

#[inline]
fn match_preimage(candidate: &[u8], preimage_hash: &[u8; 32]) -> Option<[u8; 32]> {
    if candidate.len() != PREIMAGE_SIZE {
        return None;
    }

    if sha256::Hash::hash(candidate).as_byte_array() != preimage_hash {
        return None;
    }

    candidate.try_into().ok()
}

#[cfg(test)]
mod tests {
    use super::*;
    use bitcoin::Transaction;
    use rstest::rstest;

    const TAPROOT_SWAP_TX: &str = "01000000000101b8f85fff05221e452555ae44b12a25f56d28f2a9824e67c1245f75f4b9c48d6d0000000000fdffffff01a8d50000000000002251201741cbb35789d4cc2c4472ff016dcf7a10103d7df76554bd9c5eeafb5198a8fb044061b57eb4b82d615dd0758a9e1d0c96129a8847b42dfcc94440e8002030dd1789480d2d52c5c95dc7e2b264bf91b26c6608dfba4c37e38554f4015beaf5ca7cd9200cca502fa4bc0081045551d0faa24b187092a19730742aaa6f5a1a0891a75c9139a914c51acde17d25a3af31a56841be0beb99e8a2e07e882035311bda259a948847aac4152796cba59b5f0f5da9e9171c71d164d99786a0f1ac41c18bed72ea9edbb0b6fee1b288e7ee909316a6296bf85048b202d23d0c40ffea95b1c02e96b4c5d23e62313c181c4e7e412f25af1d1c994c5d77128a58737c0c3300000000";

    #[rstest]
    #[case::nested_segwit_swap(
        "6ec0840cfab5fe6a47e632d9de1123b8067553fa800e066ade6b41ec38ee0d94",
        "010000000001012735e95bc78d1493a799ecf5fb3675a6e90139854e5742f3998ff313f6daf3ea01000000232200205d56bd226496fd06e52f4a33c5d429eb73e824b3e0fd556a0d6632b8051534befdffffff0168c30000000000002251201df1efcc418ab223d328d0dda2bd5e13531880fd479d405535f29080429ed8500347304402203249dc840d207178f0693f520c6bf4fbf2efb8cbb30be8aeac652555bb4a40c9022064de943e2451cb7081e8ee37db7bece479af7db1a33d2f39cbca7b12e3c3713c01206ec0840cfab5fe6a47e632d9de1123b8067553fa800e066ade6b41ec38ee0d9465a914a3a31d9831aa2ee3eaa4727a6411735a937a856087632102c0dc5bbfff03c7b0fb5ccbbc9d413401156bcf1d02d5da518577f60c0b6dc1226703495027b17521034477c39008880fff805bae277b989de1c678170b47e14dd4a7d2440f6e1b343a68ac00000000"
    )]
    #[case::taproot_swap(
        "0cca502fa4bc0081045551d0faa24b187092a19730742aaa6f5a1a0891a75c91",
        TAPROOT_SWAP_TX
    )]
    #[case::nested_segwit_reverse_swap(
        "f67bc660f7d7eb4d05ca3e1798f7c8a29557b0e0eb173f6576f31fd9aa26f686",
        "01000000000101309463325539e6455592f951ba47dd6258230764bf58a07548428d24b3655d1e0000000000fdffffff0110c0000000000000225120a60ddd90875c6e450cfda1eccc9b17980a475bf660e3a8fb147be1529de2ce1a03483045022100bb7c6df325028e78b57257e7036b0b97e65e4246a5d757b39e4b701cb4180f630220638f95d78bc0693686012828a0bbf9db10c7874fc18184101f7f1123403534190120f67bc660f7d7eb4d05ca3e1798f7c8a29557b0e0eb173f6576f31fd9aa26f6866a8201208763a91492dae11a7007324c7d9dbbb6c003b4e008f12b288821023d30cc51c81e9a846a010f01facd00a053565b77b6647dabc744b6ab056a8c65677503833c27b1752102a7eccfcd838b28fdcc210157fa3e08f563c656ea3dfe8051395f4b05019f3b4068ac00000000"
    )]
    fn test_detect_preimage(#[case] preimage: &str, #[case] tx: &str) {
        let tx: Transaction = bitcoin::consensus::deserialize(&hex::decode(tx).unwrap()).unwrap();
        let input = &tx.input[0];

        let expected = hex::decode(preimage).unwrap();
        let preimage_hash = sha256::Hash::hash(&expected).to_byte_array();

        assert_eq!(
            detect_preimage(input, &preimage_hash).unwrap().to_vec(),
            expected,
        );
    }

    #[test]
    fn test_detect_preimage_wrong_hash() {
        let tx: Transaction =
            bitcoin::consensus::deserialize(&hex::decode(TAPROOT_SWAP_TX).unwrap()).unwrap();
        let input = &tx.input[0];

        // The Taproot claim witness holds a 32-byte preimage (and a 32-byte
        // x-only key); a hash nothing matches must not yield a false positive.
        assert_eq!(detect_preimage(input, &[0u8; 32]), None);
    }

    struct WitnessInput(Vec<Vec<u8>>);

    impl TxIn for WitnessInput {
        fn witness(&self) -> Vec<Vec<u8>> {
            self.0.clone()
        }

        fn script_sig_pushed_bytes(&self) -> Vec<Vec<u8>> {
            Vec::new()
        }
    }

    #[test]
    fn test_detect_preimage_scans_past_nonmatching() {
        let preimage = [0xabu8; 32];
        let preimage_hash = sha256::Hash::hash(&preimage).to_byte_array();

        // A 32-byte item that is not the preimage precedes the real one;
        // detection must skip it and keep scanning instead of returning early.
        let input = WitnessInput(vec![[0xcdu8; 32].to_vec(), preimage.to_vec()]);

        assert_eq!(detect_preimage(&input, &preimage_hash), Some(preimage));
    }
}

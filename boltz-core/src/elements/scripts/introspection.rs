use crate::elements::Tapleaf;
use elements::{
    Address, AssetId,
    hashes::{hash160, sha256},
    opcodes::all::{
        OP_DROP, OP_EQUAL, OP_EQUALVERIFY, OP_HASH160, OP_INSPECTOUTPUTASSET,
        OP_INSPECTOUTPUTSCRIPTPUBKEY, OP_INSPECTOUTPUTVALUE, OP_PUSHBYTES_0, OP_PUSHNUM_1, OP_SIZE,
    },
    pset::serialize::Serialize,
    script::Builder,
    taproot::TAPROOT_LEAF_TAPSCRIPT,
};

pub const PREIMAGE_SIZE: i64 = 32;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ClaimCovenantParams {
    pub index: u32,

    pub output: Address,
    pub asset_id: AssetId,
    pub expected_amount: u64,
}

pub fn create_covenant_claim_leaf(
    preimage_hash: hash160::Hash,
    params: &ClaimCovenantParams,
) -> Tapleaf {
    let (intro_value_version, intro_value_script) = script_introspection_value(&params.output);

    Tapleaf {
        version: TAPROOT_LEAF_TAPSCRIPT,
        output: Builder::new()
            .push_opcode(OP_SIZE)
            .push_int(PREIMAGE_SIZE)
            .push_opcode(OP_EQUALVERIFY)
            .push_opcode(OP_HASH160)
            .push_slice(&preimage_hash.serialize())
            .push_opcode(OP_EQUALVERIFY)
            .push_int(params.index.into())
            .push_opcode(OP_INSPECTOUTPUTSCRIPTPUBKEY)
            .push_int(intro_value_version)
            .push_opcode(OP_EQUALVERIFY)
            .push_slice(&intro_value_script)
            .push_opcode(OP_EQUALVERIFY)
            .push_int(params.index.into())
            .push_opcode(OP_INSPECTOUTPUTASSET)
            .push_opcode(OP_PUSHNUM_1)
            .push_opcode(OP_EQUALVERIFY)
            .push_slice(&params.asset_id.serialize())
            .push_opcode(OP_EQUALVERIFY)
            .push_int(params.index.into())
            .push_opcode(OP_INSPECTOUTPUTVALUE)
            .push_opcode(OP_DROP)
            .push_slice(&params.expected_amount.to_le_bytes())
            .push_opcode(OP_EQUAL)
            .into_script(),
    }
}

macro_rules! slice_segwit_script {
    ($script:expr) => {
        if $script.len() >= 2 {
            $script = $script[2..$script.len()].to_vec();
        }
    };
}

fn script_introspection_value(output: &Address) -> (i64, Vec<u8>) {
    let mut script = output.script_pubkey().to_bytes();

    match script[0] {
        val if val == OP_PUSHBYTES_0.into_u8() => {
            slice_segwit_script!(script);
            (0, script)
        }
        val if val == OP_PUSHNUM_1.into_u8() => {
            slice_segwit_script!(script);
            (1, script)
        }
        _ => (-1, sha256::Hash::const_hash(&script).serialize()),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use rstest::rstest;
    use std::str::FromStr;

    #[rstest]
    #[case("CTEs1XTC4sC8DC8HDKFB6SNGCuGDbezbBmrbzUPMCCi4KstJp7QFMi4Wx29tVN4phQ7H1XQqL3ZuXe9g", -1, "dc3fb494a6a3959cbcd085189ac3c8f73e12182f9fda127e9f57204408bce83e")]
    #[case("AzpmZDtcVrVroW44RrMTQvsma5iuCoB68Y8B9ZxYQNS25ycQQepxtyf7FrrimHHRpgNfEmASxBnQaskp", -1, "7cfb405be121f79013fbdcde4a3ef56f6c06b39a9edd6d4c095e90e6536c8ce0")]
    #[case(
        "el1qqvfp4wu88yaxh072jyvkwe50uwqwmfdk98r4ur052gm7p0j54z2q527pe0a9wcde5q6k68r2ae9trnd5ltqq68y72lm0zlhk5",
        0,
        "2bc1cbfa5761b9a0356d1c6aee4ab1cdb4fac00d"
    )]
    #[case(
        "tlq1qqw4pne94ggk3h5ujvgcpy8lx6h9mks4j8xs8yrkyxj9h4gjue6ass5488crzfu72dycs62q63f2ugjtztq9j3v3ajs2qtmf7g4rjqtxem4tvxrrzevcl",
        0,
        "52a73e0624f3ca69310d281a8a55c44962580b28b23d941405ed3e4547202cd9"
    )]
    #[case(
        "el1pqf0k9j5q57286zdx2uduvh5x78egrh76q4c50nytn9c8cqlp6eaygsh89gr5lfgxru0j8r4sd8ne4m8n7v5u97g9g9h4dd59uuuwvhmhkdsanr438ma6",
        1,
        "42e72a074fa5061f1f238eb069e79aecf3f329c2f905416f56b685e738e65f77"
    )]
    fn test_script_introspection_value(
        #[case] address: &str,
        #[case] expected_version: i64,
        #[case] expected_script: &str,
    ) {
        let address = Address::from_str(address).unwrap();
        let (version, script) = script_introspection_value(&address);
        assert_eq!(version, expected_version);
        assert_eq!(hex::encode(script), expected_script);
    }

    #[test]
    fn test_create_covenant_claim_leaf() {
        let preimage_hash =
            hash160::Hash::from_str("0be3e65567f55ff6ac791bd4f65f672bcaf5f211").unwrap();

        let leaf = create_covenant_claim_leaf(
            preimage_hash,
            &ClaimCovenantParams {
                index: 0,
                output: Address::from_str(
                    "el1qqg6efpy0eentcmzxqts8c4rv9jxm67ryp3agu7qmql927fg32cy6x9y7xvzfj427erfk6g2fjpvx8lwtqdzszemvuyv7645tw",
                ).unwrap(),
                asset_id: AssetId::from_str("5ac9f65c0efcc4775e0baec4ec03abdde22473cd3cf33c0419ca290e0751b225").unwrap(),
                expected_amount: 123_321,
            },
        );

        assert_eq!(leaf.version, 196);
        assert_eq!(
            hex::encode(leaf.output.as_bytes()),
            "82012088a9140be3e65567f55ff6ac791bd4f65f672bcaf5f2118800d1008814149e330499555ec8d36d2149905863fdcb0345018800ce51882025b251070e29ca19043cf33ccd7324e2ddab03ecc4ae0b5e77c4fc0e5cf6c95a8800cf7508b9e101000000000087"
        );
    }
}

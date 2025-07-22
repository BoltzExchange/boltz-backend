use crate::elements::Tapleaf;
use elements::{
    Address, AssetId,
    hashes::{hash160, sha256},
    opcodes::all::{
        OP_DROP, OP_EQUAL, OP_EQUALVERIFY, OP_HASH160, OP_INSPECTOUTPUTASSET,
        OP_INSPECTOUTPUTSCRIPTPUBKEY, OP_INSPECTOUTPUTVALUE, OP_PUSHBYTES_0, OP_PUSHNUM_1, OP_SIZE,
    },
    pset::serialize::Serialize,
    script::{Builder, Instruction},
    taproot::TAPROOT_LEAF_TAPSCRIPT,
};

// TODO: test

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
            .push_slice(&params.expected_amount.to_be_bytes())
            .push_opcode(OP_EQUAL)
            .into_script(),
    }
}

fn script_introspection_value(output: &Address) -> (i64, Vec<u8>) {
    let script = output.script_pubkey();

    if let Some(Ok(Instruction::Op(op))) = script.instructions().next() {
        let mut script = script.to_bytes();
        if script.len() >= 40 {
            script = script[2..40].to_vec();
        }

        if op == OP_PUSHNUM_1 {
            return (1, script);
        } else if op == OP_PUSHBYTES_0 {
            return (0, script);
        }
    }

    (-1, sha256::Hash::const_hash(&script.to_bytes()).serialize())
}

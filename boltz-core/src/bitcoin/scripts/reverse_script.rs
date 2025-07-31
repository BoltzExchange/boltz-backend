use crate::bitcoin::scripts::swap_script::push_int;
use bitcoin::{
    ScriptBuf,
    absolute::LockTime,
    hashes::{Hash, hash160},
    opcodes::all::{
        OP_CHECKSIG, OP_CLTV, OP_DROP, OP_ELSE, OP_ENDIF, OP_EQUAL, OP_EQUALVERIFY, OP_HASH160,
        OP_IF, OP_SIZE,
    },
    secp256k1::PublicKey,
};

pub fn reverse_script(
    preimage_hash: hash160::Hash,
    claim_pubkey: &PublicKey,
    refund_pubkey: &PublicKey,
    lock_time: LockTime,
) -> ScriptBuf {
    let mut script = ScriptBuf::new();

    script.push_opcode(OP_SIZE);
    push_int(&mut script, 32);
    script.push_opcode(OP_EQUAL);

    script.push_opcode(OP_IF);
    script.push_opcode(OP_HASH160);
    script.push_slice(preimage_hash.as_byte_array());
    script.push_opcode(OP_EQUALVERIFY);
    script.push_slice(claim_pubkey.serialize());
    script.push_opcode(OP_ELSE);

    script.push_opcode(OP_DROP);
    push_int(&mut script, lock_time.to_consensus_u32().into());
    script.push_opcode(OP_CLTV);
    script.push_opcode(OP_DROP);
    script.push_slice(refund_pubkey.serialize());
    script.push_opcode(OP_ENDIF);

    script.push_opcode(OP_CHECKSIG);

    script
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::str::FromStr;

    #[test]
    fn test_reverse_script() {
        let hash = hash160::Hash::from_str("4eee61c39e3b6d46f6fc7da6ae80519aa681f6d2").unwrap();
        let claim_pubkey = PublicKey::from_str(
            "03f8109578aae1e5cfc497e466cf6ae6625497cd31886e87b2f4f54f3f0f46b539",
        )
        .unwrap();
        let refund_pubkey = PublicKey::from_str(
            "03ec0c1e45b709d708cd376a6f2daf19ac27be229647780d592e27d7fb7efb207a",
        )
        .unwrap();

        let script = reverse_script(
            hash,
            &claim_pubkey,
            &refund_pubkey,
            LockTime::from_height(515924).unwrap(),
        );

        assert_eq!(
            hex::encode(script.as_bytes()),
            "8201208763a9144eee61c39e3b6d46f6fc7da6ae80519aa681f6d2882103f8109578aae1e5cfc497e466cf6ae6625497cd31886e87b2f4f54f3f0f46b53967750354df07b1752103ec0c1e45b709d708cd376a6f2daf19ac27be229647780d592e27d7fb7efb207a68ac"
        );
    }
}

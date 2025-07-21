use elements::{
    LockTime, Script,
    hashes::hash160,
    opcodes::all::{
        OP_CHECKSIG, OP_CLTV, OP_DROP, OP_ELSE, OP_ENDIF, OP_EQUAL, OP_EQUALVERIFY, OP_HASH160,
        OP_IF, OP_SIZE,
    },
    pset::serialize::Serialize,
    script::Builder,
    secp256k1_zkp::PublicKey,
};

pub fn reverse_script(
    preimage_hash: hash160::Hash,
    claim_pubkey: &PublicKey,
    refund_pubkey: &PublicKey,
    lock_time: LockTime,
) -> Script {
    Builder::new()
        .push_opcode(OP_SIZE)
        .push_int(32)
        .push_opcode(OP_EQUAL)
        .push_opcode(OP_IF)
        .push_opcode(OP_HASH160)
        .push_slice(&preimage_hash.serialize())
        .push_opcode(OP_EQUALVERIFY)
        .push_slice(&claim_pubkey.serialize())
        .push_opcode(OP_ELSE)
        .push_opcode(OP_DROP)
        .push_int(lock_time.to_consensus_u32().into())
        .push_opcode(OP_CLTV)
        .push_opcode(OP_DROP)
        .push_slice(&refund_pubkey.serialize())
        .push_opcode(OP_ENDIF)
        .push_opcode(OP_CHECKSIG)
        .into_script()
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::str::FromStr;

    #[test]
    fn test_swap_script() {
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

use elements::{
    LockTime, Script,
    hashes::hash160,
    opcodes::all::{OP_CHECKSIG, OP_CLTV, OP_DROP, OP_ELSE, OP_ENDIF, OP_EQUAL, OP_HASH160, OP_IF},
    pset::serialize::Serialize,
    script::Builder,
    secp256k1_zkp::PublicKey,
};

pub fn swap_script(
    preimage_hash: hash160::Hash,
    claim_pubkey: &PublicKey,
    refund_pubkey: &PublicKey,
    lock_time: LockTime,
) -> Script {
    Builder::new()
        .push_opcode(OP_HASH160)
        .push_slice(&preimage_hash.serialize())
        .push_opcode(OP_EQUAL)
        .push_opcode(OP_IF)
        .push_slice(&claim_pubkey.serialize())
        .push_opcode(OP_ELSE)
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
        let hash = hash160::Hash::from_str("e2ac8cb97af3d59b1c057db4b0c4f9aa12a91273").unwrap();
        let claim_pubkey = PublicKey::from_str(
            "03f8109578aae1e5cfc497e466cf6ae6625497cd31886e87b2f4f54f3f0f46b539",
        )
        .unwrap();
        let refund_pubkey = PublicKey::from_str(
            "03ec0c1e45b709d708cd376a6f2daf19ac27be229647780d592e27d7fb7efb207a",
        )
        .unwrap();

        let script = swap_script(
            hash,
            &claim_pubkey,
            &refund_pubkey,
            LockTime::from_height(515924).unwrap(),
        );

        assert_eq!(
            hex::encode(script.as_bytes()),
            "a914e2ac8cb97af3d59b1c057db4b0c4f9aa12a9127387632103f8109578aae1e5cfc497e466cf6ae6625497cd31886e87b2f4f54f3f0f46b539670354df07b1752103ec0c1e45b709d708cd376a6f2daf19ac27be229647780d592e27d7fb7efb207a68ac"
        );
    }
}

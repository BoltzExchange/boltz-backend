use anyhow::{Result, anyhow};
use bitcoin::Script;
use bitcoin::opcodes::all as opcodes;
use bitcoin::psbt::Psbt;
use bitcoin::script::Instruction;
use serde::Serialize;
use std::str::FromStr;

/// Key data of the proprietary PSBT input field Ark uses to embed the VTXO script tree
const ARK_TAPTREE_KEY: &[u8] = b"taptree";

const P2A_SCRIPT: &[u8] = &[0x51, 0x02, 0x4e, 0x73];

#[derive(Serialize)]
pub struct DecodedTransaction {
    txid: String,
    version: i32,
    locktime: u32,
    inputs: Vec<DecodedInput>,
    outputs: Vec<DecodedOutput>,
}

#[derive(Serialize)]
struct DecodedInput {
    txid: String,
    vout: u32,
    sequence: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    witness_utxo: Option<WitnessUtxo>,
    #[serde(skip_serializing_if = "Vec::is_empty")]
    tap_leaf_scripts: Vec<TapLeafScript>,
    #[serde(skip_serializing_if = "Vec::is_empty")]
    tap_script_sigs: Vec<TapScriptSig>,
    #[serde(skip_serializing_if = "Option::is_none")]
    taptree: Option<Vec<TapTreeLeaf>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    taptree_parse_error: Option<String>,
    #[serde(skip_serializing_if = "Vec::is_empty")]
    unknown_fields: Vec<UnknownField>,
}

#[derive(Serialize)]
struct WitnessUtxo {
    amount: u64,
    script: String,
}

#[derive(Serialize)]
struct TapLeafScript {
    leaf_version: u8,
    internal_key: String,
    merkle_path: Vec<String>,
    script_asm: String,
    script_hex: String,
    looks_like: &'static str,
}

#[derive(Serialize)]
struct TapScriptSig {
    pubkey: String,
    leaf_hash: String,
    signature: String,
}

#[derive(Serialize)]
struct TapTreeLeaf {
    depth: u8,
    leaf_version: u8,
    script_asm: String,
    script_hex: String,
    looks_like: &'static str,
}

#[derive(Serialize)]
struct UnknownField {
    key_type: String,
    key: String,
    value: String,
}

#[derive(Serialize)]
struct DecodedOutput {
    amount: u64,
    script_asm: String,
    script_hex: String,
    #[serde(rename = "type")]
    kind: &'static str,
    #[serde(skip_serializing_if = "Option::is_none")]
    tap_tree: Option<Vec<TapTreeLeaf>>,
    #[serde(skip_serializing_if = "Vec::is_empty")]
    unknown_fields: Vec<UnknownField>,
}

/// Decodes an Ark virtual transaction from its base64 encoded PSBT
pub fn decode_transaction(transaction: &str) -> Result<DecodedTransaction> {
    let psbt = Psbt::from_str(transaction.trim())?;
    let tx = &psbt.unsigned_tx;

    let inputs = tx
        .input
        .iter()
        .zip(&psbt.inputs)
        .map(|(tx_in, input)| {
            let mut taptree = None;
            let mut taptree_parse_error = None;
            let mut unknown_fields = Vec::new();
            for (key, value) in &input.unknown {
                if key.key == ARK_TAPTREE_KEY {
                    match parse_ark_taptree(value) {
                        Ok(leaves) => {
                            taptree = Some(leaves);
                            continue;
                        }
                        Err(err) => taptree_parse_error = Some(err.to_string()),
                    }
                }
                unknown_fields.push(unknown_field(key, value));
            }

            DecodedInput {
                txid: tx_in.previous_output.txid.to_string(),
                vout: tx_in.previous_output.vout,
                sequence: format!("{:#x}", tx_in.sequence.0),
                witness_utxo: input.witness_utxo.as_ref().map(|utxo| WitnessUtxo {
                    amount: utxo.value.to_sat(),
                    script: utxo.script_pubkey.to_hex_string(),
                }),
                tap_leaf_scripts: input
                    .tap_scripts
                    .iter()
                    .map(|(control_block, (script, leaf_version))| TapLeafScript {
                        leaf_version: leaf_version.to_consensus(),
                        internal_key: control_block.internal_key.to_string(),
                        merkle_path: control_block
                            .merkle_branch
                            .iter()
                            .map(|hash| hash.to_string())
                            .collect(),
                        script_asm: script.to_asm_string(),
                        script_hex: script.to_hex_string(),
                        looks_like: classify_leaf(script),
                    })
                    .collect(),
                tap_script_sigs: input
                    .tap_script_sigs
                    .iter()
                    .map(|((pubkey, leaf_hash), signature)| TapScriptSig {
                        pubkey: pubkey.to_string(),
                        leaf_hash: leaf_hash.to_string(),
                        signature: alloy::hex::encode(signature.to_vec()),
                    })
                    .collect(),
                taptree,
                taptree_parse_error,
                unknown_fields,
            }
        })
        .collect();

    let outputs = tx
        .output
        .iter()
        .zip(&psbt.outputs)
        .map(|(tx_out, output)| {
            let script = &tx_out.script_pubkey;
            DecodedOutput {
                amount: tx_out.value.to_sat(),
                script_asm: script.to_asm_string(),
                script_hex: script.to_hex_string(),
                kind: if script.as_bytes() == P2A_SCRIPT {
                    "p2a ephemeral anchor"
                } else if script.is_p2tr() {
                    "p2tr"
                } else {
                    "unknown"
                },
                tap_tree: output.tap_tree.as_ref().map(|tree| {
                    tree.node_info()
                        .leaf_nodes()
                        .filter_map(|node| {
                            node.leaf().as_script().map(|(script, leaf_version)| {
                                tap_tree_leaf(
                                    node.merkle_branch().len() as u8,
                                    leaf_version.to_consensus(),
                                    script,
                                )
                            })
                        })
                        .collect()
                }),
                unknown_fields: output
                    .unknown
                    .iter()
                    .map(|(key, value)| unknown_field(key, value))
                    .collect(),
            }
        })
        .collect();

    Ok(DecodedTransaction {
        txid: tx.compute_txid().to_string(),
        version: tx.version.0,
        locktime: tx.lock_time.to_consensus_u32(),
        inputs,
        outputs,
    })
}

fn unknown_field(key: &bitcoin::psbt::raw::Key, value: &[u8]) -> UnknownField {
    UnknownField {
        key_type: format!("{:#x}", key.type_value),
        key: alloy::hex::encode(&key.key),
        value: alloy::hex::encode(value),
    }
}

fn tap_tree_leaf(depth: u8, leaf_version: u8, script: &Script) -> TapTreeLeaf {
    TapTreeLeaf {
        depth,
        leaf_version,
        script_asm: script.to_asm_string(),
        script_hex: script.to_hex_string(),
        looks_like: classify_leaf(script),
    }
}

/// Parses Ark's proprietary "taptree" field: concatenated leaves of
/// depth (1 byte) | leaf version (1 byte) | script length (compact size) | script
fn parse_ark_taptree(value: &[u8]) -> Result<Vec<TapTreeLeaf>> {
    let mut leaves = Vec::new();
    let mut offset = 0;

    while offset < value.len() {
        if value.len() - offset < 3 {
            return Err(anyhow!("truncated taptree leaf header"));
        }

        let depth = value[offset];
        let leaf_version = value[offset + 1];
        offset += 2;

        let (length, length_size) = read_compact_size(&value[offset..])?;
        offset += length_size;

        let script = value
            .get(offset..offset + length)
            .ok_or_else(|| anyhow!("truncated taptree leaf script"))?;
        offset += length;

        leaves.push(tap_tree_leaf(
            depth,
            leaf_version,
            Script::from_bytes(script),
        ));
    }

    Ok(leaves)
}

fn read_compact_size(data: &[u8]) -> Result<(usize, usize)> {
    let err = || anyhow!("truncated compact size");
    match *data.first().ok_or_else(err)? {
        0xfd => {
            let bytes: [u8; 2] = data.get(1..3).ok_or_else(err)?.try_into()?;
            Ok((u16::from_le_bytes(bytes) as usize, 3))
        }
        0xfe => {
            let bytes: [u8; 4] = data.get(1..5).ok_or_else(err)?.try_into()?;
            Ok((u32::from_le_bytes(bytes) as usize, 5))
        }
        0xff => Err(anyhow!("taptree leaf script too large")),
        length => Ok((length as usize, 1)),
    }
}

fn classify_leaf(script: &Script) -> &'static str {
    let mut has_hash = false;
    let mut has_csv = false;
    let mut has_cltv = false;
    let mut sig_ops = 0;

    for instruction in script.instructions().flatten() {
        if let Instruction::Op(op) = instruction {
            match op {
                opcodes::OP_HASH160 | opcodes::OP_SHA256 | opcodes::OP_RIPEMD160 => has_hash = true,
                opcodes::OP_CSV => has_csv = true,
                opcodes::OP_CLTV => has_cltv = true,
                opcodes::OP_CHECKSIG | opcodes::OP_CHECKSIGVERIFY | opcodes::OP_CHECKSIGADD => {
                    sig_ops += 1
                }
                _ => {}
            }
        }
    }

    if has_hash {
        "claim (preimage + signature)"
    } else if has_csv {
        "unilateral (CSV delay)"
    } else if has_cltv {
        "refund (CLTV timeout)"
    } else if sig_ops >= 2 {
        "cooperative (multiple signatures)"
    } else {
        "unknown"
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    const VHTLC_LOCKUP_TX: &str = "cHNidP8BAGsDAAAAAUcTLvCg9+Wn6t8YYFSYMoFhuvnvPKtCfAGcqAecWKHMAAAAAAD/////AnUeAAAAAAAAIlEgF9f2hdVeNVKJSS8sW5eN8T46WfJjk6KKk6bBHmMlDrAAAAAAAAAAAARRAk5zAAAAAAABASt1HgAAAAAAACJRIFVCQjt4l6tugmTSRnr0eT+AvvqzTC3YEdxHCPUM+/67QRQebYkyfEpNlSckwvINxnrOERkzL++NdXTKrqO5jYWr9QMAr0aGUVLK4yQtq+VM6552nxK7UVfssxvwVUauzjxPQKznOsp/oO/PVfTQ4Hbc3p+m3YSI21ktrBD6cqAKmumJZhKhdeByhgGbPuYx1vfplQBZixz9h6Xut0otkQJUhypBFPBrY67ZZDw6cm85c8O/uvKsGlvtYYlm4U8R3hl0aIWgAwCvRoZRUsrjJC2r5UzrnnafErtRV+yzG/BVRq7OPE9A15qc89NLHBZBG+zydryvkn1vqyfKONewNYmNmHMTTTQ/+QJUns1+GzCSkqkZCW1mqwqFicABj0apRi/8ljX3wkEUMBB4gI5Pe8Da3+KeNLHfjq8BCO8GsXIidAdevBB6EnoDAK9GhlFSyuMkLavlTOuedp8Su1FX7LMb8FVGrs48T0CeVTTz1lNDu0RIA5chHUyLfyqU2/FEQZdDWTCOCigrvpvUqgKWiwGeJVh4nd0kxlbSrqrTFi4/K8tzDOlw+S5DQhXBUJKbdMGgSVS3i0tgNel6XgeKWg8o7JbVR7/ums6AOsAQ+zdj4ChlPS28dM/F1RzZZNxo1lbSHUYYUNF5w6iyr2cgHm2JMnxKTZUnJMLyDcZ6zhEZMy/vjXV0yq6juY2Fq/WtIPBrY67ZZDw6cm85c8O/uvKsGlvtYYlm4U8R3hl0aIWgrSAwEHiAjk97wNrf4p40sd+OrwEI7waxciJ0B168EHoSeqzACN50YXB0cmVllAHAKAMIAECydSDfyuxVjH54zz44uJi6ikPPtXJyZrrjLFxbOusyxViqC6wBwGYgHm2JMnxKTZUnJMLyDcZ6zhEZMy/vjXV0yq6juY2Fq/WtIPBrY67ZZDw6cm85c8O/uvKsGlvtYYlm4U8R3hl0aIWgrSAwEHiAjk97wNrf4p40sd+OrwEI7waxciJ0B168EHoSeqwAAAA=";

    #[test]
    fn test_decode_transaction() {
        let decoded = decode_transaction(VHTLC_LOCKUP_TX).unwrap();

        assert_eq!(
            decoded.txid,
            "7e385a2b0ebb6866bcb6ed77da14045f3028cf271a670017f7b0fb6d32a56113"
        );
        assert_eq!(decoded.version, 3);
        assert_eq!(decoded.locktime, 0);

        assert_eq!(decoded.inputs.len(), 1);
        let input = &decoded.inputs[0];
        assert_eq!(
            input.txid,
            "cca1589c07a89c017c42ab3ceff9ba61813298546018dfeaa7e5f7a0f02e1347"
        );
        assert_eq!(input.vout, 0);
        assert_eq!(input.witness_utxo.as_ref().unwrap().amount, 7797);
        assert_eq!(input.tap_leaf_scripts.len(), 1);
        assert_eq!(
            input.tap_leaf_scripts[0].looks_like,
            "cooperative (multiple signatures)"
        );
        assert_eq!(input.tap_script_sigs.len(), 3);

        let taptree = input.taptree.as_ref().unwrap();
        assert_eq!(taptree.len(), 2);
        assert_eq!(taptree[0].looks_like, "unilateral (CSV delay)");
        assert_eq!(taptree[1].looks_like, "cooperative (multiple signatures)");
        assert!(input.unknown_fields.is_empty());

        assert_eq!(decoded.outputs.len(), 2);
        assert_eq!(decoded.outputs[0].amount, 7797);
        assert_eq!(decoded.outputs[0].kind, "p2tr");
        assert_eq!(decoded.outputs[1].amount, 0);
        assert_eq!(decoded.outputs[1].kind, "p2a ephemeral anchor");
    }

    #[test]
    fn test_decode_transaction_invalid_base64() {
        assert!(decode_transaction("not a psbt").is_err());
    }

    #[test]
    fn test_read_compact_size_single_byte() {
        assert_eq!(read_compact_size(&[0x00]).unwrap(), (0, 1));
        assert_eq!(read_compact_size(&[0xfc]).unwrap(), (0xfc, 1));
    }

    #[test]
    fn test_read_compact_size_u16() {
        assert_eq!(read_compact_size(&[0xfd, 0x34, 0x12]).unwrap(), (0x1234, 3));
    }

    #[test]
    fn test_read_compact_size_u32() {
        assert_eq!(
            read_compact_size(&[0xfe, 0x78, 0x56, 0x34, 0x12]).unwrap(),
            (0x1234_5678, 5)
        );
    }

    #[test]
    fn test_read_compact_size_u64_rejected() {
        assert!(read_compact_size(&[0xff, 0, 0, 0, 0, 0, 0, 0, 0]).is_err());
    }

    #[test]
    fn test_read_compact_size_truncated() {
        assert!(read_compact_size(&[]).is_err());
        assert!(read_compact_size(&[0xfd, 0x01]).is_err());
        assert!(read_compact_size(&[0xfe, 0x01, 0x02, 0x03]).is_err());
    }

    #[test]
    fn test_parse_ark_taptree_empty_script() {
        let leaves = parse_ark_taptree(&[1, 0xc0, 0]).unwrap();
        assert_eq!(leaves.len(), 1);
        assert_eq!(leaves[0].depth, 1);
        assert_eq!(leaves[0].leaf_version, 0xc0);
        assert_eq!(leaves[0].script_hex, "");
        assert_eq!(leaves[0].looks_like, "unknown");
    }

    #[test]
    fn test_parse_ark_taptree_truncated_header() {
        assert!(parse_ark_taptree(&[1]).is_err());
        assert!(parse_ark_taptree(&[1, 0xc0]).is_err());
    }

    #[test]
    fn test_parse_ark_taptree_truncated_script() {
        assert!(parse_ark_taptree(&[1, 0xc0, 2, 0x51]).is_err());
    }

    #[test]
    fn test_classify_leaf_empty_script() {
        assert_eq!(classify_leaf(Script::from_bytes(&[])), "unknown");
    }

    #[test]
    fn test_classify_leaf_csv_takes_precedence_over_cltv() {
        let script = [
            opcodes::OP_CLTV.to_u8(),
            opcodes::OP_CSV.to_u8(),
            opcodes::OP_CHECKSIG.to_u8(),
        ];
        assert_eq!(
            classify_leaf(Script::from_bytes(&script)),
            "unilateral (CSV delay)"
        );
    }

    #[test]
    fn test_classify_leaf_hash_takes_precedence_over_timelocks() {
        let script = [
            opcodes::OP_SHA256.to_u8(),
            opcodes::OP_CSV.to_u8(),
            opcodes::OP_CLTV.to_u8(),
            opcodes::OP_CHECKSIG.to_u8(),
        ];
        assert_eq!(
            classify_leaf(Script::from_bytes(&script)),
            "claim (preimage + signature)"
        );
    }
}

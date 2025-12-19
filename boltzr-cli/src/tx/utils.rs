use anyhow::Result;
use bitcoin::{
    OutPoint as BitcoinOutPoint, ScriptBuf, Transaction as BitcoinTransaction, hashes::Hash,
};
use boltz_core::{
    Musig, Network,
    address::Address,
    bitcoin::{
        InputDetail as BitcoinInputDetail, Tree as BitcoinTree,
        UncooperativeDetails as BitcoinUncooperativeDetails,
    },
    elements::{
        InputDetail as ElementsInputDetail, Tree as ElementsTree,
        UncooperativeDetails as ElementsUncooperativeDetails,
    },
    utils::{InputType, OutputType},
    wrapper::{BitcoinParams, ElementsParams, Params, Transaction, construct_tx},
};
use elements::{
    OutPoint as ElementsOutPoint, Script as ElementsScript, Transaction as ElementsTransaction,
    hex::FromHex,
};

macro_rules! find_matching_output_legacy {
    ($transaction:expr, $output_scripts:expr) => {{
        let (output_type, index) = $transaction
            .output
            .iter()
            .enumerate()
            .find_map(|(index, output)| {
                $output_scripts.iter().find_map(|(output_type, script)| {
                    if output.script_pubkey == *script {
                        Some((output_type.clone(), index))
                    } else {
                        None
                    }
                })
            })
            .ok_or_else(|| anyhow::anyhow!("no matching output found"))?;
        (output_type, index.try_into()?)
    }};
}

macro_rules! find_matching_output_taproot {
    ($transaction:expr, $output_scripts:expr) => {{
        let (internal_key, vout) = $transaction
            .output
            .iter()
            .enumerate()
            .find_map(|(index, output)| {
                $output_scripts
                    .iter()
                    .find(|(_, program)| *program == output.script_pubkey)
                    .map(|(internal_key, _)| (*internal_key, index))
            })
            .ok_or_else(|| anyhow::anyhow!("no matching output found"))?;
        (internal_key, vout.try_into()?)
    }};
}

#[allow(clippy::too_many_arguments)]
pub fn construct_transaction(
    network: Network,
    input_type: InputType,
    private_key: [u8; 32],
    swap_tree_or_redeem_script: &str,
    raw_transaction: Vec<u8>,
    destination_address: &str,
    fee_per_vbyte: f64,
    blinding_key: Option<[u8; 32]>,
) -> Result<Transaction> {
    let address = parse_address(destination_address)?;

    let params = match parse_transaction(raw_transaction)? {
        Transaction::Bitcoin(tx) => {
            let secp = bitcoin::secp256k1::Secp256k1::new();
            let keys = parse_bitcoin_keypair(&secp, &private_key)?;

            let (output_type, vout) =
                handle_output_type(&secp, swap_tree_or_redeem_script, &tx, &keys)?;

            Params::Bitcoin(BitcoinParams {
                inputs: &[&BitcoinInputDetail {
                    input_type,
                    output_type,
                    outpoint: BitcoinOutPoint::new(tx.compute_txid(), vout),
                    tx_out: tx.tx_out(vout as usize)?.clone(),
                    keys,
                }],
                destination: &boltz_core::Destination::Single(&address.try_into()?),
                fee: fee_per_vbyte.into(),
            })
        }
        Transaction::Elements(tx) => {
            let secp = elements::secp256k1_zkp::Secp256k1::new();
            let keys = parse_elements_keypair(&secp, &private_key)?;
            let blinding_key = parse_blinding_key(&secp, blinding_key)?;

            let (output_type, vout) =
                handle_output_type_elements(&secp, swap_tree_or_redeem_script, &tx, &keys)?;

            Params::Elements(ElementsParams {
                inputs: &[&ElementsInputDetail {
                    input_type,
                    output_type,
                    outpoint: ElementsOutPoint::new(tx.txid(), vout),
                    tx_out: tx.output[vout as usize].clone(),
                    blinding_key,
                    keys,
                }],
                destination: &boltz_core::Destination::Single(&address.try_into()?),
                fee: fee_per_vbyte.into(),
                genesis_hash: network.liquid_genesis_hash()?,
            })
        }
    };

    construct_tx(&params)
}

pub fn parse_transaction(transaction: Vec<u8>) -> Result<Transaction> {
    match bitcoin::consensus::deserialize(&transaction) {
        Ok(tx) => Ok(Transaction::Bitcoin(tx)),
        Err(_) => match elements::encode::deserialize(&transaction) {
            Ok(tx) => Ok(Transaction::Elements(tx)),
            Err(_) => Err(anyhow::anyhow!("invalid transaction")),
        },
    }
}

pub fn parse_address(address: &str) -> Result<Address> {
    Address::try_from(address).map_err(|e| anyhow::anyhow!("invalid address: {}", e))
}

pub fn parse_bitcoin_keypair<C: bitcoin::secp256k1::Signing>(
    secp: &bitcoin::secp256k1::Secp256k1<C>,
    private_key: &[u8],
) -> Result<bitcoin::secp256k1::Keypair> {
    bitcoin::secp256k1::Keypair::from_seckey_slice(secp, private_key)
        .map_err(|e| anyhow::anyhow!("invalid private key: {}", e))
}

pub fn parse_elements_keypair<C: bitcoin::secp256k1::Signing>(
    secp: &elements::secp256k1_zkp::Secp256k1<C>,
    private_key: &[u8],
) -> Result<elements::secp256k1_zkp::Keypair> {
    elements::secp256k1_zkp::Keypair::from_seckey_slice(secp, private_key)
        .map_err(|e| anyhow::anyhow!("invalid private key: {}", e))
}

pub fn parse_blinding_key<C: elements::secp256k1_zkp::Signing>(
    secp: &elements::secp256k1_zkp::Secp256k1<C>,
    blinding_key: Option<[u8; 32]>,
) -> Result<Option<elements::secp256k1_zkp::Keypair>> {
    blinding_key
        .map(|key| {
            elements::secp256k1_zkp::Keypair::from_seckey_slice(secp, &key)
                .map_err(|e| anyhow::anyhow!("invalid blinding key: {}", e))
        })
        .transpose()
}

pub fn handle_output_type<C: bitcoin::secp256k1::Verification>(
    secp: &bitcoin::secp256k1::Secp256k1<C>,
    swap_tree_or_redeem_script: &str,
    transaction: &BitcoinTransaction,
    keypair: &bitcoin::secp256k1::Keypair,
) -> Result<(
    OutputType<Option<BitcoinUncooperativeDetails>, ScriptBuf>,
    u32,
)> {
    match serde_json::from_str::<BitcoinTree>(swap_tree_or_redeem_script) {
        Ok(tree) => {
            let refund_pubkey = tree.refund_pubkey()?;
            let internal_keys = generate_internal_keys(
                keypair.secret_bytes(),
                keypair.public_key().serialize(),
                refund_pubkey.serialize(),
            );

            let tree_built = tree.build()?;
            let output_scripts = internal_keys
                .map(|key_result| {
                    let key = key_result?;
                    let key = bitcoin::XOnlyPublicKey::from_slice(&key.serialize())?;

                    let output_key = tree_built
                        .clone()
                        .finalize(secp, key)
                        .map_err(|err| anyhow::anyhow!("failed to finalize tree: {:?}", err))?
                        .output_key();
                    Ok((key, bitcoin::ScriptBuf::new_p2tr_tweaked(output_key)))
                })
                .collect::<Result<Vec<_>>>()?;

            let (internal_key, vout) = find_matching_output_taproot!(transaction, output_scripts);
            Ok((
                OutputType::Taproot(Some(BitcoinUncooperativeDetails { tree, internal_key })),
                vout,
            ))
        }
        Err(taproot_error) => handle_legacy_output(swap_tree_or_redeem_script, transaction)
            .map_err(|e| {
                anyhow::anyhow!(
                    "could not handle output: taproot: {:?}; legacy: {:?}",
                    taproot_error,
                    e
                )
            }),
    }
}

pub fn handle_output_type_elements<C: elements::secp256k1_zkp::Verification>(
    secp: &elements::secp256k1_zkp::Secp256k1<C>,
    swap_tree_or_redeem_script: &str,
    transaction: &ElementsTransaction,
    keypair: &elements::secp256k1_zkp::Keypair,
) -> Result<(
    OutputType<Option<ElementsUncooperativeDetails>, ElementsScript>,
    u32,
)> {
    match serde_json::from_str::<ElementsTree>(swap_tree_or_redeem_script) {
        Ok(tree) => {
            let refund_pubkey = tree.refund_pubkey()?;
            let internal_keys = generate_internal_keys(
                keypair.secret_bytes(),
                keypair.public_key().serialize(),
                refund_pubkey.serialize(),
            );

            let tree_built = tree.build()?;
            let output_scripts = internal_keys
                .map(|key_result| {
                    let key = key_result?;
                    let key = bitcoin::XOnlyPublicKey::from_slice(&key.serialize())?;

                    let output_key = tree_built
                        .clone()
                        .finalize(secp, key)
                        .map_err(|err| anyhow::anyhow!("failed to finalize tree: {:?}", err))?
                        .output_key();
                    Ok((key, ElementsScript::new_v1_p2tr_tweaked(output_key)))
                })
                .collect::<Result<Vec<_>>>()?;

            let (internal_key, vout) = find_matching_output_taproot!(transaction, output_scripts);
            Ok((
                OutputType::Taproot(Some(ElementsUncooperativeDetails { tree, internal_key })),
                vout,
            ))
        }
        Err(taproot_error) => {
            handle_legacy_output_elements(swap_tree_or_redeem_script, transaction).map_err(|e| {
                anyhow::anyhow!(
                    "could not handle output: taproot: {:?}; legacy: {:?}",
                    taproot_error,
                    e
                )
            })
        }
    }
}

fn handle_legacy_output(
    redeem_script: &str,
    transaction: &BitcoinTransaction,
) -> Result<(
    OutputType<Option<BitcoinUncooperativeDetails>, ScriptBuf>,
    u32,
)> {
    let script = ScriptBuf::from_hex(redeem_script)
        .map_err(|e| anyhow::anyhow!("failed to parse redeem script: {}", e))?;

    let output_scripts = [
        (
            OutputType::Legacy(script.clone()),
            bitcoin::ScriptBuf::new_p2sh(&script.script_hash()),
        ),
        (
            OutputType::Compatibility(script.clone()),
            bitcoin::ScriptBuf::new_p2sh(
                &bitcoin::script::Builder::new()
                    .push_opcode(bitcoin::opcodes::OP_0)
                    .push_slice(
                        bitcoin::hashes::sha256::Hash::hash(script.as_bytes()).as_byte_array(),
                    )
                    .into_script()
                    .script_hash(),
            ),
        ),
        (
            OutputType::SegwitV0(script.clone()),
            bitcoin::ScriptBuf::new_p2wsh(&script.wscript_hash()),
        ),
    ];

    Ok(find_matching_output_legacy!(transaction, output_scripts))
}

fn handle_legacy_output_elements(
    redeem_script: &str,
    transaction: &ElementsTransaction,
) -> Result<(
    OutputType<Option<ElementsUncooperativeDetails>, ElementsScript>,
    u32,
)> {
    let script = ElementsScript::from_hex(redeem_script)
        .map_err(|e| anyhow::anyhow!("failed to parse redeem script: {}", e))?;

    let output_scripts = [
        (OutputType::Legacy(script.clone()), script.to_p2sh()),
        (
            OutputType::Compatibility(script.clone()),
            elements::script::Builder::new()
                .push_opcode(elements::opcodes::all::OP_PUSHBYTES_0)
                .push_slice(bitcoin::hashes::sha256::Hash::hash(script.as_bytes()).as_byte_array())
                .into_script()
                .to_p2sh(),
        ),
        (OutputType::SegwitV0(script.clone()), script.to_v0_p2wsh()),
    ];

    Ok(find_matching_output_legacy!(transaction, output_scripts))
}

// We don't know the order of the keys, so we need to try all combinations
fn generate_internal_keys(
    privkey: [u8; 32],
    our_pubkey: [u8; 33],
    their_pubkey: [u8; 32],
) -> impl Iterator<Item = Result<boltz_core::musig::XOnlyPublicKey>> {
    [0x02u8, 0x03u8]
        .into_iter()
        .flat_map(move |tie_breaker| {
            [
                [our_pubkey, prepend_tie_breaker(&their_pubkey, tie_breaker)],
                [prepend_tie_breaker(&their_pubkey, tie_breaker), our_pubkey],
            ]
        })
        .map(move |keys| {
            Ok(Musig::new(
                Musig::convert_keypair(privkey)?,
                keys.iter()
                    .map(|key| Musig::convert_pub_key(key))
                    .collect::<Result<Vec<_>>>()?,
                [0; 32],
            )?
            .agg_pk())
        })
}

fn prepend_tie_breaker(key: &[u8; 32], tie_breaker: u8) -> [u8; 33] {
    let mut result = [0u8; 33];
    result[0] = tie_breaker;
    result[1..].copy_from_slice(key);
    result
}

use crate::{
    FeeTarget, Network,
    elements::tx::{ExplicitOutput, TxError, UnblindedOutput, create_output},
    network::NetworkError,
    target_fee::{FeeError, target_fee},
};
use elements::{
    Address, LockTime, OutPoint, Script, Sequence, Transaction, TxIn, TxInWitness, TxOut,
    confidential::{AssetBlindingFactor, ValueBlindingFactor},
    hex::ToHex,
    opcodes::all::OP_PUSHBYTES_0,
    script::Builder,
    secp256k1_zkp::{Keypair, Secp256k1, Signing, Verification, rand},
};

const ECDSA_SIGNATURE_SIZE: usize = 70;
const ECDSA_PUBLIC_KEY_SIZE: usize = 33;
const SCHNORR_SIGNATURE_SIZE: usize = 64;

enum OutputType {
    Legacy,
    NestedSegwit,
    SegwitV0,
    SegwitV1,
}

/// Errors returned by [`construct_asset_rescue`].
#[derive(Debug, thiserror::Error)]
#[non_exhaustive]
pub enum AssetRescueError {
    /// The stuck asset's input is not a Taproot output (rescue only supports v1 p2tr).
    #[error("asset input is not a Taproot")]
    AssetInputNotTaproot,
    /// The "asset" input is in fact L-BTC; use [`construct_tx`](super::construct_tx) instead.
    #[error("asset input is LBTC")]
    AssetInputIsLbtc,
    /// The supplied L-BTC funding input does not actually carry L-BTC.
    #[error("LBTC input has different asset id")]
    LbtcInputWrongAsset,
    /// The L-BTC funding input is too small to cover fees.
    #[error("change is negative")]
    NegativeChange,
    /// The L-BTC change would be exactly zero (no spendable change output).
    #[error("change is zero")]
    ZeroChange,
    /// The L-BTC destination must be a confidential (blinded) address.
    #[error("LBTC destination has to be blinded")]
    LbtcDestinationNotBlinded,
    /// The destination address has an unsupported script type.
    #[error("output has unknown type")]
    UnknownOutputType,
    /// A confidential input is missing its blinding key.
    #[error("input has no blinding key")]
    MissingBlindingKey,
    /// An explicit input did not expose its asset.
    #[error("input has no explicit asset")]
    MissingExplicitAsset,
    /// An explicit input did not expose its value.
    #[error("input has no explicit value")]
    MissingExplicitValue,
    /// The relative fee rate is non-finite or negative.
    #[error("invalid fee rate")]
    InvalidFeeRate,
    /// A [`Network`] operation failed.
    #[error(transparent)]
    Network(#[from] NetworkError),
    /// An underlying transaction-construction step failed.
    #[error(transparent)]
    Tx(#[from] TxError),
    /// Failed to unblind a confidential input.
    #[error(transparent)]
    Unblind(#[from] elements::UnblindError),
}

impl From<FeeError> for AssetRescueError {
    fn from(e: FeeError) -> Self {
        match e {
            FeeError::InvalidFeeRate => AssetRescueError::InvalidFeeRate,
        }
    }
}

/// One side of the asset-rescue input pair: an input to spend plus the
/// address it should be swept to.
///
/// Used twice by [`construct_asset_rescue`] — once for the stuck non-L-BTC
/// asset and once for the L-BTC funding input that pays the fee.
pub struct AssetPair<'a> {
    /// The previous output (`scriptPubKey` + commitments) being spent.
    pub tx_out: &'a TxOut,
    /// The outpoint of the UTXO being spent.
    pub outpoint: OutPoint,
    /// Optional blinding key, required to unblind a confidential `tx_out`.
    pub blinding_key: Option<Keypair>,

    /// Address that receives the swept funds.
    pub destination: &'a Address,
}

struct UnblindedAssetPair<'a> {
    asset_pair: &'a AssetPair<'a>,
    unblinded: UnblindedOutput,
}

/// Construct a transaction that rescues a non-L-BTC asset accidentally
/// sent to a Boltz Taproot swap output.
///
/// Spends `asset_pair` (the stuck asset) and `lbtc_pair` (an L-BTC input
/// to pay the fee), sending the asset to its destination and the L-BTC
/// remainder to its destination as change. The L-BTC destination must be
/// a confidential address — see [`AssetRescueError::LbtcDestinationNotBlinded`].
#[must_use = "ignoring the result discards the constructed rescue transaction"]
pub fn construct_asset_rescue<C: Signing + Verification>(
    secp: &Secp256k1<C>,
    network: Network,
    asset_pair: &AssetPair,
    lbtc_pair: &AssetPair,
    fee: FeeTarget,
) -> Result<(Transaction, u64), AssetRescueError> {
    if !asset_pair.tx_out.script_pubkey.is_v1_p2tr() {
        return Err(AssetRescueError::AssetInputNotTaproot);
    }

    let asset_unblinded = UnblindedAssetPair {
        asset_pair,
        unblinded: unblind_outputs(secp, asset_pair)?,
    };
    let lbtc_unblinded = UnblindedAssetPair {
        asset_pair: lbtc_pair,
        unblinded: unblind_outputs(secp, lbtc_pair)?,
    };

    let liquid_asset_id = network.liquid_asset_id()?;
    if asset_unblinded.unblinded.asset().to_hex() == liquid_asset_id {
        return Err(AssetRescueError::AssetInputIsLbtc);
    }
    if lbtc_unblinded.unblinded.asset().to_hex() != liquid_asset_id {
        return Err(AssetRescueError::LbtcInputWrongAsset);
    }

    let (mut tx, fee) = target_fee(fee, |fee, is_fee_estimation| {
        construct_raw(
            secp,
            &asset_unblinded,
            &lbtc_unblinded,
            fee,
            is_fee_estimation,
        )
    })?;

    // Clear the stubs we use for fee estimation
    for input in tx.input.iter_mut() {
        input.script_sig = Script::new();
        input.witness.script_witness = vec![];
    }

    Ok((tx, fee))
}

fn construct_raw<C: Signing + Verification>(
    secp: &Secp256k1<C>,
    asset_pair: &UnblindedAssetPair,
    lbtc_pair: &UnblindedAssetPair,
    fee: u64,
    is_fee_estimation: bool,
) -> Result<Transaction, AssetRescueError> {
    // We only allow the asset rescue for Taproot Swaps
    let asset_in = TxIn {
        previous_output: asset_pair.asset_pair.outpoint,
        sequence: Sequence::ENABLE_RBF_NO_LOCKTIME,
        witness: TxInWitness {
            script_witness: [vec![0; SCHNORR_SIGNATURE_SIZE]].to_vec(),
            ..Default::default()
        },
        ..Default::default()
    };

    let mut lbtc_in = TxIn {
        previous_output: lbtc_pair.asset_pair.outpoint,
        sequence: Sequence::ENABLE_RBF_NO_LOCKTIME,
        ..Default::default()
    };
    match output_type(lbtc_pair.asset_pair.tx_out)? {
        OutputType::Legacy => {
            lbtc_in.script_sig = Builder::new()
                .push_slice(&[0; ECDSA_SIGNATURE_SIZE])
                .push_slice(&[0; ECDSA_PUBLIC_KEY_SIZE])
                .into_script();
        }
        OutputType::NestedSegwit => {
            lbtc_in.script_sig = Builder::new()
                .push_slice(
                    Builder::new()
                        .push_opcode(OP_PUSHBYTES_0)
                        .push_slice(&[0; 20])
                        .into_script()
                        .as_bytes(),
                )
                .into_script();
            lbtc_in.witness.script_witness = [
                vec![0; ECDSA_SIGNATURE_SIZE],
                vec![0; ECDSA_PUBLIC_KEY_SIZE],
            ]
            .to_vec();
        }
        OutputType::SegwitV0 => {
            lbtc_in.witness.script_witness = [
                vec![0; ECDSA_SIGNATURE_SIZE],
                vec![0; ECDSA_PUBLIC_KEY_SIZE],
            ]
            .to_vec();
        }
        OutputType::SegwitV1 => {
            lbtc_in.witness.script_witness = [vec![0; SCHNORR_SIGNATURE_SIZE]].to_vec();
        }
    }

    Ok(Transaction {
        version: 2,
        lock_time: LockTime::ZERO,
        input: vec![asset_in, lbtc_in],
        output: blind_outputs(secp, asset_pair, lbtc_pair, fee, is_fee_estimation)?,
    })
}

fn blind_outputs<C: Signing>(
    secp: &Secp256k1<C>,
    asset_pair: &UnblindedAssetPair,
    lbtc_pair: &UnblindedAssetPair,
    fee: u64,
    is_fee_estimation: bool,
) -> Result<Vec<TxOut>, AssetRescueError> {
    let change = lbtc_pair
        .unblinded
        .amount()
        .checked_sub(fee)
        .ok_or(AssetRescueError::NegativeChange)?;

    if change == 0 {
        return Err(AssetRescueError::ZeroChange);
    }

    if !lbtc_pair.asset_pair.destination.is_blinded() {
        return Err(AssetRescueError::LbtcDestinationNotBlinded);
    }

    let unblinded = &[asset_pair.unblinded, lbtc_pair.unblinded];
    let asset_bf = AssetBlindingFactor::new(&mut rand::thread_rng());

    let asset_output = create_output(
        secp,
        unblinded,
        (asset_pair.unblinded.asset(), asset_bf),
        &asset_pair.asset_pair.destination.script_pubkey(),
        asset_pair.asset_pair.destination.blinding_pubkey,
        asset_pair.unblinded.amount(),
        is_fee_estimation,
        None,
    )?;

    let fee_output = (
        false,
        AssetBlindingFactor::zero(),
        ValueBlindingFactor::zero(),
        TxOut::new_fee(fee, lbtc_pair.unblinded.asset()),
    );

    let change_output = create_output(
        secp,
        unblinded,
        (lbtc_pair.unblinded.asset(), asset_bf),
        &lbtc_pair.asset_pair.destination.script_pubkey(),
        lbtc_pair.asset_pair.destination.blinding_pubkey,
        change,
        is_fee_estimation,
        Some(&[
            (
                asset_pair.unblinded.amount(),
                asset_output.1,
                asset_output.2,
            ),
            (fee, fee_output.1, fee_output.2),
        ]),
    )?;

    Ok(vec![asset_output.3, change_output.3, fee_output.3])
}

fn output_type(output: &TxOut) -> Result<OutputType, AssetRescueError> {
    if output.script_pubkey.is_p2pkh() {
        Ok(OutputType::Legacy)
    } else if output.script_pubkey.is_p2sh() {
        Ok(OutputType::NestedSegwit)
    } else if output.script_pubkey.is_v0_p2wpkh() {
        Ok(OutputType::SegwitV0)
    } else if output.script_pubkey.is_v1_p2tr() {
        Ok(OutputType::SegwitV1)
    } else {
        Err(AssetRescueError::UnknownOutputType)
    }
}

fn unblind_outputs<C: Verification>(
    secp: &Secp256k1<C>,
    input: &AssetPair,
) -> Result<UnblindedOutput, AssetRescueError> {
    Ok(if input.tx_out.value.is_confidential() {
        let sec = input.tx_out.unblind(
            secp,
            input
                .blinding_key
                .ok_or(AssetRescueError::MissingBlindingKey)?
                .secret_key(),
        )?;
        UnblindedOutput::Unblinded(sec)
    } else {
        UnblindedOutput::Explicit(ExplicitOutput {
            asset: input
                .tx_out
                .asset
                .explicit()
                .ok_or(AssetRescueError::MissingExplicitAsset)?,
            amount: input
                .tx_out
                .value
                .explicit()
                .ok_or(AssetRescueError::MissingExplicitValue)?,
        })
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{
        client::{RpcClient, RpcParam},
        elements::tx::tests::{
            FUNDING_AMOUNT, address_blinding_key, fund_address, get_destination, get_genesis_hash,
            mine_block, send_raw_transaction,
        },
    };
    use bitcoin::Amount;
    use elements::{
        AddressParams,
        pset::serialize::Serialize,
        schnorr::TweakedPublicKey,
        secp256k1_zkp::{Message, SecretKey},
        sighash::{Prevouts, SighashCache},
    };
    type Result<T> = std::result::Result<T, Box<dyn std::error::Error>>;

    use rstest::rstest;
    use serde::Deserialize;
    use serial_test::serial;
    use std::{collections::HashMap, str::FromStr};

    #[derive(Debug, Clone, Deserialize)]
    struct IssuedAsset {
        asset: String,
    }

    #[derive(Debug, Clone, Deserialize)]
    struct SignedTransaction {
        hex: String,
    }

    #[derive(Debug, Clone, Deserialize)]
    struct AssetAmount {
        bitcoin: f64,
        #[serde(flatten)]
        assets: HashMap<String, f64>,
    }

    #[derive(Debug, Clone, Deserialize)]
    struct TransactionResponse {
        amount: AssetAmount,
    }

    type Balances = HashMap<String, f64>;

    fn issue_asset(client: &RpcClient) -> Result<String> {
        let res = client.request::<IssuedAsset>(
            "issueasset",
            Some(&[RpcParam::Float(1.0), RpcParam::Float(1.0)]),
        )?;
        Ok(res.asset)
    }

    fn sign_raw_transaction_with_wallet(
        client: &RpcClient,
        tx: &Transaction,
    ) -> Result<Transaction> {
        let res = client.request::<SignedTransaction>(
            "signrawtransactionwithwallet",
            Some(&[RpcParam::Str(&hex::encode(tx.serialize()))]),
        )?;
        Ok(elements::encode::deserialize(&hex::decode(res.hex)?)?)
    }

    fn get_balance(client: &RpcClient) -> Result<Balances> {
        let res = client.request::<Balances>("getbalance", None)?;
        Ok(res)
    }

    fn get_transaction(client: &RpcClient, txid: &str) -> Result<AssetAmount> {
        let res = client
            .request::<TransactionResponse>("gettransaction", Some(&[RpcParam::Str(txid)]))?;
        Ok(res.amount)
    }
    #[rstest]
    #[case::blinded_asset_output_blech32(true, true, "blech32")]
    #[case::unblinded_asset_output_blech32(false, true, "blech32")]
    #[case::blinded_asset_output_nested_segwit(true, true, "p2sh-segwit")]
    #[case::unblinded_asset_output_nested_segwit(false, true, "p2sh-segwit")]
    #[case::blinded_asset_output_legacy(true, true, "legacy")]
    #[case::unblinded_asset_output_legacy(false, true, "legacy")]
    #[case::blinded_asset_output_blinded_input_blech32(true, false, "blech32")]
    #[case::unblinded_asset_output_blinded_input_blech32(false, false, "blech32")]
    #[case::blinded_asset_output_blinded_input_nested_segwit(true, false, "p2sh-segwit")]
    #[case::unblinded_asset_output_blinded_input_nested_segwit(false, false, "p2sh-segwit")]
    #[case::blinded_asset_output_blinded_input_legacy(true, false, "legacy")]
    #[case::unblinded_asset_output_blinded_input_legacy(false, false, "legacy")]
    #[serial(Elements)]
    fn test_construct_asset_rescue(
        #[case] blinded_asset_input: bool,
        #[case] blinded_asset_output: bool,
        #[case] address_type: &str,
    ) {
        let client = RpcClient::new_elements_regtest();

        let secp = Secp256k1::new();

        let keypair = Keypair::new(&secp, &mut rand::thread_rng());
        let asset_address = Address::p2tr_tweaked(
            TweakedPublicKey::new(keypair.x_only_public_key().0),
            if blinded_asset_input {
                Some(keypair.public_key())
            } else {
                None
            },
            &AddressParams::ELEMENTS,
        );

        let asset = issue_asset(&client).unwrap();
        let balance_asset_before = get_balance(&client).unwrap()[&asset];

        let (asset_tx, asset_vout) = fund_address(
            &client,
            &asset_address,
            Some(&asset),
            Some(blinded_asset_input),
        );

        let lbtc_address = get_destination(&client, true, Some(address_type));
        let (lbtc_tx, lbtc_vout) = fund_address(&client, &lbtc_address, None, Some(true));

        let fee_target = 0.1;
        let (mut rescue_tx, fee) = construct_asset_rescue(
            &secp,
            Network::Regtest,
            &AssetPair {
                tx_out: &asset_tx.output[asset_vout],
                outpoint: OutPoint::new(asset_tx.txid(), asset_vout as u32),
                blinding_key: Some(keypair),
                destination: &get_destination(&client, blinded_asset_output, None),
            },
            &AssetPair {
                tx_out: &lbtc_tx.output[lbtc_vout],
                outpoint: OutPoint::new(lbtc_tx.txid(), lbtc_vout as u32),
                blinding_key: Some(Keypair::from_secret_key(
                    &secp,
                    &SecretKey::from_str(&address_blinding_key(&client, lbtc_address.to_string()))
                        .unwrap(),
                )),
                destination: &get_destination(&client, true, None),
            },
            FeeTarget::Relative(fee_target),
        )
        .unwrap();

        let sighash = SighashCache::new(&rescue_tx)
            .taproot_key_spend_signature_hash(
                0,
                &Prevouts::All(&[
                    asset_tx.output[asset_vout].clone(),
                    lbtc_tx.output[lbtc_vout].clone(),
                ]),
                elements::SchnorrSighashType::Default,
                get_genesis_hash(&client),
            )
            .unwrap();
        rescue_tx.input[0].witness.script_witness = vec![
            secp.sign_schnorr(
                &Message::from_digest_slice(sighash.as_raw_hash().as_ref()).unwrap(),
                &keypair,
            )
            .serialize()
            .to_vec(),
        ];
        let signed_tx = sign_raw_transaction_with_wallet(&client, &rescue_tx).unwrap();

        mine_block(&client);

        println!("{}", send_raw_transaction(&client, &signed_tx));
        mine_block(&client);

        let balances_after = get_balance(&client).unwrap();
        assert_eq!(balance_asset_before, balances_after[&asset]);

        let transaction_amounts = get_transaction(&client, &signed_tx.txid().to_string()).unwrap();

        // Verify that no LBTC is sent anywhere
        assert_eq!(transaction_amounts.bitcoin, 0.0);
        assert_eq!(
            transaction_amounts.assets[&asset],
            Amount::from_sat(FUNDING_AMOUNT).to_btc()
        );

        assert_eq!(
            fee,
            (signed_tx.discount_vsize() as f64 * fee_target).ceil() as u64
        );
    }
}

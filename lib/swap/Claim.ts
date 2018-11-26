/**
 * This file is based on the repository github.com/submarineswaps/swaps-service created by Alex Bosworth
 */

import { BIP32 } from 'bip32';
import ops from '@michael1011/bitcoin-ops';
import * as bip65 from 'bip65';
import * as varuint from 'varuint-bitcoin';
import { Transaction, crypto, script, ECPair } from 'bitcoinjs-lib';
import { encodeSignature, scriptBuffersToScript, getOutputScriptType } from './SwapUtils';
import { estimateFee } from '../wallet/FeeCalculator';
import { OutputType } from '../proto/boltzrpc_pb';
import { TransactionOutput } from '../consts/Types';

export type ClaimDetails = {
  preimage: Buffer;
  keys: ECPair | BIP32;
  redeemScript: Buffer;
};

// TODO: claiming with multiple UTXOs
// TODO: support for RBF
/**
 * Claim a swap
 *
 * @param claimDetails preimage, key pair and redeemScript needed for claiming the swap
 * @param utxo amount of satoshis per vbyte that should be paid as fee
 * @param destinationScript the output script to which the funds should be sent
 * @param feePerByte how many satoshis per vbyte should be paid as fee
 * @param timeoutBlockHeight locktime of the transaction; only needed if used used for a refund
 *
 * @returns claim transaction
 */
export const constructClaimTransaction = (claimDetails: ClaimDetails, utxo: TransactionOutput,
  destinationScript: Buffer, feePerByte = 1, timeoutBlockHeight?: number): Transaction => {

  const { preimage, keys, redeemScript } = claimDetails;

  const tx = new Transaction();

  // Refunding transactions are just like claiming ones and therefore
  // this method is also used for refunds. In orders to use to use
  // the timelock needed for the refund the locktime of the transaction
  // has to be after the timelock is over.
  if (timeoutBlockHeight) {
    tx.locktime = bip65.encode({ blocks: timeoutBlockHeight });
  }

  // Add the swap as input to the transaction
  tx.addInput(utxo.txHash, utxo.vout, 0);

  // Estimate the fee for the transaction
  const fee = estimateFee(feePerByte, [{ type: utxo.type, swapDetails: { preimage, redeemScript } }], [getOutputScriptType(destinationScript)!]);

  // Send the swap value minues the estimated fee to the destination address
  tx.addOutput(destinationScript, utxo.value - fee);

  switch (utxo.type) {
    // Construct the signed input scripts for P2SH inputs
    case OutputType.LEGACY:
      const sigHash = tx.hashForSignature(0, redeemScript, Transaction.SIGHASH_ALL);
      const signature = keys.sign(sigHash);

      const inputScript = [
        encodeSignature(Transaction.SIGHASH_ALL, signature),
        preimage,
        ops.OP_PUSHDATA1,
        redeemScript,
      ];

      tx.setInputScript(0, scriptBuffersToScript(inputScript));
      break;

    // Construct the nested redeem script for nested SegWit inputs
    case OutputType.COMPATIBILITY:
      const nestedScript = [
        varuint.encode(ops.OP_0).toString('hex'),
        crypto.sha256(redeemScript),
      ];

      const nested = scriptBuffersToScript(nestedScript);

      tx.setInputScript(0, scriptBuffersToScript([nested]));
      break;
  }

  // Construct the signed witness for (nested) SegWit inputs
  if (utxo.type !== OutputType.LEGACY) {
    const sigHash = tx.hashForWitnessV0(0, redeemScript, utxo.value, Transaction.SIGHASH_ALL);
    const signature = script.signature.encode(keys.sign(sigHash), Transaction.SIGHASH_ALL);

    tx.setWitness(0, [
      signature,
      preimage,
      redeemScript,
    ]);
  }

  return tx;
};

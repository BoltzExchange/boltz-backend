/**
 * This file is based on the repository github.com/submarineswaps/swaps-service created by Alex Bosworth
 */

import { BIP32 } from 'bip32';
import ops from '@michael1011/bitcoin-ops';
import * as bip65 from 'bip65';
import * as varuint from 'varuint-bitcoin';
import { Transaction, crypto, script, ECPair } from 'bitcoinjs-lib';
import { encodeSignature, scriptBuffersToScript } from './SwapUtils';
import { OutputType } from '../proto/boltzrpc_pb';
import { TransactionOutput } from '../consts/Types';

// TODO: claiming with multiple UTXOs
// TODO: support for RBF
/**
 * Claim a swap
 *
 * @param preimage the preimage of the transaction
 * @param claimKeys the key pair needed to claim the swap
 * @param destinationScript the output script to which the funds should be sent
 * @param utxo the swap UTXO to claim
 * @param redeemScript the redeem script of the swap
 * @param timeoutBlockHeight locktime of the transaction; only needed if used used for a refund
 *
 * @returns claim transaction
 */
export const constructClaimTransaction = (preimage: Buffer, claimKeys: ECPair | BIP32, destinationScript: Buffer, utxo: TransactionOutput,
  redeemScript: Buffer, timeoutBlockHeight?: number): Transaction => {

  const tx = new Transaction();

  // Refund uses this method to generate refund transactions and CTLVs
  // require the transaction to have a locktime after the timeout
  if (timeoutBlockHeight) {
    tx.locktime = bip65.encode({ blocks: timeoutBlockHeight });
  }

  // Add the swap as input to the transaction
  tx.addInput(utxo.txHash, utxo.vout, 0);

  // TODO: fee estimation
  tx.addOutput(destinationScript, utxo.value - 1000);

  // Add missing witness and scripts
  switch (utxo.type) {
    // Construct the signed input scripts for P2SH inputs
    case OutputType.LEGACY:
      const sigHash = tx.hashForSignature(0, redeemScript, Transaction.SIGHASH_ALL);
      const signature = claimKeys.sign(sigHash);

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
    const signature = script.signature.encode(claimKeys.sign(sigHash), Transaction.SIGHASH_ALL);

    tx.setWitness(0, [
      signature,
      preimage,
      redeemScript,
    ]);
  }

  return tx;
};

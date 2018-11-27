/**
 * This file is based on the repository github.com/submarineswaps/swaps-service created by Alex Bosworth
 */

import { BIP32 } from 'bip32';
import { ECPair } from 'bitcoinjs-lib';
import ops from '@michael1011/bitcoin-ops';
import { TransactionOutput } from '../consts/Types';
import { getHexBuffer } from '../Utils';
import { constructClaimTransaction } from './Claim';

const hexBase = 16;
const dummyPreimage = getHexBuffer(ops.OP_FALSE.toString(hexBase));

/**
 * Refund a swap
 *
 * @param refundKeys the key pair needed to refund the swap
 * @param redeemScript redeem script of the swap
 * @param timeoutBlockHeight block height at which the swap times out
 * @param utxo the swap UTXO to claim
 * @param destinationScript the output script to which the funds should be sent
 * @param feePerByte how many satoshis per vbyte should be paid as fee
 *
 * @returns refund transaction
 */
export const constructRefundTransaction = (refundKeys: ECPair | BIP32, redeemScript: Buffer, timeoutBlockHeight: number, utxo: TransactionOutput,
  destinationScript: Buffer, feePerByte = 1) => {

  return constructClaimTransaction(
    {
      redeemScript,
      keys: refundKeys,
      preimage: dummyPreimage,
    },
    utxo,
    destinationScript,
    feePerByte,
    timeoutBlockHeight,
  );
};

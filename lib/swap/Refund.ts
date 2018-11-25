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

// TODO: add unit tests
// TODO: same TODOs as in Claim.ts
/**
 * Refund a swap
 *
 * @param timeoutBlockHeight block height at which the swap times out
 * @param refundKeys the key pair needed to refund the swap
 * @param destinationScript the output script to which the funds should be sent
 * @param utxo the swap UTXO to claim
 * @param redeemScript the redeem script of the swap
 *
 * @returns refund transaction
 */
export const constructRefundTransaction = (timeoutBlockHeight: number, refundKeys: ECPair | BIP32, destinationScript: Buffer,
  utxo: TransactionOutput, redeemScript: Buffer) => {

  return constructClaimTransaction(
    dummyPreimage,
    refundKeys,
    destinationScript,
    utxo,
    redeemScript,
    timeoutBlockHeight,
  );
};

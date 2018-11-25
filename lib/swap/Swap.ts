/**
 * This file is based on the repository github.com/submarineswaps/swaps-service created by Alex Bosworth
 */

import { script, crypto } from 'bitcoinjs-lib';
import ops from '@michael1011/bitcoin-ops';
import * as bip65 from 'bip65';
import { toPushdataScript } from './SwapUtils';

const encodeCltv = (timeoutBlockHeight: number) => {
  return script.number.encode(
    bip65.encode({ blocks: timeoutBlockHeight }),
  );
};

/**
 * Generate a swap redeem script with a public key refund path
 *
 * @param preimageHash hash of the preimage of the swap
 * @param claimPublicKey public key of the keypair needed for claiming
 * @param refundPublicKey public key of the keypair needed for refunding
 * @param timeoutBlockHeight at what block the HTLC should time out
 *
 * @returns redeem script
 */
export const pkRefundSwap = (preimageHash: Buffer, claimPublicKey: Buffer, refundPublicKey: Buffer, timeoutBlockHeight: number) => {
  const cltv = encodeCltv(timeoutBlockHeight);

  return toPushdataScript([
    ops.OP_HASH160,
    crypto.ripemd160(preimageHash),
    ops.OP_EQUAL,

    ops.OP_IF,
    claimPublicKey,

    ops.OP_ELSE,
    cltv,
    ops.OP_CHECKLOCKTIMEVERIFY,
    ops.OP_DROP,
    refundPublicKey,

    ops.OP_ENDIF,

    ops.OP_CHECKSIG,
  ]);
};

/**
 * Generate a swap redeem script with a public key hash refund path
 *
 * @param preimageHash hash of the preimage of the swap
 * @param claimPublicKey public key of the keypair needed for claiming
 * @param refundPublicKeyHash hash of the public key of the keypair needed for refunding
 * @param timeoutBlockHeight at what block the HTLC should time out
 *
 * @returns redeem script
 */
export const pkHashRefundSwap = (preimageHash: Buffer, claimPublicKey: Buffer, refundPublicKeyHash: Buffer, timeoutBlockHeight: number) => {
  const cltv = encodeCltv(timeoutBlockHeight);

  return toPushdataScript([
    ops.OP_DUP,
    ops.OP_HASH160,
    crypto.ripemd160(preimageHash),
    ops.OP_EQUAL,

    ops.OP_IF,
    ops.OP_DROP,
    claimPublicKey,

    ops.OP_ELSE,
    cltv,
    ops.OP_CHECKLOCKTIMEVERIFY,
    ops.OP_DROP,
    ops.OP_DUP,
    ops.OP_HASH160,
    refundPublicKeyHash,
    ops.OP_EQUALVERIFY,

    ops.OP_ENDIF,

    ops.OP_CHECKSIG,
  ]);
};

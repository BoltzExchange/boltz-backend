/**
 * This file is based on the repository github.com/submarineswaps/swaps-service created by Alex Bosworth
 */

import { script, crypto } from 'bitcoinjs-lib';
import ops from '@michael1011/bitcoin-ops';

/**
 * Get a P2WPKH output script
 *
 * @param hash public key hash hex Buffer
 *
 * @returns P2WPKH output script Buffer
 */
export const p2wpkhOutput = (hash: Buffer) => {
  return script.compile([
    ops.OP_0,
    hash,
  ]);
};

/**
 * Encode a P2WSH output script
 *
 * @param scriptHex redeem script hex Buffer
 *
 * @returns P2WSH output script Buffer
 */
export const p2wshOutput = (scriptHex: Buffer) => {
  return script.compile([
    ops.OP_0,
    crypto.sha256(scriptHex),
  ]);
};

/**
 * Get a P2PKH output script
 *
 * @param hash public key hash hex Buffer
 *
 * @returns P2PKH output script Buffer
 */
export const p2pkhOutput = (hash: Buffer) => {
  return script.compile([
    ops.OP_DUP,
    ops.OP_HASH160,
    hash,
    ops.OP_EQUALVERIFY,
    ops.OP_CHECKSIG,
  ]);
};

/**
 * Encode a P2SH output script
 *
 * @param scriptHex redeem script hex Buffer
 *
 * @returns P2SH output script Buffer
 */
export const p2shOutput = (scriptHex: Buffer) => {
  return script.compile([
    ops.OP_HASH160,
    crypto.hash160(scriptHex),
    ops.OP_EQUAL,
  ]);
};

/**
 * Get a P2SH nested P2WPKH output script
 *
 * @param hash public key hash hex Buffer
 */
export const p2shP2wpkhOutput = (hash: Buffer) => {
  const witness = p2wpkhOutput(hash);

  return {
    redeemScript: witness,
    outputScript: p2shOutput(witness),
  };
};

/**
 * Get a P2SH nested P2WSH output script
 *
 * @param scriptHex redeem script hex Buffer
 */
export const p2shP2wshOutput = (scriptHex: Buffer) => {
  const witness = p2wshOutput(scriptHex);

  return p2shOutput(witness);
};

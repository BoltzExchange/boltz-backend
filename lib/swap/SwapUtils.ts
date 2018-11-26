/**
 * This file is based on the repository github.com/submarineswaps/swaps-service created by Alex Bosworth
 */

// TODO: add missing typings
import { script } from 'bitcoinjs-lib';
import Bn from 'bn.js';
import bip66 from 'bip66';
import ops from '@michael1011/bitcoin-ops';
import * as varuint from 'varuint-bitcoin';
import { getHexBuffer, getHexString } from '../Utils';
import { ScriptElement } from '../consts/Types';
import { Currency } from '../wallet/WalletManager';
import { Output } from '../wallet/FeeCalculator';
import { OutputType } from '../proto/boltzrpc_pb';

const zeroHexBuffer = getHexBuffer('00');

/**
 * DER encode bytes to eliminate sign confusion in a big-endian number
 *
 * @param point bytes to encode
 *
 * @returns an encoded point buffer
 */
const derEncode = (point: string) => {
  let i = 0;
  let x = getHexBuffer(point);

  while (x[i] === 0) {
    i += 1;
  }

  if (i === x.length) {
    return zeroHexBuffer;
  }

  x = x.slice(i);

  if (x[0] & 0x80) {
    return Buffer.concat([zeroHexBuffer, x], x.length + 1);
  } else {
    return x;
  }
};

/**
 * Encode a signature
 *
 * @param flag signature hash flag number
 * @param signature signature hex Buffer
 *
 * @returns encoded signature Buffer
 */
export const encodeSignature = (flag: number, signature: Buffer) => {
  const pointSize = 32;

  const signatureEnd = pointSize + pointSize;

  const hashType = Buffer.from([flag]);

  const r = derEncode(getHexString(signature.slice(0, pointSize)));
  const s = derEncode(getHexString(signature.slice(pointSize, signatureEnd)));

  return Buffer.concat([bip66.encode(r, s), hashType]);
};

/**
 * Convert an array of ScriptElement to a formed script
 *
 * @param elements array of ScriptElement
 *
 * @returns a script Buffer
 */
export const scriptBuffersToScript = (elements: ScriptElement[]): Buffer => {
  const buffers: Buffer[] = [];

  elements.forEach((element) => {
    if (Buffer.isBuffer(element)) {
      buffers.push(Buffer.concat([varuint.encode(element.length), element]));
    } else {
      buffers.push(getHexBuffer(element.toString(16)));
    }
  });

  return Buffer.concat(buffers);
};

/**
 * Convert an array of ScriptElement to a formed pushdata script
 *
 * @param elements array of ScriptElement
 *
 * @returns a script Buffer
 */
export const toPushdataScript = (elements: ScriptElement[]): Buffer => {
  const buffers: Buffer[] = [];

  elements.forEach((element) => {
    if (Buffer.isBuffer(element)) {
      buffers.push(Buffer.concat([varuint.encode(element.length), element]));
    } else {
      buffers.push(new Bn(element, 10).toArrayLike(Buffer));
    }
  });

  return Buffer.concat(buffers);
};

/**
 * Get the OutputType and whether it is a SH of a output script
 */
export const getOutputScriptType = (outputScript: Buffer): Output | undefined => {
  const rawScript = script.decompile(outputScript);

  if (rawScript.length > 1) {
    switch (rawScript[0]) {
      case ops.OP_0:
        // If the second entry of the script array has the length of 20 it is a
        // PKH output if not it is a SH output
        const secondEntry = rawScript[1] as Buffer;
        let isSh = false;

        if (secondEntry.length !== 20) {
          isSh = true;
        }

        return {
          isSh,
          type: OutputType.BECH32,
        };

      case ops.OP_HASH160:
        // The FeeCalculator treats legacy SH outputs the same way as compatibility PKH ones
        // Which one of the aforementioned types the outputScript is does not
        // matter for the fee estimation of a output
        return { type: OutputType.LEGACY, isSh: true };

      case ops.OP_DUP: return { type: OutputType.LEGACY, isSh: false };
    }
  }

  return;
};

/**
 * Get the BIP21 prefix for a currency
 */
export const getBip21Prefix = (currency: Currency) => {
  return currency.symbol === 'BTC' ? 'bitcoin' : 'litecoin';
};

/**
 * Encode a BIP21 payment request
 */
export const encodeBip21 = (prefix: string, address: string, satoshis: number, label?: string) => {
  let request = `${prefix}:${address}?value=${satoshis / 100000000}`;

  if (label) {
    request += `&label=${label.replace(/ /g, '%20')}`;
  }

  return request;
};

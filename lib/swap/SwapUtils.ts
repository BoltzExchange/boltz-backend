/**
 * This file is based on the repository github.com/submarineswaps/swaps-service created by Alex Bosworth
 */

// TODO: add missing typings
import bip66 from 'bip66';
import Bn from 'bn.js';
import * as varuint from 'varuint-bitcoin';
import { getHexBuffer, getHexString } from '../Utils';
import { ScriptElement } from '../consts/Types';
import { Currency } from '../wallet/WalletManager';

/**
 * DER encode bytes to eliminate sign confusion in a big-endian number
 *
 * @param point bytes to encode
 *
 * @returns an encoded point buffer
 */
const derEncode = (point: string) => {
  const zero = getHexBuffer('00');

  let i = 0;
  let x = getHexBuffer(point);

  while (x[i] === 0) {
    i += 1;
  }

  if (i === x.length) {
    return zero;
  }

  x = x.slice(i);

  if (x[0] & 0x80) {
    return Buffer.concat([zero, x], x.length + 1);
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
 * Gets the BIP21 prefix for a currency
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

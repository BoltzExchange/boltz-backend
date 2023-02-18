import * as ecc from 'tiny-secp256k1';
import { ECPairFactory } from 'ecpair';
import { initEccLib } from 'bitcoinjs-lib';

initEccLib(ecc);
export const ECPair = ECPairFactory(ecc);

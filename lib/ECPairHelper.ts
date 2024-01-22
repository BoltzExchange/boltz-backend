import { ECPairFactory } from 'ecpair';
import * as ecc from 'tiny-secp256k1';

export const ECPair = ECPairFactory(ecc);

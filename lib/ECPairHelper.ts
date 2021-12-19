import * as ecc from 'tiny-secp256k1';
import { ECPairFactory } from 'ecpair';

export const ECPair = ECPairFactory(ecc);

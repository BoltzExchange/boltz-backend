import { ECPair } from 'bitcoinjs-lib';
import { getHexString, stringify } from '../../Utils';

export const command = 'newkeys';

export const describe = 'generates a new keypair';

export const builder = {};

export const handler = (): void => {
  const keys = ECPair.makeRandom({});

  console.log(stringify({
    publicKey: getHexString(keys.publicKey),
    privateKey: getHexString(keys.privateKey as Buffer),
  }));
};

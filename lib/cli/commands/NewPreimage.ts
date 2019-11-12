import { randomBytes } from 'crypto';
import { crypto } from 'bitcoinjs-lib';
import { getHexString, stringify } from '../../Utils';

export const command = 'newpreimage';

export const describe = 'generates a new preimage and its hash';

export const builder = {};

export const handler = () => {
  const preimage = randomBytes(32);

  console.log(stringify({
    preimage: getHexString(preimage),
    preimageHash: getHexString(crypto.sha256(preimage)),
  }));
};

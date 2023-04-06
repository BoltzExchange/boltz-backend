import { Arguments } from 'yargs';
import { crypto } from 'bitcoinjs-lib';
import { getHexBuffer, getHexString, stringify } from '../../Utils';

export const command = 'hash <value>';

export const describe = 'parses a hex value and SHA256 hashes it';

export const builder = {
  value: {
    type: 'string',
    describe: 'hex value',
  },
};

export const handler = (argv: Arguments<any>): void => {
  const preimage = getHexBuffer(argv.value);

  console.log(stringify({
    hash: getHexString(crypto.sha256(preimage)),
  }));
};

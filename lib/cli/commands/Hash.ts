import { Arguments } from 'yargs';
import { crypto } from 'bitcoinjs-lib';
import { getHexBuffer, getHexString, stringify } from '../../Utils';

export const command = 'hash <value>';

export const describe = 'parses a hex value and hashes it';

export const builder = {
  value: {
    type: 'string',
    describe: 'hex value',
  },
};

export const handler = (argv: Arguments<any>): void => {
  const preimage = getHexBuffer(argv.value);

  console.log(
    stringify({
      sha256: getHexString(crypto.sha256(preimage)),
      hash160: getHexString(crypto.hash160(preimage)),
    }),
  );
};

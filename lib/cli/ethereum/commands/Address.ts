import type { Arguments } from 'yargs';
import { stringify } from '../../../Utils';
import { connectEthereum } from '../EthereumUtils';

export const command = 'address';

export const describe = 'prints the address of the signer';

export const builder = {};

export const handler = async (argv: Arguments<any>): Promise<void> => {
  const signer = await connectEthereum(argv.provider);
  console.log(stringify({ address: await signer.getAddress() }));
};

import type { Arguments } from 'yargs';
import { DeriveBlindingKeyRequest } from '../../proto/boltzrpc_pb';
import { callback, loadBoltzClient } from '../Command';

export const command = 'deriveblindingkeys <address>';

export const describe = 'derives a the blinding keypair of an address';

export const builder = {
  address: {
    describe: 'address for which the blinding keys should be derived',
    type: 'string',
  },
};

export const handler = (argv: Arguments<any>): void => {
  const request = new DeriveBlindingKeyRequest();
  request.setAddress(argv.address);

  loadBoltzClient(argv).deriveBlindingKeys(request, callback());
};

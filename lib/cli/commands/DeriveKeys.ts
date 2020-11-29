import { Arguments } from 'yargs';
import BuilderComponents from '../BuilderComponents';
import { callback, loadBoltzClient } from '../Command';
import { DeriveKeysRequest } from '../../proto/boltzrpc_pb';

export const command = 'derivekeys <symbol> <index>';

export const describe = 'derives a keypair from the index of an HD wallet';

export const builder = {
  symbol: BuilderComponents.symbol,
  index: {
    describe: 'index of the keypair',
    type: 'number',
  },
};

export const handler = (argv: Arguments<any>): void => {
  const request = new DeriveKeysRequest();

  request.setSymbol(argv.symbol);
  request.setIndex(argv.index);

  loadBoltzClient(argv).deriveKeys(request, callback);
};

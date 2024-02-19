import { Arguments } from 'yargs';
import { RescanRequest } from '../../proto/boltzrpc_pb';
import BuilderComponents from '../BuilderComponents';
import { callback, loadBoltzClient } from '../Command';

export const command = 'rescan <symbol> <startHeight>';

export const describe = 'rescans the chain of a symbol';

export const builder = {
  symbol: BuilderComponents.symbol,
  startHeight: {
    describe: 'block height to start the rescan from',
    type: 'number',
  },
};

export const handler = (argv: Arguments<any>): void => {
  const request = new RescanRequest();
  request.setSymbol(argv.symbol);
  request.setStartHeight(argv.startHeight);

  loadBoltzClient(argv).rescan(request, callback());
};

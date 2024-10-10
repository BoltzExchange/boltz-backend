import { Arguments } from 'yargs';
import { RescanRequest } from '../../proto/boltzrpc_pb';
import BuilderComponents, { ApiType, BuilderTypes } from '../BuilderComponents';
import { callback, loadBoltzClient } from '../Command';

export const command = 'rescan <symbol> <startHeight> [includeMempool]';

export const describe = 'rescans the chain of a symbol';

export const builder = {
  symbol: BuilderComponents.symbol,
  startHeight: {
    describe: 'block height to start the rescan from',
    type: 'number',
  },
  includeMempool: {
    describe: 'whether the mempool should be rescanned too',
    type: 'boolean',
    default: false,
  },
};

export const handler = (
  argv: Arguments<BuilderTypes<typeof builder> & ApiType>,
): void => {
  const request = new RescanRequest();
  request.setSymbol(argv.symbol);
  request.setStartHeight(argv.startHeight);
  request.setIncludeMempool(argv.includeMempool);

  loadBoltzClient(argv).rescan(request, callback());
};

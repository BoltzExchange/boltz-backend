import { Arguments } from 'yargs';
import { ListSwapsRequest } from '../../proto/boltzrpc_pb';
import { ApiType, BuilderTypes } from '../BuilderComponents';
import { callback, loadBoltzClient } from '../Command';

export const command = 'listswaps [status] [limit]';

export const describe = 'lists swaps';

export const builder = {
  status: {
    type: 'string',
    describe: 'status of the swaps to list',
  },
  limit: {
    type: 'number',
    describe: 'limit of the swaps to list per type',
    default: 100,
  },
};

export const handler = (
  argv: Arguments<BuilderTypes<typeof builder> & ApiType>,
): void => {
  const request = new ListSwapsRequest();

  request.setLimit(argv.limit);

  if (argv.status) {
    request.setStatus(argv.status);
  }

  loadBoltzClient(argv).listSwaps(request, callback());
};

import { Arguments } from 'yargs';
import { DevClearSwapUpdateCacheRequest } from '../../proto/boltzrpc_pb';
import { ApiType, BuilderTypes } from '../BuilderComponents';
import { callback, loadBoltzClient } from '../Command';

export const command = 'dev-clearswapupdatecache [id]';

export const describe = 'clears the swap update cache';

export const builder = {
  id: {
    type: 'string',
    describe: 'id of the swap to clear from the cache',
  },
};

export const handler = (
  argv: Arguments<BuilderTypes<typeof builder> & ApiType>,
): void => {
  const request = new DevClearSwapUpdateCacheRequest();
  request.setId(argv.id);

  loadBoltzClient(argv).devClearSwapUpdateCache(request, callback());
};

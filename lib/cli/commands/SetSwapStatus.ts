import type { Arguments } from 'yargs';
import { SetSwapStatusRequest } from '../../proto/boltzrpc_pb';
import { callback, loadBoltzClient } from '../Command';

export const command = 'setswapstatus <id> <status>';

export const describe = 'changes swap status in the database';

export const builder = {
  id: {
    type: 'string',
    describe: 'ID of the swap',
  },
  status: {
    type: 'string',
    describe: 'swap status',
  },
};

export const handler = (argv: Arguments<any>): void => {
  const request = new SetSwapStatusRequest();

  request.setId(argv.id);
  request.setStatus(argv.status);

  loadBoltzClient(argv).setSwapStatus(request, callback());
};

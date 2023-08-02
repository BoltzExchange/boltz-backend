import { Arguments } from 'yargs';
import { loadBoltzClient, callback } from '../Command';
import { UpdateTimeoutBlockDeltaRequest } from '../../proto/boltzrpc_pb';

const command = 'updatetimeout <reverse> <swap_min> <swap_max>';

const describe = 'updates the timeout block delta of a pair';

const builder = {
  pair: {
    describe: 'id of the pair',
    type: 'string',
  },
  reverse: {
    describe: 'new reverse swap timeout block delta in minutes',
    type: 'number',
  },
  swap_min: {
    describe: 'new minimal swap timeout block delta in minutes',
    type: 'number',
  },
  swap_max: {
    describe: 'new maximal swap timeout block delta in minutes',
    type: 'number',
  },
};

const handler = (argv: Arguments<any>): void => {
  const request = new UpdateTimeoutBlockDeltaRequest();

  request.setPair(argv.pair);
  request.setReverseTimeout(argv.reverse);
  request.setSwapMinimalTimeout(argv.swap_min);
  request.setSwapMaximalTimeout(argv.swap_max);

  loadBoltzClient(argv).updateTimeoutBlockDelta(request, callback());
};

export { builder, command, handler, describe };

import { Arguments } from 'yargs';
import { loadBoltzClient, callback } from '../Command';
import { UpdateTimeoutBlockDeltaRequest } from '../../proto/boltzrpc_pb';

const command = 'updatetimeout <pair> <new_delta>';

const describe = 'updates the timeout block delta of a pair';

const builder = {
  pair: {
    describe: 'id of the pair',
    type: 'string',
  },
  new_delta: {
    describe: 'new timeout block delta in minutes',
    type: 'number',
  },
};

const handler = (argv: Arguments<any>): void => {
  const request = new UpdateTimeoutBlockDeltaRequest();

  request.setPair(argv.pair);
  request.setNewDelta(argv.new_delta);

  loadBoltzClient(argv).updateTimeoutBlockDelta(request, callback);
};

export {
  builder,
  command,
  handler,
  describe,
};

import { Arguments } from 'yargs';
import { UpdateTimeoutBlockDeltaRequest } from '../../proto/boltzrpc_pb';
import { ApiType, BuilderTypes } from '../BuilderComponents';
import { callback, loadBoltzClient } from '../Command';

const command =
  'updatetimeout <reverse> <swap_min> <swap_max> <swap_taproot> <chain_swap>';

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
  swap_taproot: {
    describe: 'new Taproot swap timeout block delta in minutes',
    type: 'number',
  },
  chain_swap: {
    describe: 'new Chain swap timeout block delta in minutes',
    type: 'number',
  },
};

const handler = (
  argv: Arguments<BuilderTypes<typeof builder> & ApiType>,
): void => {
  const request = new UpdateTimeoutBlockDeltaRequest();

  request.setPair(argv.pair);
  request.setReverseTimeout(argv.reverse);
  request.setSwapMinimalTimeout(argv.swap_min);
  request.setSwapMaximalTimeout(argv.swap_max);
  request.setSwapTaprootTimeout(argv.swap_taproot);
  request.setChainTimeout(argv.chain_swap);

  loadBoltzClient(argv).updateTimeoutBlockDelta(request, callback());
};

export { builder, command, handler, describe };

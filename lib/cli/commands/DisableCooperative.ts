import type { Arguments } from 'yargs';
import { SetDisableCooperativeRequest } from '../../proto/boltzrpc_pb';
import type { ApiType, BuilderTypes } from '../BuilderComponents';
import { callback, loadBoltzClient } from '../Command';

export const command = 'disablecooperative [disabled]';

export const describe = 'disable cooperative signatures for swaps';

export const builder = {
  disabled: {
    type: 'boolean',
    describe: 'whether cooperative signatures should be disabled',
    default: false,
  },
};

export const handler = (
  argv: Arguments<BuilderTypes<typeof builder> & ApiType>,
): void => {
  const request = new SetDisableCooperativeRequest();

  request.setDisabled(argv.disabled);

  loadBoltzClient(argv).setDisableCooperative(request, callback());
};

import { Arguments } from 'yargs';
import { AllowRefundRequest } from '../../proto/boltzrpc_pb';
import { ApiType, BuilderTypes } from '../BuilderComponents';
import { callback, loadBoltzClient } from '../Command';

export const command = 'allowrefund <id>';

export const describe =
  'skips the safety checks and allows cooperative refunds for a swap';

export const builder = {
  id: {
    type: 'string',
    describe: 'ID of the swap',
  },
};

export const handler = (
  argv: Arguments<BuilderTypes<typeof builder> & ApiType>,
): void => {
  const request = new AllowRefundRequest();
  request.setId(argv.id);

  loadBoltzClient(argv).allowRefund(request, callback());
};

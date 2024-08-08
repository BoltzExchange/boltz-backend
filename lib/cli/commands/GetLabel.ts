import { Arguments } from 'yargs';
import { GetLabelRequest } from '../../proto/boltzrpc_pb';
import { ApiType, BuilderTypes } from '../BuilderComponents';
import { callback, loadBoltzClient } from '../Command';

export const command = 'getlabel <id>';

export const describe = 'get the label for a transaction';

export const builder = {
  id: {
    type: 'string',
    describe: 'transaction id',
  },
};

export const handler = (
  argv: Arguments<BuilderTypes<typeof builder> & ApiType>,
): void => {
  const request = new GetLabelRequest();
  request.setTxId(argv.id);

  loadBoltzClient(argv).getLabel(request, callback());
};

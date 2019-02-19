import { Arguments } from 'yargs';
import { callback, loadBoltzClient } from '../Command';
import { NewAddressRequest } from '../../proto/boltzrpc_pb';
import { getOutputType } from '../Utils';
import BuilderComponents from '../BuilderComponents';

export const command = 'newaddress <currency> [type]';

export const describe = 'gets a new address of a specified wallet';

export const builder = {
  currency: BuilderComponents.currency,
  type: BuilderComponents.outputType,
};

export const handler = (argv: Arguments<any>) => {
  const request = new NewAddressRequest();

  request.setCurrency(argv.currency);
  request.setType(getOutputType(argv.type));

  loadBoltzClient(argv).newAddress(request, callback);
};

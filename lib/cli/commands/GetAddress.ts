import { Arguments } from 'yargs';
import { GetAddressRequest } from '../../proto/boltzrpc_pb';
import BuilderComponents, { BuilderTypes } from '../BuilderComponents';
import { callback, loadBoltzClient } from '../Command';

export const command = 'getaddress <symbol> <label>';

export const describe = 'gets an address of a specified wallet';

export const builder = {
  symbol: BuilderComponents.symbol,
  label: {
    describe: 'label for the address',
    type: 'string',
  },
};

export const handler = (
  argv: Arguments<BuilderTypes<typeof builder>>,
): void => {
  const request = new GetAddressRequest();

  request.setSymbol(argv.symbol);
  request.setLabel(argv.label);

  loadBoltzClient(argv).getAddress(request, callback());
};

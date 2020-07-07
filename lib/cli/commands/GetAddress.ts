import { Arguments } from 'yargs';
import BuilderComponents from '../BuilderComponents';
import { callback, loadBoltzClient } from '../Command';
import { GetAddressRequest } from '../../proto/boltzrpc_pb';

export const command = 'getaddress <symbol>';

export const describe = 'gets an address of a specified wallet';

export const builder = {
  symbol: BuilderComponents.symbol,
};

export const handler = (argv: Arguments<any>): void => {
  const request = new GetAddressRequest();

  request.setSymbol(argv.symbol);

  loadBoltzClient(argv).getAddress(request, callback);
};

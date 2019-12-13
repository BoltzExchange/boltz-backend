import { Arguments } from 'yargs';
import BuilderComponents from '../BuilderComponents';
import { callback, loadBoltzClient } from '../Command';
import { NewAddressRequest } from '../../proto/boltzrpc_pb';

export const command = 'newaddress <symbol>';

export const describe = 'gets a new address of a specified wallet';

export const builder = {
  symbol: BuilderComponents.symbol,
};

export const handler = (argv: Arguments<any>) => {
  const request = new NewAddressRequest();

  request.setSymbol(argv.symbol);

  loadBoltzClient(argv).newAddress(request, callback);
};

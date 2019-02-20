import { Arguments } from 'yargs';
import { callback, loadBoltzClient } from '../Command';
import { GetBalanceRequest } from '../../proto/boltzrpc_pb';
import BuilderComponents from '../BuilderComponents';

export const command = 'getbalance [currency]';

export const describe = 'gets the balance for either all wallets or just a single one if specified';

export const builder = {
  currency: BuilderComponents.currency,
};

export const handler = (argv: Arguments<any>) => {
  const request = new GetBalanceRequest();

  request.setCurrency(argv.currency);

  loadBoltzClient(argv).getBalance(request, callback);
};

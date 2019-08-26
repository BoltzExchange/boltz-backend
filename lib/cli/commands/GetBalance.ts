import { Arguments } from 'yargs';
import BuilderComponents from '../BuilderComponents';
import { callback, loadBoltzClient } from '../Command';
import { GetBalanceRequest } from '../../proto/boltzrpc_pb';

export const command = 'getbalance [symbol]';

export const describe = 'gets the balance for either all wallets or just a single one if specified';

export const builder = {
  symbol: BuilderComponents.symbol,
};

export const handler = (argv: Arguments<any>) => {
  const request = new GetBalanceRequest();

  request.setSymbol(argv.symbol);

  loadBoltzClient(argv).getBalance(request, callback);
};

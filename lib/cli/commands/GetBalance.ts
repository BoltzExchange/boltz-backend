import { Arguments } from 'yargs';
import { GetBalanceRequest } from '../../proto/boltzrpc_pb';
import BuilderComponents from '../BuilderComponents';
import { callback, loadBoltzClient } from '../Command';

export const command = 'getbalance';

export const describe = 'gets the balance of all wallets';

export const builder = {
  symbol: BuilderComponents.symbol,
};

export const handler = (argv: Arguments<any>): void => {
  loadBoltzClient(argv).getBalance(new GetBalanceRequest(), callback());
};

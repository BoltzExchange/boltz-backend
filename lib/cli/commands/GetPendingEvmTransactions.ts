import { Arguments } from 'yargs';
import { GetPendingEvmTransactionsRequest } from '../../proto/boltzrpc_pb';
import { ApiType, BuilderTypes } from '../BuilderComponents';
import { callback, loadBoltzClient } from '../Command';

export const command = 'getpendingevmtransactions';

export const describe = 'get pending EVM transactions';

export const builder = {};

export const handler = (
  argv: Arguments<BuilderTypes<typeof builder> & ApiType>,
) => {
  const request = new GetPendingEvmTransactionsRequest();
  loadBoltzClient(argv).getPendingEvmTransactions(request, callback());
};

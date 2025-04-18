import type { Arguments } from 'yargs';
import { CheckTransactionRequest } from '../../proto/boltzrpc_pb';
import type { ApiType, BuilderTypes } from '../BuilderComponents';
import { callback, loadBoltzClient } from '../Command';

export const command = 'checktx <symbol> <id>';

export const describe = 'checks a transaction on the blockchain';

export const builder = {
  symbol: {
    type: 'string',
    describe: 'Symbol of the currency the transaction is on',
  },
  id: {
    type: 'string',
    describe: 'Transaction ID to check',
  },
};

export const handler = (
  argv: Arguments<BuilderTypes<typeof builder> & ApiType>,
): void => {
  const request = new CheckTransactionRequest();

  request.setSymbol(argv.symbol);
  request.setId(argv.id);

  loadBoltzClient(argv).checkTransaction(request, callback());
};

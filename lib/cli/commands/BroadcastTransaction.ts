import { Arguments } from 'yargs';
import { callback, loadBoltzClient } from '../Command';
import { BroadcastTransactionRequest } from '../../proto/boltzrpc_pb';
import BuilderComponents from '../BuilderComponents';

export const command = 'broadcasttransaction <currency> <transaction_hex>';

export const describe = 'get a new address for the specified coin';

export const builder = {
  currency: BuilderComponents.currency,
  transaction_hex: {
    describe: 'hex encoded transaction that should be broadcasted',
    type: 'string',
  },
};

export const handler = (argv: Arguments<any>) => {
  const request = new BroadcastTransactionRequest();

  request.setCurrency(argv.currency);
  request.setTransactionHex(argv.transaction_hex);

  loadBoltzClient(argv).broadcastTransaction(request, callback);
};

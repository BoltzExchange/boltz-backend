import { Arguments } from 'yargs';
import BuilderComponents from '../BuilderComponents';
import { callback, loadBoltzClient } from '../Command';
import { SendCoinsRequest } from '../../proto/boltzrpc_pb';

export const command = 'sendcoins <currency> <address> <amount> [fee_per_byte]';

export const describe = 'sends coins to a specified address';

export const builder = {
  currency: BuilderComponents.currency,
  address: {
    describe: 'address to which the funds should be sent',
    type: 'string',
  },
  amount: {
    describe: 'amount that should be sent',
    type: 'number',
  },
  fee_per_byte: BuilderComponents.feePerByte,
};

export const handler = (argv: Arguments<any>) => {
  const request = new SendCoinsRequest();

  request.setCurrency(argv.currency);
  request.setAddress(argv.address);
  request.setAmount(argv.amount);
  request.setSatPerVbyte(argv.fee_per_byte);

  loadBoltzClient(argv).sendCoins(request, callback);
};

import { Arguments } from 'yargs';
import BuilderComponents from '../BuilderComponents';
import { callback, loadBoltzClient } from '../Command';
import { SendCoinsRequest } from '../../proto/boltzrpc_pb';

export const command = 'sendcoins <symbol> <address> <amount> [fee] [send_all]';

export const describe = 'sends coins to a specified address';

export const builder = {
  symbol: BuilderComponents.symbol,
  address: {
    describe: 'address to which the funds should be sent',
    type: 'string',
  },
  amount: {
    describe: 'amount that should be sent',
    type: 'number',
  },
  fee: {
    describe: 'sat/vbyte or gas price in gwei that should be paid as fee',
    type: 'number',
    default: 2,
  },
  send_all: {
    describe: 'ignores the amount and sends the whole balance of the wallet',
    type: 'boolean',
  },
};

export const handler = (argv: Arguments<any>) => {
  const request = new SendCoinsRequest();

  request.setSymbol(argv.symbol);
  request.setAddress(argv.address);
  request.setAmount(argv.amount);
  request.setFee(argv.fee);
  request.setSendAll(argv.send_all);

  loadBoltzClient(argv).sendCoins(request, callback);
};

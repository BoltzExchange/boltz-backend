import type { Arguments } from 'yargs';
import { SendCoinsRequest } from '../../proto/boltzrpc_pb';
import type { ApiType, BuilderTypes } from '../BuilderComponents';
import BuilderComponents from '../BuilderComponents';
import { callback, loadBoltzClient, parseAmount } from '../Command';

export const command =
  'sendcoins <symbol> <address> <amount> <label> [fee] [send_all]';

export const describe = 'sends coins to a specified address';

export const builder = {
  symbol: BuilderComponents.symbol,
  address: {
    describe: 'address to which the funds should be sent',
    type: 'string',
  },
  amount: {
    describe: 'amount that should be sent',
    type: 'string',
  },
  label: {
    describe: 'label for the transaction',
    type: 'string',
  },
  fee: {
    describe: 'sat/vbyte or gas price in gwei that should be paid as fee',
    type: 'number',
  },
  send_all: {
    describe: 'ignores the amount and sends the whole balance of the wallet',
    type: 'boolean',
  },
};

export const handler = (
  argv: Arguments<BuilderTypes<typeof builder> & ApiType>,
): void => {
  const request = new SendCoinsRequest();

  request.setSymbol(argv.symbol);
  request.setAddress(argv.address);
  request.setAmount(parseAmount(argv.amount));
  request.setLabel(argv.label);
  request.setFee(argv.fee);
  request.setSendAll(argv.send_all);

  loadBoltzClient(argv).sendCoins(request, callback());
};

import { Arguments } from 'yargs';
import { callback, loadBoltzClient } from '../Command';
import BuilderComponents from '../BuilderComponents';
import { CreateReverseSwapRequest } from '../../proto/boltzrpc_pb';
import { getOrderSide } from '../Utils';

export const command = 'createreverseswap <base_currency> <quote_currency> <order_side> <rate> <claim_public_key> <amount>';

export const describe = 'creates a new swap from Lightning to the chain';

export const builder = {
  base_currency: BuilderComponents.base_currency,
  quote_currency: BuilderComponents.quote_currency,
  order_side: BuilderComponents.orderSide,
  rate: BuilderComponents.rate,
  claim_public_key: {
    describe: 'public key with which a claiming transaction has to be signed',
    type: 'string',
  },
  amount: {
    describe: 'amount of the invoice that will be returned',
    type: 'number',
  },
};

export const handler = (argv: Arguments<any>) => {
  const request = new CreateReverseSwapRequest();

  request.setBaseCurrency(argv.base_currency);
  request.setQuoteCurrency(argv.quote_currency);
  request.setOrderSide(getOrderSide(argv.order_side));
  request.setRate(argv.rate);
  request.setClaimPublicKey(argv.claim_public_key);
  request.setAmount(argv.amount);

  loadBoltzClient(argv).createReverseSwap(request, callback);
};

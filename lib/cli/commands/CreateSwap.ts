import { Arguments } from 'yargs';
import BuilderComponents from '../BuilderComponents';
import { getOutputType, getOrderSide } from '../Utils';
import { callback, loadBoltzClient } from '../Command';
import { CreateSwapRequest } from '../../proto/boltzrpc_pb';

export const command = 'createswap <base_currency> <quote_currency> <order_side> <rate> <invoice>' +
  '<refund_public_key> [timeout_block_number] [output_type]';

export const describe = 'creates a new swap from the chain to Lightning';

export const builder = {
  base_currency: BuilderComponents.base_currency,
  quote_currency: BuilderComponents.quote_currency,
  order_side: BuilderComponents.orderSide,
  rate: BuilderComponents.rate,
  invoice: {
    describe: 'invoice to pay',
    type: 'string',
  },
  refund_public_key: {
    describe: 'public key with which a refund transaction has to be signed',
    type: 'string',
  },
  timeout_block_number: BuilderComponents.timeoutBlockNumber,
  output_type: BuilderComponents.outputType,
};

export const handler = (argv: Arguments<any>) => {
  const request = new CreateSwapRequest();

  request.setBaseCurrency(argv.base_currency);
  request.setQuoteCurrency(argv.quote_currency);
  request.setOrderSide(getOrderSide(argv.order_side));
  request.setRate(argv.rate);
  request.setInvoice(argv.invoice);
  request.setRefundPublicKey(argv.refund_public_key);
  request.setOutputType(getOutputType(argv.output_type));
  request.setTimeoutBlockNumber(argv.timeout_block_number);

  loadBoltzClient(argv).createSwap(request, callback);
};

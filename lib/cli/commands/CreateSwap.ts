import { Arguments } from 'yargs';
import * as qrcode from 'qrcode-terminal';
import { loadBoltzClient, GrpcResponse, printError, printResponse } from '../Command';
import BuilderComponents from '../BuilderComponents';
import { CreateSwapRequest } from '../../proto/boltzrpc_pb';
import { getOutputType, getOrderSide } from '../Utils';

export const command = 'createswap <pair_id> <order_side> <invoice> <refund_public_key> [output_type] [show_qr]';

export const describe = 'create a new swap from the chain to Lightning';

export const builder = {
  pair_id: BuilderComponents.pairId,
  order_side: BuilderComponents.orderSide,
  invoice: {
    describe: 'invoice to pay',
    type: 'string',
  },
  refund_public_key: {
    describe: 'public key with which a refund transaction has to be signed',
    type: 'string',
  },
  output_type: BuilderComponents.outputType,
  show_qr: {
    describe: 'whether a QR code for the BIP21 payment request should be shown',
    type: 'boolean',
  },
};

let showQr = false;

export const callback = (error: Error | null, response: GrpcResponse) => {
  if (error) {
    printError(error);
  } else {
    const responseObj = response.toObject();

    printResponse(responseObj);

    if (showQr) {
      console.log();
      qrcode.generate(responseObj.bip21, { small: true });
    }
  }
};

export const handler = (argv: Arguments) => {
  const request = new CreateSwapRequest();

  request.setPairId(argv.pair_id);
  request.setOrderSide(getOrderSide(argv.order_side));
  request.setInvoice(argv.invoice);
  request.setRefundPublicKey(argv.refund_public_key);
  request.setOutputType(getOutputType(argv.output_type));

  showQr = argv.show_qr;

  loadBoltzClient(argv).createSwap(request, callback);
};

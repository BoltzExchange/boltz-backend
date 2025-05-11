import type { Arguments } from 'yargs';
import { stringToSwapType, swapTypeToGrpcSwapType } from '../../consts/Enums';
import { InvoiceClnThresholdRequest } from '../../proto/boltzrpc_pb';
import type { ApiType, BuilderTypes } from '../BuilderComponents';
import { callback, loadBoltzClient } from '../Command';

export const command = 'clnthreshold <type> <threshold>';

export const describe = 'sets the CLN threshold for a swap type';

export const builder = {
  type: {
    type: 'string',
    describe: 'the swap type',
    choices: ['submarine', 'reverse'],
  },
  threshold: {
    type: 'number',
    describe: 'the threshold in satoshis',
  },
};

export const handler = async (
  argv: Arguments<BuilderTypes<typeof builder> & ApiType>,
) => {
  const threshold = new InvoiceClnThresholdRequest.Threshold();
  threshold.setType(swapTypeToGrpcSwapType(stringToSwapType(argv.type)));
  threshold.setThreshold(argv.threshold);

  const req = new InvoiceClnThresholdRequest();
  req.addThresholds(threshold);

  const client = loadBoltzClient(argv);
  client.invoiceClnThreshold(req, callback());
};

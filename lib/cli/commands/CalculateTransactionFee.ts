import { Arguments } from 'yargs';
import { CalculateTransactionFeeRequest } from '../../proto/boltzrpc_pb';
import BuilderComponents, { ApiType, BuilderTypes } from '../BuilderComponents';
import { callback, loadBoltzClient } from '../Command';

export const command = 'txfee <symbol> <transactionId>';

export const describe = 'calculate the fee of a transaction';

export const builder = {
  symbol: BuilderComponents.symbol,
  transactionId: {
    type: 'string',
    describe: 'ID or hash of the transaction',
  },
};

export const handler = async (
  argv: Arguments<BuilderTypes<typeof builder> & ApiType>,
) => {
  const request = new CalculateTransactionFeeRequest();
  request.setSymbol(argv.symbol);
  request.setTransactionId(argv.transactionId);

  loadBoltzClient(argv).calculateTransactionFee(
    request,
    callback((res) => {
      const data: Record<string, number> = {
        absolute: res.getAbsolute(),
      };

      if (res.hasSatPerVbyte()) {
        data.satPerVbyte = res.getSatPerVbyte();
      }
      if (res.hasGwei()) {
        data.gwei = res.getGwei();
      }

      return data;
    }),
  );
};

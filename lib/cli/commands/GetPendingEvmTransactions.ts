import type { Arguments } from 'yargs';
import { getHexString } from '../../Utils';
import { GetPendingEvmTransactionsRequest } from '../../proto/boltzrpc_pb';
import type { ApiType, BuilderTypes } from '../BuilderComponents';
import { callback, loadBoltzClient } from '../Command';

export const command = 'pendingevmtransactions';

export const describe = 'get pending EVM transactions';

export const builder = {};

export const handler = (
  argv: Arguments<BuilderTypes<typeof builder> & ApiType>,
) => {
  const request = new GetPendingEvmTransactionsRequest();
  loadBoltzClient(argv).getPendingEvmTransactions(
    request,
    callback((res) => {
      return res.getTransactionsList().map((tx) => ({
        ...tx.toObject(),
        hash: getHexString(Buffer.from(tx.getHash() as string, 'base64')),
        hex: getHexString(Buffer.from(tx.getHex() as string, 'base64')),
      }));
    }),
  );
};

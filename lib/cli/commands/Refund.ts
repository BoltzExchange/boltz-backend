import { Arguments } from 'yargs';
import BuilderComponents from '../BuilderComponents';

export const command =
  'refund <network> <privateKey> <timeoutBlockHeight> <redeemScript> <rawTransaction> <destinationAddress> [feePerVbyte]';

export const describe = 'refunds submarine or chain to chain swaps';

export const builder = {
  network: BuilderComponents.network,
  privateKey: BuilderComponents.privateKey,
  timeoutBlockHeight: {
    describe: 'timeout block height of the swap',
    type: 'number',
  },
  redeemScript: BuilderComponents.redeemScript,
  rawTransaction: BuilderComponents.rawTransaction,
  destinationAddress: BuilderComponents.destinationAddress,
  feePerVbyte: BuilderComponents.feePerVbyte,
};

export const handler = (_argv: Arguments<any>): void => {
  /*
  const {
    type,
    network,
    keys,
    swapOutput,
    transaction,
    redeemScript,
    destinationAddress,
  } = prepareTx(argv);

  const refundTransaction = constructRefundTransaction(
    type,
    [
      {
        ...swapOutput,
        keys,
        redeemScript,
        txHash: transaction.getHash(),
      } as any,
    ],
    destinationAddress,
    argv.timeoutBlockHeight,
    argv.feePerVbyte,
    // Needed for Liquid
    network.assetHash,
  ).toHex();

  console.log(stringify({ refundTransaction }));
   */
};

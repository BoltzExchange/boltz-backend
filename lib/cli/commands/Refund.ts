import { Arguments } from 'yargs';
import { prepareTx } from '../Command';
import { stringify } from '../../Utils';
import BuilderComponents from '../BuilderComponents';
import { constructRefundTransaction } from '../../Core';

export const command =
  'refund <network> <privateKey> <timeoutBlockHeight> <redeemScript> <rawTransaction> <destinationAddress> [feePerVbyte] [blindingKey]';

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
  blindingKey: BuilderComponents.blindingKey,
};

export const handler = async (argv: Arguments<any>): Promise<void> => {
  const {
    keys,
    network,
    walletStub,
    swapOutput,
    transaction,
    redeemScript,
    destinationAddress,
  } = await prepareTx(argv);

  const refundTransaction = constructRefundTransaction(
    walletStub,
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
};

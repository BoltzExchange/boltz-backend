import {
  extractClaimPublicKeyFromReverseSwapTree,
  extractClaimPublicKeyFromSwapTree,
} from 'boltz-core';
import { Arguments } from 'yargs';
import { constructRefundTransaction } from '../../Core';
import { stringify } from '../../Utils';
import BuilderComponents from '../BuilderComponents';
import { prepareTx } from '../Command';

export const command =
  'refund <network> <privateKey> <timeoutBlockHeight> <redeemScript> <rawTransaction> <destinationAddress> [feePerVbyte] [blindingKey] [discountCT]';

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
  discountCT: BuilderComponents.discountCT,
};

export const handler = async (argv: Arguments<any>): Promise<void> => {
  const {
    keys,
    walletStub,
    swapOutput,
    transaction,
    redeemScript,
    destinationAddress,
  } = await prepareTx(argv, [
    extractClaimPublicKeyFromSwapTree,
    extractClaimPublicKeyFromReverseSwapTree,
  ]);

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
  ).toHex();

  console.log(stringify({ refundTransaction }));
};

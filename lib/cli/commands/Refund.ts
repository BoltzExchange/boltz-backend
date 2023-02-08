import { Arguments } from 'yargs';
import { address, Transaction } from 'bitcoinjs-lib';
import { Networks, constructRefundTransaction, detectSwap } from 'boltz-core';
import { ECPair } from '../../ECPairHelper';
import BuilderComponents from '../BuilderComponents';
import { getHexBuffer, stringify } from '../../Utils';

export const command = 'refund <network> <privateKey> <timeoutBlockHeight> <redeemScript> <rawTransaction> <destinationAddress> [feePerVbyte]';

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

export const handler = (argv: Arguments<any>): void => {
  const network = Networks[argv.network];

  const redeemScript = getHexBuffer(argv.redeemScript);
  const transaction = Transaction.fromHex(argv.rawTransaction);

  const swapOutput = detectSwap(redeemScript, transaction)!;

  const refundTransaction = constructRefundTransaction(
    [{
      ...swapOutput,
      txHash: transaction.getHash(),
      redeemScript: getHexBuffer(argv.redeemScript),
      keys: ECPair.fromPrivateKey(getHexBuffer(argv.privateKey)),
    }],
    address.toOutputScript(argv.destinationAddress, network),
    argv.timeoutBlockHeight,
    argv.feePerVbyte,
    true,
  ).toHex();

  console.log(stringify({ refundTransaction }));
};

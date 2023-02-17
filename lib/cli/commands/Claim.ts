import { Arguments } from 'yargs';
import { address, Transaction } from 'bitcoinjs-lib';
import { Networks, constructClaimTransaction, detectSwap } from 'boltz-core';
import { ECPair } from '../../ECPairHelper';
import BuilderComponents from '../BuilderComponents';
import { getHexBuffer, stringify } from '../../Utils';

export const command = 'claim <network> <preimage> <privateKey> <redeemScript> <rawTransaction> <destinationAddress> [feePerVbyte]';

export const describe = 'claims reverse submarine or chain to chain swaps';

export const builder = {
  network: BuilderComponents.network,
  privateKey: BuilderComponents.privateKey,
  redeemScript: BuilderComponents.redeemScript,
  rawTransaction: BuilderComponents.rawTransaction,
  destinationAddress: BuilderComponents.destinationAddress,
  preimage: {
    describe: 'preimage of the swap',
    type: 'string',
  },
  feePerVbyte: BuilderComponents.feePerVbyte,
};

export const handler = (argv: Arguments<any>): void => {
  const network = Networks[argv.network];

  const redeemScript = getHexBuffer(argv.redeemScript);
  const transaction = Transaction.fromHex(argv.rawTransaction);

  const swapOutput = detectSwap(redeemScript, transaction)!;

  const claimTransaction = constructClaimTransaction(
    [{
      ...swapOutput,
      txHash: transaction.getHash(),
      preimage: getHexBuffer(argv.preimage),
      redeemScript: getHexBuffer(argv.redeemScript),
      keys: ECPair.fromPrivateKey(getHexBuffer(argv.privateKey)),
    }],
    address.toOutputScript(argv.destinationAddress, network),
    argv.feePerVbyte,
    true,
  ).toHex();

  console.log(stringify({ claimTransaction }));
};

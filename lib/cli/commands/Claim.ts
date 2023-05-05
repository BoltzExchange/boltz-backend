import { Arguments } from 'yargs';
import { prepareTx } from '../Command';
import BuilderComponents from '../BuilderComponents';
import { getHexBuffer, stringify } from '../../Utils';
import { constructClaimTransaction } from '../../Core';

export const command =
  'claim <network> <preimage> <privateKey> <redeemScript> <rawTransaction> <destinationAddress> [feePerVbyte]';

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
  const {
    keys,
    type,
    network,
    swapOutput,
    transaction,
    redeemScript,
    destinationAddress,
  } = prepareTx(argv);

  const claimTransaction = constructClaimTransaction(
    type,
    [
      {
        ...swapOutput,
        keys,
        redeemScript,
        txHash: transaction.getHash(),
        preimage: getHexBuffer(argv.preimage),
      } as any,
    ],
    destinationAddress,
    argv.feePerVbyte,
    // Needed for Liquid
    network.assetHash,
  ).toHex();

  console.log(stringify({ claimTransaction }));
};

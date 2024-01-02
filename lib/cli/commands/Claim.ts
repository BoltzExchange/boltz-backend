import { Arguments } from 'yargs';
import { extractRefundPublicKeyFromReverseSwapTree } from 'boltz-core';
import { prepareTx } from '../Command';
import BuilderComponents from '../BuilderComponents';
import { getHexBuffer, stringify } from '../../Utils';
import { constructClaimTransaction } from '../../Core';

export const command =
  'claim <network> <preimage> <privateKey> <redeemScript> <rawTransaction> <destinationAddress> [feePerVbyte] [blindingKey]';

export const describe = 'claims reverse submarine or chain to chain swaps';

export const builder = {
  network: BuilderComponents.network,
  preimage: BuilderComponents.preimage,
  privateKey: BuilderComponents.privateKey,
  redeemScript: BuilderComponents.redeemScript,
  rawTransaction: BuilderComponents.rawTransaction,
  destinationAddress: BuilderComponents.destinationAddress,
  feePerVbyte: BuilderComponents.feePerVbyte,
  blindingKey: BuilderComponents.blindingKey,
};

export const handler = async (argv: Arguments<any>): Promise<void> => {
  const {
    keys,
    walletStub,
    swapOutput,
    transaction,
    redeemScript,
    destinationAddress,
  } = await prepareTx(argv, extractRefundPublicKeyFromReverseSwapTree);

  const claimTransaction = constructClaimTransaction(
    walletStub,
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
  ).toHex();

  console.log(stringify({ claimTransaction }));
};

import { Arguments } from 'yargs';
import BoltzApiClient from '../BoltzApiClient';
import BuilderComponents from '../BuilderComponents';
import { getHexString, stringify } from '../../Utils';
import {
  extractRefundPublicKeyFromReverseSwapTree,
  parseTransaction,
} from '../../Core';
import {
  finalizeCooperativeTransaction,
  prepareCooperativeTransaction,
  setupCooperativeTransaction,
} from '../TaprootHelper';

export const command =
  'claim-cooperative <network> <preimage> <privateKey> <swapId> <swapTree> <destinationAddress> [feePerVbyte] [blindingKey]';

export const describe = 'claims a Taproot Reverse Submarine Swap cooperatively';

export const builder = {
  network: BuilderComponents.network,
  preimage: BuilderComponents.preimage,
  privateKey: BuilderComponents.privateKey,
  swapId: BuilderComponents.swapId,
  swapTree: BuilderComponents.swapTree,
  destinationAddress: BuilderComponents.destinationAddress,
  feePerVbyte: BuilderComponents.feePerVbyte,
  blindingKey: BuilderComponents.blindingKey,
};

export const handler = async (argv: Arguments<any>): Promise<void> => {
  const { network, keys, tweakedKey, theirPublicKey, musig, currencyType } =
    await setupCooperativeTransaction(
      argv,
      extractRefundPublicKeyFromReverseSwapTree,
    );

  const boltzClient = new BoltzApiClient();
  const swapStatus = await boltzClient.getStatus(argv.swapId);

  if (swapStatus.transaction === undefined) {
    throw 'no transaction in swap status';
  }

  const lockupTx = parseTransaction(currencyType, swapStatus.transaction.hex);

  const { details, tx } = prepareCooperativeTransaction(
    argv,
    network,
    currencyType,
    keys,
    tweakedKey,
    lockupTx,
  );

  const partialSig = await boltzClient.getReverseClaimPartialSignature(
    argv.swapId,
    argv.preimage,
    tx.toHex(),
    0,
    getHexString(Buffer.from(musig.getPublicNonce())),
  );
  console.log(
    stringify({
      refundTransaction: finalizeCooperativeTransaction(
        tx,
        musig,
        network,
        currencyType,
        theirPublicKey,
        details,
        partialSig,
      ).toHex(),
    }),
  );
};

import { extractRefundPublicKeyFromReverseSwapTree } from 'boltz-core';
import { Arguments } from 'yargs';
import { parseTransaction } from '../../Core';
import { getHexString, stringify } from '../../Utils';
import BoltzApiClient from '../BoltzApiClient';
import BuilderComponents from '../BuilderComponents';
import { currencyTypeFromNetwork, parseNetwork } from '../Command';
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
  const boltzClient = new BoltzApiClient();
  const swapStatus = await boltzClient.getStatus(argv.swapId);

  if (swapStatus.transaction === undefined) {
    throw 'no transaction in swap status';
  }

  const network = parseNetwork(argv.network);
  const currencyType = currencyTypeFromNetwork(argv.network);

  const lockupTx = parseTransaction(currencyType, swapStatus.transaction.hex);

  const { keys, tweakedKey, theirPublicKey, musig } =
    await setupCooperativeTransaction(
      argv,
      extractRefundPublicKeyFromReverseSwapTree,
      lockupTx,
    );

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
      claimTransaction: finalizeCooperativeTransaction(
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

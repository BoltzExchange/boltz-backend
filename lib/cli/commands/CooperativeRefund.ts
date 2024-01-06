import { extractClaimPublicKeyFromSwapTree } from 'boltz-core';
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
  'refund-cooperative <network> <privateKey> <swapId> <swapTree> <destinationAddress> [feePerVbyte] [blindingKey]';

export const describe = 'refunds a Taproot Submarine Swap cooperatively';

export const builder = {
  network: BuilderComponents.network,
  privateKey: BuilderComponents.privateKey,
  swapId: BuilderComponents.swapId,
  swapTree: BuilderComponents.swapTree,
  destinationAddress: BuilderComponents.destinationAddress,
  feePerVbyte: BuilderComponents.feePerVbyte,
  blindingKey: BuilderComponents.blindingKey,
};

export const handler = async (argv: Arguments<any>): Promise<void> => {
  const network = parseNetwork(argv.network);
  const currencyType = currencyTypeFromNetwork(argv.network);

  const boltzClient = new BoltzApiClient();
  const lockupTx = parseTransaction(
    currencyType,
    (await boltzClient.getSwapTransaction(argv.swapId)).transactionHex,
  );

  const { keys, musig, tweakedKey, theirPublicKey } =
    await setupCooperativeTransaction(
      argv,
      extractClaimPublicKeyFromSwapTree,
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

  const partialSig = await boltzClient.getSwapRefundPartialSignature(
    argv.swapId,
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

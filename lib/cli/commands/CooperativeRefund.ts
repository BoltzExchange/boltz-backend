import {
  SwapTreeSerializer,
  extractClaimPublicKeyFromReverseSwapTree,
  extractClaimPublicKeyFromSwapTree,
} from 'boltz-core';
import { Arguments } from 'yargs';
import { parseTransaction } from '../../Core';
import { ECPair } from '../../ECPairHelper';
import { getHexBuffer, getHexString, stringify } from '../../Utils';
import BoltzApiClient from '../BoltzApiClient';
import BuilderComponents, { ApiType, BuilderTypes } from '../BuilderComponents';
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

export const handler = async (
  argv: Arguments<BuilderTypes<typeof builder> & ApiType>,
): Promise<void> => {
  const network = parseNetwork(argv.network);
  const currencyType = currencyTypeFromNetwork(argv.network);

  const boltzClient = new BoltzApiClient(argv.api.endpoint);
  const lockupTx = parseTransaction(
    currencyType,
    (await boltzClient.getSwapTransaction(argv.swapId)).transactionHex,
  );

  const { keys, musig, tweakedKey, theirPublicKey } =
    await setupCooperativeTransaction(
      network,
      currencyType,
      SwapTreeSerializer.deserializeSwapTree(argv.swapTree),
      ECPair.fromPrivateKey(getHexBuffer(argv.privateKey)),
      [
        extractClaimPublicKeyFromSwapTree,
        extractClaimPublicKeyFromReverseSwapTree,
      ],
      lockupTx,
    );

  const { details, tx } = prepareCooperativeTransaction(
    network,
    currencyType,
    keys,
    tweakedKey,
    lockupTx,
    argv.destinationAddress,
    argv.feePerVbyte,
    argv.blindingKey,
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

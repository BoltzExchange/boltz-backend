import { Arguments } from 'yargs';
import { randomBytes } from 'crypto';
import { Transaction } from 'bitcoinjs-lib';
import { Transaction as LiquidTransaction } from 'liquidjs-lib';
import { TaprootUtils as LiquidTaprootDetails } from 'boltz-core/dist/lib/liquid';
import {
  detectSwap,
  Musig,
  OutputType,
  SwapTreeSerializer,
  TaprootUtils,
} from 'boltz-core';
import { ECPair } from '../../ECPairHelper';
import BoltzApiClient from '../BoltzApiClient';
import { CurrencyType } from '../../consts/Enums';
import BuilderComponents from '../BuilderComponents';
import { getHexBuffer, getHexString, stringify } from '../../Utils';
import {
  constructClaimTransaction,
  extractClaimPublicKeyFromSwapTree,
  parseTransaction,
  setup,
  tweakMusig,
  zkpMusig,
} from '../../Core';
import {
  currencyTypeFromNetwork,
  getWalletStub,
  parseNetwork,
} from '../Command';

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
  await setup();

  const network = parseNetwork(argv.network);
  const currencyType = currencyTypeFromNetwork(argv.network);

  const swapTree = SwapTreeSerializer.deserializeSwapTree(argv.swapTree);
  const keys = ECPair.fromPrivateKey(getHexBuffer(argv.privateKey));
  const claimKey = extractClaimPublicKeyFromSwapTree(swapTree);

  const musig = new Musig(zkpMusig, keys, randomBytes(32), [
    claimKey,
    keys.publicKey,
  ]);
  const tweakedKey = tweakMusig(currencyType, musig, swapTree);

  const boltzClient = new BoltzApiClient();
  const lockupTx = parseTransaction(
    currencyType,
    (await boltzClient.getSwapTransaction(argv.swapId)).transactionHex,
  );
  const swapOutput = detectSwap(tweakedKey, lockupTx);
  if (swapOutput === undefined) {
    throw 'could not find swap output';
  }

  const refundDetails = [
    {
      ...swapOutput,
      keys,
      txHash: lockupTx.getHash(),
      type: OutputType.Taproot,
      cooperative: true,
    } as any,
  ];
  const refundTx = constructClaimTransaction(
    getWalletStub(
      currencyType,
      network,
      argv.destinationAddress,
      argv.blindingKey,
    ),
    refundDetails,
    argv.destinationAddress,
    argv.feePerVbyte,
  );

  const partialSig = await boltzClient.refundSwap(
    argv.swapId,
    refundTx.toHex(),
    0,
    getHexString(Buffer.from(musig.getPublicNonce())),
  );
  musig.aggregateNonces(
    new Map([[claimKey, getHexBuffer(partialSig.pubNonce)]]),
  );

  let hash: Buffer;
  if (currencyType === CurrencyType.BitcoinLike) {
    hash = TaprootUtils.hashForWitnessV1(
      refundDetails,
      refundTx as Transaction,
      0,
    );
  } else {
    hash = LiquidTaprootDetails.hashForWitnessV1(
      network,
      refundDetails,
      refundTx as LiquidTransaction,
      0,
    );
  }

  musig.initializeSession(hash);
  musig.signPartial();
  musig.addPartial(claimKey, getHexBuffer(partialSig.partialSignature));
  refundTx.setWitness(0, [musig.aggregatePartials()]);

  console.log(stringify({ refundTransaction: refundTx.toHex() }));
};

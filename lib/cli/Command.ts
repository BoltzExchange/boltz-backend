import { credentials } from '@grpc/grpc-js';
import { Network, Transaction } from 'bitcoinjs-lib';
import {
  Musig,
  Networks,
  SwapTreeSerializer,
  Types,
  detectSwap,
} from 'boltz-core';
import { Networks as LiquidNetworks } from 'boltz-core/dist/lib/liquid';
import * as console from 'console';
import { randomBytes } from 'crypto';
import { ECPairInterface } from 'ecpair';
import { Transaction as LiquidTransaction } from 'liquidjs-lib';
import { Network as LiquidNetwork } from 'liquidjs-lib/src/networks';
import { Arguments } from 'yargs';
import {
  parseTransaction,
  setup,
  toOutputScript,
  tweakMusig,
  zkp,
} from '../Core';
import { ECPair } from '../ECPairHelper';
import { getHexBuffer, stringify } from '../Utils';
import { CurrencyType } from '../consts/Enums';
import { BoltzClient } from '../proto/boltzrpc_grpc_pb';

export interface GrpcResponse {
  toObject: () => any;
}

export const loadBoltzClient = (argv: Arguments<any>): BoltzClient => {
  return new BoltzClient(
    `${argv.rpc.host}:${argv.rpc.port}`,
    credentials.createInsecure(),
  );
};

export const callback = <T extends GrpcResponse>(
  formatter?: (res: T) => any,
): ((error: Error | null, response: T) => void) => {
  return (error: Error | null, response: T) => {
    if (error) {
      printError(error);

      // eslint-disable-next-line no-process-exit
      process.exit(1);
    } else {
      const responseObj = response.toObject();

      if (Object.keys(responseObj).length === 0) {
        console.log('success');
      } else {
        printResponse(
          formatter !== undefined ? formatter(response) : responseObj,
        );
      }
    }
  };
};

export const prepareTx = async (
  argv: Arguments<any>,
  keyExtractionFunc: (tree: Types.SwapTree) => Buffer,
) => {
  await setup();

  const type = currencyTypeFromNetwork(argv.network);
  const network = parseNetwork(argv.network);

  const transaction = parseTransaction(type, argv.rawTransaction);
  const blindingKey = parseBlindingKey(type, argv.blindingKey);

  const res: any = {
    type,
    blindingKey,
    transaction,
    walletStub: getWalletStub(
      type,
      network,
      argv.destinationAddress,
      argv.blindingKey,
    ),
    destinationAddress: argv.destinationAddress,
    keys: ECPair.fromPrivateKey(getHexBuffer(argv.privateKey)),
  };

  // If the redeem script can be parsed as JSON, it is a swap tree
  try {
    const tree = SwapTreeSerializer.deserializeSwapTree(
      argv.redeemScript.replaceAll('\\"', '"'),
    );

    const { musig, swapOutput } = musigFromExtractedKey(
      type,
      res.keys,
      keyExtractionFunc(tree),
      tree,
      transaction,
    );

    res.swapOutput = {
      ...swapOutput,
      swapTree: tree,
      internalKey: musig.getAggregatedPublicKey(),
    };
  } catch (e) {
    res.redeemScript = getHexBuffer(argv.redeemScript);
    res.swapOutput = detectSwap(res.redeemScript, transaction);
  }

  return res;
};

export const getWalletStub = (
  type: CurrencyType,
  network: Network | LiquidNetwork,
  destinationAddress: string,
  blindingKey: string,
) =>
  ({
    type,
    network,
    deriveBlindingKeyFromScript: () => ({
      privateKey: parseBlindingKey(type, blindingKey),
    }),
    decodeAddress: () => toOutputScript(type, destinationAddress, network),
  }) as any;

export const parseBlindingKey = (type: CurrencyType, blindingKey: string) =>
  type === CurrencyType.Liquid ? getHexBuffer(blindingKey) : undefined;

export const parseNetwork = (network: string) =>
  currencyTypeFromNetwork(network) === CurrencyType.BitcoinLike
    ? Networks[network]
    : LiquidNetworks[network];

export const currencyTypeFromNetwork = (network: string) =>
  network.includes('liquid') ? CurrencyType.Liquid : CurrencyType.BitcoinLike;

export const printResponse = (response: unknown): void => {
  console.log(stringify(response));
};

export const printError = (error: Error): void => {
  console.error(`${error.name}: ${error.message}`);
};

export const musigFromExtractedKey = (
  type: CurrencyType,
  ourKeys: ECPairInterface,
  theirPublicKey: Buffer,
  tree: Types.SwapTree,
  lockupTx: Transaction | LiquidTransaction,
) => {
  for (const tieBreaker of ['02', '03']) {
    const compressedKey = Buffer.concat([
      getHexBuffer(tieBreaker),
      theirPublicKey,
    ]);

    const musig = new Musig(zkp, ourKeys, randomBytes(32), [
      compressedKey,
      ourKeys.publicKey,
    ]);
    const tweakedKey = tweakMusig(type, musig, tree);

    const swapOutput = detectSwap(tweakedKey, lockupTx);
    if (swapOutput !== undefined) {
      return {
        musig,
        tweakedKey,
        swapOutput,
        theirPublicKey: compressedKey,
      };
    }
  }

  throw 'could not find swap output';
};

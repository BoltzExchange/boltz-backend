import { Arguments } from 'yargs';
import { randomBytes } from 'crypto';
import { Network } from 'bitcoinjs-lib';
import { credentials } from '@grpc/grpc-js';
import {
  detectSwap,
  Musig,
  Networks,
  SwapTreeSerializer,
  Types,
} from 'boltz-core';
import { Network as LiquidNetwork } from 'liquidjs-lib/src/networks';
import { Networks as LiquidNetworks } from 'boltz-core/dist/lib/liquid';
import { ECPair } from '../ECPairHelper';
import { CurrencyType } from '../consts/Enums';
import { getHexBuffer, stringify } from '../Utils';
import { BoltzClient } from '../proto/boltzrpc_grpc_pb';
import {
  parseTransaction,
  setup,
  toOutputScript,
  tweakMusig,
  zkpMusig,
} from '../Core';

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
    const tree = SwapTreeSerializer.deserializeSwapTree(argv.redeemScript);
    const theirPublicKey = keyExtractionFunc(tree);

    const musig = new Musig(zkpMusig, res.keys, randomBytes(32), [
      theirPublicKey,
      res.keys.publicKey,
    ]);
    const tweakedKey = tweakMusig(type, musig, tree);

    const swapOutput: any = detectSwap(tweakedKey, transaction);

    swapOutput.swapTree = tree;
    swapOutput.internalKey = musig.getAggregatedPublicKey();

    res.swapOutput = swapOutput;
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

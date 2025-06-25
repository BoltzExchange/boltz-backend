import { credentials } from '@grpc/grpc-js';
import type { Network, Transaction } from 'bitcoinjs-lib';
import type { Types } from 'boltz-core';
import { Musig, Networks, SwapTreeSerializer, detectSwap } from 'boltz-core';
import { Networks as LiquidNetworks } from 'boltz-core/dist/lib/liquid';
import * as console from 'console';
import { randomBytes } from 'crypto';
import type { ECPairInterface } from 'ecpair';
import type { Transaction as LiquidTransaction } from 'liquidjs-lib';
import type { Network as LiquidNetwork } from 'liquidjs-lib/src/networks';
import path from 'path';
import type { Arguments } from 'yargs';
import {
  parseTransaction,
  setup,
  toOutputScript,
  tweakMusig,
  zkp,
} from '../Core';
import { coinsToSatoshis } from '../DenominationConverter';
import { ECPair } from '../ECPairHelper';
import { getHexBuffer, stringify } from '../Utils';
import { CurrencyType } from '../consts/Enums';
import { CertificatePrefix } from '../grpc/Certificates';
import GrpcServer from '../grpc/GrpcServer';
import { grpcOptions } from '../lightning/GrpcUtils';
import { createSsl } from '../lightning/cln/Types';
import { BoltzClient } from '../proto/boltzrpc_grpc_pb';
import type { RpcType } from './BuilderComponents';

const invalidAmountError = new Error('invalid amount');

export interface GrpcResponse {
  toObject: () => any;
}

export const loadBoltzClient = (argv: RpcType): BoltzClient => {
  const address = `${argv.rpc.host}:${argv.rpc.port}`;

  if (argv.rpc['disable-ssl']) {
    return new BoltzClient(address, credentials.createInsecure());
  } else {
    const creds = createSsl('Boltz', 'gRPC', {
      rootCertPath: path.join(
        argv.rpc.certificates,
        `${CertificatePrefix.CA}.pem`,
      ),
      certChainPath: path.join(
        argv.rpc.certificates,
        `${CertificatePrefix.Client}.pem`,
      ),
      privateKeyPath: path.join(
        argv.rpc.certificates,
        `${CertificatePrefix.Client}-key.pem`,
      ),
    });
    return new BoltzClient(
      address,
      creds,
      grpcOptions(GrpcServer.certificateSubject),
    );
  }
};

export const callback = <T extends GrpcResponse>(
  formatter?: (res: T) => any,
): ((error: Error | null, response: T) => void) => {
  return (error: Error | null, response: T) => {
    if (error) {
      printError(error);

      // eslint-disable-next-line n/no-process-exit
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
  keyExtractionFuncs: ((tree: Types.SwapTree) => Buffer)[],
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
      keyExtractionFuncs.map((fn) => fn(tree)),
      tree,
      transaction,
    );

    res.swapOutput = {
      ...swapOutput,
      swapTree: tree,
      internalKey: musig.getAggregatedPublicKey(),
    };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    res.redeemScript = getHexBuffer(argv.redeemScript);
    res.swapOutput = detectSwap(res.redeemScript, transaction);
  }

  if (res.swapOutput === undefined) {
    throw 'could not find swap output';
  }

  return res;
};

export const getWalletStub = (
  type: CurrencyType,
  network: Network | LiquidNetwork,
  destinationAddress: string,
  blindingKey?: string,
) =>
  ({
    type,
    network,
    decodeAddress: () => toOutputScript(type, destinationAddress, network),
    deriveBlindingKeyFromScript: () => ({
      privateKey: parseBlindingKey(type, blindingKey!),
    }),
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
  possibleTheirPublicKeys: Buffer[],
  tree: Types.SwapTree,
  lockupTx: Transaction | LiquidTransaction,
) => {
  for (const theirPublicKey of possibleTheirPublicKeys) {
    if (!Buffer.isBuffer(theirPublicKey)) {
      continue;
    }

    for (const tieBreaker of ['02', '03']) {
      const compressedKey = Buffer.concat([
        getHexBuffer(tieBreaker),
        theirPublicKey,
      ]);

      for (const keys of [
        [compressedKey, Buffer.from(ourKeys.publicKey)],
        [Buffer.from(ourKeys.publicKey), compressedKey],
      ]) {
        const musig = new Musig(zkp, ourKeys, randomBytes(32), keys);
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
    }
  }

  throw 'could not find swap output';
};

export const parseAmount = (amount: string) => {
  const trimmed = amount.trim();
  if (trimmed.length === 0) {
    throw invalidAmountError;
  }

  let parsed = Number(trimmed);

  if (isNaN(parsed) || !Number.isFinite(parsed)) {
    throw invalidAmountError;
  }

  // Treat inputs that contain a decimal point or have a fractional part as coin amounts
  if (parsed % 1 !== 0 || trimmed.includes('.')) {
    parsed = Math.round(coinsToSatoshis(parsed));
  }

  if (!Number.isSafeInteger(parsed)) {
    throw invalidAmountError;
  }

  return Math.round(parsed);
};

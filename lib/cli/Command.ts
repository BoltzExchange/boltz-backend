import { Arguments } from 'yargs';
import { credentials } from '@grpc/grpc-js';
import { detectSwap, Networks } from 'boltz-core';
import { Network as LiquidNetwork } from 'liquidjs-lib/src/networks';
import { Networks as LiquidNetworks } from 'boltz-core/dist/lib/liquid';
import { ECPair } from '../ECPairHelper';
import { CurrencyType } from '../consts/Enums';
import { getHexBuffer, stringify } from '../Utils';
import { BoltzClient } from '../proto/boltzrpc_grpc_pb';
import { parseTransaction, setup, toOutputScript } from '../Core';
import { Network } from 'bitcoinjs-lib';

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

export const prepareTx = async (argv: Arguments<any>) => {
  await setup();

  const redeemScript = getHexBuffer(argv.redeemScript);

  const type = currencyTypeFromNetwork(argv.network);
  const network = parseNetwork(argv.network);

  const transaction = parseTransaction(type, argv.rawTransaction);
  const blindingKey = parseBlindingKey(type, argv.blindingKey);

  return {
    type,
    transaction,
    redeemScript,
    blindingKey,
    walletStub: getWalletStub(
      type,
      network,
      argv.destinationAddress,
      argv.blindingKey,
    ),
    destinationAddress: argv.destinationAddress,
    swapOutput: detectSwap(redeemScript, transaction),
    keys: ECPair.fromPrivateKey(getHexBuffer(argv.privateKey)),
  };
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

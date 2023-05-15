import { Arguments } from 'yargs';
import { credentials } from '@grpc/grpc-js';
import { Networks } from 'boltz-core-liquid-michael1011';
import { ECPair } from '../ECPairHelper';
import { CurrencyType } from '../consts/Enums';
import { getHexBuffer, stringify } from '../Utils';
import { BoltzClient } from '../proto/boltzrpc_grpc_pb';
import { detectSwap, parseTransaction, setup, toOutputScript } from '../Core';

export interface GrpcResponse {
  toObject: () => any;
}

export const loadBoltzClient = (argv: Arguments<any>): BoltzClient => {
  return new BoltzClient(
    `${argv.rpc.host}:${argv.rpc.port}`,
    credentials.createInsecure(),
  );
};

export const callback = (error: Error | null, response: GrpcResponse): void => {
  if (error) {
    printError(error);
  } else {
    const responseObj = response.toObject();
    if (Object.keys(responseObj).length === 0) {
      console.log('success');
    } else {
      printResponse(responseObj);
    }
  }
};

export const prepareTx = async (argv: Arguments<any>) => {
  await setup();
  const network = Networks[argv.network];

  const redeemScript = getHexBuffer(argv.redeemScript);

  const type = argv.network.includes('liquid')
    ? CurrencyType.Liquid
    : CurrencyType.BitcoinLike;
  const transaction = parseTransaction(type, argv.rawTransaction);

  const blindingKey =
    type === CurrencyType.Liquid ? getHexBuffer(argv.blindingKey) : undefined;

  return {
    type,
    network,
    transaction,
    redeemScript,
    blindingKey,
    walletStub: {
      type,
      deriveBlindingKeyFromScript: () => ({
        privateKey: blindingKey,
      }),
      decodeAddress: () =>
        toOutputScript(type, argv.destinationAddress, network),
    } as any,
    destinationAddress: argv.destinationAddress,
    swapOutput: detectSwap(type, redeemScript, transaction),
    keys: ECPair.fromPrivateKey(getHexBuffer(argv.privateKey)),
  };
};

export const printResponse = (response: unknown): void => {
  console.log(stringify(response));
};

export const printError = (error: Error): void => {
  console.error(`${error.name}: ${error.message}`);
};

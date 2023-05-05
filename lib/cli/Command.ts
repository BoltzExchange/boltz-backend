import { Arguments } from 'yargs';
import { credentials } from '@grpc/grpc-js';
import { Networks } from 'boltz-core-liquid';
import { ECPair } from '../ECPairHelper';
import { CurrencyType } from '../consts/Enums';
import { getHexBuffer, stringify } from '../Utils';
import { BoltzClient } from '../proto/boltzrpc_grpc_pb';
import { detectSwap, parseTransaction, toOutputScript } from '../Core';

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

export const prepareTx = (argv: Arguments<any>) => {
  const network = Networks[argv.network];

  const redeemScript = getHexBuffer(argv.redeemScript);

  const type = argv.network.includes('liquid')
    ? CurrencyType.Liquid
    : CurrencyType.BitcoinLike;
  const transaction = parseTransaction(type, argv.rawTransaction);

  return {
    type,
    network,
    swapOutput: detectSwap(type, redeemScript, transaction),
    transaction,
    redeemScript,
    keys: ECPair.fromPrivateKey(getHexBuffer(argv.privateKey)),
    destinationAddress: toOutputScript(type, argv.destinationAddress, network),
  };
};

export const printResponse = (response: unknown): void => {
  console.log(stringify(response));
};

export const printError = (error: Error): void => {
  console.error(`${error.name}: ${error.message}`);
};

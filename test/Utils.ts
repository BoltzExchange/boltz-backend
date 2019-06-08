import { OutputType, Networks } from 'boltz-core';
import { ECPair, address, crypto, TransactionBuilder } from 'bitcoinjs-lib';
import { getPubkeyHashFunction } from '../lib/Utils';

export const wait = (ms: number) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const waitForFunctionToBeTrue = (func: () => boolean) => {
  return new Promise((resolve) => {
    const interval = setInterval(() => {
      if (func()) {
        clearInterval(interval);
        resolve();
      }
    });
  });
};

export const waitForPromiseToBeTrue = (func: () => Promise<boolean>) => {
  return new Promise((resolve) => {
    const interval = setInterval(async () => {
      if (await func()) {
        clearInterval(interval);
        resolve();
      }
    });
  });
};

export const generateAddress = (outputType: OutputType) => {
  const keys = ECPair.makeRandom({ network: Networks.bitcoinRegtest });
  const encodeFunction = getPubkeyHashFunction(outputType);

  const outputScript = encodeFunction(crypto.hash160(keys.publicKey!)) as Buffer;
  return {
    outputScript,
    address: address.fromOutputScript(outputScript, Networks.bitcoinRegtest),
  };
};

export const constructTransaction = (rbf: boolean, input: string, outputAmount = 1) => {
  const { outputScript } = generateAddress(OutputType.Bech32);
  const keys = ECPair.makeRandom({ network: Networks.bitcoinRegtest });

  const builder = new TransactionBuilder(Networks.bitcoinRegtest);

  builder.addInput(input, 0, rbf ? 0xfffffffd : 0xffffffff);
  builder.addOutput(outputScript, outputAmount);

  builder.sign(0, keys);

  return builder.build();
};

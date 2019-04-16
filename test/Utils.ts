import { OutputType, Networks } from 'boltz-core';
import { ECPair, address, crypto } from 'bitcoinjs-lib';
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

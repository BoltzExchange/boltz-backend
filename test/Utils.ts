import { OutputType, Networks, Scripts } from 'boltz-core';
import { TransactionInput } from 'bip174/src/lib/interfaces';
import { ECPair, address, crypto, Psbt } from 'bitcoinjs-lib';
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
    }, 25);
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

  const outputScript = encodeFunction(crypto.hash160(keys.publicKey)) as Buffer;

  return {
    outputScript,
    address: address.fromOutputScript(outputScript, Networks.bitcoinRegtest),
  };
};

export const constructTransaction = (rbf: boolean, input: string, outputAmount = 1) => {
  const { outputScript } = generateAddress(OutputType.Bech32);
  const keys = ECPair.makeRandom({ network: Networks.bitcoinRegtest });

  const psbt = new Psbt({
    network: Networks.bitcoinRegtest,
  });

  psbt.addInput({
    hash: input,
    index: 0,
    sequence: rbf  ? 0xfffffffd : 0xffffffff,
    witnessUtxo: {
      value: outputAmount + 1,
      script: Scripts.p2wpkhOutput(crypto.hash160(keys.publicKey)),
    },
  } as any as TransactionInput);
  psbt.addOutput({
    script: outputScript,
    value: outputAmount,
  });

  psbt.signInput(0, keys);

  psbt.validateSignaturesOfAllInputs();
  psbt.finalizeAllInputs();

  return psbt.extractTransaction();
};

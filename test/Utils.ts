import { OutputType, Networks, Scripts } from 'boltz-core';
import { TransactionInput } from 'bip174/src/lib/interfaces';
import { ECPair, address, crypto, Psbt, Transaction } from 'bitcoinjs-lib';
import { getPubkeyHashFunction } from '../lib/Utils';

export const randomRange = (max: number): number => {
  return Math.floor(Math.random() * Math.floor(max));
};

export const wait = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const waitForFunctionToBeTrue = (func: () => boolean): Promise<void> => {
  return new Promise((resolve) => {
    const interval = setInterval(() => {
      if (func()) {
        clearInterval(interval);
        resolve();
      }
    }, 25);
  });
};

export const generateAddress = (outputType: OutputType): { outputScript: Buffer, address: string } => {
  const keys = ECPair.makeRandom({ network: Networks.bitcoinRegtest });
  const encodeFunction = getPubkeyHashFunction(outputType);

  const outputScript = encodeFunction(crypto.hash160(keys.publicKey)) as Buffer;

  return {
    outputScript,
    address: address.fromOutputScript(outputScript, Networks.bitcoinRegtest),
  };
};

export const constructTransaction = (rbf: boolean, input: string, outputAmount = 1): Transaction => {
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

import { Psbt, PsbtTxInput, Transaction, address, crypto } from 'bitcoinjs-lib';
import { Networks, OutputType, Scripts } from 'boltz-core';
import { createServer } from 'net';
import { AddressInfo } from 'ws';
import { ECPair } from '../lib/ECPairHelper';
import { racePromise } from '../lib/PromiseUtils';
import { getPubkeyHashFunction } from '../lib/Utils';

export const randomRange = (max: number): number => {
  return Math.floor(Math.random() * Math.floor(max));
};

export const wait = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const waitForFunctionToBeTrue = (
  func: () => boolean | Promise<boolean>,
  interval = 25,
): Promise<void> => {
  return new Promise((resolve) => {
    const intervalNmb = setInterval(async () => {
      if (await func()) {
        clearInterval(intervalNmb);
        resolve();
      }
    }, interval);
  });
};

export const generateAddress = (
  outputType: OutputType,
): { outputScript: Buffer; address: string } => {
  const keys = ECPair.makeRandom({ network: Networks.bitcoinRegtest });
  const encodeFunction = getPubkeyHashFunction(outputType);

  const outputScript = encodeFunction(crypto.hash160(keys.publicKey)) as Buffer;

  return {
    outputScript,
    address: address.fromOutputScript(outputScript, Networks.bitcoinRegtest),
  };
};

export const constructTransaction = (
  rbf: boolean,
  input: string,
  outputAmount = 1,
): Transaction => {
  const { outputScript } = generateAddress(OutputType.Bech32);
  const keys = ECPair.makeRandom({ network: Networks.bitcoinRegtest });

  const psbt = new Psbt({
    network: Networks.bitcoinRegtest,
  });

  psbt.addInput({
    hash: input,
    index: 0,
    sequence: rbf ? 0xfffffffd : 0xffffffff,
    witnessUtxo: {
      value: outputAmount + 1,
      script: Scripts.p2wpkhOutput(crypto.hash160(keys.publicKey)),
    },
  } as any as PsbtTxInput);
  psbt.addOutput({
    script: outputScript,
    value: outputAmount,
  });

  psbt.signInput(0, keys);

  psbt.finalizeAllInputs();

  return psbt.extractTransaction();
};

export const getPort = () => {
  return new Promise<number>((resolve, reject) => {
    const server = createServer();
    server.unref();
    server.on('error', reject);

    server.listen(0, () => {
      const { port } = server.address() as AddressInfo;

      server.close(() => {
        resolve(port);
      });
    });
  });
};

export const raceCall = <T>(
  promise: (() => Promise<T>) | Promise<T>,
  raceHandler: (reason?: any) => void,
  raceTimeout: number,
): Promise<T> =>
  racePromise(promise, (reject) => raceHandler(reject), raceTimeout);

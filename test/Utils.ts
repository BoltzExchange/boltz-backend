import { secp256k1 } from '@noble/curves/secp256k1.js';
import { ripemd160 } from '@noble/hashes/legacy.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { randomBytes } from '@noble/hashes/utils.js';
import { Transaction } from '@scure/btc-signer';
import { OutputType, Scripts } from 'boltz-core';
import type { AddressInfo } from 'net';
import { createServer } from 'net';
import { addressFromOutputScript } from '../lib/AddressUtils';
import Logger from '../lib/Logger';
import { racePromise } from '../lib/PromiseUtils';
import { getPubkeyHashFunction } from '../lib/Utils';
import { CurrencyType } from '../lib/consts/Enums';
import Database from '../lib/db/Database';
import { regtest as regtestNetwork } from './Networks';

const hash160 = (data: Uint8Array): Uint8Array => ripemd160(sha256(data));

const makeRandomKeys = () => {
  const privateKey = randomBytes(32);
  return {
    privateKey,
    publicKey: secp256k1.getPublicKey(privateKey, true),
  };
};

export const getPostgresDatabase = () => {
  return new Database(Logger.disabledLogger, undefined, {
    host: 'localhost',
    port: 5432,
    database: 'boltz_test',
    username: 'boltz',
    password: 'boltz',
  });
};

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

export const generateOutputScript = (outputType: OutputType): Buffer => {
  const keys = makeRandomKeys();
  const encodeFunction = getPubkeyHashFunction(outputType);
  return encodeFunction(Buffer.from(hash160(keys.publicKey))) as Buffer;
};

export const generateAddress = async (
  outputType: OutputType,
): Promise<{ outputScript: Buffer; address: string }> => {
  const outputScript = generateOutputScript(outputType);

  return {
    outputScript,
    address: await addressFromOutputScript(
      CurrencyType.BitcoinLike,
      outputScript,
      regtestNetwork,
    ),
  };
};

export const constructTransaction = (
  rbf: boolean,
  input: string,
  outputAmount = 1,
): Transaction => {
  const outputScript = generateOutputScript(OutputType.Bech32);
  const keys = makeRandomKeys();

  const tx = new Transaction({ allowUnknownInputs: true });
  const witnessScript = Buffer.from(
    Scripts.p2wpkhOutput(hash160(keys.publicKey)),
  );

  tx.addInput({
    txid: input,
    index: 0,
    sequence: rbf ? 0xfffffffd : 0xffffffff,
    witnessUtxo: {
      amount: BigInt(outputAmount + 1),
      script: witnessScript,
    },
  });

  tx.addOutput({
    script: outputScript,
    amount: BigInt(outputAmount),
  });

  tx.sign(keys.privateKey!);
  tx.finalize();

  return tx;
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

export const createDeferred = () => {
  let resolve!: () => void;
  const promise = new Promise<void>((res) => {
    resolve = res;
  });

  return { promise, resolve };
};

export const raceCall = <T>(
  promise: (() => Promise<T>) | Promise<T>,
  raceHandler: (reason?: any) => void,
  raceTimeout: number,
): Promise<T> =>
  racePromise(promise, (reject) => raceHandler(reject), raceTimeout);

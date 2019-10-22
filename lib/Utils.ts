import os from 'os';
import path from 'path';
import bolt11 from '@boltz/bolt11';
import { Transaction } from 'bitcoinjs-lib';
import { OutputType, Scripts } from 'boltz-core';
import { OrderSide } from './consts/Enums';

const {
  p2shOutput,
  p2wshOutput,
  p2pkhOutput,
  p2wpkhOutput,
  p2shP2wshOutput,
  p2shP2wpkhOutput,
} = Scripts;

const idPossibilities = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

/**
 * Generate an id
 *
 * @param length how many characters the id should have
 */
export const generateId = (length = 6): string => {
  let id = '';

  for (let i = 0; i < length; i += 1) {
    id += idPossibilities.charAt(Math.floor(Math.random() * idPossibilities.length));
  }

  return id;
};

/**
 * Stringify any object or array
 */
export const stringify = (object: any) => {
  return JSON.stringify(object, undefined, 2);
};

/**
 * Turn a map into an object
 */
export const mapToObject = (map: Map<any, any>) => {
  const object: any = {};

  map.forEach((value, index) => {
    object[index] = value;
  });

  return object;
};

/**
 * Get the pair id of a pair
 */
export const getPairId = (pair: { base: string, quote: string }): string => {
  return `${pair.base}/${pair.quote}`;
};

/**
 * Get the quote and base asset of a pair id
 */
export const splitPairId = (pairId: string): {
  base: string,
  quote: string,
} => {
  const split = pairId.split('/');

  return {
    base: split[0],
    quote: split[1],
  };
};

/**
 * Convert minutes into milliseconds
 */
export const minutesToMilliseconds = (minutes: number) => {
  return minutes * 60 * 1000;
};

/**
 * Gets the amount of an invoice in satoshis
 */
export const getInvoiceAmt = (invoice: string): number => {
  return Number(bolt11.decode(invoice).millisatoshis) / 1000;
};

/**
 * Splits a derivation path into multiple parts
 */
export const splitDerivationPath = (path: string): { master: string, sub: number[] } => {
  const split = path.split('/');
  const master = split.shift()!;

  const sub: number[] = [];

  split.forEach((part) => {
    sub.push(Number(part));
  });

  return {
    master,
    sub,
  };
};

/**
 * Concat an error code and its prefix
 */
export const concatErrorCode = (prefix: number, code: number) => {
  return `${prefix}.${code}`;
};

/**
 * Capitalize the first letter of a string
 */
export const capitalizeFirstLetter = (input: string) => {
  return input.charAt(0).toUpperCase() + input.slice(1);
};

/**
 * Resolve '~' on Linux and Unix-Like systems
 */
export const resolveHome = (filename: string) => {
  if (os.platform() !== 'win32') {
    if (filename.charAt(0) === '~') {
      return path.join(process.env.HOME!, filename.slice(1));
    }
  }

  return filename;
};

/**
 * Get a hex encoded Buffer from a string
 * @returns a hex encoded Buffer
 */
export const getHexBuffer = (input: string) => {
  return Buffer.from(input, 'hex');
};

/**
 * Get a hex encoded string from a Buffer
 *
 * @returns a hex encoded string
 */
export const getHexString = (input: Buffer) => {
  return input.toString('hex');
};

/**
 * Check whether a variable is a non-array object
 */
export const isObject = (val: any): boolean => {
  return (val && typeof val === 'object' && !Array.isArray(val));
};

/**
 * Get the current date in the LocaleString format.
 */
export const getTsString = (): string => (new Date()).toLocaleString('en-US', { hour12: false });

/**
 * Recursively merge properties from different sources into a target object, overriding any
 * existing properties.
 * @param target The destination object to merge into.
 * @param sources The sources objects to copy from.
 */
export const deepMerge = (target: any, ...sources: any[]): object => {
  if (!sources.length) return target;
  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach((key) => {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        deepMerge(target[key], source[key]);
      } else if (source[key] !== undefined) {
        Object.assign(target, { [key]: source[key] });
      }
    });
  }

  return deepMerge(target, ...sources);
};

/**
 * Get all methods from an object whose name doesn't start with an underscore.
 */
export const getPublicMethods = (obj: any): any => {
  const ret = {};
  Object.getOwnPropertyNames(Object.getPrototypeOf(obj)).forEach((name) => {
    const func = obj[name];
    if ((func instanceof Function) && name !== 'constructor' && !name.startsWith('_')) {
      ret[name] = func;
    }
  });
  return ret;
};

export const groupBy = (arr: object[], keyGetter: (item: any) => string | number): any => {
  const ret = {};
  arr.forEach((item) => {
    const key = keyGetter(item);
    const group = ret[key];
    if (!group) {
      ret[key] = [item];
    } else {
      group.push(item);
    }
  });
  return ret;
};

/**
 * Split a string into host and port
 *
 * @param listen string of format host:port
 */
export const splitListen = (listen: string) =>  {
  const split = listen.split(':');
  return {
    host: split[0],
    port: split[1],
  };
};

/**
 * Get directory of system home.
 */
export const getSystemHomeDir = (): string => {
  switch (os.platform()) {
    case 'win32': return process.env.LOCALAPPDATA!;
    case 'darwin': return path.join(process.env.HOME!, 'Library', 'Application Support');
    default: return process.env.HOME!;
  }
};

/**
 * Get the data directory of a service
 */
export const getServiceDataDir = (service: string) => {
  const homeDir = getSystemHomeDir();
  const serviceDir = service.toLowerCase();
  switch (os.platform()) {
    case 'win32':
    case 'darwin':
      return path.join(homeDir, capitalizeFirstLetter(serviceDir));

    default: return path.join(homeDir, `.${serviceDir}`);
  }
};

export const getOutputType = (type?: number) => {
  if (type === undefined) {
    return OutputType.Legacy;
  }

  switch (type) {
    case 0: return OutputType.Bech32;
    case 1: return OutputType.Compatibility;
    case 2: return OutputType.Legacy;

    default: throw Error('type does not exist');
  }
};

export const getPubkeyHashFunction = (outputType: OutputType) => {
  switch (outputType) {
    case OutputType.Bech32:
      return p2wpkhOutput;

    case OutputType.Compatibility:
      return p2shP2wpkhOutput;

    case OutputType.Legacy:
      return p2pkhOutput;
  }
};

export const getScriptHashFunction = (outputType: OutputType) => {
  switch (outputType) {
    case OutputType.Bech32:
      return p2wshOutput;

    case OutputType.Compatibility:
      return p2shP2wshOutput;

    case OutputType.Legacy:
      return p2shOutput;
  }
};

export const reverseBuffer = (input: Buffer) => {
  const buffer = Buffer.allocUnsafe(input.length);

  for (let i = 0, j = input.length - 1; i <= j; i += 1, j -= 1) {
    buffer[i] = input[j];
    buffer[j] = input[i];
  }

  return buffer;
};

/**
 * The reversed version of the hex representation of a Buffer is not equal to the reversed Buffer.
 * Therefore we have to go full circle from a string to back to the Buffer, reverse that Buffer
 * and convert it back to a string to get the id of the transaction that is used by BTCD
 */
export const transactionHashToId = (transactionHash: Buffer) => {
  return getHexString(
    reverseBuffer(transactionHash),
  );
};

/**
 * Detects whether the transactions signals RBF explicitly
 *
 * @param transaction the transcations to scan
 */
export const transactionSignalsRbfExplicitly = (transaction: Transaction) => {
  let singalsRbf = false;

  transaction.ins.forEach((input) => {
    if (input.sequence < 0xffffffff - 1) {
      singalsRbf = true;
    }
  });

  return singalsRbf;
};

export const getSendingReceivingCurrency = (baseCurrency: string, quoteCurrency: string, orderSide: OrderSide) => {
  const isBuy = orderSide === OrderSide.BUY;

  return {
    sending: isBuy ? baseCurrency : quoteCurrency,
    receiving: isBuy ? quoteCurrency : baseCurrency,
  };
};

export const getRate = (rate: number, orderSide: OrderSide, isReverse: boolean) => {
  if (isReverse) {
    return orderSide === OrderSide.BUY ? 1 / rate : rate;
  } else {
    return orderSide === OrderSide.BUY ? rate : 1 / rate;
  }
};

export const getChainCurrency = (base: string, quote: string, orderSide: OrderSide, isReverse: boolean) => {
  if (isReverse) {
    return orderSide === OrderSide.BUY ? base : quote;
  } else {
    return orderSide === OrderSide.BUY ? quote : base;
  }
};

export const getLightningCurrency = (base: string, quote: string, orderSide: OrderSide, isReverse: boolean) => {
  if (isReverse) {
    return orderSide === OrderSide.BUY ? quote : base;
  } else {
    return orderSide === OrderSide.BUY ? base : quote;
  }
};

/**
 * Gets the memo for the BIP21 payment request or the invoice of a swap
 *
 * @param receivingCurrency currency the user is receiving
 * @param isReverse whether the swap is a reverse one
 */
export const getSwapMemo = (receivingCurrency: string, isReverse: boolean): string => {
  return `${isReverse ? 'Reverse ' : ''}Swap to ${receivingCurrency}`;
};

export const formatError = (error: any) => {
  if (typeof error === 'string') {
    return error;
  } else if ('message' in error) {
    return error['message'];
  } else {
    return JSON.stringify(error);
  }
};

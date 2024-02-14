import bolt11, { RoutingInfo } from '@boltz/bolt11';
import { Transaction, crypto } from 'bitcoinjs-lib';
import { OutputType, Scripts } from 'boltz-core';
import { randomBytes } from 'crypto';
import { ContractTransactionResponse } from 'ethers';
import { Transaction as LiquidTransaction, confidential } from 'liquidjs-lib';
import os from 'os';
import path from 'path';
import packageJson from '../package.json';
import commitHash from './Version';
import ChainClient from './chain/ChainClient';
import { etherDecimals } from './consts/Consts';
import { OrderSide, SwapVersion } from './consts/Enums';

export const TAPROOT_NOT_SUPPORTED = 'taproot not supported';

const {
  p2shOutput,
  p2wshOutput,
  p2pkhOutput,
  p2wpkhOutput,
  p2shP2wshOutput,
  p2shP2wpkhOutput,
} = Scripts;

const idPossibilities =
  'ABCDEFGHIJKLMNPQRSTUVWXYZabcdefghkmnopqrstuvwxyz123456789';

/**
 * Generate an ID for a swap
 *
 * @param length how many characters the id should have
 */
export const generateId = (length = 6): string => {
  let id = '';

  for (let i = 0; i < length; i += 1) {
    id += idPossibilities.charAt(
      Math.floor(Math.random() * idPossibilities.length),
    );
  }

  return id;
};

export const generateSwapId = (version: SwapVersion): string =>
  generateId(version === SwapVersion.Legacy ? undefined : 12);

/**
 * Stringify any object or array
 */
export const stringify = (object: unknown): string => {
  return JSON.stringify(object, undefined, 2);
};

const sanitizeObject = (object: unknown): unknown => {
  if (typeof object !== 'object') {
    return;
  }

  const cpy = Object.assign({}, object);
  for (const [key, value] of Object.entries(cpy)) {
    switch (typeof value) {
      case 'object':
        cpy[key] = sanitizeObject(value);
        break;

      case 'string':
        if (value.length > 1000) {
          cpy[key] = undefined;
        }
        break;
    }
  }

  return cpy;
};

export const saneStringify = (object: unknown): string => {
  return stringify(sanitizeObject(object));
};

type MapKey = string | number | symbol;

type MapRecordType<T> =
  T extends Map<infer U, infer V>
    ? U extends MapKey
      ? Record<U, V extends Map<any, any> ? MapRecordType<V> : V>
      : never
    : T;

/**
 * Turn a map into an object
 */
const mapToObjectInternal = <T extends Map<MapKey, any>>(
  map: T,
  recursionLevel = 0,
): MapRecordType<T> => {
  if (recursionLevel > 10) {
    throw 'nested map recursion level too deep';
  }

  const object: any = {};

  map.forEach((value, index) => {
    object[index] =
      value instanceof Map
        ? mapToObjectInternal(value, recursionLevel + 1)
        : value;
  });

  return object;
};

export const mapToObject = <T extends Map<MapKey, any>>(map: T) =>
  mapToObjectInternal(map);

/**
 * Get the pair id of a pair
 */
export const getPairId = (pair: { base: string; quote: string }): string => {
  return `${pair.base}/${pair.quote}`;
};

/**
 * Get the quote and base asset of a pair id
 */
export const splitPairId = (
  pairId: string,
): {
  base: string;
  quote: string;
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
export const minutesToMilliseconds = (minutes: number): number => {
  return minutes * 60 * 1000;
};

const coalesceInvoiceAmount = (
  decoded: bolt11.PaymentRequestObject,
): number => {
  const decodedMsat = decoded.millisatoshis
    ? Math.ceil(Number(decoded.millisatoshis) / 1000)
    : undefined;

  return decoded.satoshis || decodedMsat || 0;
};

export const decodeInvoiceAmount = (invoice: string): number =>
  coalesceInvoiceAmount(bolt11.decode(invoice));

export const decodeInvoice = (
  invoice: string,
): bolt11.PaymentRequestObject & {
  satoshis: number;
  paymentHash: string | undefined;
  routingInfo: bolt11.RoutingInfo | undefined;
  minFinalCltvExpiry: number | undefined;
} => {
  const decoded = bolt11.decode(invoice);

  let paymentHash: string | undefined;
  let routingInfo: bolt11.RoutingInfo | undefined;
  let minFinalCltvExpiry: number | undefined;

  for (const tag of decoded.tags) {
    switch (tag.tagName) {
      case 'payment_hash':
        paymentHash = tag.data as string;
        break;
      case 'routing_info':
        routingInfo = tag.data as RoutingInfo;
        break;

      case 'min_final_cltv_expiry':
        minFinalCltvExpiry = tag.data as number;
        break;
    }
  }

  return {
    ...decoded,
    routingInfo,
    paymentHash,
    minFinalCltvExpiry,
    satoshis: coalesceInvoiceAmount(decoded),
  };
};

/**
 * Splits a derivation path into multiple parts
 */
export const splitDerivationPath = (
  path: string,
): { master: string; sub: number[] } => {
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
export const concatErrorCode = (prefix: number, code: number): string => {
  return `${prefix}.${code}`;
};

/**
 * Capitalize the first letter of a string
 */
export const capitalizeFirstLetter = (input: string): string => {
  return input.charAt(0).toUpperCase() + input.slice(1);
};

/**
 * Resolve '~' on Linux and Unix-Like systems
 */
export const resolveHome = (filename: string): string => {
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
export const getHexBuffer = (input: string): Buffer => {
  return Buffer.from(input, 'hex');
};

/**
 * Get a hex encoded string from a Buffer
 *
 * @returns a hex encoded string
 */
export const getHexString = (input: Buffer): string => {
  return input.toString('hex');
};

/**
 * Check whether a variable is a non-array object
 */
export const isObject = (val: unknown): boolean => {
  return val !== undefined && typeof val === 'object' && !Array.isArray(val);
};

/**
 * Get the current date
 */
export const getTsString = (date = new Date()): string => {
  const pad = (input: number, maxLength = 2) => {
    return input.toString().padStart(maxLength, '0');
  };

  return (
    `${pad(date.getUTCDate())}/${pad(
      date.getUTCMonth() + 1,
    )}/${date.getUTCFullYear()}` +
    ` ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(
      date.getUTCSeconds(),
    )}:` +
    `${pad(date.getUTCMilliseconds(), 3)}`
  );
};

/**
 * Recursively merge properties from different sources into a target object, overriding any
 * existing properties.
 *
 * @param target The destination object to merge into.
 * @param sources The sources objects to copy from.
 */
export const deepMerge = (
  target: Record<string, any>,
  ...sources: any[]
): unknown => {
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
 * Split a string into host and port
 *
 * @param listen string of format host:port
 */
export const splitListen = (listen: string): { host: string; port: string } => {
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
    case 'win32':
      return process.env.LOCALAPPDATA!;
    case 'darwin':
      return path.join(process.env.HOME!, 'Library', 'Application Support');
    default:
      return process.env.HOME!;
  }
};

/**
 * Get the data directory of a service
 */
export const getServiceDataDir = (service: string): string => {
  const homeDir = getSystemHomeDir();
  const serviceDir = service.toLowerCase();

  switch (os.platform()) {
    case 'win32':
    case 'darwin':
      return path.join(homeDir, capitalizeFirstLetter(serviceDir));

    default:
      return path.join(homeDir, `.${serviceDir}`);
  }
};

export const getOutputType = (type?: number): OutputType => {
  if (type === undefined) {
    return OutputType.Legacy;
  }

  switch (type) {
    case 0:
      return OutputType.Bech32;
    case 1:
      return OutputType.Compatibility;
    case 2:
      return OutputType.Legacy;

    default:
      throw Error('type does not exist');
  }
};

export const getPubkeyHashFunction = (
  outputType: OutputType,
):
  | ((hash: Buffer) => Buffer)
  | ((hash: Buffer) => {
      redeemScript: Buffer;
      outputScript: Buffer;
    }) => {
  switch (outputType) {
    case OutputType.Taproot:
      throw TAPROOT_NOT_SUPPORTED;

    case OutputType.Bech32:
      return p2wpkhOutput;

    case OutputType.Compatibility:
      return p2shP2wpkhOutput;

    case OutputType.Legacy:
      return p2pkhOutput;
  }
};

export const getScriptHashFunction = (
  outputType: OutputType,
): ((scriptHex: Buffer) => Buffer) => {
  switch (outputType) {
    case OutputType.Taproot:
      throw TAPROOT_NOT_SUPPORTED;

    case OutputType.Bech32:
      return p2wshOutput;

    case OutputType.Compatibility:
      return p2shP2wshOutput;

    case OutputType.Legacy:
      return p2shOutput;
  }
};

export const reverseBuffer = (input: Buffer): Buffer => {
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
export const transactionHashToId = (transactionHash: Buffer): string => {
  return getHexString(reverseBuffer(transactionHash));
};

/**
 * Detects whether the transactions signals RBF explicitly
 *
 * @param transaction the transactions to scan
 */
export const transactionSignalsRbfExplicitly = (
  transaction: Transaction | LiquidTransaction,
): boolean => {
  for (const input of transaction.ins) {
    if (input.sequence < 0xffffffff - 1) {
      return true;
    }
  }

  return false;
};

export const getSendingReceivingCurrency = (
  baseCurrency: string,
  quoteCurrency: string,
  orderSide: OrderSide,
): {
  sending: string;
  receiving: string;
} => {
  const isBuy = orderSide === OrderSide.BUY;

  return {
    sending: isBuy ? baseCurrency : quoteCurrency,
    receiving: isBuy ? quoteCurrency : baseCurrency,
  };
};

export const getRate = (
  rate: number,
  orderSide: OrderSide,
  isReverse: boolean,
): number => {
  if (isReverse) {
    return orderSide === OrderSide.BUY ? 1 / rate : rate;
  } else {
    return orderSide === OrderSide.BUY ? rate : 1 / rate;
  }
};

export const getChainCurrency = (
  base: string,
  quote: string,
  orderSide: OrderSide,
  isReverse: boolean,
): string => {
  if (isReverse) {
    return orderSide === OrderSide.BUY ? base : quote;
  } else {
    return orderSide === OrderSide.BUY ? quote : base;
  }
};

export const getLightningCurrency = (
  base: string,
  quote: string,
  orderSide: OrderSide,
  isReverse: boolean,
): string => {
  if (isReverse) {
    return orderSide === OrderSide.BUY ? quote : base;
  } else {
    return orderSide === OrderSide.BUY ? base : quote;
  }
};

/**
 * Gets the memo for the BIP21 payment request or the invoice of a swap
 *
 * @param sendingCurrency currency Boltz sends and the user is receiving
 * @param isReverse whether the swap is a reverse one
 */
export const getSwapMemo = (
  sendingCurrency: string,
  isReverse: boolean,
): string => {
  return `Send to ${sendingCurrency} ${isReverse ? 'address' : 'lightning'}`;
};

export const getPrepayMinerFeeInvoiceMemo = (
  sendingCurrency: string,
): string => {
  return `Miner fee for sending to ${sendingCurrency} address`;
};

export const formatError = (error: unknown): string => {
  if (typeof error === 'string') {
    return error;
  } else if ('message' in (error as any)) {
    return (error as any)['message'];
  } else {
    return JSON.stringify(error);
  }
};

export const getVersion = (): string => {
  return `${packageJson.version}${commitHash}`;
};

export const getUnixTime = (): number => {
  return Math.round(new Date().getTime() / 1000);
};

/**
 * Calculates the miner fee of a transaction on a UTXO based chain
 */
export const calculateUtxoTransactionFee = async (
  chainClient: ChainClient,
  transaction: Transaction,
): Promise<number> => {
  let fee = 0n;

  for (const input of transaction.ins) {
    const inputId = transactionHashToId(input.hash);
    const rawInputTransaction = await chainClient.getRawTransaction(inputId);
    const inputTransaction = Transaction.fromHex(rawInputTransaction);

    const spentOutput = inputTransaction.outs[input.index];

    fee += BigInt(spentOutput.value);
  }

  transaction.outs.forEach((output) => {
    fee -= BigInt(output.value);
  });

  return Number(fee);
};

export const calculateLiquidTransactionFee = (
  transaction: LiquidTransaction,
) => {
  return confidential.confidentialValueToSatoshi(
    (transaction as LiquidTransaction).outs.find(
      (out) => out.script.length === 0,
    )!.value,
  );
};

/**
 * Calculates the transaction fee of an Ethereum contract interaction and rounds it to 10 ** -8 decimals
 */
export const calculateEthereumTransactionFee = (
  transaction: ContractTransactionResponse,
): number => {
  return Number(
    (transaction.gasLimit! *
      (transaction.type === 2
        ? transaction.maxFeePerGas!
        : transaction.gasPrice!)) /
      etherDecimals,
  );
};

/**
 * Hashes an arbitrary UTF-8 string with SHA256
 *
 * @returns hex encoded hash
 */
export const hashString = (input: string): string => {
  return getHexString(crypto.sha256(Buffer.from(input, 'utf-8')));
};

export const createApiCredential = (): string => {
  return randomBytes(32).toString('hex');
};

export const splitChannelPoint = (channelPoint: string) => {
  const split = channelPoint.split(':');

  return {
    id: split[0],
    vout: Number(split[1]),
  };
};

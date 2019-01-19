import os from 'os';
import path from 'path';
import { OutputType, Scripts } from 'boltz-core';

const { p2wshOutput, p2shP2wshOutput, p2shOutput, p2wpkhOutput, p2pkhOutput, p2shP2wpkhOutput } = Scripts;

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
 * Get current time in unix time (milliseconds).
 */
export const ms = (): number => {
  return Date.now();
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

export const getOutputType = (type: number) => {
  switch (type) {
    case 0: return OutputType.Bech32;
    case 1: return OutputType.Compatibility;
    default: return OutputType.Legacy;
  }
};

export const getPubKeyHashEncodeFuntion = (outputType: OutputType) => {
  switch (outputType) {
    case OutputType.Bech32:
      return p2wpkhOutput;

    case OutputType.Compatibility:
      return p2shP2wpkhOutput;

    case OutputType.Legacy:
      return p2pkhOutput;
  }
};

export const getScriptHashEncodeFunction = (outputType: OutputType) => {
  switch (outputType) {
    case OutputType.Bech32:
      return p2wshOutput;

    case OutputType.Compatibility:
      return p2shP2wshOutput;

    case OutputType.Legacy:
      return p2shOutput;
  }
};

export const reverseString = (input: string) => {
  return input.split('').reverse().join('');
};

export const reverseBuffer = (input: Buffer) => {
  const buffer = Buffer.allocUnsafe(input.length);

  for (let i = 0, j = input.length - 1; i <= j; i += 1, j -= 1) {
    buffer[i] = input[j];
    buffer[j] = input[i];
  }

  return buffer;
};

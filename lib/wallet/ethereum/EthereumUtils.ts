import type { Overrides, Provider } from 'ethers';
import { getHexBuffer } from '../../Utils';

/**
 * Removes the 0x prefix of the Ethereum bytes
 */
export const parseBuffer = (input: string): Buffer => {
  return getHexBuffer(input.slice(2));
};

const nonceConflictMessages = [
  'nonce too low',
  'nonce has already been used',
  'already known',
  'replacement transaction underpriced',
];

const nonceConflictCodes = ['NONCE_EXPIRED', 'REPLACEMENT_UNDERPRICED'];

const collectErrorValues = (
  error: unknown,
  values: string[] = [],
  seen = new Set<unknown>(),
  depth = 0,
): string[] => {
  if (error === null || error === undefined || depth > 5) {
    return values;
  }

  if (typeof error === 'string') {
    values.push(error);

    try {
      collectErrorValues(JSON.parse(error), values, seen, depth + 1);
    } catch {
      // Not JSON; the string itself is enough for matching.
    }
    return values;
  }

  if (typeof error !== 'object' || seen.has(error)) {
    return values;
  }

  seen.add(error);
  const err = error as Error & { code?: unknown; shortMessage?: unknown };

  if (err.message !== undefined) {
    collectErrorValues(err.message, values, seen, depth + 1);
  }
  if (err.shortMessage !== undefined) {
    collectErrorValues(err.shortMessage, values, seen, depth + 1);
  }
  if (err.code !== undefined) {
    collectErrorValues(err.code, values, seen, depth + 1);
  }

  for (const value of Object.values(error)) {
    collectErrorValues(value, values, seen, depth + 1);
  }

  return values;
};

/**
 * Detects broadcast errors that may indicate the transaction is already
 * in the mempool or mined. Per the ethers docs, NONCE_EXPIRED means the
 * nonce is consumed - possibly by this same transaction - not that the
 * broadcast failed. Arbitrum's sequencer can also advance state between
 * sequencing our tx and the RPC response, producing "nonce too low" for
 * a tx that just landed.
 */
export const isNonceConflictError = (error: unknown): boolean => {
  const values = collectErrorValues(error);
  if (values.some((value) => nonceConflictCodes.includes(value))) {
    return true;
  }

  const haystack = values.join(' ').toLowerCase();
  return nonceConflictMessages.some((needle) => haystack.includes(needle));
};

export const bumpGasLimit = (gasLimit: bigint): bigint => {
  return (gasLimit * 125n + 99n) / 100n;
};

export const getGasPrices = async (provider: Provider): Promise<Overrides> => {
  const feeData = await provider.getFeeData();

  // Legacy pre EIP-1559 provider
  if (feeData.maxFeePerGas === null || feeData.maxFeePerGas === undefined) {
    return {
      type: 0,
      gasPrice: feeData.gasPrice,
    };
  }

  return {
    type: 2,
    maxFeePerGas: feeData.maxFeePerGas,
    maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
  };
};

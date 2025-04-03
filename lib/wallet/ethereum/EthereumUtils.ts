import type { Overrides, Provider } from 'ethers';
import { getHexBuffer } from '../../Utils';

/**
 * Removes the 0x prefix of the Ethereum bytes
 */
export const parseBuffer = (input: string): Buffer => {
  return getHexBuffer(input.slice(2));
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

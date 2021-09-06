import { Overrides, providers } from 'ethers';
import { getHexBuffer } from '../../Utils';

/**
 * Removes the 0x prefix of the Ethereum bytes
 */
export const parseBuffer = (input: string): Buffer => {
  return getHexBuffer(input.slice(2));
};

export const getGasPrices = async (provider: providers.Provider): Promise<Overrides> => {
  const feeData = await provider.getFeeData();

  return {
    type: 2,
    maxFeePerGas: feeData.maxFeePerGas!,
    maxPriorityFeePerGas: feeData.maxPriorityFeePerGas!,
  };
};

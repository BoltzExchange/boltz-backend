import { BigNumber } from 'ethers';
import { OutputType } from 'boltz-core';

export const ReverseSwapOutputType = OutputType.Bech32;

// Decimals from WEI to 10 ** -8
export const etherDecimals = BigNumber.from(10).pow(BigNumber.from(10));

// Decimals from GWEI to WEI
export const gweiDecimals = BigNumber.from(10).pow(BigNumber.from(9));

// This amount will be multiplied with the current gas price to determine
// how much Ether should be sent to the claim address as prepay miner fee
export const ethereumPrepayMinerFeeGasLimit = BigNumber.from(100000);


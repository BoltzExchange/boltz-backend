import { BigNumber } from 'ethers';
import { OutputType } from 'boltz-core';

export const ReverseSwapOutputType = OutputType.Bech32;

// Decimals from WEI to 10 ** -8
export const etherDecimals = BigNumber.from(10).pow(BigNumber.from(10));

// Decimals from GWEI to WEI
export const gweiDecimals = BigNumber.from(10).pow(BigNumber.from(9));

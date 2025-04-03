import { getUnixTime } from '../Utils';
import type { Currency } from '../wallet/WalletManager';
import Errors from './Errors';
import TimeoutDeltaProvider from './TimeoutDeltaProvider';

export const getCurrency = (
  currencies: Map<string, Currency>,
  symbol: string,
) => {
  const currency = currencies.get(symbol);
  if (!currency) {
    throw Errors.CURRENCY_NOT_FOUND(symbol);
  }

  return currency;
};

export const calculateTimeoutDate = (chain: string, blocksMissing: number) => {
  const blockTime = TimeoutDeltaProvider.blockTimes.get(chain);
  if (blockTime === undefined) {
    throw Errors.CURRENCY_NOT_FOUND(chain);
  }

  return getUnixTime() + blocksMissing * blockTime * 60;
};

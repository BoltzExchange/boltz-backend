import { getUnixTime } from '../Utils';
import { Currency } from '../wallet/WalletManager';
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
  return (
    getUnixTime() +
    blocksMissing * TimeoutDeltaProvider.blockTimes.get(chain)! * 60
  );
};

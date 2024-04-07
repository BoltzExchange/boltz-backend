import Errors from '../../../lib/service/Errors';
import { calculateTimeoutDate, getCurrency } from '../../../lib/service/Utils';

jest.mock('../../../lib/Utils', () => {
  return {
    getUnixTime: jest.fn().mockReturnValue(1),
    concatErrorCode: jest.fn().mockReturnValue(0),
  };
});

describe('Utils', () => {
  test('should get currency', () => {
    const symbol = 'BTC';
    const currency = { symbol: 'BTC' };

    const currencies = new Map<string, any>([[symbol, currency]]);

    expect(getCurrency(currencies, symbol)).toEqual(currency);
  });

  test('should throw when getting currency that is not set', () => {
    const symbol = 'BTC';

    expect(() => getCurrency(new Map(), symbol)).toThrow(
      Errors.CURRENCY_NOT_FOUND(symbol).message,
    );
  });

  test.each`
    chain      | blocksMissing | expected
    ${'BTC'}   | ${1}          | ${601}
    ${'BTC'}   | ${2}          | ${1_201}
    ${'L-BTC'} | ${2}          | ${121}
  `('should calculate timeout dates', ({ chain, blocksMissing, expected }) => {
    expect(calculateTimeoutDate(chain, blocksMissing)).toEqual(expected);
  });

  test('should throw when calculating timeout date for chain that has no block time set', () => {
    const symbol = 'notFound';
    expect(() => calculateTimeoutDate(symbol, 1)).toThrow(
      Errors.CURRENCY_NOT_FOUND(symbol).message,
    );
  });
});

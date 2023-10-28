import { getPairId } from '../../../lib/Utils';
import { PairConfig } from '../../../lib/consts/Types';
import InvoiceExpiryHelper from '../../../lib/service/InvoiceExpiryHelper';
import TimeoutDeltaProvider from '../../../lib/service/TimeoutDeltaProvider';

jest.mock('../../../lib/service/TimeoutDeltaProvider', () => {
  return jest.fn().mockImplementation(() => ({
    timeoutDeltas: new Map<string, any>([
      [
        'RBTC/BTC',
        {
          quote: {
            swapMaximal: 0,
            swapMinimal: 0,
            reverse: 144,
          },
        },
      ],
    ]),
  }));
});

const MockedTimeoutDeltaProvider = <jest.Mock<TimeoutDeltaProvider>>(
  (<any>TimeoutDeltaProvider)
);

(MockedTimeoutDeltaProvider as any).blockTimes = new Map<string, number>([
  ['BTC', 10],
]);

describe('InvoiceExpiryHelper', () => {
  const pairs = [
    {
      base: 'BTC',
      quote: 'BTC',
      invoiceExpiry: 123,
    },
    {
      base: 'LTC',
      quote: 'BTC',
      invoiceExpiry: 210,
    },
    {
      base: 'RBTC',
      quote: 'BTC',
    },
  ] as any as PairConfig[];

  const timeoutDeltaProvider = MockedTimeoutDeltaProvider();

  const helper = new InvoiceExpiryHelper(pairs, timeoutDeltaProvider);

  test.each`
    pair                   | expected
    ${getPairId(pairs[0])} | ${123}
    ${getPairId(pairs[1])} | ${210}
  `(
    'should get expiry of invoices with set invoiceExpiry',
    ({ pair, expected }) => {
      expect(helper.getExpiry(pair)).toEqual(expected);
    },
  );

  test('should use 50% of swap timeout for invoice expiry', () => {
    expect(helper.getExpiry(getPairId(pairs[2]))).toEqual((144 * 10 * 60) / 2);
  });

  test('should default when pair cannot be found', () => {
    expect(helper.getExpiry('DOGE')).toEqual(3600);
    expect(helper.getExpiry('DOGE/BTC')).toEqual(3600);
  });

  test.each`
    timestamp    | timeExpiryDate | expected
    ${120}       | ${360}         | ${360}
    ${400}       | ${360}         | ${360}
    ${400}       | ${1200}        | ${1200}
    ${120}       | ${undefined}   | ${3720}
    ${400}       | ${undefined}   | ${4000}
    ${undefined} | ${undefined}   | ${3600}
  `(
    'should calculate expiry of invoice (timestamp $timestamp, timeExpiryDate $timeExpiryDate)',
    ({ timestamp, timeExpiryDate, expected }) => {
      expect(
        InvoiceExpiryHelper.getInvoiceExpiry(timestamp, timeExpiryDate),
      ).toEqual(expected);
    },
  );
});

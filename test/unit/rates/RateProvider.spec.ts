import Logger from '../../../lib/Logger';
import { SwapVersion } from '../../../lib/consts/Enums';
import { PairConfig } from '../../../lib/consts/Types';
import Errors from '../../../lib/rates/Errors';
import RateProvider from '../../../lib/rates/RateProvider';
import WalletManager from '../../../lib/wallet/WalletManager';

jest.mock('../../../lib/rates/FeeProvider', () => {
  return jest.fn().mockImplementation(() => {
    return {
      updateMinerFees: jest.fn().mockImplementation(),
      getPercentageFees: jest.fn().mockImplementation((pairId) => {
        switch (pairId) {
          case 'BTC/BTC':
            return {
              percentage: 0.5,
              percentageSwapIn: 0.1,
            };

          default:
            return {
              percentage: 0.25,
              percentageSwapIn: 0.1,
            };
        }
      }),
    };
  });
});

jest.mock('../../../lib/rates/providers/RateProviderLegacy', () => {
  return jest.fn().mockImplementation(() => {
    return {
      setHardcodedPair: jest.fn(),
      updateHardcodedPair: jest.fn(),
    };
  });
});

jest.mock('../../../lib/rates/providers/RateProviderTaproot', () => {
  return jest.fn().mockImplementation(() => {
    return {
      setHardcodedPair: jest.fn(),
      updateHardcodedPair: jest.fn(),
    };
  });
});

describe('RateProvider', () => {
  const rateProvider = new RateProvider(
    Logger.disabledLogger,
    60,
    new Map<string, any>([
      [
        'BTC',
        {
          symbol: 'BTC',
          limits: {},
        },
      ],
      [
        'L-BTC',
        {
          symbol: 'L-BTC',
          limits: {
            maxZeroConfAmount: 100_000,
          },
        },
      ],
    ]),
    {} as WalletManager,
    jest.fn(),
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    rateProvider.disconnect();
  });

  test('should parse 0-conf limits', () => {
    expect(rateProvider['zeroConfAmounts'].get('BTC')).toEqual(0);
    expect(rateProvider['zeroConfAmounts'].get('L-BTC')).toEqual(100_000);
  });

  test.each`
    currency   | amount     | expected
    ${'BTC'}   | ${1}       | ${false}
    ${'L-BTC'} | ${99_999}  | ${true}
    ${'L-BTC'} | ${100_000} | ${true}
    ${'L-BTC'} | ${100_001} | ${false}
  `('should check if 0-conf is accepted', ({ currency, amount, expected }) => {
    expect(rateProvider.acceptZeroConf(currency, amount)).toEqual(expected);
  });

  test('should init', async () => {
    const pairs = [
      {
        base: 'BTC',
        quote: 'BTC',
        rate: 1,
        minSwapAmount: 10_000,
        maxSwapAmount: 250_000,
      },
      {
        base: 'L-BTC',
        quote: 'BTC',
        rate: 1,
        minSwapAmount: 1_000,
        maxSwapAmount: 100_000,
      },
    ];
    await rateProvider.init(pairs);

    for (const version of [SwapVersion.Taproot, SwapVersion.Legacy]) {
      expect(
        rateProvider.providers[version].setHardcodedPair,
      ).toHaveBeenCalledTimes(2);
      expect(
        rateProvider.providers[version].setHardcodedPair,
      ).toHaveBeenCalledWith(pairs[0]);
      expect(
        rateProvider.providers[version].setHardcodedPair,
      ).toHaveBeenCalledWith(pairs[1]);

      expect(
        rateProvider.providers[version].updateHardcodedPair,
      ).toHaveBeenCalledTimes(2);
      expect(
        rateProvider.providers[version].updateHardcodedPair,
      ).toHaveBeenCalledWith('BTC/BTC');
      expect(
        rateProvider.providers[version].updateHardcodedPair,
      ).toHaveBeenCalledWith('L-BTC/BTC');
    }

    expect(rateProvider['pairConfigs'].size).toEqual(2);
    expect(rateProvider['pairConfigs'].get('BTC/BTC')).toEqual(pairs[0]);
    expect(rateProvider['pairConfigs'].get('L-BTC/BTC')).toEqual(pairs[1]);

    expect(rateProvider['configPairs'].size).toEqual(2);
    expect(rateProvider['configPairs'].has('BTC/BTC')).toEqual(true);
    expect(rateProvider['configPairs'].has('L-BTC/BTC')).toEqual(true);
  });

  test('should not init when a pair does not have "maxSwapAmount"', async () => {
    await expect(
      rateProvider.init([
        {
          base: 'BTC',
          quote: 'BTC',
        },
      ] as PairConfig[]),
    ).rejects.toEqual(
      Errors.CONFIGURATION_INCOMPLETE('BTC/BTC', 'maxSwapAmount'),
    );
  });

  test('should not init when a pair does not have "minSwapAmount"', async () => {
    await expect(
      rateProvider.init([
        {
          base: 'BTC',
          quote: 'BTC',
          maxSwapAmount: 21,
        },
      ] as PairConfig[]),
    ).rejects.toEqual(
      Errors.CONFIGURATION_INCOMPLETE('BTC/BTC', 'minSwapAmount'),
    );
  });
});

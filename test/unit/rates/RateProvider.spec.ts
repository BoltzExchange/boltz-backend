import type { MinSwapSizeMultipliersConfig } from '../../../lib/Config';
import Logger from '../../../lib/Logger';
import { OrderSide, SwapType, SwapVersion } from '../../../lib/consts/Enums';
import type { PairConfig } from '../../../lib/consts/Types';
import type Swap from '../../../lib/db/models/Swap';
import Errors from '../../../lib/rates/Errors';
import RateProvider from '../../../lib/rates/RateProvider';
import type WalletManager from '../../../lib/wallet/WalletManager';

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
    undefined,
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

  describe('parseMinSwapSizeMultipliers', () => {
    test('should set defaults when min size multipliers are undefined', () => {
      expect(RateProvider['parseMinSwapSizeMultipliers'](undefined)).toEqual(
        RateProvider['minLimitMultipliersDefaults'],
      );
    });

    test('should fall back to defaults when a value is not set', () => {
      const values: Partial<MinSwapSizeMultipliersConfig> = {
        reverse: 3,
        submarine: 2,
      };
      expect(RateProvider['parseMinSwapSizeMultipliers'](values)).toEqual({
        [SwapType.Submarine]: values.submarine,
        [SwapType.ReverseSubmarine]: values.reverse,
        [SwapType.Chain]:
          RateProvider['minLimitMultipliersDefaults'][SwapType.Chain],
      });
    });
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

  describe('isBatchOnly', () => {
    rateProvider.providers[SwapVersion.Taproot].getSubmarinePairs = jest
      .fn()
      .mockReturnValue(
        new Map([
          ['L-BTC', new Map([['BTC', { limits: { minimal: 100_000 } }]])],
        ]),
      );

    test.each`
      pair           | orderSide         | type                         | version                | invoiceAmount | expected
      ${'L-BTC/BTC'} | ${OrderSide.SELL} | ${SwapType.Submarine}        | ${SwapVersion.Taproot} | ${21}         | ${true}
      ${'L-BTC/BTC'} | ${OrderSide.SELL} | ${SwapType.Submarine}        | ${SwapVersion.Taproot} | ${100_001}    | ${false}
      ${'L-BTC/BTC'} | ${OrderSide.BUY}  | ${SwapType.Submarine}        | ${SwapVersion.Taproot} | ${50}         | ${false}
      ${'BTC/L-BTC'} | ${OrderSide.SELL} | ${SwapType.Submarine}        | ${SwapVersion.Taproot} | ${75}         | ${false}
      ${'L-BTC/BTC'} | ${OrderSide.SELL} | ${SwapType.ReverseSubmarine} | ${SwapVersion.Taproot} | ${50}         | ${false}
      ${'L-BTC/BTC'} | ${OrderSide.SELL} | ${SwapType.Submarine}        | ${SwapVersion.Legacy}  | ${50}         | ${false}
    `(
      'should check if swap is batch only: $pair, $orderSide, $invoiceAmount',
      ({ pair, orderSide, type, version, invoiceAmount, expected }) => {
        expect(
          rateProvider.isBatchOnly({
            pair,
            orderSide,
            type,
            version,
            invoiceAmount,
          } as unknown as Swap),
        ).toEqual(expected);
      },
    );
  });

  test('should init', async () => {
    const pairs = [
      {
        base: 'BTC',
        quote: 'BTC',
        rate: 1,
        minSwapAmount: 10_000,
        maxSwapAmount: 250_000,
        swapTypes: ['submarine', 'Reverse'],
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
      ).toHaveBeenCalledWith(pairs[0], [
        SwapType.Submarine,
        SwapType.ReverseSubmarine,
      ]);
      expect(
        rateProvider.providers[version].setHardcodedPair,
      ).toHaveBeenCalledWith(pairs[1], [
        SwapType.Submarine,
        SwapType.ReverseSubmarine,
        SwapType.Chain,
      ]);

      expect(
        rateProvider.providers[version].updateHardcodedPair,
      ).toHaveBeenCalledTimes(2);
      expect(
        rateProvider.providers[version].updateHardcodedPair,
      ).toHaveBeenCalledWith('BTC/BTC', [
        SwapType.Submarine,
        SwapType.ReverseSubmarine,
      ]);
      expect(
        rateProvider.providers[version].updateHardcodedPair,
      ).toHaveBeenCalledWith('L-BTC/BTC', [
        SwapType.Submarine,
        SwapType.ReverseSubmarine,
        SwapType.Chain,
      ]);
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

  test('should update 0-conf amounts', async () => {
    expect(rateProvider['zeroConfAmounts'].get('L-BTC')).not.toEqual(0);

    await rateProvider.setZeroConfAmount('L-BTC', 0);
    expect(rateProvider['zeroConfAmounts'].get('L-BTC')).toEqual(0);

    expect(
      rateProvider['providers'][SwapVersion.Taproot].updateHardcodedPair,
    ).toHaveBeenCalledTimes(2);
    expect(
      rateProvider['providers'][SwapVersion.Legacy].updateHardcodedPair,
    ).toHaveBeenCalledTimes(2);
  });
});

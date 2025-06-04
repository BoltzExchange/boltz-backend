import Logger from '../../../lib/Logger';
import {
  BaseFeeType,
  OrderSide,
  PercentageFeeType,
  SwapType,
  SwapVersion,
} from '../../../lib/consts/Enums';
import type Referral from '../../../lib/db/models/Referral';
import FeeProvider from '../../../lib/rates/FeeProvider';
import DataAggregator from '../../../lib/rates/data/DataAggregator';
import type { ExtraFees } from '../../../lib/service/Service';
import WalletManager from '../../../lib/wallet/WalletManager';
import { Ethereum } from '../../../lib/wallet/ethereum/EvmNetworks';

const btcFee = 36;
const ltcFee = 3;
const ethFee = 11;
const lbtcFee = 0.12;

const getFeeEstimation = async () => {
  return new Map([
    ['BTC', btcFee],
    ['LTC', ltcFee],
    ['ETH', ethFee],
    ['L-BTC', lbtcFee],
  ]);
};

jest.mock('../../../lib/rates/data/DataAggregator', () => {
  return jest.fn().mockImplementation(() => ({
    latestRates: new Map<string, number>([['ETH/USDT', 2]]),
  }));
});

const MockedDataAggregator = <jest.Mock<DataAggregator>>DataAggregator;

jest.mock('../../../lib/wallet/WalletManager', () => {
  return jest.fn().mockImplementation(() => ({
    ethereumManagers: [
      {
        networkDetails: Ethereum,
        hasSymbol: jest.fn().mockReturnValue(true),
      },
    ],
  }));
});

const MockedWalletManager = <jest.Mock<WalletManager>>(<any>WalletManager);

describe('FeeProvider', () => {
  const walletManager = MockedWalletManager();
  const feeProvider = new FeeProvider(
    Logger.disabledLogger,
    walletManager,
    MockedDataAggregator(),
    getFeeEstimation,
  );

  test.each`
    fee      | premium      | expected
    ${0.1}   | ${null}      | ${0.1}
    ${0.1}   | ${undefined} | ${0.1}
    ${0.1}   | ${10}        | ${0.2}
    ${0.2}   | ${-25}       | ${-0.05}
    ${0.101} | ${10}        | ${0.2}
  `('should add premium', ({ fee, premium, expected }) => {
    expect(FeeProvider.addPremium(fee, premium)).toEqual(expected);
  });

  describe('calculateTotalPercentageFeeCalculation', () => {
    test.each`
      percentageCalculation | extraFeePercentage | expected
      ${0}                  | ${0}               | ${0}
      ${0}                  | ${0.01}            | ${0.0001}
      ${0}                  | ${1}               | ${0.01}
      ${0.0001}             | ${0}               | ${0.0001}
      ${0.0001}             | ${1}               | ${0.0101}
      ${0.0001}             | ${99}              | ${0.9901}
      ${0.9999}             | ${1}               | ${1.0099}
      ${0.9999}             | ${99}              | ${1.9899}
      ${0.0001}             | ${0.01}            | ${0.0002}
      ${0.0001}             | ${0.02}            | ${0.0003}
      ${0.0002}             | ${0.01}            | ${0.0003}
      ${0.0001}             | ${0.09}            | ${0.001}
      ${0.0009}             | ${0.01}            | ${0.001}
      ${0.1234}             | ${0.01}            | ${0.1235}
      ${0.1234}             | ${0.02}            | ${0.1236}
      ${0.1234}             | ${0.09}            | ${0.1243}
      ${0.1234}             | ${1}               | ${0.1334}
    `(
      'should calculate total percentage fee in calculation format',
      ({ percentageCalculation, extraFeePercentage, expected }) => {
        expect(
          FeeProvider.calculateTotalPercentageFeeCalculation(
            percentageCalculation,
            extraFeePercentage,
          ),
        ).toEqual(expected);
      },
    );

    test('should throw on negative extra fee percentage', () => {
      expect(() => {
        FeeProvider.calculateTotalPercentageFeeCalculation(0.01, -1);
      }).toThrow('invalid extra fees percentage: -1');
    });
  });

  test('should init', () => {
    feeProvider.init([
      {
        base: 'LTC',
        quote: 'BTC',
        fee: 2,
        swapInFee: -1,
        minSwapAmount: 1,
        maxSwapAmount: 2,
      },
      {
        base: 'BTC',
        quote: 'BTC',
        fee: 0,
        swapInFee: -1,
        chainSwap: {
          buyFee: 1,
          sellFee: 2,
        },
        minSwapAmount: 1,
        maxSwapAmount: 2,
      },
      {
        base: 'LTC',
        quote: 'LTC',

        // The FeeProvider should set this to 1
        fee: undefined,
        swapInFee: undefined,

        minSwapAmount: 1,
        maxSwapAmount: 2,
      },
    ]);

    const feeMap = feeProvider['percentageFees'];
    expect(feeMap.size).toEqual(3);
  });

  test('should get percentage fees of a pair', () => {
    expect(feeProvider['percentageFees'].get('LTC/BTC')).toEqual({
      [SwapType.Submarine]: -1,
      [SwapType.ReverseSubmarine]: 2,
      [SwapType.Chain]: {
        [OrderSide.BUY]: 2,
        [OrderSide.SELL]: 2,
      },
    });
    expect(feeProvider['percentageFees'].get('BTC/BTC')).toEqual({
      [SwapType.Submarine]: -1,
      [SwapType.ReverseSubmarine]: 0,
      [SwapType.Chain]: {
        [OrderSide.BUY]: 1,
        [OrderSide.SELL]: 2,
      },
    });
    expect(feeProvider['percentageFees'].get('LTC/LTC')).toEqual({
      [SwapType.Submarine]: 1,
      [SwapType.ReverseSubmarine]: 1,
      [SwapType.Chain]: {
        [OrderSide.BUY]: 1,
        [OrderSide.SELL]: 1,
      },
    });
  });

  describe('getPercentageFee', () => {
    test('should get percentage fees of normal swaps', () => {
      expect(
        feeProvider.getPercentageFee(
          'LTC/BTC',
          OrderSide.BUY,
          SwapType.Submarine,
          PercentageFeeType.Calculation,
          null,
        ),
      ).toEqual(-0.01);
      expect(
        feeProvider.getPercentageFee(
          'LTC/BTC',
          OrderSide.BUY,
          SwapType.Submarine,
          PercentageFeeType.Display,
          null,
        ),
      ).toEqual(-1);

      expect(
        feeProvider.getPercentageFee(
          'BTC/BTC',
          OrderSide.BUY,
          SwapType.Submarine,
          PercentageFeeType.Calculation,
          null,
        ),
      ).toEqual(-0.01);

      // Should set undefined fees to 1%
      expect(
        feeProvider.getPercentageFee(
          'LTC/LTC',
          OrderSide.BUY,
          SwapType.Submarine,
          PercentageFeeType.Calculation,
          null,
        ),
      ).toEqual(0.01);
    });

    test('should get percentage fees of reverse swaps', () => {
      expect(
        feeProvider.getPercentageFee(
          'LTC/BTC',
          OrderSide.BUY,
          SwapType.ReverseSubmarine,
          PercentageFeeType.Calculation,
          null,
        ),
      ).toEqual(0.02);
      expect(
        feeProvider.getPercentageFee(
          'LTC/BTC',
          OrderSide.BUY,
          SwapType.ReverseSubmarine,
          PercentageFeeType.Display,
          null,
        ),
      ).toEqual(2);

      expect(
        feeProvider.getPercentageFee(
          'BTC/BTC',
          OrderSide.BUY,
          SwapType.ReverseSubmarine,
          PercentageFeeType.Calculation,
          null,
        ),
      ).toEqual(0);

      // Should set undefined fees to 1%
      expect(
        feeProvider.getPercentageFee(
          'LTC/LTC',
          OrderSide.BUY,
          SwapType.ReverseSubmarine,
          PercentageFeeType.Calculation,
          null,
        ),
      ).toEqual(0.01);
    });

    test('should get percentage fees of chain swaps', () => {
      expect(
        feeProvider.getPercentageFee(
          'LTC/BTC',
          OrderSide.BUY,
          SwapType.Chain,
          PercentageFeeType.Calculation,
          null,
        ),
      ).toEqual(0.02);

      expect(
        feeProvider.getPercentageFee(
          'BTC/BTC',
          OrderSide.BUY,
          SwapType.Chain,
          PercentageFeeType.Calculation,
          null,
        ),
      ).toEqual(0.01);
      expect(
        feeProvider.getPercentageFee(
          'BTC/BTC',
          OrderSide.SELL,
          SwapType.Chain,
          PercentageFeeType.Calculation,
          null,
        ),
      ).toEqual(0.02);
      expect(
        feeProvider.getPercentageFee(
          'BTC/BTC',
          OrderSide.SELL,
          SwapType.Chain,
          PercentageFeeType.Display,
          null,
        ),
      ).toEqual(2);

      // Should set undefined fees to 1%
      expect(
        feeProvider.getPercentageFee(
          'LTC/LTC',
          OrderSide.BUY,
          SwapType.Chain,
          PercentageFeeType.Calculation,
          null,
        ),
      ).toEqual(0.01);
    });

    test('should get percentage fees with premium', () => {
      const referral = {
        premium: jest.fn().mockReturnValue(20),
      } as unknown as Referral;

      expect(
        feeProvider.getPercentageFee(
          'BTC/BTC',
          OrderSide.BUY,
          SwapType.Chain,
          PercentageFeeType.Calculation,
          referral,
        ),
      ).toEqual(0.012);

      expect(
        feeProvider.getPercentageFee(
          'BTC/BTC',
          OrderSide.BUY,
          SwapType.Chain,
          PercentageFeeType.Display,
          referral,
        ),
      ).toEqual(1.2);
    });

    test('should apply directional premiums for chain swaps', () => {
      const referral = {
        premium: jest.fn().mockImplementation((_pair, _type, orderSide) => {
          if (orderSide === OrderSide.BUY) return -50;
          return 50;
        }),
      } as unknown as Referral;

      expect(
        feeProvider.getPercentageFee(
          'BTC/BTC',
          OrderSide.BUY,
          SwapType.Chain,
          PercentageFeeType.Calculation,
          referral,
        ),
      ).toEqual(0.005);

      expect(
        feeProvider.getPercentageFee(
          'BTC/BTC',
          OrderSide.SELL,
          SwapType.Chain,
          PercentageFeeType.Calculation,
          referral,
        ),
      ).toEqual(0.025);

      expect(referral.premium).toHaveBeenCalledWith(
        'BTC/BTC',
        SwapType.Chain,
        OrderSide.BUY,
      );
      expect(referral.premium).toHaveBeenCalledWith(
        'BTC/BTC',
        SwapType.Chain,
        OrderSide.SELL,
      );
    });
  });

  test('should update miner fees', async () => {
    expect(feeProvider.minerFees.size).toEqual(0);

    await feeProvider.updateMinerFees('BTC');
    await feeProvider.updateMinerFees('LTC');
    await feeProvider.updateMinerFees('ETH');
    await feeProvider.updateMinerFees('USDT');

    expect(feeProvider.minerFees.size).toEqual(4);
  });

  test('should calculate miner fees', () => {
    expect(feeProvider.minerFees.get('BTC')).toEqual({
      [SwapVersion.Taproot]: {
        normal: 5436,
        reverse: {
          claim: 3996,
          lockup: 5544,
        },
      },
      [SwapVersion.Legacy]: {
        normal: 6120,
        reverse: {
          claim: 4968,
          lockup: 5508,
        },
      },
    });

    expect(feeProvider.minerFees.get('LTC')).toEqual({
      [SwapVersion.Taproot]: {
        normal: 453,
        reverse: {
          claim: 333,
          lockup: 462,
        },
      },
      [SwapVersion.Legacy]: {
        normal: 510,
        reverse: {
          claim: 414,
          lockup: 459,
        },
      },
    });

    expect(feeProvider.minerFees.get('ETH')).toEqual({
      [SwapVersion.Taproot]: {
        normal: 13708,
        reverse: {
          claim: 27416,
          lockup: 51106,
        },
      },
      [SwapVersion.Legacy]: {
        normal: 13708,
        reverse: {
          claim: 27416,
          lockup: 51106,
        },
      },
    });

    expect(feeProvider.minerFees.get('USDT')).toEqual({
      [SwapVersion.Taproot]: {
        normal: 26974,
        reverse: {
          claim: 53948,
          lockup: 191356,
        },
      },
      [SwapVersion.Legacy]: {
        normal: 26974,
        reverse: {
          claim: 53948,
          lockup: 191356,
        },
      },
    });
  });

  describe('getFees', () => {
    test('should get fees of a Swap', () => {
      const amount = 100000000;

      expect(
        feeProvider.getFees(
          'LTC/BTC',
          SwapVersion.Legacy,
          2,
          OrderSide.BUY,
          amount,
          SwapType.Submarine,
          BaseFeeType.NormalClaim,
          null,
          undefined,
        ),
      ).toEqual({
        baseFee: 6120,
        percentageFee: -2000000,
      });

      expect(
        feeProvider.getFees(
          'LTC/BTC',
          SwapVersion.Taproot,
          2,
          OrderSide.BUY,
          amount,
          SwapType.Submarine,
          BaseFeeType.NormalClaim,
          null,
          undefined,
        ),
      ).toEqual({
        baseFee: 5436,
        percentageFee: -2000000,
      });

      expect(
        feeProvider.getFees(
          'LTC/BTC',
          SwapVersion.Legacy,
          2,
          OrderSide.BUY,
          amount,
          SwapType.ReverseSubmarine,
          BaseFeeType.ReverseLockup,
          null,
          undefined,
        ),
      ).toEqual({
        baseFee: 459,
        percentageFee: 4000000,
      });

      expect(
        feeProvider.getFees(
          'LTC/BTC',
          SwapVersion.Taproot,
          2,
          OrderSide.BUY,
          amount,
          SwapType.ReverseSubmarine,
          BaseFeeType.ReverseLockup,
          null,
          undefined,
        ),
      ).toEqual({
        baseFee: 462,
        percentageFee: 4000000,
      });

      const referral = {
        premium: jest.fn().mockReturnValue(20),
      } as unknown as Referral;

      expect(
        feeProvider.getFees(
          'LTC/BTC',
          SwapVersion.Taproot,
          2,
          OrderSide.BUY,
          amount,
          SwapType.ReverseSubmarine,
          BaseFeeType.ReverseLockup,
          referral,
          undefined,
        ),
      ).toEqual({
        baseFee: 462,
        percentageFee: 4400000,
      });
    });

    test('should get fees with extra fees', () => {
      const amount = 100_000;

      expect(
        feeProvider.getFees(
          'LTC/BTC',
          SwapVersion.Taproot,
          2,
          OrderSide.BUY,
          amount,
          SwapType.ReverseSubmarine,
          BaseFeeType.ReverseLockup,
          null,
          {
            percentage: 1,
          } as ExtraFees,
        ),
      ).toEqual({
        baseFee: 462,
        extraFee: 2_000,
        percentageFee: 4_000,
      });

      expect(
        feeProvider.getFees(
          'LTC/BTC',
          SwapVersion.Taproot,
          2,
          OrderSide.BUY,
          amount,
          SwapType.ReverseSubmarine,
          BaseFeeType.ReverseLockup,
          null,
          {
            percentage: 0.01,
          } as ExtraFees,
        ),
      ).toEqual({
        baseFee: 462,
        extraFee: 20,
        percentageFee: 4_000,
      });
    });
  });

  test.each`
    symbol   | version                | type                         | expected
    ${'BTC'} | ${SwapVersion.Legacy}  | ${BaseFeeType.NormalClaim}   | ${6120}
    ${'BTC'} | ${SwapVersion.Taproot} | ${BaseFeeType.NormalClaim}   | ${5436}
    ${'BTC'} | ${SwapVersion.Legacy}  | ${BaseFeeType.ReverseClaim}  | ${4968}
    ${'BTC'} | ${SwapVersion.Taproot} | ${BaseFeeType.ReverseClaim}  | ${3996}
    ${'BTC'} | ${SwapVersion.Legacy}  | ${BaseFeeType.ReverseLockup} | ${5508}
    ${'BTC'} | ${SwapVersion.Taproot} | ${BaseFeeType.ReverseLockup} | ${5544}
    ${'LTC'} | ${SwapVersion.Legacy}  | ${BaseFeeType.NormalClaim}   | ${510}
  `(
    'should get base fees (symbol: $symbol, version: $version, type: $type)',
    ({ symbol, version, type, expected }) => {
      expect(feeProvider.getBaseFee(symbol, version, type)).toEqual(expected);
    },
  );

  test.each`
    pair         | orderSide         | type                  | version                | expected
    ${'BTC/BTC'} | ${OrderSide.BUY}  | ${SwapType.Submarine} | ${SwapVersion.Legacy}  | ${6120}
    ${'BTC/BTC'} | ${OrderSide.BUY}  | ${SwapType.Submarine} | ${SwapVersion.Taproot} | ${5436}
    ${'LTC/BTC'} | ${OrderSide.BUY}  | ${SwapType.Submarine} | ${SwapVersion.Taproot} | ${5436}
    ${'LTC/BTC'} | ${OrderSide.SELL} | ${SwapType.Submarine} | ${SwapVersion.Taproot} | ${453}
    ${'BTC/BTC'} | ${OrderSide.BUY} | ${SwapType.ReverseSubmarine} | ${SwapVersion.Legacy} | ${{
  claim: 4968,
  lockup: 5508,
}}
    ${'BTC/BTC'} | ${OrderSide.BUY} | ${SwapType.ReverseSubmarine} | ${SwapVersion.Taproot} | ${{
  claim: 3996,
  lockup: 5544,
}}
    ${'LTC/BTC'} | ${OrderSide.BUY} | ${SwapType.Chain} | ${SwapVersion.Taproot} | ${{
  server: 5898,
  user: { claim: 333, lockup: 5544 },
}}
    ${'LTC/BTC'} | ${OrderSide.SELL} | ${SwapType.Chain} | ${SwapVersion.Taproot} | ${{
  server: 5997,
  user: { claim: 3996, lockup: 462 },
}}
  `(
    'should get swap base fees',
    ({ pair, orderSide, type, version, expected }) => {
      expect(
        feeProvider.getSwapBaseFees(pair, orderSide, type, version),
      ).toEqual(expected);
    },
  );

  test.each`
    gasPrice    | gasUsage   | expected
    ${0.065164} | ${100_000} | ${651}
    ${0.06}     | ${100_000} | ${600}
    ${0.042}    | ${100_000} | ${420}
    ${0.042}    | ${50_000}  | ${210}
    ${0.006}    | ${100_000} | ${60}
    ${0.0006}   | ${100_000} | ${6}
    ${0.0001}   | ${100_000} | ${1}
  `(
    'should calculate gas cost for gas price $gasPrice',
    ({ gasPrice, gasUsage, expected }) => {
      expect(FeeProvider['calculateEtherGasCost'](gasPrice, gasUsage)).toEqual(
        expected,
      );
    },
  );
});

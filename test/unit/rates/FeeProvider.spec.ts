import Logger from '../../../lib/Logger';
import {
  BaseFeeType,
  OrderSide,
  SwapType,
  SwapVersion,
} from '../../../lib/consts/Enums';
import FeeProvider from '../../../lib/rates/FeeProvider';
import DataAggregator from '../../../lib/rates/data/DataAggregator';
import WalletManager from '../../../lib/wallet/WalletManager';
import { Ethereum } from '../../../lib/wallet/ethereum/EvmNetworks';

const btcFee = 36;
const ltcFee = 3;
const ethFee = 11;

const getFeeEstimation = async () => {
  return new Map([
    ['BTC', btcFee],
    ['LTC', ltcFee],
    ['ETH', ethFee],
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

const MockedWalletManager = <jest.Mock<WalletManager>>WalletManager;

describe('FeeProvider', () => {
  const feeProvider = new FeeProvider(
    Logger.disabledLogger,
    MockedWalletManager(),
    MockedDataAggregator(),
    getFeeEstimation,
  );

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
        chainSwapFee: 3,
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
    expect(feeProvider.getPercentageFees('LTC/BTC')).toEqual({
      [SwapType.Chain]: 2,
      [SwapType.Submarine]: -1,
      [SwapType.ReverseSubmarine]: 2,
    });
    expect(feeProvider.getPercentageFees('BTC/BTC')).toEqual({
      [SwapType.Chain]: 3,
      [SwapType.Submarine]: -1,
      [SwapType.ReverseSubmarine]: 0,
    });
    expect(feeProvider.getPercentageFees('LTC/LTC')).toEqual({
      [SwapType.Chain]: 1,
      [SwapType.Submarine]: 1,
      [SwapType.ReverseSubmarine]: 1,
    });
  });

  test('should get percentage fees of normal swaps', () => {
    expect(feeProvider.getPercentageFee('LTC/BTC', SwapType.Submarine)).toEqual(
      -0.01,
    );
    expect(feeProvider.getPercentageFee('BTC/BTC', SwapType.Submarine)).toEqual(
      -0.01,
    );

    // Should set undefined fees to 1%
    expect(feeProvider.getPercentageFee('LTC/LTC', SwapType.Submarine)).toEqual(
      0.01,
    );
  });

  test('should get percentage fees of reverse swaps', () => {
    expect(
      feeProvider.getPercentageFee('LTC/BTC', SwapType.ReverseSubmarine),
    ).toEqual(0.02);
    expect(
      feeProvider.getPercentageFee('BTC/BTC', SwapType.ReverseSubmarine),
    ).toEqual(0);

    // Should set undefined fees to 1%
    expect(
      feeProvider.getPercentageFee('LTC/LTC', SwapType.ReverseSubmarine),
    ).toEqual(0.01);
  });

  test('should get percentage fees of chain swaps', () => {
    expect(feeProvider.getPercentageFee('LTC/BTC', SwapType.Chain)).toEqual(
      0.02,
    );
    expect(feeProvider.getPercentageFee('BTC/BTC', SwapType.Chain)).toEqual(
      0.03,
    );

    // Should set undefined fees to 1%
    expect(feeProvider.getPercentageFee('LTC/LTC', SwapType.Chain)).toEqual(
      0.01,
    );
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
        normal: 27416,
        reverse: {
          claim: 27416,
          lockup: 51106,
        },
      },
      [SwapVersion.Legacy]: {
        normal: 27416,
        reverse: {
          claim: 27416,
          lockup: 51106,
        },
      },
    });

    expect(feeProvider.minerFees.get('USDT')).toEqual({
      [SwapVersion.Taproot]: {
        normal: 53948,
        reverse: {
          claim: 53948,
          lockup: 191356,
        },
      },
      [SwapVersion.Legacy]: {
        normal: 53948,
        reverse: {
          claim: 53948,
          lockup: 191356,
        },
      },
    });
  });

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
      ),
    ).toEqual({
      baseFee: 462,
      percentageFee: 4000000,
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
    pair         | orderSide         | type                         | version                | expected
    ${'BTC/BTC'} | ${OrderSide.BUY}  | ${SwapType.Submarine}        | ${SwapVersion.Legacy}  | ${6120}
    ${'BTC/BTC'} | ${OrderSide.BUY}  | ${SwapType.Submarine}        | ${SwapVersion.Taproot} | ${5436}
    ${'LTC/BTC'} | ${OrderSide.BUY}  | ${SwapType.Submarine}        | ${SwapVersion.Taproot} | ${5436}
    ${'LTC/BTC'} | ${OrderSide.SELL} | ${SwapType.Submarine}        | ${SwapVersion.Taproot} | ${453}
    ${'BTC/BTC'} | ${OrderSide.BUY}  | ${SwapType.ReverseSubmarine} | ${SwapVersion.Legacy}  | ${{ claim: 4968, lockup: 5508 }}
    ${'BTC/BTC'} | ${OrderSide.BUY}  | ${SwapType.ReverseSubmarine} | ${SwapVersion.Taproot} | ${{ claim: 3996, lockup: 5544 }}
    ${'LTC/BTC'} | ${OrderSide.BUY}  | ${SwapType.Chain}            | ${SwapVersion.Taproot} | ${{ server: 4458, user: { claim: 333, lockup: 5544 } }}
    ${'LTC/BTC'} | ${OrderSide.SELL} | ${SwapType.Chain}            | ${SwapVersion.Taproot} | ${{ server: 5877, user: { claim: 3996, lockup: 462 } }}
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

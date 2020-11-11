import { createSwap } from './Utils';
import Stats from '../../../lib/data/Stats';
import Swap from '../../../lib/db/models/Swap';
import { stringify } from '../../../lib/Utils';
import { OrderSide } from '../../../lib/consts/Enums';
import SwapRepository from '../../../lib/db/SwapRepository';
import ReverseSwap from '../../../lib/db/models/ReverseSwap';
import ReverseSwapRepository from '../../../lib/db/ReverseSwapRepository';

const swaps: Swap[] = [];

jest.mock('../../../lib/db/SwapRepository', () => {
  return jest.fn().mockImplementation(() => {
    return {
      getSwaps: () => Promise.resolve(swaps),
    };
  });
});

const mockedSwapRepository = <jest.Mock<SwapRepository>><any>SwapRepository;

const reverseSwaps: ReverseSwap[] = [];

jest.mock('../../../lib/db/ReverseSwapRepository', () => {
  return jest.fn().mockImplementation(() => {
    return {
      getReverseSwaps: () => Promise.resolve(reverseSwaps),
    };
  });
});

const mockedReverseSwapRepository = <jest.Mock<ReverseSwapRepository>><any>ReverseSwapRepository;

describe('Stats', () => {
  const quoteSymbol = 'BTC';

  const onchainAmount = 54321;
  const lightningAmount = 12345;

  // tslint:disable-next-line: max-line-length
  const invoice = 'lnbcrt123450n1pw0tzpcpp5tfsw3wjufkwfvw7anfpg4lkjdgvalzhygzcgj5d34zfhrt3q8tuqdqqcqzpgncs58qgtpx06ztdd7v34mjpj8k5qfxguhk85qgnhkuhr9axkrs93zmtxwmpmqhdltlcfhegss55mpq29q3ev8dlzw2gepcfenhp2yqcpdpv6eh';

  const stats = new Stats(
    mockedSwapRepository(),
    mockedReverseSwapRepository(),
  );

  beforeAll(() => {
    for (let i = 0; i < 2; i += 1) {
      const swapMock = createSwap<Swap>(true, i === 1, { invoice, onchainAmount });
      const reverseSwapMock = createSwap<ReverseSwap>(false, i === 1, { invoice, onchainAmount });

      swaps.push(swapMock);
      reverseSwaps.push(reverseSwapMock);
    }
  });

  test('should generate statistics', async () => {
    expect(await stats.generate()).toEqual(stringify({
      10: {
        failureRates: {
          swaps: 0.5,
          reverseSwaps: 0.5,
        },
        volume: {
          [quoteSymbol]: 0.00133332,
        },
        trades: {
          'LTC/BTC': swaps.length + reverseSwaps.length,
        },
      },
    }));
  });

  test('should format volume map', () => {
    /*const volume = 123456789;

    stats['volumeMap'] = new Map<string, number>([
      [quoteSymbol, volume],
    ]);

    expect(
      stats['formatVolumeMap'](),
    ).toEqual({
      [quoteSymbol]: volume / 100000000,
    });

    stats['volumeMap'].clear();*/
  });

  test('should get the quote amount of a swap', () => {
    const getSwapAmount = stats['getSwapAmount'];

    expect(getSwapAmount(false, OrderSide.BUY, onchainAmount, invoice)).toEqual(onchainAmount);
    expect(getSwapAmount(false, OrderSide.SELL, onchainAmount, invoice)).toEqual(lightningAmount);

    expect(getSwapAmount(true, OrderSide.BUY, onchainAmount, invoice)).toEqual(lightningAmount);
    expect(getSwapAmount(true, OrderSide.SELL, onchainAmount, invoice)).toEqual(onchainAmount);
  });
});

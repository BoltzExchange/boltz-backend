import Swap from '../db/models/Swap';
import { OrderSide } from '../consts/Enums';
import Report, { SwapArrays } from './Report';
import SwapRepository from '../db/SwapRepository';
import ReverseSwap from '../db/models/ReverseSwap';
import { satoshisToCoins } from '../DenominationConverter';
import ReverseSwapRepository from '../db/ReverseSwapRepository';
import { splitPairId, decodeInvoice, stringify, mapToObject } from '../Utils';

type MonthStats = {
  volume: Record<string, number>;
  trades: Record<string, number>;
  failureRates: {
    swaps: number;
    reverseSwaps: number;
  };
};

class Stats {
  constructor(
    private swapRepository: SwapRepository,
    private reverseSwapRepository: ReverseSwapRepository,
  ) {}

  public generate = async (): Promise<string> => {
    const {
      swaps,
      reverseSwaps,
    } = await Report.getSuccessfulSwaps(this.swapRepository, this.reverseSwapRepository);

    const {
      swaps: failedSwaps,
      reverseSwaps: failedReverseSwaps,
    } = await Report.getFailedSwaps(this.swapRepository, this.reverseSwapRepository);

    const swapsPerMonth = new Map<number, {
      successfulSwaps: SwapArrays,
      failedSwaps: SwapArrays,
    }>();

    const addSwapToMonth = (swap: Swap | ReverseSwap, isSuccessful: boolean, isReverse: boolean) => {
      let monthArrays = swapsPerMonth.get(swap.createdAt.getMonth());

      if (!monthArrays) {
        monthArrays = {
          successfulSwaps: {
            swaps: [],
            reverseSwaps: [],
          },
          failedSwaps: {
            swaps: [],
            reverseSwaps: [],
          },
        };

        swapsPerMonth.set(swap.createdAt.getMonth(), monthArrays);
      }

      const arrays = isSuccessful ? monthArrays.successfulSwaps : monthArrays.failedSwaps;

      isReverse ? arrays.reverseSwaps.push(swap as ReverseSwap) : arrays.swaps.push(swap);
    };

    swaps.forEach((swap) => addSwapToMonth(swap, true, false));
    reverseSwaps.forEach((reverseSwap) => addSwapToMonth(reverseSwap, true, true));

    failedSwaps.forEach((failedSwap) => addSwapToMonth(failedSwap, false, false));
    failedReverseSwaps.forEach((failedReverseSwap) => addSwapToMonth(failedReverseSwap, false, true));

    const monthStats = new Map<number, MonthStats>();

    swapsPerMonth.forEach((stats, month) => {
      monthStats.set(month, this.generateMonth(stats));
    });

    return stringify(mapToObject(monthStats));
  }

  private generateMonth = (swaps: {
    successfulSwaps: SwapArrays,
    failedSwaps: SwapArrays,
  }) => {
    const { successfulSwaps, failedSwaps } = swaps;

    const volumeMap = new Map<string, number>();
    const tradesPerPair = new Map<string, number>();

    const addSwapToMaps = (swap: Swap | ReverseSwap, isReverse: boolean) => {
      const { quote } = splitPairId(swap.pair);
      const amount = this.getSwapAmount(isReverse, swap.orderSide, swap.onchainAmount!, swap.invoice!);

      const existingTrades = tradesPerPair.get(swap.pair);

      if (existingTrades) {
        tradesPerPair.set(swap.pair, existingTrades + 1);
      } else {
        tradesPerPair.set(swap.pair, 1);
      }

      const existingVolume = volumeMap.get(quote);

      if (existingVolume) {
        volumeMap.set(quote, existingVolume + amount);
      } else {
        volumeMap.set(quote, amount);
      }
    };

    // Successful Swaps
    successfulSwaps.swaps.forEach((swap) => {
      addSwapToMaps(swap, false);
    });

    successfulSwaps.reverseSwaps.forEach((reverseSwap) => {
      addSwapToMaps(reverseSwap, true);
    });

    // Failed Swaps
    const failureRates = {
      swaps: 0,
      reverseSwaps: 0,
    };

    failureRates.swaps = failedSwaps.swaps.length / (successfulSwaps.swaps.length + failedSwaps.swaps.length);
    failureRates.reverseSwaps = failedSwaps.reverseSwaps.length /
      (successfulSwaps.reverseSwaps.length + failedSwaps.reverseSwaps.length);

    return {
      failureRates,
      volume: this.formatVolumeMap(volumeMap),
      trades: mapToObject(tradesPerPair),
    };
  }

  private formatVolumeMap = (volumeMap: Map<string, number>) => {
    const volume = {};

    volumeMap.forEach((value, index) => {
      volume[index] = satoshisToCoins(value);
    });

    return volume;
  }

  private getSwapAmount = (isReverse: boolean, orderSide: number, onchainAmount: number, invoice: string) => {
    if (
      (isReverse && orderSide === OrderSide.BUY) ||
      (!isReverse && orderSide === OrderSide.SELL)
    ) {
      return decodeInvoice(invoice).satoshis;
    } else {
      return onchainAmount;
    }
  }
}

export default Stats;

import Report from './Report';
import Swap from '../db/models/Swap';
import { OrderSide } from '../consts/Enums';
import SwapRepository from '../db/SwapRepository';
import ReverseSwap from '../db/models/ReverseSwap';
import { satoshisToCoins } from '../DenominationConverter';
import ReverseSwapRepository from '../db/ReverseSwapRepository';
import { splitPairId, decodeInvoice, stringify, mapToObject } from '../Utils';

class Stats {
  private volumeMap = new Map<string, number>();
  private tradesPerPair = new Map<string, number>();

  constructor(
    private swapRepository: SwapRepository,
    private reverseSwapRepository: ReverseSwapRepository,
  ) {}

  public generate = async () => {
    // Handle and count successful swaps
    const {
      swaps,
      reverseSwaps,
    } = await Report.getSuccessfulSwaps(this.swapRepository, this.reverseSwapRepository);

    const addSwapToMaps = (swap: Swap | ReverseSwap, isReverse: boolean) => {
      const { quote } = splitPairId(swap.pair);
      const amount = this.getSwapAmount(isReverse, swap.orderSide, swap.onchainAmount!, swap.invoice!);

      this.addToTrades(swap.pair);
      this.addToVolume(quote, amount);
    };

    swaps.forEach((swap) => {
      addSwapToMaps(swap, false);
    });

    reverseSwaps.forEach((reverseSwap) => {
      addSwapToMaps(reverseSwap, true);
    });

    // Count failed swaps
    const {
      swaps: failedSwaps,
      reverseSwaps: failedReverseSwaps,
    } = await Report.getFailedSwaps(this.swapRepository, this.reverseSwapRepository);

    const failureRates = {
      swaps: 0,
      reverseSwaps: 0,
    };

    failureRates.swaps = failedSwaps.length / (swaps.length + failedSwaps.length);
    failureRates.reverseSwaps = failedReverseSwaps.length / (reverseSwaps.length + failedReverseSwaps.length);

    return stringify({
      failureRates,
      volume: this.formatVolumeMap(),
      trades: mapToObject(this.tradesPerPair),
    });
  }

  private formatVolumeMap = () => {
    const volume = {};

    this.volumeMap.forEach((value, index) => {
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

  private addToVolume = (symbol: string, volume: number) => {
    const existing = this.volumeMap.get(symbol);

    if (existing) {
      this.volumeMap.set(symbol, existing + volume);
    } else {
      this.volumeMap.set(symbol, volume);
    }
  }

  private addToTrades = (symbol: string) => {
    const trades = this.tradesPerPair.get(symbol);

    if (trades) {
      this.tradesPerPair.set(symbol, trades + 1);
    } else {
      this.tradesPerPair.set(symbol, 1);
    }
  }
}

export default Stats;

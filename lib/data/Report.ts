import { Op } from 'sequelize';
import Swap from '../db/models/Swap';
import SwapRepository from '../db/SwapRepository';
import { SwapUpdateEvent } from '../consts/Enums';
import ReverseSwap from '../db/models/ReverseSwap';
import { getChainCurrency, splitPairId } from '../Utils';
import { satoshisToCoins } from '../DenominationConverter';
import ReverseSwapRepository from '../db/ReverseSwapRepository';

type Entry = {
  date: Date;
  pair: string;
  type: string;
  orderSide: string;
  failed: boolean;

  minerFee: string;
  routingFee: string;

  fee: string;
  feeCurrency: string;
};

type SwapArrays = {
  swaps: Swap[];
  reverseSwaps: ReverseSwap[];
};

class Report {
  constructor(private swapRepository: SwapRepository, private reverseSwapRepository: ReverseSwapRepository) {}

  /**
   * Gets all successful (reverse) swaps
   */
  public static getSuccessfulSwaps = async (
    swapRepository: SwapRepository,
    reverseSwapRepository: ReverseSwapRepository,
  ): Promise<SwapArrays> => {

    const [swaps, reverseSwaps] = await Promise.all([
      swapRepository.getSwaps({
        status: {
          [Op.eq]: SwapUpdateEvent.TransactionClaimed,
        },
      }),
      reverseSwapRepository.getReverseSwaps({
        status: {
          [Op.eq]: SwapUpdateEvent.InvoiceSettled,
        },
      }),
    ]);

    return {
      swaps,
      reverseSwaps,
    };
  }

  /**
   * Gets all failed (reverse) swaps
   */
  public static getFailedSwaps = async (
    swapRepository: SwapRepository,
    reverseSwapRepository: ReverseSwapRepository,
  ): Promise<SwapArrays> => {

    const [swaps, reverseSwaps] = await Promise.all([
      swapRepository.getSwaps({
        status: {
          [Op.or]: [
            SwapUpdateEvent.SwapExpired,
            SwapUpdateEvent.InvoiceFailedToPay,
          ],
        },
      }),
      reverseSwapRepository.getReverseSwaps({
        status: {
          [Op.or]: [
            SwapUpdateEvent.SwapExpired,
            SwapUpdateEvent.TransactionFailed,
            SwapUpdateEvent.TransactionRefunded,
          ],
        },
      }),
    ]);

    return {
      swaps,
      reverseSwaps,
    };
  }

  public generate = async (): Promise<string> => {
    const {
      swaps: successfulSwaps,
      reverseSwaps: successfulReverseSwaps,
    } = await Report.getSuccessfulSwaps(this.swapRepository, this.reverseSwapRepository);
    const successfulEntries = this.swapsToEntries(successfulSwaps, successfulReverseSwaps, false);

    const {
      swaps: failedSwaps,
      reverseSwaps: failedReverseSwaps,
    } = await Report.getFailedSwaps(this.swapRepository, this.reverseSwapRepository);
    const failedEntries = this.swapsToEntries(failedSwaps, failedReverseSwaps, true);

    const entries = [...successfulEntries, ...failedEntries];

    entries.sort((a, b) => {
      return a.date.getTime() - b.date.getTime();
    });

    return this.arrayToCsv(entries);
  }

  private swapsToEntries = (swaps: Swap[], reverseSwaps: ReverseSwap[], failed: boolean) => {
    const entries: Entry[] = [];

    const pushToEntries = (array: Swap[] | ReverseSwap[], isReverse: boolean) => {
      array.forEach((swap: Swap | ReverseSwap) => {
        const { base, quote } = splitPairId(swap.pair);
        const routingFee = swap['routingFee'] ? swap['routingFee'] : 0;

        entries.push({
          date: new Date(swap.createdAt),
          pair: swap.pair,
          type: this.getSwapType(swap.orderSide, isReverse),
          orderSide: swap.orderSide === 0 ? 'buy' : 'sell',
          // tslint:disable-next-line: object-shorthand-properties-first
          failed,

          minerFee: this.formatAmount(swap.minerFee ? swap.minerFee : 0),
          routingFee: (routingFee / 1000).toFixed(3),

          fee: this.formatAmount(swap.fee!),
          feeCurrency: getChainCurrency(base, quote, swap.orderSide, isReverse),
        });
      });
    };

    pushToEntries(swaps, false);
    pushToEntries(reverseSwaps, true);

    return entries;
  }

  private arrayToCsv = (entries: Entry[]) => {
    const lines: string[] = [];

    if (entries.length !== 0) {
      const keys = Object.keys(entries[0]);
      lines.push(keys.join(','));
    }

    entries.forEach((entry) => {
      const date = this.formatDate(entry.date);

      lines.push(
        `${date},${entry.pair},${entry.type},${entry.orderSide},${entry.failed},` +
        `${entry.minerFee},${entry.routingFee},${entry.fee},${entry.feeCurrency}`,
      );
    });

    return lines.join('\n');
  }

  private formatDate = (date: Date) => {
    return date.toLocaleString('en-US', { hour12: false }).replace(',', '');
  }

  private formatAmount = (satoshis: number) => {
    return satoshisToCoins(satoshis).toFixed(8);
  }

  private getSwapType = (orderSide: number, isReverse: boolean) => {
    if ((orderSide === 0 && !isReverse) || (orderSide !== 0 && isReverse)) {
      return 'Lightning/Chain';
    } else {
      return 'Chain/Lightning';
    }
  }
}

export default Report;
export { SwapArrays };

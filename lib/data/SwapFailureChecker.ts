import Report from './Report';
import Swap from '../db/models/Swap';
import { SwapUpdateEvent } from '../consts/Enums';
import SwapRepository from '../db/SwapRepository';
import ReverseSwap from '../db/models/ReverseSwap';
import ReverseSwapRepository from '../db/ReverseSwapRepository';

type SwapFailureReasons = {
  [SwapUpdateEvent.SwapExpired]: number,
  [SwapUpdateEvent.InvoiceFailedToPay]: number,
};

type SwapExpiryReasons = {
  noTransaction: number,
  transactionSent: string[],
};

type ReverseSwapFailureReasons = {
  [SwapUpdateEvent.TransactionRefunded]: number,
};

class CheckFailedSwaps {
  constructor(private swapRepository: SwapRepository, private reverseSwapRepository: ReverseSwapRepository) {}

  private checkSwaps = (failedSwaps: Swap[]) => {
    const swapFailureReasons = {
      [SwapUpdateEvent.SwapExpired]: 0,
      [SwapUpdateEvent.InvoiceFailedToPay]: 0,
    };

    const swapExpiryReasons = {
      noTransaction: 0,
      transactionSent: [] as string[],
    };

    for (const swap of failedSwaps) {
      swapFailureReasons[swap.status as string] += 1;

      if (swap.status === SwapUpdateEvent.SwapExpired) {
        if (swap.lockupTransactionId) {
          swapExpiryReasons.transactionSent.push(swap.id);
        } else {
          swapExpiryReasons.noTransaction += 1;
        }
      }
    }

    return {
      failureReasons: swapFailureReasons,
      expiryReasons: swapExpiryReasons,
    };
  }

  private checkReverseSwaps = (failedReverseSwaps: ReverseSwap[]) => {
    const reverseSwapFailureReasons = {
      [SwapUpdateEvent.TransactionRefunded]: 0,
    };

    for (const reverseSwap of failedReverseSwaps) {
      reverseSwapFailureReasons[reverseSwap.status as string] += 1;
    }

    return {
      failureReasons: reverseSwapFailureReasons,
    };
  }

  public check = async (): Promise<{
    swaps: {
      expiryReasons: SwapExpiryReasons,
      failureReasons: SwapFailureReasons,
    },
    reverseSwaps: {
      failureReasons: ReverseSwapFailureReasons
    },
  }> => {
    const failedSwaps = await Report.getFailedSwaps(this.swapRepository, this.reverseSwapRepository);

    return {
      swaps: this.checkSwaps(failedSwaps.swaps),
      reverseSwaps: this.checkReverseSwaps(failedSwaps.reverseSwaps),
    };
  }
}

export default CheckFailedSwaps;

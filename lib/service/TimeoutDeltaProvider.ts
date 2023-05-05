import fs from 'fs';
import toml from '@iarna/toml';
import Errors from './Errors';
import Logger from '../Logger';
import { ConfigType } from '../Config';
import { OrderSide } from '../consts/Enums';
import { PairConfig } from '../consts/Types';
import { decodeInvoice, getPairId, splitPairId, stringify } from '../Utils';

type PairTimeoutBlocksDelta = {
  reverse: number;

  swapMinimal: number;
  swapMaximal: number;
};

type PairTimeoutBlockDeltas = {
  base: PairTimeoutBlocksDelta;
  quote: PairTimeoutBlocksDelta;
};

class TimeoutDeltaProvider {
  public static minCltvOffset = 6;

  // A map of the symbols of currencies and their block times in minutes
  public static blockTimes = new Map<string, number>([
    ['BTC', 10],
    ['L-BTC', 1],
    ['LTC', 2.5],
    ['ETH', 0.2],
  ]);

  public timeoutDeltas = new Map<string, PairTimeoutBlockDeltas>();

  constructor(private logger: Logger, private config: ConfigType) {}

  public static convertBlocks = (
    fromSymbol: string,
    toSymbol: string,
    blocks: number,
  ): number => {
    const minutes = blocks * TimeoutDeltaProvider.getBlockTime(fromSymbol)!;

    // In the context this function is used, we calculate the timeout of the first leg of a
    // reverse swap which has to be longer than the second one
    return Math.ceil(minutes / TimeoutDeltaProvider.getBlockTime(toSymbol)!);
  };

  public init = (pairs: PairConfig[]): void => {
    for (const pair of pairs) {
      const pairId = getPairId(pair);

      if (pair.timeoutDelta !== undefined) {
        // Compatibility mode with legacy config
        if (typeof pair.timeoutDelta === 'number') {
          pair.timeoutDelta = {
            reverse: pair.timeoutDelta,
            swapMaximal: pair.timeoutDelta,
            swapMinimal: pair.timeoutDelta,
          };
        }

        this.logger.debug(
          `Setting timeout block delta of ${pairId} to minutes: ${stringify(
            pair.timeoutDelta,
          )}`,
        );
        this.timeoutDeltas.set(
          pairId,
          this.minutesToBlocks(pairId, pair.timeoutDelta),
        );
      } else {
        throw Errors.NO_TIMEOUT_DELTA(pairId);
      }
    }
  };

  public setTimeout = (
    pairId: string,
    newDeltas: PairTimeoutBlocksDelta,
  ): void => {
    if (this.timeoutDeltas.has(pairId)) {
      const blocks = this.minutesToBlocks(pairId, newDeltas);

      this.timeoutDeltas.set(pairId, blocks);

      for (let i = 0; i < this.config.pairs.length; i += 1) {
        if (getPairId(this.config.pairs[i]) === pairId) {
          this.config.pairs[i].timeoutDelta = newDeltas;

          break;
        }
      }

      // Write the new config to the disk
      const newConfig = toml.stringify(this.config as toml.JsonMap);
      fs.writeFileSync(this.config.configpath, newConfig);
    } else {
      throw Errors.PAIR_NOT_FOUND(pairId);
    }
  };

  public getTimeout = (
    pairId: string,
    orderSide: OrderSide,
    isReverse: boolean,
    invoice?: string,
  ): number => {
    const timeout = this.timeoutDeltas.get(pairId);

    if (!timeout) {
      throw Errors.PAIR_NOT_FOUND(pairId);
    }

    const { base, quote } = timeout;

    if (isReverse) {
      return orderSide === OrderSide.BUY ? base.reverse : quote.reverse;
    } else {
      const deltas = orderSide === OrderSide.BUY ? quote : base;
      return invoice
        ? this.getTimeoutInvoice(deltas, invoice)
        : deltas.swapMinimal;
    }
  };

  private getTimeoutInvoice = (
    timeout: PairTimeoutBlocksDelta,
    invoice: string,
  ): number => {
    const { minFinalCltvExpiry } = decodeInvoice(invoice);

    let blocks = timeout.swapMinimal;

    if (minFinalCltvExpiry) {
      const minTimeout =
        minFinalCltvExpiry + TimeoutDeltaProvider.minCltvOffset;

      if (minTimeout > timeout.swapMaximal) {
        throw Errors.MIN_CLTV_TOO_BIG(timeout.swapMaximal, minFinalCltvExpiry);
      }

      blocks = Math.max(timeout.swapMinimal, minTimeout);
    }

    return blocks;
  };

  private minutesToBlocks = (
    pair: string,
    newDeltas: PairTimeoutBlocksDelta,
  ) => {
    const calculateBlocks = (symbol: string, minutes: number) => {
      const minutesPerBlock = TimeoutDeltaProvider.getBlockTime(symbol);
      const blocks = minutes / minutesPerBlock;

      // Sanity checks to make sure no impossible deltas are set
      if (blocks % 1 !== 0 || blocks < 1) {
        throw Errors.INVALID_TIMEOUT_BLOCK_DELTA();
      }

      return blocks;
    };

    const convertToBlocks = (symbol: string): PairTimeoutBlocksDelta => {
      return {
        reverse: calculateBlocks(symbol, newDeltas.reverse),
        swapMinimal: calculateBlocks(symbol, newDeltas.swapMinimal),
        swapMaximal: calculateBlocks(symbol, newDeltas.swapMaximal),
      };
    };

    const { base, quote } = splitPairId(pair);

    return {
      base: convertToBlocks(base),
      quote: convertToBlocks(quote),
    };
  };

  /**
   * If the block time for the symbol is not hardcoded, it is assumed that the symbol belongs to an ERC20 token
   */
  private static getBlockTime = (symbol: string): number => {
    return (
      TimeoutDeltaProvider.blockTimes.get(symbol) ||
      TimeoutDeltaProvider.blockTimes.get('ETH')!
    );
  };
}

export default TimeoutDeltaProvider;
export { PairTimeoutBlocksDelta };

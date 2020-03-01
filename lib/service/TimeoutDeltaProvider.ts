import fs from 'fs';
import toml from '@iarna/toml';
import Errors from './Errors';
import Logger from '../Logger';
import { ConfigType } from '../Config';
import { OrderSide } from '../consts/Enums';
import { PairConfig } from '../consts/Types';
import { getPairId, splitPairId } from '../Utils';

type PairTimeoutBlockDeltas = {
  base: number;
  quote: number;
};

class TimeoutDeltaProvider {
  private timeoutDeltas = new Map<string, PairTimeoutBlockDeltas>();

  // A map of the symbols of currencies and their block times in minutes
  private static blockTimes = new Map<string, number>([
    ['BTC', 10],
    ['LTC', 2.5],
  ]);

  constructor(private logger: Logger, private config: ConfigType) {}

  public static convertBlocks = (fromSymbol: string, toSymbol: string, blocks: number) => {
    if (!TimeoutDeltaProvider.blockTimes.has(fromSymbol)) {
      throw Errors.BLOCK_TIME_NOT_FOUND(fromSymbol);
    }

    if (!TimeoutDeltaProvider.blockTimes.has(toSymbol)) {
      throw Errors.BLOCK_TIME_NOT_FOUND(toSymbol);
    }

    const minutes = blocks * TimeoutDeltaProvider.blockTimes.get(fromSymbol)!;

    // In the context this function is used, we calculate the timeout of the first leg of a
    // reverse swap which has to be longer than the second one
    return Math.ceil(minutes / TimeoutDeltaProvider.blockTimes.get(toSymbol)!);
  }

  public init = (pairs: PairConfig[]) => {
    for (const pair of pairs) {
      const pairId = getPairId(pair);

      if (pair.timeoutDelta !== undefined) {
        this.logger.debug(`Setting timeout block delta of ${pairId} to ${pair.timeoutDelta} minutes`);
        this.timeoutDeltas.set(pairId, this.minutesToBlocks(pairId, pair.timeoutDelta));
      } else {
        throw Errors.NO_TIMEOUT_DELTA(pairId);
      }
    }
  }

  public getTimeout = (pairId: string, orderSide: OrderSide, isReverse: boolean) => {
    const timeout = this.timeoutDeltas.get(pairId);

    if (!timeout) {
      throw Errors.PAIR_NOT_FOUND(pairId);
    }

    const { base, quote } = timeout;

    if (isReverse) {
      return orderSide === OrderSide.BUY ? base : quote;
    } else {
      return orderSide === OrderSide.BUY ? quote : base;
    }
  }

  public setTimeout = (pairId: string, newDelta: number) => {
    if (this.timeoutDeltas.has(pairId)) {
      const blocks = this.minutesToBlocks(pairId, newDelta);

      this.timeoutDeltas.set(pairId, blocks);

      for (let i = 0; i < this.config.pairs.length; i += 1) {
        if (getPairId(this.config.pairs[i]) === pairId) {
          this.config.pairs[i].timeoutDelta = newDelta;

          break;
        }
      }

      // Write the new config to the disk
      const newConfig = toml.stringify(this.config as toml.JsonMap);
      fs.writeFileSync(this.config.configpath, newConfig);
    } else {
      throw Errors.PAIR_NOT_FOUND(pairId);
    }
  }

  private minutesToBlocks = (pair: string, minutes: number) => {
    const calculateBlocks = (symbol: string) => {
      const minutesPerBlock = TimeoutDeltaProvider.blockTimes.get(symbol);

      if (!minutesPerBlock) {
        throw Errors.BLOCK_TIME_NOT_FOUND(symbol);
      }

      const blocks = minutes / minutesPerBlock;

      // Sanity checks to make sure no impossible deltas are set
      if (blocks % 1 !== 0 || blocks < 1) {
        throw Errors.INVALID_TIMEOUT_BLOCK_DELTA();
      }

      return blocks;
    };

    const { base, quote } = splitPairId(pair);

    return {
      base: calculateBlocks(base),
      quote: calculateBlocks(quote),
    };
  }
}

export default TimeoutDeltaProvider;

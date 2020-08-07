import Errors from './Errors';
import Logger from '../Logger';
import { PairConfig } from '../consts/Types';
import DataProvider from './data/DataProvider';
import { Currency } from '../wallet/WalletManager';
import FeeProvider, { BaseFeeType } from './FeeProvider';
import { getPairId, mapToObject, minutesToMilliseconds, stringify } from '../Utils';

type CurrencyLimits = {
  minimal: number;
  maximal: number;

  maximalZeroConf: number;
};

type ReverseMinerFees = {
  lockup: number;
  claim: number;
};

type MinerFees = {
  normal: number;
  reverse: ReverseMinerFees;
};

type PairType = {
  rate: number;
  limits: {
    minimal: number;
    maximal: number;

    maximalZeroConf: {
      baseAsset: number;
      quoteAsset: number;
    }
  };
  fees: {
    percentage: number;
    minerFees: {
      baseAsset: MinerFees,
      quoteAsset: MinerFees,
    };
  };
};

class RateProvider {
  // A map between the pair ids and the rate, limits and fees of that pair
  public pairs = new Map<string, PairType>();

  // An array of tuples between the base and quote asset of all pairs for which the rate should be queried
  public pairsToQuery: [string, string][] = [];

  // A map of all pairs with hardcoded rates
  private hardcodedPairs = new Map<string, { base: string, quote: string }>();

  // A map between assets and their limits
  private limits = new Map<string, CurrencyLimits>();

  // A copy of the "percentageFees" Map in the FeeProvider but all values are multiplied with 100
  private percentageFees = new Map<string, number>();

  private dataProvider = new DataProvider();

  private timer!: any;

  constructor(
    private logger: Logger,
    private feeProvider: FeeProvider,
    private rateUpdateInterval: number,
    currencies: Currency[]) {

    this.parseCurrencies(currencies);
  }

  public init = async (pairs: PairConfig[]): Promise<void> => {
    this.feeProvider.percentageFees.forEach((percentage, pair) => {
      // Multiply with 100 to get the percentage
      this.percentageFees.set(pair, percentage * 100);
    });

    const minerFees = await this.getMinerFees();

    pairs.forEach((pair) => {
      // If a pair has a hardcoded rate the rate doesn't have to be queried from the exchanges
      if (pair.rate) {
        const id = getPairId(pair);

        this.logger.debug(`Setting hardcoded rate for pair ${id}: ${pair.rate}`);

        this.pairs.set(id, {
          rate: pair.rate,
          limits: this.getLimits(id, pair.base, pair.quote, pair.rate),
          fees: {
            percentage: this.percentageFees.get(id)!,
            minerFees: {
              baseAsset: minerFees.get(pair.base)!,
              quoteAsset: minerFees.get(pair.quote)!,
            },
          },
        });

        this.hardcodedPairs.set(id, {
          base: pair.base,
          quote: pair.quote,
        });
      } else {
        this.pairsToQuery.push([pair.base, pair.quote]);
      }
    });

    this.logger.debug(`Prepared data for requests to exchanges: ${stringify(this.pairsToQuery)}`);

    await this.updateRates(minerFees);

    this.logger.silly(`Got pairs: ${stringify(mapToObject(this.pairs))}`);
    this.logger.debug(`Updating rates every ${this.rateUpdateInterval} minutes`);

    this.timer = setInterval(async () => {
      await this.updateRates(await this.getMinerFees());
    }, minutesToMilliseconds(this.rateUpdateInterval));
  }

  public disconnect = (): void => {
    clearInterval(this.timer);
  }

  /**
   * Returns whether 0-conf should be accepted for a specific amount on a specified chain
   */
  public acceptZeroConf = (chainCurrency: string, amount: number): boolean => {
    const limits = this.limits.get(chainCurrency);

    if (limits) {
      return amount <= limits.maximalZeroConf;
    } else {
      return false;
    }
  }

  private updateRates = async (minerFees: Map<string, MinerFees>) => {
    const promises: Promise<void>[] = [];

    // Update the pairs with a variable rate
    this.pairsToQuery.forEach(([base, quote]) => {
      promises.push((async () => {
        const rate = await this.dataProvider.getPrice(base, quote);

        // If the rate returned is "null" or "NaN" that means that all requests to the APIs of the exchanges
        // failed and that the pairs and limits don't have to be updated
        if (rate !== null && !isNaN(rate)) {
          const pair = getPairId({ base, quote });
          const limits = this.getLimits(pair, base, quote, rate);

          this.pairs.set(pair, {
            rate,
            limits,
            fees: {
              percentage: this.percentageFees.get(pair)!,
              minerFees: {
                baseAsset: minerFees.get(base)!,
                quoteAsset: minerFees.get(quote)!,
              },
            },
          });
        } else {
          this.logger.warn(`Could not fetch rates of ${getPairId({ base, quote })}`);
        }
      })());
    });

    // Update the miner fees of the pairs with a hardcoded rate
    this.hardcodedPairs.forEach(({ base, quote }, pair) => {
      const pairInfo = this.pairs.get(pair)!;

      pairInfo.fees.minerFees = {
        baseAsset: minerFees.get(base)!,
        quoteAsset: minerFees.get(quote)!,
      };

      this.pairs.set(pair, pairInfo);
    });

    await Promise.all(promises);

    this.logger.silly('Updated rates');
  }

  private getLimits = (pair: string, base: string, quote: string, rate: number) => {
    const baseLimits = this.limits.get(base);
    const quoteLimits = this.limits.get(quote);

    if (baseLimits && quoteLimits) {
      return {
        maximal: Math.floor(Math.min(quoteLimits.maximal, baseLimits.maximal * rate)),
        minimal: Math.ceil(Math.max(quoteLimits.minimal, baseLimits.minimal * rate)),

        maximalZeroConf: {
          baseAsset: baseLimits.maximalZeroConf,
          quoteAsset: quoteLimits.maximalZeroConf,
        },
      };
    }

    throw `Could not get limits for pair ${pair}`;
  }

  private parseCurrencies = (currencies: Currency[]) => {
    for (const currency of currencies) {
      if (currency.limits.maxZeroConfAmount === undefined) {
        this.logger.warn(`Maximal 0-conf amount not set for ${currency.symbol}`);
      }

      if (currency.limits.maxSwapAmount === undefined) {
        throw Errors.CONFIGURATION_INCOMPLETE(currency.symbol, 'maxSwapAmount');
      }

      if (currency.limits.minSwapAmount === undefined) {
        throw Errors.CONFIGURATION_INCOMPLETE(currency.symbol, 'minSwapAmount');
      }

      this.limits.set(currency.symbol, {
        maximal: currency.limits.maxSwapAmount,
        minimal: currency.limits.minSwapAmount,

        // Set the maximal 0-conf amount to 0 if it wasn't set explicitly
        maximalZeroConf: currency.limits.maxZeroConfAmount || 0,
      });
    }
  }

  private getMinerFees = async () => {
    const minerFees = new Map<string, MinerFees>();

    for (const [symbol] of this.limits) {
      const { normalClaim, reverseLockup, reverseClaim } = await this.getFeeFromProvider(symbol);

      minerFees.set(symbol, {
        normal: normalClaim,
        reverse: {
          claim: reverseClaim,
          lockup: reverseLockup,
        },
      });
    }

    return minerFees;
  }

  private getFeeFromProvider = async (chainCurrency: string) => {
    const [normalClaim, reverseLockup, reverseClaim] = await Promise.all([
      this.feeProvider.getBaseFee(chainCurrency, BaseFeeType.NormalClaim),
      this.feeProvider.getBaseFee(chainCurrency, BaseFeeType.ReverseLockup),
      this.feeProvider.getBaseFee(chainCurrency, BaseFeeType.ReverseClaim),
    ]);

    return {
      normalClaim,
      reverseLockup,
      reverseClaim,
    };
  }
}

export default RateProvider;
export { PairType };

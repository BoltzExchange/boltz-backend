import Errors from './Errors';
import Logger from '../Logger';
import { PairConfig } from '../consts/Types';
import { CurrencyType } from '../consts/Enums';
import DataAggregator from './data/DataAggregator';
import { Currency } from '../wallet/WalletManager';
import FeeProvider, { MinerFees } from './FeeProvider';
import { getPairId, hashString, mapToObject, minutesToMilliseconds, splitPairId, stringify } from '../Utils';

type CurrencyLimits = {
  minimal: number;
  maximal: number;

  maximalZeroConf: number;
};

const emptyMinerFees = {
  normal: 0,
  reverse: {
    claim: 0,
    lockup: 0,
  },
};

type PairType = {
  hash: string;
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
  public feeProvider: FeeProvider;

  // A map between the pair ids and the rate, limits and fees of that pair
  public pairs = new Map<string, PairType>();

  // A list of all pairs that are specified in the config
  public configPairs = new Set<string>();

  // A map of all pairs with hardcoded rates
  private hardcodedPairs = new Map<string, { base: string, quote: string }>();

  // A map between assets and their limits
  private limits = new Map<string, CurrencyLimits>();

  // A copy of the "percentageFees" Map in the FeeProvider but all values are multiplied with 100
  private percentageFees = new Map<string, number>();

  private dataAggregator = new DataAggregator();

  private timer!: any;

  constructor(
    private logger: Logger,
    private rateUpdateInterval: number,
    private currencies: Map<string, Currency>,
    private getFeeEstimation: (symbol: string) => Promise<Map<string, number>>,
  ) {
    this.feeProvider = new FeeProvider(this.logger, this.dataAggregator, this.getFeeEstimation);
    this.parseCurrencies(Array.from(currencies.values()));
  }

  public init = async (pairs: PairConfig[]): Promise<void> => {
    this.feeProvider.percentageFees.forEach((percentage, pair) => {
      // Multiply with 100 to get the percentage
      this.percentageFees.set(pair, percentage * 100);
    });

    pairs.forEach((pair) => {
      const id = getPairId(pair);
      this.configPairs.add(id);

      // If a pair has a hardcoded rate the rate doesn't have to be queried from the exchanges
      if (pair.rate) {
        this.logger.debug(`Setting hardcoded rate for pair ${id}: ${pair.rate}`);

        this.pairs.set(id, {
          hash: '',
          rate: pair.rate,
          limits: this.getLimits(id, pair.base, pair.quote, pair.rate),
          fees: {
            percentage: this.percentageFees.get(id)!,
            minerFees: {
              baseAsset: emptyMinerFees,
              quoteAsset: emptyMinerFees,
            },
          },
        });

        this.hardcodedPairs.set(id, {
          base: pair.base,
          quote: pair.quote,
        });
      } else {
        this.dataAggregator.registerPair(pair.base, pair.quote);

        // TODO: find way to get ETH/<token> rate without having to hardcode it here
        const checkAndRegisterToken = (symbol: string) => {
          if (this.currencies.get(symbol)!.type === CurrencyType.ERC20) {
            this.dataAggregator.registerPair('ETH', symbol);
          }
        };

        checkAndRegisterToken(pair.base);
        checkAndRegisterToken(pair.quote);
      }
    });

    const pairsToQuery: string[] = [];
    this.dataAggregator.pairs.forEach(([base, quote]) => {
      pairsToQuery.push(getPairId({ base, quote }));
    });
    this.logger.debug(`Prepared data for requests to exchanges: \n  - ${pairsToQuery.join('\n  - ')}`);

    await this.updateRates();

    this.logger.silly(`Got pairs: ${stringify(mapToObject(this.pairs))}`);
    this.logger.debug(`Updating rates every ${this.rateUpdateInterval} minutes`);

    this.timer = setInterval(async () => {
      await this.updateRates();
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

  private updateRates = async () => {
    // Update the pairs with a variable rate
    const [, updatedRates] = await Promise.all([
      this.getMinerFees(),
      this.dataAggregator.fetchPairs(),
    ]);

    for (const [pairId, rate] of updatedRates) {
      // Filter pairs that are fetched (for example to calculate gas fees for a BTC/<token> pair)
      // but not specified in the config
      if (!this.configPairs.has(pairId)) {
        continue;
      }

      const { base, quote } = splitPairId(pairId);

      // If the rate returned is "undefined" or "NaN" that means that all requests to the APIs of the exchanges
      // failed and that the pairs and limits don't have to be updated
      if (rate && !isNaN(rate)) {
        const limits = this.getLimits(pairId, base, quote, rate);

        this.pairs.set(pairId, {
          rate,
          limits,
          hash: '',
          fees: {
            percentage: this.percentageFees.get(pairId)!,
            minerFees: {
              baseAsset: this.feeProvider.minerFees.get(base)!,
              quoteAsset: this.feeProvider.minerFees.get(quote)!,
            },
          },
        });

      } else {
        this.logger.warn(`Could not fetch rates of ${pairId}`);
      }
    }

    // Update the miner fees of the pairs with a hardcoded rate
    this.hardcodedPairs.forEach(({ base, quote }, pair) => {
      const pairInfo = this.pairs.get(pair)!;

      pairInfo.fees.minerFees = {
        baseAsset: this.feeProvider.minerFees.get(base)!,
        quoteAsset: this.feeProvider.minerFees.get(quote)!,
      };

      this.pairs.set(pair, pairInfo);
    });

    this.pairs.forEach((pair, symbol) => {
      this.pairs.get(symbol)!.hash = hashString(JSON.stringify({
        rate: pair.rate,
        fees: pair.fees,
        limits: pair.limits,
      }));
    });

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
    const promises: Promise<void>[] = [];

    for (const [symbol] of this.limits) {
      promises.push(this.feeProvider.updateMinerFees(symbol));
    }

    await Promise.all(promises);
  }
}

export default RateProvider;
export { PairType };

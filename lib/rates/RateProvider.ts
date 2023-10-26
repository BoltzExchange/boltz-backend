import Errors from './Errors';
import Logger from '../Logger';
import NodeSwitch from '../swap/NodeSwitch';
import { PairConfig } from '../consts/Types';
import RateCalculator from './RateCalculator';
import DataAggregator from './data/DataAggregator';
import { BaseFeeType, CurrencyType } from '../consts/Enums';
import WalletManager, { Currency } from '../wallet/WalletManager';
import FeeProvider, { MinerFees, PercentageFees } from './FeeProvider';
import {
  getPairId,
  hashString,
  mapToObject,
  minutesToMilliseconds,
  splitPairId,
  stringify,
} from '../Utils';

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
    };
  };
  fees: PercentageFees & {
    minerFees: {
      baseAsset: MinerFees;
      quoteAsset: MinerFees;
    };
  };
};

class RateProvider {
  private static minLimitFactor = 2;

  public feeProvider: FeeProvider;

  public dataAggregator = new DataAggregator();
  public rateCalculator = new RateCalculator(this.dataAggregator);

  // A map between the pair ids and the rate, limits and fees of that pair
  public pairs = new Map<string, PairType>();

  // A list of all pairs that are specified in the config
  public configPairs = new Set<string>();

  // A map of all pairs with hardcoded rates
  private hardcodedPairs = new Map<string, { base: string; quote: string }>();

  private zeroConfAmounts = new Map<string, number>();
  private pairConfigs = new Map<string, PairConfig>();

  private timer!: any;

  constructor(
    private logger: Logger,
    private rateUpdateInterval: number,
    private currencies: Map<string, Currency>,
    getFeeEstimation: (symbol: string) => Promise<Map<string, number>>,
    walletManager: WalletManager,
  ) {
    this.feeProvider = new FeeProvider(
      this.logger,
      walletManager,
      this.dataAggregator,
      getFeeEstimation,
    );
    this.parseCurrencies(Array.from(currencies.values()));
  }

  public init = async (pairs: PairConfig[]): Promise<void> => {
    pairs.forEach((pair) => {
      this.pairConfigs.set(getPairId(pair), pair);
    });

    await this.updateMinerFees();

    pairs.forEach((pair) => {
      const id = getPairId(pair);
      this.configPairs.add(id);

      if (pair.maxSwapAmount === undefined) {
        throw Errors.CONFIGURATION_INCOMPLETE(id, 'maxSwapAmount');
      }

      if (pair.minSwapAmount === undefined) {
        throw Errors.CONFIGURATION_INCOMPLETE(id, 'minSwapAmount');
      }

      // If a pair has a hardcoded rate the rate doesn't have to be queried from the exchanges
      if (pair.rate) {
        this.logger.debug(
          `Setting hardcoded rate for pair ${id}: ${pair.rate}`,
        );

        this.pairs.set(id, {
          hash: '',
          rate: pair.rate,
          limits: this.getLimits(id, pair.rate),
          fees: {
            ...this.feeProvider.getPercentageFees(id),
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
        // TODO: RSK
        const checkAndRegisterToken = (symbol: string) => {
          if (this.currencies.get(symbol)!.type === CurrencyType.ERC20) {
            this.dataAggregator.registerPair('ETH', symbol);
          }
        };

        checkAndRegisterToken(pair.base);
        checkAndRegisterToken(pair.quote);
      }
    });

    if (this.dataAggregator.pairs.size > 0) {
      const pairsToQuery: string[] = [];
      this.dataAggregator.pairs.forEach(([base, quote]) => {
        pairsToQuery.push(getPairId({ base, quote }));
      });
      this.logger.debug(
        `Prepared data for requests to exchanges: \n  - ${pairsToQuery.join(
          '\n  - ',
        )}`,
      );
    }

    await this.updateRates();

    this.logger.silly(`Got pairs: ${stringify(mapToObject(this.pairs))}`);
    this.logger.debug(
      `Updating rates every ${this.rateUpdateInterval} minutes`,
    );

    this.timer = setInterval(async () => {
      await this.updateRates();
    }, minutesToMilliseconds(this.rateUpdateInterval));
  };

  public disconnect = (): void => {
    clearInterval(this.timer);
  };

  /**
   * Returns whether 0-conf should be accepted for a specific amount on a specified chain
   */
  public acceptZeroConf = (chainCurrency: string, amount: number): boolean => {
    const limits = this.zeroConfAmounts.get(chainCurrency);

    if (limits) {
      return amount <= limits;
    } else {
      return false;
    }
  };

  private updateRates = async () => {
    // The fees for the ERC20 tokens depend on the rates
    // Updating rates and fees at the same time would result in a race condition
    // that could leave the fee estimations for the ERC20 tokens outdated or even
    // "null" on the very first run of this function
    const updatedRates = await this.dataAggregator.fetchPairs();

    await this.updateMinerFees();

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
        this.pairs.set(pairId, {
          rate,
          hash: '',
          limits: this.getLimits(pairId, rate),
          fees: {
            ...this.feeProvider.getPercentageFees(pairId),
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
      pairInfo.limits = this.getLimits(pair, pairInfo.rate);

      this.pairs.set(pair, pairInfo);
    });

    this.pairs.forEach((pair, symbol) => {
      this.pairs.get(symbol)!.hash = hashString(
        JSON.stringify({
          rate: pair.rate,
          fees: pair.fees,
          limits: pair.limits,
        }),
      );
    });

    this.logger.silly('Updated rates');
  };

  private getLimits = (pair: string, rate: number) => {
    const config = this.pairConfigs.get(pair);

    if (config === undefined) {
      throw `Could not get limits for pair ${pair}`;
    }

    const { base, quote } = splitPairId(pair);
    const minimalLimits = [config.minSwapAmount];

    [
      [base, quote],
      [quote, base],
    ]
      .filter(([chain, lightning]) =>
        this.isPossibleChainCurrency(chain, lightning),
      )
      .map(([currency]) => currency)
      .forEach((currency) => {
        let limit =
          this.feeProvider.getBaseFee(currency, BaseFeeType.NormalClaim) *
          RateProvider.minLimitFactor;
        if (currency === base) {
          limit *= rate;
        }

        minimalLimits.push(limit);
      });

    return {
      maximal: config.maxSwapAmount,
      minimal: Math.ceil(Math.max(...minimalLimits)),

      maximalZeroConf: {
        baseAsset: this.zeroConfAmounts.get(base)!,
        quoteAsset: this.zeroConfAmounts.get(quote)!,
      },
    };
  };

  private isPossibleChainCurrency = (
    cur: string,
    lightningCur: string,
  ): boolean => {
    return (
      this.currencies.get(cur)!.chainClient !== undefined &&
      NodeSwitch.hasClient(this.currencies.get(lightningCur)!)
    );
  };

  private parseCurrencies = (currencies: Currency[]) => {
    for (const currency of currencies) {
      if (currency.limits.maxZeroConfAmount === undefined) {
        this.logger.warn(
          `Maximal 0-conf amount not set for ${currency.symbol}`,
        );
      }

      // Set the maximal 0-conf amount to 0 if it wasn't set explicitly
      this.zeroConfAmounts.set(
        currency.symbol,
        currency.limits.maxZeroConfAmount || 0,
      );
    }
  };

  private updateMinerFees = async () => {
    await Promise.all(
      Array.from(this.currencies.keys()).map((currency) =>
        this.feeProvider.updateMinerFees(currency),
      ),
    );
  };
}

export default RateProvider;
export { PairType };

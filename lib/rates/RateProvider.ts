import Logger from '../Logger';
import { getPairId, minutesToMilliseconds } from '../Utils';
import {
  CurrencyType,
  SwapType,
  SwapVersion,
  stringToSwapType,
  swapTypeToPrettyString,
  swapTypeToString,
} from '../consts/Enums';
import { PairConfig } from '../consts/Types';
import WalletManager, { Currency } from '../wallet/WalletManager';
import Errors from './Errors';
import FeeProvider from './FeeProvider';
import RateCalculator from './RateCalculator';
import DataAggregator from './data/DataAggregator';
import RateProviderBase from './providers/RateProviderBase';
import RateProviderLegacy from './providers/RateProviderLegacy';
import RateProviderTaproot from './providers/RateProviderTaproot';

class RateProvider {
  public readonly feeProvider: FeeProvider;

  public readonly providers: {
    [SwapVersion.Taproot]: RateProviderTaproot;
    [SwapVersion.Legacy]: RateProviderLegacy;
  };

  public readonly dataAggregator = new DataAggregator();
  public readonly rateCalculator = new RateCalculator(this.dataAggregator);

  // A list of all pairs that are specified in the config
  private readonly configPairs = new Set<string>();

  // A map of all pairs with hardcoded rates
  private readonly hardcodedPairs = new Set<string>();

  private readonly zeroConfAmounts = new Map<string, number>();
  private readonly swapTypes = new Map<string, SwapType[]>();
  private readonly pairConfigs = new Map<string, PairConfig>();

  private timer!: any;

  constructor(
    private readonly logger: Logger,
    private readonly rateUpdateInterval: number,
    private readonly currencies: Map<string, Currency>,
    private readonly walletManager: WalletManager,
    getFeeEstimation: (symbol: string) => Promise<Map<string, number>>,
  ) {
    this.feeProvider = new FeeProvider(
      this.logger,
      walletManager,
      this.dataAggregator,
      getFeeEstimation,
    );
    this.parseCurrencies(Array.from(currencies.values()));

    this.providers = {
      [SwapVersion.Taproot]: new RateProviderTaproot(
        this.currencies,
        this.feeProvider,
        this.pairConfigs,
        this.zeroConfAmounts,
      ),
      [SwapVersion.Legacy]: new RateProviderLegacy(
        this.currencies,
        this.feeProvider,
        this.pairConfigs,
        this.zeroConfAmounts,
      ),
    };
  }

  public init = async (pairs: PairConfig[]): Promise<void> => {
    pairs.forEach((pair) => {
      this.pairConfigs.set(getPairId(pair), pair);
    });

    await this.updateMinerFees();

    for (const pair of pairs) {
      const id = getPairId(pair);
      this.configPairs.add(id);
      this.swapTypes.set(id, this.parseSwapTypes(pair));

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

        this.hardcodedPairs.add(id);
        this.forProviders((provider) =>
          provider.setHardcodedPair(pair, this.swapTypes.get(id)!),
        );
      } else {
        this.dataAggregator.registerPair(pair.base, pair.quote);

        // TODO: find way to get <chain fee asset>/<token> rate without having to hardcode it here
        const checkAndRegisterToken = (symbol: string) => {
          if (this.currencies.get(symbol)!.type !== CurrencyType.ERC20) {
            return;
          }

          const chainFeeSymbol = this.walletManager.ethereumManagers.find(
            (manager) => manager.hasSymbol(symbol),
          )!.networkDetails.symbol;
          this.dataAggregator.registerPair(chainFeeSymbol, symbol);
        };

        checkAndRegisterToken(pair.base);
        checkAndRegisterToken(pair.quote);
      }
    }

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

  public has = (pairId: string) => this.configPairs.has(pairId);

  public setZeroConfAmount = async (symbol: string, amount: number) => {
    this.zeroConfAmounts.set(symbol, amount);
    await this.updateRates();
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

      // If the rate returned is "undefined" or "NaN" that means that all requests to the APIs of the exchanges
      // failed and that the pairs and limits don't have to be updated
      if (rate && !isNaN(rate)) {
        this.forProviders((provider) =>
          provider.updatePair(pairId, rate, this.swapTypes.get(pairId)!),
        );
      } else {
        this.logger.warn(`Could not fetch rates of ${pairId}`);
      }
    }

    // Update the miner fees of the pairs with a hardcoded rate
    this.hardcodedPairs.forEach((pairId) =>
      this.forProviders((provider) =>
        provider.updateHardcodedPair(pairId, this.swapTypes.get(pairId)!),
      ),
    );

    this.logger.silly('Updated rates');
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

  private parseSwapTypes = (config: PairConfig) => {
    if (config.swapTypes === undefined) {
      const allTypes = Object.keys(SwapType)
        .filter((s) => !isNaN(Number(s)))
        .map((s) => Number(s)) as SwapType[];

      this.logger.warn(
        `No swap types configured for ${getPairId(config)}; enabling all: ${allTypes.map(swapTypeToPrettyString).join(', ')}`,
      );
      return allTypes;
    }

    const types = config.swapTypes.map(stringToSwapType);
    this.logger.debug(
      `Enabling swap types for ${getPairId(config)}: ${types.map(swapTypeToString).join(', ')}`,
    );
    return types;
  };

  private forProviders = (fn: (provider: RateProviderBase<any>) => void) =>
    Object.values(this.providers).forEach(fn);
}

export default RateProvider;

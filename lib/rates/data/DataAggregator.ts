import { getPairId } from '../../Utils';
import { networks } from '../../wallet/ethereum/EvmNetworks';
import type Exchange from './Exchange';
import Binance from './exchanges/Binance';
import Bitfinex from './exchanges/Bitfinex';
import CoinbasePro from './exchanges/CoinbasePro';
import Kraken from './exchanges/Kraken';

class DataAggregator {
  private readonly exchanges: Exchange[] = [
    new Kraken(),
    new Binance(),
    new Bitfinex(),
    new CoinbasePro(),
  ];

  public readonly pairs = new Set<[string, string]>();

  public latestRates = new Map<string, number>();

  // Pairs that need to be fetched inverted (base/quote swapped)
  private readonly invertedPairs = new Set<string>();

  public registerPair = (baseAsset: string, quoteAsset: string): void => {
    this.pairs.add([baseAsset, quoteAsset]);
  };

  public fetchPairs = async (): Promise<Map<string, number>> => {
    const rateMap = new Map<string, number>();

    const queryPromises: Promise<void>[] = [];

    const queryRate = async (base: string, quote: string) => {
      const pairId = getPairId({ base, quote });
      const inversePairId = getPairId({ base: quote, quote: base });
      const rate = await this.getRateWithInverse(base, quote);

      if (rate !== undefined) {
        rateMap.set(pairId, rate);
        rateMap.set(inversePairId, 1 / rate);
      } else {
        // If the rate couldn't be fetched, the latest one should be used
        rateMap.set(pairId, this.latestRates.get(pairId) || NaN);
        rateMap.set(inversePairId, this.latestRates.get(inversePairId) || NaN);
      }
    };

    this.pairs.forEach(([baseAsset, quoteAsset]) => {
      queryPromises.push(queryRate(baseAsset, quoteAsset));
    });

    await Promise.all(queryPromises);

    this.latestRates = rateMap;
    return rateMap;
  };

  private getRateWithInverse = async (
    baseAsset: string,
    quoteAsset: string,
  ): Promise<number | undefined> => {
    const pairId = getPairId({ base: baseAsset, quote: quoteAsset });
    const shouldInvert = this.invertedPairs.has(pairId);

    const [first, second] = shouldInvert
      ? [quoteAsset, baseAsset]
      : [baseAsset, quoteAsset];

    // Try the preferred order first
    const rate = await this.getRate(first, second);
    if (rate !== undefined) {
      return shouldInvert ? 1 / rate : rate;
    }

    // Try the other order
    const inverseRate = await this.getRate(second, first);
    if (inverseRate !== undefined) {
      // Remember to use inverted order for subsequent fetches
      if (!shouldInvert) {
        this.invertedPairs.add(pairId);
      }
      return shouldInvert ? inverseRate : 1 / inverseRate;
    }

    return undefined;
  };

  private getRate = async (
    baseAsset: string,
    quoteAsset: string,
  ): Promise<number | undefined> => {
    const promises: Promise<number>[] = [];

    this.exchanges.forEach((exchange) =>
      promises.push(
        exchange.getPrice(
          this.assetMapper(baseAsset),
          this.assetMapper(quoteAsset),
        ),
      ),
    );

    const results = await Promise.all(
      promises.map((promise) => promise.catch((error) => error)),
    );

    // Filter all results that are not numeric (failed requests)
    const validResults: number[] = results.filter(
      (result) => !isNaN(Number(result)),
    );

    if (validResults.length === 0) {
      return undefined;
    }

    validResults.sort((a, b) => a - b);

    const middle = (validResults.length - 1) / 2;

    if (validResults.length % 2 === 0) {
      return (
        (validResults[Math.ceil(middle)] + validResults[Math.floor(middle)]) / 2
      );
    } else {
      return validResults[middle];
    }
  };

  private assetMapper = (asset: string) => {
    switch (asset) {
      case networks.Arbitrum.symbol:
        return 'ETH';
      case 'TBTC':
        return 'BTC';
      default:
        return asset;
    }
  };
}

export default DataAggregator;

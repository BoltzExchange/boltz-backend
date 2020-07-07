import Exchange from './Exchange';
import Binance from './exchanges/Binance';
import Bitfinex from './exchanges/Bitfinex';
import CoinbasePro from './exchanges/CoinbasePro';
import Kraken from './exchanges/Kraken';
import Poloniex from './exchanges/Poloniex';

class DataProvider {
  private readonly exchanges: Exchange[] = [
    new Binance(),
    new Bitfinex(),
    new CoinbasePro(),
    new Kraken(),
    new Poloniex(),
  ];

  public getPrice = async (baseAsset: string, quoteAsset: string): Promise<number> => {
    const promises: Promise<number>[] = [];

    this.exchanges.forEach(exchange => promises.push(exchange.getPrice(baseAsset, quoteAsset)));

    const results = await Promise.all(promises.map(promise => promise.catch(error => error)));

    // Filter all results that are not numeric (failed requests)
    const validResults: number[] = results.filter(result => !isNaN(Number(result)));
    validResults.sort((a, b) => a - b);

    const middle = (validResults.length - 1) / 2;

    if (validResults.length % 2 === 0) {
      return (validResults[Math.ceil(middle)] + validResults[Math.floor(middle)]) / 2;
    } else {
      return validResults[middle];
    }
  }
}

export default DataProvider;

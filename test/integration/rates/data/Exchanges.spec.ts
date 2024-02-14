import Bitfinex from '../../../../lib/rates/data/exchanges/Bitfinex';
import CoinbasePro from '../../../../lib/rates/data/exchanges/CoinbasePro';
import Kraken from '../../../../lib/rates/data/exchanges/Kraken';
import { baseAsset, checkPrice, quoteAsset } from './Consts';

describe('Exchanges', () => {
  // TODO: Binance banned all US IP addresses. What is a long term fix that? Remove Binance? Binance US?
  // eslint-disable-next-line jest/no-commented-out-tests
  /*
    test('should get price from Binance', async () => {
      const binance = new Binance();
      const price = await binance.getPrice(baseAsset, quoteAsset);

      checkPrice(price);
    });
  */

  test('should get price from Bitfinex', async () => {
    const bitfinex = new Bitfinex();
    const price = await bitfinex.getPrice(baseAsset, quoteAsset);

    checkPrice(price);
  });

  test('should get price from Coinbase Pro', async () => {
    const coinbase = new CoinbasePro();
    const price = await coinbase.getPrice(baseAsset, quoteAsset);

    checkPrice(price);
  });

  test('should get price from Kraken', async () => {
    const kraken = new Kraken();
    const price = await kraken.getPrice(baseAsset, quoteAsset);

    checkPrice(price);
  });
});

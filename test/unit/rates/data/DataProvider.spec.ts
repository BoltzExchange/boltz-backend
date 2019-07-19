import Binance from '../../../../lib/rates/data/exchanges/Binance';
import DataProvider from '../../../../lib/rates/data/DataProvider';

jest.mock('../../../../lib/rates/data/exchanges/Binance', () => {
  return jest.fn().mockImplementation(() => {
    return {};
  });
});

const mockedExchange = <jest.Mock<Binance>><any>Binance;

describe('DataProvider', () => {
  const createExchange = (price: number, throwError = false) => {
    const exchange = mockedExchange();

    exchange.getPrice = (_baseAsset: string, _quoteAsset: string) => {
      return new Promise((resolve, reject) => {
        if (throwError) {
          reject('API error');
        } else {
          resolve(price);
        }
      });
    };

    return exchange;
  };

  const baseAsset = 'LTC';
  const quoteAsset = 'BTC';

  const prices = [
    10,
    2,
    38,
    23,
    38,
    23,
    21,
    16,
    1000,
    0,
  ];

  const dataProvider = new DataProvider();
  const exchanges = dataProvider['exchanges'];

  beforeAll(() => {
    // To clear the existing 'readonly' array
    dataProvider['exchanges'].length = 0;

    prices.forEach((price) => {
      exchanges.push(createExchange(price));
    });
  });

  test('should calculate the median price of arrays with an even length', async () => {
    const price = await dataProvider.getPrice(baseAsset, quoteAsset);
    expect(price).toEqual(22);
  });

  test('should calculate the median price of array with an uneven length', async () => {
    exchanges.push(createExchange(35));

    const price = await dataProvider.getPrice(baseAsset, quoteAsset);
    expect(price).toEqual(23);
  });

  test('should calculate the median price of arrays with just one entry', async () => {
    const singleDataProvider = new DataProvider();

    const exchangePrice = 5;

    singleDataProvider['exchanges'].length = 0;
    singleDataProvider['exchanges'].push(createExchange(5));

    const price = await singleDataProvider.getPrice(baseAsset, quoteAsset);
    expect(price).toEqual(exchangePrice);
  });

  test('should handle errors', async () => {
    exchanges.push(createExchange(0, true));

    const price = await dataProvider.getPrice(baseAsset, quoteAsset);
    expect(price).toEqual(23);
  });
});

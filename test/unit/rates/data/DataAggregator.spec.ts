import Binance from '../../../../lib/rates/data/exchanges/Binance';
import DataAggregator from '../../../../lib/rates/data/DataAggregator';

jest.mock('../../../../lib/rates/data/exchanges/Binance', () => {
  return jest.fn().mockImplementation(() => {
    return {};
  });
});

const mockedExchange = <jest.Mock<Binance>><any>Binance;

describe('DataAggregator', () => {
  const createExchange = (price: number, throwError = false) => {
    const exchange = mockedExchange();

    exchange.getPrice = () => {
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

  const dataProvider = new DataAggregator();

  const getRate = dataProvider['getRate'];
  const exchanges = dataProvider['exchanges'];

  beforeAll(() => {
    // To clear the existing 'readonly' array
    dataProvider['exchanges'].length = 0;

    prices.forEach((price) => {
      exchanges.push(createExchange(price));
    });
  });

  test('should calculate the median price of arrays with an even length', async () => {
    const price = await getRate(baseAsset, quoteAsset);
    expect(price).toEqual(22);
  });

  test('should calculate the median price of array with an uneven length', async () => {
    exchanges.push(createExchange(35));

    const price = await getRate(baseAsset, quoteAsset);
    expect(price).toEqual(23);
  });

  test('should calculate the median price of arrays with just one entry', async () => {
    const singleDataAggregator = new DataAggregator();

    const exchangePrice = 5;

    singleDataAggregator['exchanges'].length = 0;
    singleDataAggregator['exchanges'].push(createExchange(5));

    const price = await singleDataAggregator['getRate'](baseAsset, quoteAsset);
    expect(price).toEqual(exchangePrice);
  });

  test('should handle errors', async () => {
    exchanges.push(createExchange(0, true));

    const price = await getRate(baseAsset, quoteAsset);
    expect(price).toEqual(23);
  });
});

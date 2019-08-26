import DataProvider from '../../../../lib/rates/data/DataProvider';
import { baseAsset, quoteAsset, checkPrice } from './Exchanges.spec';

describe('DataProvider', () => {
  const dataProvider = new DataProvider();

  test('should calculate the median price', async () => {
    const price = await dataProvider.getPrice(baseAsset, quoteAsset);

    checkPrice(price);
  });
});

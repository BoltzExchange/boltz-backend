import { baseAsset, quoteAsset, checkPrice } from './Consts';
import DataProvider from '../../../../lib/rates/data/DataProvider';

describe('DataProvider', () => {
  const dataProvider = new DataProvider();

  test('should calculate the median price', async () => {
    const price = await dataProvider.getPrice(baseAsset, quoteAsset);

    checkPrice(price);
  });
});

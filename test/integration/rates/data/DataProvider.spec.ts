import { baseAsset, quoteAsset, checkPrice } from './Consts';
import DataAggregator from '../../../../lib/rates/data/DataProvider';

describe('DataProvider', () => {
  const dataProvider = new DataAggregator();

  test('should calculate the median price', async () => {
    const price = await dataProvider.getPrice(baseAsset, quoteAsset);

    checkPrice(price);
  });
});

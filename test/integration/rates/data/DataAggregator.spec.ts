import { getPairId } from '../../../../lib/Utils';
import { baseAsset, quoteAsset, checkPrice } from './Consts';
import DataAggregator from '../../../../lib/rates/data/DataAggregator';

describe('DataProvider', () => {
  const dataAggregator = new DataAggregator();

  test('should register pairs', () => {
    dataAggregator.registerPair(baseAsset, quoteAsset);

    expect(dataAggregator.pairs.size).toEqual(1);
    expect(Array.from(dataAggregator.pairs.values())[0]).toEqual([baseAsset, quoteAsset]);
  });

  test('should calculate the median price', async () => {
    const result = await dataAggregator.fetchPairs();

    expect(result).toEqual(dataAggregator.latestRates);

    checkPrice(result.get(getPairId({ base: baseAsset, quote: quoteAsset }))!);
  });

  test('should fallback to latest rate when current cannot be fetched', async () => {
    const mockBaseAsset = 'SOME';
    const mockQuoteAsset = 'QueryFailure';

    const mockPair = getPairId({ base: mockBaseAsset, quote: mockQuoteAsset });

    dataAggregator.registerPair(mockBaseAsset, mockQuoteAsset);

    const latestMockPrice = 123;
    dataAggregator.latestRates.set(mockPair, latestMockPrice);

    const result = await dataAggregator.fetchPairs();

    expect(result.size).toEqual(2);
    expect(result.get(mockPair)).toEqual(latestMockPrice);
  });
});

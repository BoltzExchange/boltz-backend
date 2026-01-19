import { getPairId } from '../../../../lib/Utils';
import DataAggregator from '../../../../lib/rates/data/DataAggregator';
import { baseAsset, checkPrice, quoteAsset } from './Consts';

describe('DataProvider', () => {
  const dataAggregator = new DataAggregator();

  test('should register pairs', () => {
    dataAggregator.registerPair(baseAsset, quoteAsset);

    expect(dataAggregator.pairs.size).toEqual(1);
    expect(Array.from(dataAggregator.pairs.values())[0]).toEqual([
      baseAsset,
      quoteAsset,
    ]);
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

    expect(result.size).toEqual(4);
    expect(result.get(mockPair)).toEqual(latestMockPrice);
  });

  test('should populate inverse rate alongside direct rate', async () => {
    const aggregator = new DataAggregator();
    const base = 'BTC';
    const quote = 'ETH';
    const pairId = getPairId({ base, quote });
    const inversePairId = getPairId({ base: quote, quote: base });

    aggregator.registerPair(base, quote);

    const result = await aggregator.fetchPairs();

    const rate = result.get(pairId)!;
    const inverseRate = result.get(inversePairId)!;

    expect(rate).toBeGreaterThan(0);
    expect(inverseRate).toBeGreaterThan(0);

    expect(inverseRate).toBeCloseTo(1 / rate, 10);
  });

  test('should use inverse pair when direct pair fails and remember for subsequent fetches', async () => {
    const aggregator = new DataAggregator();
    const base = 'BTC';
    const quote = 'ETH';
    const pairId = getPairId({ base, quote });

    aggregator.registerPair(base, quote);

    const result1 = await aggregator.fetchPairs();
    const rate1 = result1.get(pairId)!;

    expect(rate1).toBeGreaterThan(0);

    const result2 = await aggregator.fetchPairs();
    const rate2 = result2.get(pairId)!;

    expect(rate2).toBeGreaterThan(0);
    expect(Math.abs(rate1 - rate2) / rate1).toBeLessThan(0.1);
  });

  test('should fallback to latest rates for both pair and inverse when fetching fails', async () => {
    const aggregator = new DataAggregator();
    const mockBase = 'INVALID';
    const mockQuote = 'PAIR';
    const mockPairId = getPairId({ base: mockBase, quote: mockQuote });
    const mockInversePairId = getPairId({ base: mockQuote, quote: mockBase });

    aggregator.registerPair(mockBase, mockQuote);

    const latestRate = 42;
    const latestInverseRate = 1 / latestRate;
    aggregator.latestRates.set(mockPairId, latestRate);
    aggregator.latestRates.set(mockInversePairId, latestInverseRate);

    const result = await aggregator.fetchPairs();

    expect(result.get(mockPairId)).toEqual(latestRate);
    expect(result.get(mockInversePairId)).toEqual(latestInverseRate);
  });
});

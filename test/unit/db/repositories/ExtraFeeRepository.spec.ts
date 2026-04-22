import ExtraFeeRepository, {
  type ExtraFeeStats,
} from '../../../../lib/db/repositories/ExtraFeeRepository';

describe('ExtraFeeRepository', () => {
  describe('mergeStats', () => {
    const baseStat: ExtraFeeStats = {
      year: '2026',
      month: '4',
      id: 'referral-a',
      pair: 'BTC/BTC',
      swap_count: 3,
      volume: '100000',
      failure_rate_submarine: 0,
      failure_rate_reverse: 0,
      failure_rate_chain: 0,
    };

    test('should merge extra-fee stats into the year/month/groups structure', () => {
      const merged = ExtraFeeRepository.mergeStats({}, [baseStat]);

      expect(merged['2026']['4'].groups!['referral-a']).toEqual({
        volume: { 'BTC/BTC': '0.00100000' },
        trades: { 'BTC/BTC': 3 },
        failureRates: {},
      });
    });

    test.each(['__proto__', 'constructor', 'prototype'])(
      'should refuse to merge stats whose id is the unsafe key "%s" and not pollute Object.prototype',
      (id) => {
        const before = Object.keys(Object.prototype).length;

        expect(() =>
          ExtraFeeRepository.mergeStats({}, [{ ...baseStat, id }]),
        ).toThrow(`unsafe object key: ${id}`);

        expect(Object.keys(Object.prototype).length).toBe(before);
        expect(({} as any).volume).toBeUndefined();
        expect(({} as any).trades).toBeUndefined();
        expect(({} as any).failureRates).toBeUndefined();
      },
    );
  });
});

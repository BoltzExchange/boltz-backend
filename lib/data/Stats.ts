import { satoshisToPaddedCoins } from '../DenominationConverter';
import StatsRepository, { StatsDate } from '../db/repositories/StatsRepository';
import { getNestedObject } from './Utils';

type MonthStats = {
  volume: Record<string, number>;
  trades: Record<string, number>;
  failureRates: {
    swaps: number;
    reverseSwaps: number;
  };
};

class Stats {
  private static readonly totalString = 'total';

  public static generate = async (
    minYear: number,
    minMonth: number,
    referral?: string,
  ): Promise<Record<string, Record<string, MonthStats>>> => {
    const [volumes, tradeCounts, failureRates] = await Promise.all([
      StatsRepository.getVolume(minYear, minMonth, referral),
      StatsRepository.getTradeCounts(minYear, minMonth, referral),
      StatsRepository.getFailureRates(minYear, minMonth, referral),
    ]);

    const stats = {};

    const getMonthObj = ({ year, month }: StatsDate) => {
      return getNestedObject(getNestedObject(stats, year), month);
    };

    volumes.forEach((volume) => {
      const obj = getNestedObject(getMonthObj(volume), 'volume');
      obj[volume.pair || Stats.totalString] = satoshisToPaddedCoins(volume.sum);
    });

    tradeCounts.forEach((counts) => {
      const obj = getNestedObject(getMonthObj(counts), 'trades');
      obj[counts.pair || Stats.totalString] = counts.count;
    });

    failureRates.forEach((fails) => {
      const obj = getNestedObject(getMonthObj(fails), 'failureRates');
      obj[fails.type] = fails.failureRate;
    });

    return stats;
  };
}

export default Stats;

import Swap from '../db/models/Swap';
import Referral from '../db/models/Referral';
import Report, { SwapArrays } from './Report';
import ReverseSwap from '../db/models/ReverseSwap';
import SwapRepository from '../db/repositories/SwapRepository';
import { mapToObject, splitPairId, stringify } from '../Utils';
import ReferralRepository from '../db/repositories/ReferralRepository';
import ReverseSwapRepository from '../db/repositories/ReverseSwapRepository';

class ReferralStats {
  constructor(
    private referralRepository: ReferralRepository,
    private swapRepository: SwapRepository,
    private reverseSwapRepository: ReverseSwapRepository,
  ) {}

  public generate = async (): Promise<string> => {
    const {
      swaps,
      reverseSwaps,
    } = await Report.getSuccessfulSwaps(
      this.swapRepository,
      this.reverseSwapRepository,
    );

    const swapsPerYear = new Map<number, Map<number, SwapArrays>>();

    const addSwapToYear = (swap: Swap | ReverseSwap, isReverse: boolean) => {
      let year = swapsPerYear.get(swap.createdAt.getFullYear());

      if (!year) {
        year = new Map<number, SwapArrays>();
        swapsPerYear.set(swap.createdAt.getFullYear(), year);
      }

      let monthArray = year.get(Report.getMonth(swap.createdAt));

      if (!monthArray) {
        monthArray = {
          swaps: [],
          reverseSwaps: [],
        };

        year.set(Report.getMonth(swap.createdAt), monthArray);
      }

      isReverse ? monthArray.reverseSwaps.push(swap as ReverseSwap) : monthArray.swaps.push(swap);
    };

    swaps.forEach((swap) => addSwapToYear(swap, false));
    reverseSwaps.forEach((reverseSwap) => addSwapToYear(reverseSwap, true));

    const referrals = await this.getReferrals();

    // Year -> Month -> Referral ID -> Currency -> Fee share amount
    const yearStats = new Map<number, Record<any, any>>();

    for (const [year, swapsYear] of swapsPerYear.entries()) {
      const monthStats = new Map<number, Record<any, any>>();

      for (const [month, swapsMonth] of swapsYear.entries()) {
        monthStats.set(month, this.generateMonth(referrals, swapsMonth));
      }

      yearStats.set(year, mapToObject(monthStats));
    }

    return stringify(mapToObject(yearStats));
  }

  // TODO: to whole coins?
  private generateMonth = (referrals: Map<string, Referral>, swaps: SwapArrays) => {
    const referralStats = new Map<string, Record<string, number>>();

    const addSwapToStats = (swap: Swap | ReverseSwap) => {
      if (swap.referral === null || swap.referral === undefined) {
        return;
      }

      const swapReferral = referrals.get(swap.referral);

      if (swapReferral === undefined) {
        return;
      }

      const { quote } = splitPairId(swap.pair);
      const referralFee = swap.fee! * (swapReferral.feeShare / 100);

      let referralOfSwapStats = referralStats.get(swapReferral.id);

      if (referralOfSwapStats === undefined) {
        referralOfSwapStats = {};
        referralStats.set(swapReferral.id, referralOfSwapStats);
      }

      if (referralOfSwapStats[quote] === undefined) {
        referralOfSwapStats[quote] = referralFee;
      } else {
        referralOfSwapStats[quote] += referralFee;
      }
    };

    swaps.swaps.forEach((swap) => addSwapToStats(swap));
    swaps.reverseSwaps.forEach((reverseSwap) => addSwapToStats(reverseSwap));

    return mapToObject(referralStats);
  }

  private getReferrals = async (): Promise<Map<string, Referral>> => {
    const referrals = await this.referralRepository.getReferrals();
    const referralsMap = new Map<string, Referral>();

    for (const referral of referrals) {
      referralsMap.set(referral.id, referral);
    }

    return referralsMap;
  }
}

export default ReferralStats;

import { getPairId, hashString, splitPairId } from '../../Utils';
import {
  OrderSide,
  PercentageFeeType,
  SwapType,
  SwapVersion,
} from '../../consts/Enums';
import { PairConfig } from '../../consts/Types';
import Errors from '../../service/Errors';
import { Currency } from '../../wallet/WalletManager';
import FeeProvider, { MinerFeesForVersion } from '../FeeProvider';
import RateProviderBase, { MinSwapSizeMultipliers } from './RateProviderBase';

type PairTypeLegacy = {
  hash: string;
  rate: number;
  limits: {
    minimal: number;
    maximal: number;

    maximalZeroConf: {
      baseAsset: number;
      quoteAsset: number;
    };
  };
  fees: {
    percentage: number;
    percentageSwapIn: number;
    minerFees: {
      baseAsset: MinerFeesForVersion;
      quoteAsset: MinerFeesForVersion;
    };
  };
};

const emptyMinerFees = {
  normal: 0,
  reverse: {
    claim: 0,
    lockup: 0,
  },
};

class RateProviderLegacy extends RateProviderBase<PairTypeLegacy> {
  public readonly pairs = new Map<string, PairTypeLegacy>();

  constructor(
    currencies: Map<string, Currency>,
    feeProvider: FeeProvider,
    minSwapSizeMultipliers: MinSwapSizeMultipliers,
    private readonly pairConfigs: Map<string, PairConfig>,
    private readonly zeroConfAmounts: Map<string, number>,
  ) {
    super(currencies, feeProvider, minSwapSizeMultipliers);
  }

  public setHardcodedPair = (pair: PairConfig) => {
    const id = getPairId(pair);

    const hardcodedPair = {
      hash: '',
      rate: pair.rate!,
      limits: this.getLimits(id, pair.rate!),
      fees: {
        percentageSwapIn: this.feeProvider.getPercentageFee(
          id,
          OrderSide.BUY,
          SwapType.Submarine,
          PercentageFeeType.Display,
          null,
        ),
        percentage: this.feeProvider.getPercentageFee(
          id,
          OrderSide.BUY,
          SwapType.ReverseSubmarine,
          PercentageFeeType.Display,
          null,
        ),
        minerFees: {
          baseAsset: emptyMinerFees,
          quoteAsset: emptyMinerFees,
        },
      },
    };
    hardcodedPair.hash = this.hashPair(hardcodedPair);

    this.setPair(id, hardcodedPair);
  };

  public updatePair = (pairId: string, rate: number) => {
    const { base, quote } = splitPairId(pairId);

    const pair = {
      rate,
      hash: '',
      limits: this.getLimits(pairId, rate),
      fees: {
        percentageSwapIn: this.feeProvider.getPercentageFee(
          pairId,
          OrderSide.BUY,
          SwapType.Submarine,
          PercentageFeeType.Display,
          null,
        ),
        percentage: this.feeProvider.getPercentageFee(
          pairId,
          OrderSide.BUY,
          SwapType.ReverseSubmarine,
          PercentageFeeType.Display,
          null,
        ),
        minerFees: {
          baseAsset: this.feeProvider.minerFees.get(base)![SwapVersion.Legacy],
          quoteAsset:
            this.feeProvider.minerFees.get(quote)![SwapVersion.Legacy],
        },
      },
    };
    pair.hash = this.hashPair(pair);

    this.setPair(pairId, pair);
  };

  public updateHardcodedPair = (pairId: string) => {
    const { base, quote } = splitPairId(pairId);
    const pairInfo = this.pairs.get(pairId);

    if (pairInfo === undefined) {
      return;
    }

    pairInfo.fees.minerFees = {
      baseAsset: this.feeProvider.minerFees.get(base)![SwapVersion.Legacy],
      quoteAsset: this.feeProvider.minerFees.get(quote)![SwapVersion.Legacy],
    };
    pairInfo.limits = this.getLimits(pairId, pairInfo.rate);

    pairInfo.hash = this.hashPair(pairInfo);

    this.setPair(pairId, pairInfo);
  };

  public validatePairHash = (hash: string, pairId: string) => {
    const pair = this.pairs.get(pairId);

    if (pair === undefined || hash !== pair.hash) {
      throw Errors.INVALID_PAIR_HASH();
    }
  };

  public getRate = (pairId: string): number | undefined =>
    this.pairs.get(pairId)?.rate;

  protected hashPair = (pair: PairTypeLegacy): string =>
    hashString(
      JSON.stringify({
        rate: pair.rate,
        fees: pair.fees,
        limits: pair.limits,
      }),
    );

  private getLimits = (pair: string, rate: number) => {
    const config = this.pairConfigs.get(pair);
    if (config === undefined) {
      throw `Could not get limits for pair: ${pair}`;
    }

    const { base, quote } = splitPairId(pair);

    return {
      maximal: config.maxSwapAmount,
      minimal: this.adjustMinimaForFees(
        base,
        quote,
        rate,
        config.minSwapAmount,
      ),

      maximalZeroConf: {
        baseAsset: this.zeroConfAmounts.get(base)!,
        quoteAsset: this.zeroConfAmounts.get(quote)!,
      },
    };
  };

  private setPair = (id: string, pair: PairTypeLegacy) => {
    if (this.pairConfigs.get(id)?.isLegacy) {
      this.pairs.set(id, pair);
    }
  };
}

export default RateProviderLegacy;
export { PairTypeLegacy };

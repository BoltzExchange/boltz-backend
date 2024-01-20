import {
  getChainCurrency,
  getLightningCurrency,
  getPairId,
  hashString,
  mapToObject,
  splitPairId,
} from '../../Utils';
import { OrderSide, SwapVersion } from '../../consts/Enums';
import { PairConfig } from '../../consts/Types';
import Errors from '../../service/Errors';
import NodeSwitch from '../../swap/NodeSwitch';
import { Currency } from '../../wallet/WalletManager';
import FeeProvider, { ReverseMinerFees } from '../FeeProvider';
import RateProviderBase from './RateProviderBase';

type PairLimits = {
  minimal: number;
  maximal: number;
};

type PairTypeTaproot = {
  hash: string;
  rate: number;
};

type SubmarinePairTypeTaproot = PairTypeTaproot & {
  limits: PairLimits & {
    maximalZeroConf: number;
  };
  fees: {
    percentage: number;
    minerFees: number;
  };
};

type ReversePairTypeTaproot = PairTypeTaproot & {
  limits: PairLimits;
  fees: {
    percentage: number;
    minerFees: ReverseMinerFees;
  };
};

type SwapTypes = SubmarinePairTypeTaproot | ReversePairTypeTaproot;

class RateProviderTaproot extends RateProviderBase<SwapTypes> {
  public readonly submarinePairs = new Map<
    string,
    Map<string, SubmarinePairTypeTaproot>
  >();

  public readonly reversePairs = new Map<
    string,
    Map<string, ReversePairTypeTaproot>
  >();

  constructor(
    currencies: Map<string, Currency>,
    feeProvider: FeeProvider,
    private readonly pairConfigs: Map<string, PairConfig>,
    private readonly zeroConfAmounts: Map<string, number>,
  ) {
    super(currencies, feeProvider);
  }

  public static serializePairs = <T>(
    map: Map<string, Map<string, T>>,
  ): Record<string, Record<string, T>> => {
    const obj = mapToObject(map);

    // Remove empty "from" currencies
    Object.entries(obj).forEach(([key, value]) => {
      if (Object.values(value).length === 0) {
        delete obj[key];
      }
    });

    return obj;
  };

  public setHardcodedPair = (pair: PairConfig) => {
    const id = getPairId(pair);

    for (const orderSide of [OrderSide.BUY, OrderSide.SELL]) {
      const rate = orderSide === OrderSide.BUY ? pair.rate! : 1 / pair.rate!;

      this.setPair<SubmarinePairTypeTaproot>(id, orderSide, false, rate, 0);

      this.setPair<ReversePairTypeTaproot>(id, orderSide, true, pair.rate!, {
        claim: 0,
        lockup: 0,
      });
    }
  };

  public updatePair = (pairId: string, rawRate: number) => {
    for (const orderSide of [OrderSide.BUY, OrderSide.SELL]) {
      const rate = orderSide === OrderSide.BUY ? rawRate : 1 / rawRate;

      this.setPair<SubmarinePairTypeTaproot>(pairId, orderSide, false, rate);
      this.setPair<ReversePairTypeTaproot>(pairId, orderSide, true, rate);
    }
  };

  public updateHardcodedPair = (pairId: string) => {
    for (const orderSide of [OrderSide.BUY, OrderSide.SELL]) {
      this.setPair<SubmarinePairTypeTaproot>(pairId, orderSide, false);
      this.setPair<ReversePairTypeTaproot>(pairId, orderSide, true);
    }
  };

  public validatePairHash = (
    hash: string,
    pairId: string,
    orderSide: OrderSide,
    isReverse: boolean,
  ) => {
    const nested = this.getToMap(pairId, orderSide, isReverse);
    if (nested === undefined) {
      throw Errors.PAIR_NOT_FOUND(pairId);
    }

    const pair = nested.toMap.get(nested.toAsset);
    if (pair === undefined) {
      throw Errors.PAIR_NOT_FOUND(pairId);
    }

    if (hash !== pair.hash) {
      throw Errors.INVALID_PAIR_HASH();
    }
  };

  private getToMap = <T = SwapTypes>(
    pairId: string,
    orderSide: OrderSide,
    isReverse: boolean,
    create: boolean = false,
  ):
    | { toMap: Map<string, T>; fromAsset: string; toAsset: string }
    | undefined => {
    const { base, quote } = splitPairId(pairId);
    const fromAsset = isReverse
      ? getLightningCurrency(base, quote, orderSide, true)
      : getChainCurrency(base, quote, orderSide, false);

    const toAsset = isReverse
      ? getChainCurrency(base, quote, orderSide, true)
      : getLightningCurrency(base, quote, orderSide, false);

    const toMap = (isReverse ? this.reversePairs : this.submarinePairs).get(
      fromAsset,
    );
    if (toMap === undefined) {
      if (!create) {
        return undefined;
      }

      const newMap = new Map<string, any>();
      (isReverse ? this.reversePairs : this.submarinePairs).set(
        fromAsset,
        newMap,
      );

      return {
        toAsset,
        fromAsset,
        toMap: newMap,
      };
    }

    return {
      toAsset,
      fromAsset,
      toMap: toMap as Map<string, T>,
    };
  };

  protected hashPair = (pair: SwapTypes) =>
    hashString(
      JSON.stringify({
        rate: pair.rate,
        fees: pair.fees,
        limits: pair.limits,
      }),
    );

  private setPair = <
    T extends SubmarinePairTypeTaproot | ReversePairTypeTaproot,
  >(
    pairId: string,
    orderSide: OrderSide,
    isReverse: boolean,
    rate?: number,
    minerFees?: T['fees']['minerFees'],
  ) => {
    const nested = this.getToMap<T>(pairId, orderSide, isReverse, true)!;

    if (
      !this.isPossibleCombination(isReverse, nested.fromAsset, nested.toAsset)
    ) {
      return;
    }

    if (rate === undefined) {
      rate = nested.toMap.get(nested.toAsset)?.rate;
      if (rate === undefined) {
        return;
      }
    }

    if (minerFees === undefined) {
      const { base, quote } = splitPairId(pairId);
      const minerFeesObj = this.feeProvider.minerFees.get(
        getChainCurrency(base, quote, orderSide, isReverse),
      )![SwapVersion.Taproot];
      minerFees = isReverse ? minerFeesObj.reverse : minerFeesObj.normal;
    }

    const percentageFees = this.feeProvider.getPercentageFees(pairId);

    const pair: T = {
      hash: '',
      rate: rate,
      limits: this.getLimits(pairId, orderSide, isReverse, rate) as T['limits'],
      fees: {
        percentage: isReverse
          ? percentageFees.percentage
          : percentageFees.percentageSwapIn,
        minerFees,
      },
    } as T;

    pair.hash = this.hashPair(pair);
    nested.toMap.set(nested.toAsset, pair);
  };

  private getLimits = (
    pair: string,
    orderSide: OrderSide,
    isReverse: boolean,
    rate: number,
  ): SwapTypes['limits'] => {
    const config = this.pairConfigs.get(pair);
    if (config === undefined) {
      throw `Could not get limits for pair: ${pair}`;
    }

    const { base, quote } = splitPairId(pair);

    const result = {
      maximal: config.maxSwapAmount,
      minimal: this.adjustMinimaForFees(
        base,
        quote,
        rate,
        config.minSwapAmount,
        orderSide,
        isReverse,
      ),
    };

    if (isReverse) {
      return result;
    }

    const chainCurrency = getChainCurrency(base, quote, orderSide, false);

    return {
      ...result,
      maximalZeroConf: this.zeroConfAmounts.get(chainCurrency)!,
    };
  };

  private isPossibleCombination = (
    isReverse: boolean,
    fromAsset: string,
    toAsset: string,
  ) => {
    if (isReverse) {
      return this.canLightning(fromAsset) && this.canOnchain(toAsset);
    }

    return this.canOnchain(fromAsset) && this.canLightning(toAsset);
  };

  private canLightning = (currency: string) => {
    const cur = this.currencies.get(currency);
    if (cur === undefined) {
      return false;
    }

    return NodeSwitch.hasClient(cur);
  };

  private canOnchain = (currency: string) => {
    const cur = this.currencies.get(currency);
    if (cur === undefined) {
      return false;
    }

    return cur.chainClient !== undefined || cur.provider !== undefined;
  };
}

export default RateProviderTaproot;
export { SubmarinePairTypeTaproot, ReversePairTypeTaproot };

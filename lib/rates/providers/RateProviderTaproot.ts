import {
  getChainCurrency,
  getLightningCurrency,
  getPairId,
  getReceivingChain,
  getSendingChain,
  hashString,
  mapToObject,
  roundToDecimals,
  splitPairId,
} from '../../Utils';
import {
  OrderSide,
  PercentageFeeType,
  SwapType,
  SwapVersion,
} from '../../consts/Enums';
import { ChainSwapPairConfig, PairConfig } from '../../consts/Types';
import Referral from '../../db/models/Referral';
import Errors from '../../service/Errors';
import NodeSwitch from '../../swap/NodeSwitch';
import { Currency } from '../../wallet/WalletManager';
import FeeProvider, {
  ChainSwapMinerFees,
  ReverseMinerFees,
} from '../FeeProvider';
import RateProviderBase, { MinSwapSizeMultipliers } from './RateProviderBase';

type PairLimits = {
  minimal: number;
  maximal: number;
};

type PairTypeTaproot = {
  hash: string;
  rate: number;
};

type PairLimitWithZeroConf = PairLimits & {
  maximalZeroConf: number;
};

type SubmarinePairTypeTaproot = PairTypeTaproot & {
  limits: PairLimitWithZeroConf;
  fees: {
    percentage: number;
    minerFees: number;
    maximalRoutingFee?: number;
  };
};

type ReversePairTypeTaproot = PairTypeTaproot & {
  limits: PairLimits;
  fees: {
    percentage: number;
    minerFees: ReverseMinerFees;
  };
};

type ChainPairTypeTaproot = PairTypeTaproot & {
  limits: PairLimitWithZeroConf;
  fees: {
    percentage: number;
    minerFees: ChainSwapMinerFees;
  };
};

type SwapTypes =
  | SubmarinePairTypeTaproot
  | ReversePairTypeTaproot
  | ChainPairTypeTaproot;

class RateProviderTaproot extends RateProviderBase<SwapTypes> {
  private readonly submarinePairs = new Map<
    string,
    Map<string, SubmarinePairTypeTaproot>
  >();

  private readonly reversePairs = new Map<
    string,
    Map<string, ReversePairTypeTaproot>
  >();

  private readonly chainPairs = new Map<
    string,
    Map<string, ChainPairTypeTaproot>
  >();

  constructor(
    currencies: Map<string, Currency>,
    feeProvider: FeeProvider,
    minSwapSizeMultipliers: MinSwapSizeMultipliers,
    private readonly pairConfigs: Map<string, PairConfig>,
    private readonly zeroConfAmounts: Map<string, number>,
  ) {
    super(currencies, feeProvider, minSwapSizeMultipliers);
  }

  public getSubmarinePairs = (
    referral?: Referral | null,
  ): typeof this.submarinePairs => {
    if (referral === null || referral === undefined) {
      return this.submarinePairs;
    }

    return this.deepCloneWithReferral(
      this.submarinePairs,
      SwapType.Submarine,
      referral,
    );
  };

  public getReversePairs = (
    referral?: Referral | null,
  ): typeof this.reversePairs => {
    if (referral === null || referral === undefined) {
      return this.reversePairs;
    }

    return this.deepCloneWithReferral(
      this.reversePairs,
      SwapType.ReverseSubmarine,
      referral,
    );
  };

  public getChainPairs = (
    referral?: Referral | null,
  ): typeof this.chainPairs => {
    if (referral === null || referral === undefined) {
      return this.chainPairs;
    }

    return this.deepCloneWithReferral(
      this.chainPairs,
      SwapType.Chain,
      referral,
    );
  };

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

  public setHardcodedPair = (pair: PairConfig, swapTypes: SwapType[]) => {
    const id = getPairId(pair);

    for (const orderSide of [OrderSide.BUY, OrderSide.SELL]) {
      const rate = orderSide === OrderSide.BUY ? pair.rate! : 1 / pair.rate!;

      this.setPair<SubmarinePairTypeTaproot>(
        swapTypes,
        id,
        orderSide,
        SwapType.Submarine,
        rate,
        0,
      );
      this.setPair<ReversePairTypeTaproot>(
        swapTypes,
        id,
        orderSide,
        SwapType.ReverseSubmarine,
        pair.rate!,
        {
          claim: 0,
          lockup: 0,
        },
      );
      this.setPair<ChainPairTypeTaproot>(
        swapTypes,
        id,
        orderSide,
        SwapType.Chain,
        pair.rate!,
        {
          server: 0,
          user: {
            claim: 0,
            lockup: 0,
          },
        },
      );
    }
  };

  public updatePair = (
    pairId: string,
    rawRate: number,
    swapTypes: SwapType[],
  ) => {
    for (const orderSide of [OrderSide.BUY, OrderSide.SELL]) {
      const rate = orderSide === OrderSide.BUY ? rawRate : 1 / rawRate;

      this.setPair<SubmarinePairTypeTaproot>(
        swapTypes,
        pairId,
        orderSide,
        SwapType.Submarine,
        rate,
      );
      this.setPair<ReversePairTypeTaproot>(
        swapTypes,
        pairId,
        orderSide,
        SwapType.ReverseSubmarine,
        rate,
      );
      this.setPair<ChainPairTypeTaproot>(
        swapTypes,
        pairId,
        orderSide,
        SwapType.Chain,
        rate,
      );
    }
  };

  public updateHardcodedPair = (pairId: string, swapTypes: SwapType[]) => {
    for (const orderSide of [OrderSide.BUY, OrderSide.SELL]) {
      this.setPair<SubmarinePairTypeTaproot>(
        swapTypes,
        pairId,
        orderSide,
        SwapType.Submarine,
      );
      this.setPair<ReversePairTypeTaproot>(
        swapTypes,
        pairId,
        orderSide,
        SwapType.ReverseSubmarine,
      );
      this.setPair<ChainPairTypeTaproot>(
        swapTypes,
        pairId,
        orderSide,
        SwapType.Chain,
      );
    }
  };

  public validatePairHash = (
    hash: string,
    pairId: string,
    orderSide: OrderSide,
    type: SwapType,
  ) => {
    const nested = this.getToMap(pairId, orderSide, type);
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

  public getRate = (pairId: string, type: SwapType): number | undefined => {
    const nested = this.getToMap(pairId, OrderSide.SELL, type);
    if (nested === undefined) {
      return undefined;
    }

    return nested.toMap.get(nested.toAsset)?.rate;
  };

  private getToMap = <T = SwapTypes>(
    pairId: string,
    orderSide: OrderSide,
    type: SwapType,
    create: boolean = false,
  ):
    | { toMap: Map<string, T>; fromAsset: string; toAsset: string }
    | undefined => {
    const { base, quote } = splitPairId(pairId);

    let baseMap: Map<string, Map<string, T>>;
    let fromAsset: string;
    let toAsset: string;

    switch (type) {
      case SwapType.Submarine:
        baseMap = this.submarinePairs as Map<string, Map<string, T>>;
        fromAsset = getChainCurrency(base, quote, orderSide, false);
        toAsset = getLightningCurrency(base, quote, orderSide, false);
        break;

      case SwapType.ReverseSubmarine:
        baseMap = this.reversePairs as Map<string, Map<string, T>>;
        fromAsset = getLightningCurrency(base, quote, orderSide, true);
        toAsset = getChainCurrency(base, quote, orderSide, true);
        break;

      case SwapType.Chain:
        baseMap = this.chainPairs as Map<string, Map<string, T>>;
        fromAsset = getReceivingChain(base, quote, orderSide);
        toAsset = getSendingChain(base, quote, orderSide);
        break;
    }

    const toMap = baseMap.get(fromAsset);
    if (toMap === undefined) {
      if (!create) {
        return undefined;
      }

      const newMap = new Map<string, T>();
      baseMap.set(fromAsset, newMap);

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

  private setPair = <T extends SwapTypes>(
    swapTypes: SwapType[],
    pairId: string,
    orderSide: OrderSide,
    type: SwapType,
    rate?: number,
    minerFees?: T['fees']['minerFees'],
  ) => {
    if (!swapTypes.includes(type)) {
      return;
    }

    const nested = this.getToMap<T>(pairId, orderSide, type, true)!;

    if (!this.isPossibleCombination(type, nested.fromAsset, nested.toAsset)) {
      return;
    }

    if (rate === undefined) {
      rate = nested.toMap.get(nested.toAsset)?.rate;
      if (rate === undefined) {
        return;
      }
    }

    if (minerFees === undefined) {
      minerFees = this.feeProvider.getSwapBaseFees<T['fees']['minerFees']>(
        pairId,
        orderSide,
        type,
        SwapVersion.Taproot,
      );
    }

    const pair: T = {
      hash: '',
      rate: rate,
      limits: this.getLimits(pairId, orderSide, type, rate) as T['limits'],
      fees: {
        percentage: this.feeProvider.getPercentageFee(
          pairId,
          orderSide,
          type,
          PercentageFeeType.Display,
          null,
        ),
        minerFees,
      },
    } as T;

    pair.hash = this.hashPair(pair);
    nested.toMap.set(nested.toAsset, pair);
  };

  private getLimits = (
    pair: string,
    orderSide: OrderSide,
    type: SwapType,
    rate: number,
  ): SwapTypes['limits'] => {
    const config = this.pairConfigs.get(pair);
    if (config === undefined) {
      throw `Could not get limits for pair: ${pair}`;
    }

    const { base, quote } = splitPairId(pair);
    const result = {
      maximal: this.getPairLimit('maxSwapAmount', config, type),
      minimal: this.adjustMinimaForFees(
        base,
        quote,
        rate,
        this.getPairLimit('minSwapAmount', config, type),
        orderSide,
        type,
      ),
    };

    if (type === SwapType.ReverseSubmarine) {
      return result;
    }

    const chainCurrency = getChainCurrency(base, quote, orderSide, false);

    return {
      ...result,
      maximalZeroConf: this.zeroConfAmounts.get(chainCurrency)!,
    };
  };

  private getPairLimit = (
    entry: keyof (ChainSwapPairConfig | PairConfig),
    config: PairConfig,
    type: SwapType,
  ): number => {
    if (type !== SwapType.Chain) {
      return config[entry];
    }

    const chainSwapConfigVar = config.chainSwap
      ? config.chainSwap[entry]
      : undefined;
    return chainSwapConfigVar || config[entry];
  };

  private isPossibleCombination = (
    type: SwapType,
    fromAsset: string,
    toAsset: string,
  ) => {
    switch (type) {
      case SwapType.Submarine:
        return this.canOnchain(fromAsset) && this.canLightning(toAsset);

      case SwapType.ReverseSubmarine:
        return this.canLightning(fromAsset) && this.canOnchain(toAsset);

      case SwapType.Chain:
        return (
          fromAsset !== toAsset &&
          this.canOnchain(fromAsset) &&
          this.canOnchain(toAsset)
        );
    }
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

  private deepCloneWithReferral = <
    T extends
      | SubmarinePairTypeTaproot
      | ReversePairTypeTaproot
      | ChainPairTypeTaproot,
    K extends Map<string, Map<string, T>>,
  >(
    map: K,
    type: SwapType,
    referral?: Referral | null,
  ): K => {
    return new Map(
      Array.from(map.entries()).map(([from, nested]) => [
        from,
        new Map(
          Array.from(nested.entries()).map(([to, value]) => {
            const pairIds = [
              [from, to],
              [to, from],
            ].map(([base, quote]) => getPairId({ base, quote }));

            const premium = referral?.premiumForPairs(pairIds, type);
            const limits = referral?.limitsForPairs(pairIds, type);

            const result = {
              ...value,
              limits: {
                ...value.limits,
                minimal: this.applyOverride(
                  Math.max,
                  value.limits.minimal,
                  limits?.minimal,
                ),
                maximal: this.applyOverride(
                  Math.min,
                  value.limits.maximal,
                  limits?.maximal,
                ),
              },
              fees: {
                ...value.fees,
                percentage: FeeProvider.addPremium(
                  value.fees.percentage,
                  premium,
                ),
              },
            };

            if (type === SwapType.Submarine) {
              const maxRoutingFeeOverride =
                referral?.maxRoutingFeeRatioForPairs(pairIds);

              if (maxRoutingFeeOverride !== undefined) {
                (result as SubmarinePairTypeTaproot).fees.maximalRoutingFee =
                  roundToDecimals(maxRoutingFeeOverride * 100, 4);
              } else {
                const currency = this.currencies.get(to);

                (result as SubmarinePairTypeTaproot).fees.maximalRoutingFee =
                  roundToDecimals(
                    (currency?.lndClient?.maxPaymentFeeRatio ||
                      currency?.clnClient?.maxPaymentFeeRatio ||
                      0) * 100,
                    4,
                  );
              }
            }

            return [to, result];
          }),
        ),
      ]),
    ) as K;
  };

  private applyOverride = (
    compFunc: (...values: number[]) => number,
    original: number,
    override?: number,
  ): number => {
    if (override === undefined) {
      return original;
    }

    return compFunc(original, override);
  };
}

export default RateProviderTaproot;
export {
  SwapTypes,
  SubmarinePairTypeTaproot,
  ReversePairTypeTaproot,
  ChainPairTypeTaproot,
};

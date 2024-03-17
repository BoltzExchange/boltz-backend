import {
  getChainCurrency,
  getLightningCurrency,
  getPairId,
  getReceivingChain,
  getSendingChain,
  hashString,
  mapToObject,
  splitPairId,
} from '../../Utils';
import { OrderSide, SwapType, SwapVersion } from '../../consts/Enums';
import { PairConfig } from '../../consts/Types';
import Errors from '../../service/Errors';
import NodeSwitch from '../../swap/NodeSwitch';
import { Currency } from '../../wallet/WalletManager';
import FeeProvider, {
  ChainSwapMinerFees,
  ReverseMinerFees,
} from '../FeeProvider';
import RateProviderBase from './RateProviderBase';

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
  public readonly submarinePairs = new Map<
    string,
    Map<string, SubmarinePairTypeTaproot>
  >();

  public readonly reversePairs = new Map<
    string,
    Map<string, ReversePairTypeTaproot>
  >();

  public readonly chainPairs = new Map<
    string,
    Map<string, ChainPairTypeTaproot>
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

      this.setPair<SubmarinePairTypeTaproot>(
        id,
        orderSide,
        SwapType.Submarine,
        rate,
        0,
      );
      this.setPair<ReversePairTypeTaproot>(
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

  public updatePair = (pairId: string, rawRate: number) => {
    for (const orderSide of [OrderSide.BUY, OrderSide.SELL]) {
      const rate = orderSide === OrderSide.BUY ? rawRate : 1 / rawRate;

      this.setPair<SubmarinePairTypeTaproot>(
        pairId,
        orderSide,
        SwapType.Submarine,
        rate,
      );
      this.setPair<ReversePairTypeTaproot>(
        pairId,
        orderSide,
        SwapType.ReverseSubmarine,
        rate,
      );
      this.setPair<ChainPairTypeTaproot>(
        pairId,
        orderSide,
        SwapType.Chain,
        rate,
      );
    }
  };

  public updateHardcodedPair = (pairId: string) => {
    for (const orderSide of [OrderSide.BUY, OrderSide.SELL]) {
      this.setPair<SubmarinePairTypeTaproot>(
        pairId,
        orderSide,
        SwapType.Submarine,
      );
      this.setPair<ReversePairTypeTaproot>(
        pairId,
        orderSide,
        SwapType.ReverseSubmarine,
      );
      this.setPair<ChainPairTypeTaproot>(pairId, orderSide, SwapType.Chain);
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
        fromAsset = getSendingChain(base, quote, orderSide);
        toAsset = getReceivingChain(base, quote, orderSide);
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
    pairId: string,
    orderSide: OrderSide,
    type: SwapType,
    rate?: number,
    minerFees?: T['fees']['minerFees'],
  ) => {
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
        percentage: this.feeProvider.getPercentageFees(pairId)[type],
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
      maximal: config.maxSwapAmount,
      minimal: this.adjustMinimaForFees(
        base,
        quote,
        rate,
        config.minSwapAmount,
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
        return this.canOnchain(fromAsset) && this.canOnchain(toAsset);
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
}

export default RateProviderTaproot;
export { SubmarinePairTypeTaproot, ReversePairTypeTaproot };

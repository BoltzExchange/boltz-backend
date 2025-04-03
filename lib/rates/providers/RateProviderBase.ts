import { getChainCurrency, getLightningCurrency } from '../../Utils';
import type { OrderSide } from '../../consts/Enums';
import { BaseFeeType, SwapType, SwapVersion } from '../../consts/Enums';
import type { PairConfig } from '../../consts/Types';
import NodeSwitch from '../../swap/NodeSwitch';
import type { Currency } from '../../wallet/WalletManager';
import type FeeProvider from '../FeeProvider';

type MinSwapSizeMultipliers = Record<SwapType, number>;

abstract class RateProviderBase<T> {
  protected constructor(
    protected readonly currencies: Map<string, Currency>,
    protected readonly feeProvider: FeeProvider,
    private readonly minSwapSizeMultipliers: MinSwapSizeMultipliers,
  ) {}

  public abstract setHardcodedPair(
    pair: PairConfig,
    swapTypes: SwapType[],
  ): void;

  public abstract updatePair(
    pairId: string,
    rate: number,
    swapTypes: SwapType[],
  ): void;

  public abstract updateHardcodedPair(
    pairId: string,
    swapTypes: SwapType[],
  ): void;

  public abstract validatePairHash(
    hash: string,
    pairId: string,
    orderSide: OrderSide,
    type: SwapType,
  ): void;

  public abstract getRate(pairId: string, type: SwapType): number | undefined;

  protected abstract hashPair(pair: T): string;

  protected adjustMinimaForFees = (
    base: string,
    quote: string,
    rate: number,
    configuredMinima: number,
    orderSide?: OrderSide,
    type?: SwapType,
  ) => {
    const minima = [configuredMinima];

    const isReverse = type === SwapType.ReverseSubmarine;

    const pairsToCheck =
      orderSide === undefined || type === SwapType.Chain
        ? [
            [base, quote],
            [quote, base],
          ]
        : [
            [
              getChainCurrency(base, quote, orderSide!, isReverse),
              getLightningCurrency(base, quote, orderSide!, isReverse),
            ],
          ];

    pairsToCheck
      .filter(
        ([chain, lightning]) =>
          type === SwapType.Chain ||
          this.isPossibleChainCurrency(chain, lightning),
      )
      .map(([currency]) => currency)
      .forEach((currency) => {
        let limit =
          this.feeProvider.getBaseFee(
            currency,
            SwapVersion.Legacy,
            BaseFeeType.NormalClaim,
          ) * this.minSwapSizeMultipliers[type || SwapType.Submarine];

        if (currency === base) {
          limit *= rate;
        }

        minima.push(limit);
      });

    return Math.ceil(Math.max(...minima));
  };

  private isPossibleChainCurrency = (
    chainCurrency: string,
    lightningCurrency: string,
  ): boolean => {
    return (
      this.currencies.get(chainCurrency)!.chainClient !== undefined &&
      NodeSwitch.hasClient(this.currencies.get(lightningCurrency)!)
    );
  };
}

export default RateProviderBase;
export { MinSwapSizeMultipliers };

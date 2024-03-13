import { getChainCurrency, getLightningCurrency } from '../../Utils';
import {
  BaseFeeType,
  OrderSide,
  SwapType,
  SwapVersion,
} from '../../consts/Enums';
import { PairConfig } from '../../consts/Types';
import NodeSwitch from '../../swap/NodeSwitch';
import { Currency } from '../../wallet/WalletManager';
import FeeProvider from '../FeeProvider';

abstract class RateProviderBase<T> {
  private static minLimitFactor = 2;

  protected constructor(
    protected readonly currencies: Map<string, Currency>,
    protected readonly feeProvider: FeeProvider,
  ) {}

  public abstract setHardcodedPair(pair: PairConfig): void;

  public abstract updatePair(pairId: string, rate: number): void;

  public abstract updateHardcodedPair(pairId: string): void;

  public abstract validatePairHash(
    hash: string,
    pairId: string,
    orderSide: OrderSide,
    type: SwapType,
  ): void;

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

    const pairsToCheck =
      orderSide === undefined || type === SwapType.Chain
        ? [
            [base, quote],
            [quote, base],
          ]
        : [
            [
              getChainCurrency(
                base,
                quote,
                orderSide!,
                type === SwapType.ReverseSubmarine,
              ),
              getLightningCurrency(
                base,
                quote,
                orderSide!,
                type === SwapType.ReverseSubmarine,
              ),
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
          ) * RateProviderBase.minLimitFactor;

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

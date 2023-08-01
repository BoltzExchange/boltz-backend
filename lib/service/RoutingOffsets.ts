import { getPairId } from '../Utils';
import { ConfigType } from '../Config';

type Params = {
  k: number;
  d: number;
};

class RoutingOffsets {
  private static readonly minOffset = 60;
  private static readonly maxOffset = 900;

  private params = new Map<string, Params>();
  private exceptions = new Map<string, Map<string, number>>();

  constructor(config: ConfigType) {
    config.pairs.forEach((pair) => {
      const k =
        (RoutingOffsets.maxOffset - RoutingOffsets.minOffset) /
        (pair.maxSwapAmount - pair.minSwapAmount);

      this.params.set(getPairId(pair), {
        k,
        d: RoutingOffsets.minOffset - k * pair.minSwapAmount,
      });
    });

    config.currencies.forEach((currency) => {
      this.exceptions.set(
        currency.symbol,
        new Map<string, number>(
          (currency.routingOffsetExceptions || []).map((exception) => [
            exception.nodeId,
            exception.offset,
          ]),
        ),
      );
    });
  }

  public getOffset = (
    pair: string,
    amount: number,
    lightningCurrency: string,
    destination: string,
  ): number => {
    return (
      this.getOffsetException(lightningCurrency, destination) ||
      this.calculateOffset(pair, amount)
    );
  };

  private getOffsetException = (
    lightningCurrency: string,
    destination: string,
  ) => {
    const exceptions = this.exceptions.get(lightningCurrency);
    if (exceptions === undefined) {
      return undefined;
    }

    return exceptions.get(destination);
  };

  private calculateOffset = (pair: string, amount: number) => {
    const params = this.params.get(pair);
    if (params === undefined) {
      return RoutingOffsets.maxOffset;
    }

    return Math.max(
      Math.min(
        Math.ceil(amount * params.k + params.d),
        RoutingOffsets.maxOffset,
      ),
      RoutingOffsets.minOffset,
    );
  };
}

export default RoutingOffsets;

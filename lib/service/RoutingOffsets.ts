import Logger from '../Logger';
import { ConfigType } from '../Config';
import { getPairId, mapToObject, stringify } from '../Utils';

type Params = {
  k: number;
  d: number;
};

class RoutingOffsets {
  private static readonly minOffset = 60;
  private static readonly maxOffset = 900;

  private params = new Map<string, Params>();
  private exceptions = new Map<string, Map<string, number>>();

  constructor(
    private logger: Logger,
    config: ConfigType,
  ) {
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
      const exceptions = new Map<string, number>(
        (currency.routingOffsetExceptions || []).map((exception) => [
          exception.nodeId,
          exception.offset,
        ]),
      );
      this.exceptions.set(currency.symbol, exceptions);
      this.logger.debug(
        `Using routing offset exceptions for ${currency.symbol}: ${stringify(
          mapToObject(exceptions),
        )}`,
      );
    });
  }

  public getOffset = (
    pair: string,
    amount: number,
    lightningCurrency: string,
    destinations: string[],
  ): number => {
    const exceptions = destinations
      .map((destination) => [
        destination,
        this.getOffsetException(lightningCurrency, destination),
      ])
      .filter(
        (exception): exception is [string, number] =>
          exception[1] !== undefined,
      );

    if (exceptions.length > 0) {
      const exception = exceptions.reduce((e, max) => {
        return e[1] > max[1] ? e : max;
      });
      this.logger.debug(
        `Using routing exception of ${exception[0]}: ${exception[1]}`,
      );
      return exception[1];
    }

    return this.calculateOffset(pair, amount);
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

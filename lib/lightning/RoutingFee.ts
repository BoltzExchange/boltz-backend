import type Logger from '../Logger';
import { getHexString, stringify } from '../Utils';
import type DecodedInvoice from '../sidecar/DecodedInvoice';

export type Config = {
  default?: number;
  overrides?: Record<string, number>;
};

class RoutingFee {
  private static readonly minFeeMillisatoshi = Math.ceil(121 * 1000);
  private static readonly maxFeeRatio = 0.1;

  public readonly defaultPaymentFeeRatio: number;

  private readonly overrides: Map<string, number>;

  constructor(
    private readonly logger: Logger,
    config?: Config,
  ) {
    const defaultRatio =
      config?.default !== undefined ? config.default : 0.0035;
    const overrides = config?.overrides !== undefined ? config.overrides : {};

    RoutingFee.validateRatio(defaultRatio, 'default');
    Object.entries(overrides).forEach(([nodeId, ratio]) =>
      RoutingFee.validateRatio(ratio, nodeId),
    );

    this.logger.debug(`Using routing fee default: ${defaultRatio}`);
    this.logger.debug(`Using routing fee overrides: ${stringify(overrides)}`);

    this.defaultPaymentFeeRatio = defaultRatio;
    this.overrides = new Map(
      Object.entries(overrides).map(([nodeId, ratio]) => [
        nodeId.toLowerCase(),
        ratio,
      ]),
    );
  }

  /**
   * Calculates the routing fee for a decoded invoice
   *
   * @param decoded the decoded Lightning invoice
   * @param maxPaymentFeeRatio the max payment fee ratio to use
   * @returns the calculated routing fee in milli-satoshis
   */
  public calculateFee = (
    decoded: DecodedInvoice,
    maxPaymentFeeRatio?: number,
  ) => {
    const amount = decoded.amountMsat;

    if (maxPaymentFeeRatio !== undefined) {
      return RoutingFee.calculatePaymentFee(amount, maxPaymentFeeRatio);
    }

    const destinations = [
      ...(decoded.payee ? [getHexString(decoded.payee)] : []),
      ...decoded.routingHints.flatMap((hint) => hint.map((hop) => hop.nodeId)),
      ...decoded.paths
        .map((path) => path.nodeId)
        .filter((nodeId) => nodeId !== undefined)
        .map((nodeId) => getHexString(nodeId)),
    ].map((destination) => destination.toLowerCase());

    const overrides = destinations
      .map(
        (destination) =>
          [destination, this.overrides.get(destination)] as [
            string,
            number | undefined,
          ],
      )
      .filter(
        (override): override is [string, number] => override[1] !== undefined,
      );

    const maxOverride =
      overrides.length === 0
        ? undefined
        : overrides.reduce((max, [destination, override]) => {
            if (override > max[1]) {
              return [destination, override];
            }

            return max;
          });

    let ratio: number | undefined;

    if (maxOverride !== undefined) {
      const [destination, override] = maxOverride;
      this.logger.debug(
        `Using routing fee override for ${destination}: ${override}`,
      );
      ratio = override;
    }

    return RoutingFee.calculatePaymentFee(
      amount,
      ratio ?? this.defaultPaymentFeeRatio,
    );
  };

  /**
   * Calculates the payment fee in milli-satoshis
   * @param amountMsat the amount in milli-satoshis
   * @param ratio the ratio of the payment fee
   * @returns the payment fee in milli-satoshis
   */
  private static calculatePaymentFee = (
    amountMsat: number,
    ratio: number,
  ): number =>
    Math.ceil(Math.max(amountMsat * ratio, RoutingFee.minFeeMillisatoshi));

  private static validateRatio = (ratio: number, name: string) => {
    if (ratio <= 0 || ratio >= RoutingFee.maxFeeRatio) {
      throw new Error(
        `invalid routing fee ratio for ${name}: ${ratio}. Must be > 0 and < ${RoutingFee.maxFeeRatio} (${RoutingFee.maxFeeRatio * 100}%)`,
      );
    }
  };
}

export default RoutingFee;

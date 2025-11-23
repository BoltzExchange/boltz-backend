import type Logger from '../../../Logger';
import type DeferredClaimer from '../DeferredClaimer';
import SweepTrigger from './SweepTrigger';

class AmountTrigger extends SweepTrigger {
  constructor(
    private readonly logger: Logger,
    private readonly pendingValues: typeof DeferredClaimer.prototype.pendingSweepsValues,
    private readonly sweepAmountTrigger?: number,
  ) {
    super();

    if (this.sweepAmountTrigger !== undefined) {
      if (typeof this.sweepAmountTrigger !== 'number') {
        throw new Error('sweepAmountTrigger is not a number');
      }

      if (this.sweepAmountTrigger <= 0) {
        throw new Error('sweepAmountTrigger is not positive');
      }

      this.logger.info(
        `Amount batch sweep trigger: ${this.sweepAmountTrigger}`,
      );
    } else {
      this.logger.info('Amount batch sweep trigger not set');
    }
  }

  public check = async (chainCurrency: string): Promise<boolean> => {
    if (this.sweepAmountTrigger === undefined) {
      return false;
    }

    const pendingValues = this.pendingValues().get(chainCurrency);
    if (pendingValues === undefined) {
      return false;
    }

    const toSweep = pendingValues.reduce(
      (acc, value) => acc + value.onchainAmount,
      0,
    );
    return toSweep >= this.sweepAmountTrigger;
  };

  public close = () => {};
}

export default AmountTrigger;

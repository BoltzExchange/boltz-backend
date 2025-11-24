import type { Job } from 'node-schedule';
import { scheduleJob } from 'node-schedule';
import type { SwapConfig } from '../../../Config';
import type Logger from '../../../Logger';
import { formatError } from '../../../Utils';
import type DeferredClaimer from '../DeferredClaimer';
import SweepTrigger from './SweepTrigger';

class ScheduledAmountTrigger extends SweepTrigger {
  private readonly threshold?: number;

  private batchClaimSchedule?: Job;

  constructor(
    private readonly logger: Logger,
    config: SwapConfig['scheduleAmountTrigger'] | undefined,
    private readonly pendingValues: typeof DeferredClaimer.prototype.pendingSweepsValues,
    private readonly onTrigger: (symbol: string) => Promise<void>,
  ) {
    super();

    if (config === undefined) {
      this.logger.warn('Scheduled amount trigger not set');
      return;
    }

    if (config.threshold === undefined) {
      throw new Error('scheduleAmountTrigger.threshold is required');
    }

    if (config.interval === undefined) {
      throw new Error('scheduleAmountTrigger.interval is required');
    }

    this.threshold = config.threshold;
    this.logger.verbose(
      `Scheduled amount trigger: >= ${this.threshold} every ${config.interval}`,
    );

    this.batchClaimSchedule = scheduleJob(config.interval, async () => {
      try {
        await this.checkAndTrigger();
      } catch (error) {
        this.logger.error(
          `Error in scheduled amount trigger check: ${formatError(error)}`,
        );
      }
    });
  }

  public check = async (): Promise<boolean> => {
    // Scheduled amount trigger doesn't check per-swap conditions
    // It triggers on a schedule instead
    return false;
  };

  public close = () => {
    this.batchClaimSchedule?.cancel();
    this.batchClaimSchedule = undefined;
  };

  private checkAndTrigger = async () => {
    if (this.threshold === undefined) {
      return;
    }

    for (const [symbol, pendingValues] of this.pendingValues()) {
      const totalAmount = pendingValues.reduce(
        (acc, value) => acc + value.onchainAmount,
        0,
      );

      if (totalAmount >= this.threshold) {
        this.logger.verbose(
          `Scheduled amount trigger for ${symbol}: ${totalAmount} >= ${this.threshold}`,
        );
        try {
          await this.onTrigger(symbol);
        } catch (triggerError) {
          this.logger.error(
            `Error triggering scheduled amount sweep for ${symbol}: ${formatError(triggerError)}`,
          );
        }
      }
    }
  };
}

export default ScheduledAmountTrigger;

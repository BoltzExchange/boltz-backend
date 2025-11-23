import type { Job } from 'node-schedule';
import { scheduleJob } from 'node-schedule';
import type Logger from '../../../Logger';
import SweepTrigger from './SweepTrigger';

class IntervalTrigger extends SweepTrigger {
  private batchClaimSchedule?: Job;

  constructor(
    private readonly logger: Logger,
    private readonly interval: string,
    callback: () => Promise<void>,
  ) {
    super();

    this.logger.verbose(`Batch claim interval: ${this.interval}`);

    this.batchClaimSchedule = scheduleJob(this.interval, async () => {
      this.logger.verbose('Batch claim interval triggered');
      await callback();
    });
  }

  public check = async (): Promise<boolean> => {
    // Interval trigger doesn't check per-swap conditions
    // It triggers on a schedule instead
    return false;
  };

  public close = () => {
    this.batchClaimSchedule?.cancel();
    this.batchClaimSchedule = undefined;
  };
}

export default IntervalTrigger;

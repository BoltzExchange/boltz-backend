import { execFile } from 'child_process';
import Logger from '../Logger';
import { Emojis } from './Markup';
import NotificationClient from './clients/NotificationClient';

type DiskUsage = {
  total: number;
  available: number;
};

class DiskUsageChecker {
  private alertSent = false;

  private static rootDir = '/';
  private static gigabyte = 1024 ** 2;
  private static warningThreshold = 0.9;

  constructor(
    private logger: Logger,
    private notificationClient: NotificationClient,
  ) {}

  public checkUsage = async (): Promise<void> => {
    const { available, total } = await this.getUsage();

    const used = total - available;
    const usedPercentage = used / total;

    if (usedPercentage >= DiskUsageChecker.warningThreshold) {
      if (!this.alertSent) {
        const message =
          `${Emojis.RotatingLight} Disk usage is **${this.formatNumber(
            usedPercentage * 100,
          )}%**: ` +
          `**${this.formatNumber(
            this.convertToGb(available),
          )} GB** of **${this.formatNumber(
            this.convertToGb(total),
          )} GB** available ${Emojis.RotatingLight}`;

        this.logger.warn(message);
        await this.notificationClient.sendMessage(message);

        this.alertSent = true;
      }
    } else {
      this.alertSent = false;
    }
  };

  private getUsage = async (): Promise<DiskUsage> => {
    return new Promise((resolve, reject) => {
      execFile(
        'df',
        ['-P', '-k', DiskUsageChecker.rootDir],
        (error, stdout) => {
          if (error) {
            reject(error);
            return;
          }

          const lines = stdout.split('\n');

          if (lines.length < 2) {
            throw new Error(`unexpected df output: ${stdout}`);
          }

          const parts = lines[1].split(' ').filter((x) => {
            return x !== '';
          });

          resolve({
            total: Number(parts[1]),
            available: Number(parts[3]),
          });
        },
      );
    });
  };

  private formatNumber = (toFormat: number) => {
    return Number(toFormat.toFixed(2));
  };

  private convertToGb = (bytes: number) => {
    return bytes / DiskUsageChecker.gigabyte;
  };
}

export default DiskUsageChecker;
export { DiskUsage };

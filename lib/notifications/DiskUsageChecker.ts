import { platform } from 'os';
import { check } from 'diskusage';
import Logger from '../Logger';
import { Emojis } from './Markup';
import DiscordClient from './DiscordClient';

class DiskUsageChecker {
  private alertSent = false;

  private static warningThreshold = 0.9;
  private static rootDir = platform() !== 'win32' ? '/' : 'C:';

  constructor(private logger: Logger, private discord: DiscordClient) {}

  public checkUsage = async (): Promise<void> => {
    const { available, total } = await check(DiskUsageChecker.rootDir);

    const used = total - available;
    const usedPercentage = used / total;

    if (usedPercentage >= DiskUsageChecker.warningThreshold) {
      if (!this.alertSent) {
        const message = `${Emojis.RotatingLight} Disk usage is **${this.formatNumber(usedPercentage * 100)}%**: ` +
          `**${this.formatNumber(this.convertToGb(available))} GB** of **${this.formatNumber(this.convertToGb(total))} GB** available ${Emojis.RotatingLight}`;

        this.logger.warn(message);
        await this.discord.sendMessage(message);

        this.alertSent = true;
      }
    } else {
      this.alertSent = false;
    }
  }

  private formatNumber = (toFormat: number) => {
    return Number(toFormat.toFixed(2));
  }

  private convertToGb = (bytes: number) => {
    return bytes / 1073741824;
  }
}

export default DiskUsageChecker;

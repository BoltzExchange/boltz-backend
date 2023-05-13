import { scheduleJob } from 'node-schedule';
import Errors from './Errors';
import Logger from '../Logger';
import { formatError } from '../Utils';
import Webdav from './providers/Webdav';
import { BackupConfig } from '../Config';
import GoogleCloud from './providers/GoogleCloud';
import EventHandler from '../service/EventHandler';

interface BackupProvider {
  uploadString(path: string, data: string): Promise<void>;
  uploadFile(path: string, file: string): Promise<void>;
}

class BackupScheduler {
  private readonly providers: BackupProvider[] = [];

  constructor(
    private logger: Logger,
    private dbpath: string,
    private config: BackupConfig,
    private eventHandler: EventHandler,
  ) {
    try {
      if (config.gcloud && GoogleCloud.configValid(config.gcloud)) {
        this.providers.push(new GoogleCloud(config.gcloud));
        this.logProviderEnabled('Google Cloud Storage');
      }

      if (config.webdav && Webdav.configValid(config.webdav)) {
        this.providers.push(new Webdav(config.webdav));
        this.logProviderEnabled('WebDav');
      }

      if (this.providers.length === 0) {
        this.logger.warn('Disabled backups because no provider was specified');
        return;
      }

      this.subscribeChannelBackups();
      this.logger.info('Started channel backup subscription');

      this.logger.verbose(
        `Scheduling database backups: ${this.config.interval}`,
      );
      scheduleJob(this.config.interval, async (date) => {
        await this.uploadDatabase(date);
      });
    } catch (error) {
      this.logger.warn(`Could not start backup scheduler: ${error}`);
    }
  }

  private static getDate = (date: Date) => {
    let str = '';

    for (const elem of [
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      '-',
      date.getHours(),
      date.getMinutes(),
    ]) {
      str +=
        typeof elem === 'number' ? BackupScheduler.addLeadingZeros(elem) : elem;
    }

    return str;
  };

  /**
   * Adds a leading 0 to the provided number if it is smaller than 10
   */
  private static addLeadingZeros = (number: number) => {
    return `${number}`.padStart(2, '0');
  };

  public uploadDatabase = async (date: Date): Promise<void> => {
    if (this.providers.length === 0) {
      throw Errors.BACKUP_DISABLED();
    }

    const dateString = BackupScheduler.getDate(date);
    this.logger.silly(`Backing up databases at: ${dateString}`);

    await this.uploadFile(`backend/database-${dateString}.db`, this.dbpath);
  };

  private uploadFile = async (path: string, file: string) => {
    try {
      await Promise.all(
        this.providers.map((provider) => provider.uploadFile(path, file)),
      );
      this.logger.silly(`Uploaded file ${file} to: ${path}`);
    } catch (error) {
      this.logger.warn(`Could not upload file ${path}: ${error}`);
    }
  };

  private uploadString = async (path: string, data: string) => {
    try {
      await Promise.all(
        this.providers.map((provider) => provider.uploadString(path, data)),
      );
      this.logger.silly(`Uploaded data into file: ${path}`);
    } catch (error) {
      this.logger.warn(
        `Could not upload data to file ${path}: ${formatError(error)}`,
      );
    }
  };

  private subscribeChannelBackups = () => {
    this.eventHandler.on(
      'channel.backup',
      async (currency: string, channelBackup: string) => {
        const dateString = BackupScheduler.getDate(new Date());

        await this.uploadString(
          `lnd/${currency}/multiChannelBackup-${dateString}`,
          channelBackup,
        );
      },
    );
  };

  private logProviderEnabled = (name: string) => {
    this.logger.verbose(`Enabled ${name} backup provider`);
  };
}

export default BackupScheduler;
export { BackupProvider };

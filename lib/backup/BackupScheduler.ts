import { readFileSync } from 'fs';
import { scheduleJob } from 'node-schedule';
import { Storage, Bucket } from '@google-cloud/storage';
import Errors from './Errors';
import Logger from '../Logger';
import Report from '../data/Report';
import { BackupConfig } from '../Config';
import EventHandler from '../service/EventHandler';

class BackupScheduler {
  private bucket?: Bucket;

  constructor(
    private logger: Logger,
    private dbpath: string,
    private config: BackupConfig,
    private eventHandler: EventHandler,
    private report: Report) {

    if (
      config.email === '' ||
      config.privatekeypath === '' ||
      config.bucketname === ''
    ) {
      logger.warn('Disabled backups because of incomplete configuration');
      return;
    }

    const storage = new Storage({
      credentials: {
        client_email: config.email,
        private_key: readFileSync(config.privatekeypath, 'utf-8'),
      },
    });

    this.bucket = storage.bucket(config.bucketname);

    this.subscribeChannelBackups();
    this.logger.info('Started channel backup subscription');

    this.logger.verbose(`Scheduling database backups: ${this.config.interval}`);
    scheduleJob(this.config.interval, async (date) => {
      await this.uploadDatabase(date);
      await this.uploadReport();
    });
  }

  private static getDate = (date: Date) => {
    return `${date.getFullYear()}${BackupScheduler.addLeadingZeros(date.getMonth())}${BackupScheduler.addLeadingZeros(date.getDate())}` +
      `-${BackupScheduler.addLeadingZeros(date.getHours())}${BackupScheduler.addLeadingZeros(date.getMinutes())}`;
  }

  /**
   * Adds a leading 0 to the provided number if it is smalled than 10
   */
  private static addLeadingZeros = (number: number) => {
    return `${number}`.padStart(2, '0');
  }

  public uploadDatabase = async (date: Date) => {
    if (!this.bucket) {
      throw Errors.BACKUP_DISABLED();
    }

    const dateString = BackupScheduler.getDate(date);
    this.logger.silly(`Backing up databases at: ${dateString}`);

    await this.uploadFile(this.dbpath, dateString);
  }

  public uploadReport = async () => {
    if (!this.bucket) {
      return;
    }

    const data = await this.report.generate();
    await this.uploadString('report.csv', data);
  }

  private uploadFile = async (path: string, date: string) => {
    try {
      const destination = `backend/database-${date}.db`;

      await this.bucket!.upload(path, {
        destination,
      });

      this.logger.silly(`Uploaded file ${path} to: ${destination}`);
    } catch (error) {
      this.logger.warn(`Could not upload file: ${error}`);
      throw error;
    }
  }

  private uploadString = async (fileName: string, data: string) => {
    try {
      const file = this.bucket!.file(fileName);
      await file.save(data);

      this.logger.silly(`Uploaded data into file: ${fileName}`);
    } catch (error) {
      this.logger.warn(`Could not upload data to file: ${error}`);
      throw error;
    }
  }

  private subscribeChannelBackups = () => {
    this.eventHandler.on('channel.backup', async (currency: string, channelBackup: string) => {
      const dateString = BackupScheduler.getDate(new Date());

      await this.uploadString(`lnd/${currency}/multiChannelBackup-${dateString}`, channelBackup);
    });
  }
}

export default BackupScheduler;
export { BackupConfig };

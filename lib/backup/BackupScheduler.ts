import { exec } from 'child_process';
import { unlinkSync } from 'fs';
import { scheduleJob } from 'node-schedule';
import { BackupConfig, PostgresConfig } from '../Config';
import Logger from '../Logger';
import { formatError } from '../Utils';
import EventHandler from '../service/EventHandler';
import Errors from './Errors';
import S3 from './providers/S3';

interface BackupProvider {
  uploadString(path: string, data: string): Promise<void>;
  uploadFile(path: string, file: string): Promise<void>;
}

class BackupScheduler {
  private readonly providers: BackupProvider[] = [];

  constructor(
    private readonly logger: Logger,
    private readonly postgresConfig: PostgresConfig | undefined,
    private readonly config: BackupConfig,
    private readonly eventHandler: EventHandler,
  ) {
    try {
      if (config.simpleStorage && S3.configValid(config.simpleStorage)) {
        this.providers.push(new S3(config.simpleStorage));
        this.logProviderEnabled('S3');
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
      this.logger.error(`Could not start backup scheduler: ${error}`);
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
    this.logger.silly(`Backing up database at: ${dateString}`);

    const backupPath = `backend/database-${dateString}.sql.gz`;
    const tempFilePath = `sql-backup-${Date.now().toString()}.temp`;

    return new Promise<void>((resolve, reject) => {
      const backupChild = exec(
        `PGPASSWORD="${this.postgresConfig!.password}" pg_dump -U ${this.postgresConfig!.username} -h ${this.postgresConfig!.host} -p ${this.postgresConfig!.port} -d ${this.postgresConfig!.database} | gzip > ${tempFilePath}`,
      );
      backupChild.on('exit', (code) => {
        if (code !== 0) {
          reject(`creating PostgreSQL backup failed with code: ${code}`);
          return;
        }

        this.uploadFile(backupPath, tempFilePath)
          .then(() => {
            unlinkSync(tempFilePath);
            resolve();
          })
          .catch(reject);
      });
    });
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
      async ({ currency, channelBackup }) => {
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

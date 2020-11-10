import { Sequelize } from 'sequelize';
import Logger from '../Logger';
import Swap from './models/Swap';
import { decodeInvoice } from '../Utils';
import ReverseSwap from './models/ReverseSwap';
import ChannelCreation from './models/ChannelCreation';
import DatabaseVersion from './models/DatabaseVersion';
import DatabaseVersionRepository from './DatabaseVersionRepository';

class Migration {
  private versionRepository: DatabaseVersionRepository;

  private static latestSchemaVersion = 2;

  constructor(private logger: Logger, private sequelize: Sequelize) {
    this.versionRepository = new DatabaseVersionRepository();
  }

  public migrate = async (): Promise<void> => {
    await DatabaseVersion.sync();
    const versionRow = await this.versionRepository.getVersion();

    // When no version row is found, just insert the latest version into the database
    if (!versionRow) {
      this.logger.verbose('No schema version found in database');
      this.logger.debug(`Inserting latest schema version ${Migration.latestSchemaVersion} in database`);

      await this.versionRepository.createVersion(Migration.latestSchemaVersion);
      return;
    }

    switch (versionRow.version) {
      // TODO: query lockup vout when migrating
      case 1: {
        this.logOutdatedVersion(versionRow.version);

        this.logUpdatingTable('swaps');

        // Add the missing columns to make querying via the model possible
        await this.sequelize.query('ALTER TABLE swaps ADD failureReason VARCHAR(255)');
        await this.sequelize.query('ALTER TABLE swaps ADD lockupTransactionVout VARCHAR(255)');

        const allSwaps = await Swap.findAll();
        const allChannelCreations = await ChannelCreation.findAll();

        // To drop the "swaps" table, we also need to drop "channelCreations" because it has a foreign constraint
        await this.dropTable('channelCreations');
        await this.dropTable('swaps');

        await Swap.sync();
        await ChannelCreation.sync();

        for (const swap of allSwaps) {
          await Swap.create({
            ...this.getModelDataValues(swap),
          });
        }

        for (const channelCreation of allChannelCreations) {
          await ChannelCreation.create({
            ...this.getModelDataValues(channelCreation),
          });
        }

        this.logUpdatingTable('reverseSwaps');

        // Add the missing columns to make querying via the model possible
        await this.sequelize.query('ALTER TABLE reverseSwaps ADD claimAddress VARCHAR(255)');
        await this.sequelize.query('ALTER TABLE reverseSwaps ADD preimageHash VARCHAR(255)');
        await this.sequelize.query('ALTER TABLE reverseSwaps ADD failureReason VARCHAR(255)');

        const allReverseSwaps = await ReverseSwap.findAll();

        await this.dropTable('reverseSwaps');

        await ReverseSwap.sync();

        for (const reverseSwap of allReverseSwaps) {
          await ReverseSwap.create({
            ...this.getModelDataValues(reverseSwap),
            preimageHash: decodeInvoice(reverseSwap.invoice).paymentHash!,
          });
        }

        this.logger.info(`Finished database migration to schema version ${versionRow.version + 1}`);
        await this.versionRepository.updateVersion(versionRow.version + 1);

        await this.migrate();
        break;
      }

      case Migration.latestSchemaVersion:
        this.logger.verbose(`Database at latest schema version ${Migration.latestSchemaVersion}`);
        break;

      default:
        throw `found unexpected database version ${versionRow.version}`;
    }
  }

  private dropTable = async (table: string) => {
    await this.sequelize.query(`DROP TABLE ${table}`);
  }

  private getModelDataValues = (model: any) => {
    return model['dataValues'];
  }

  private logUpdatingTable = (table: string) => {
    this.logger.debug(`Updating database table ${table}`);
  }

  private logOutdatedVersion = (version: number) => {
    this.logger.warn(`Found database with outdated schema version ${version}`);
    this.logger.info(`Starting migration to database schema version ${version + 1}`);
  }
}

export default Migration;

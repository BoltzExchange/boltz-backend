import { DataTypes, Sequelize } from 'sequelize';
import { detectSwap } from 'boltz-core';
import { Transaction } from 'bitcoinjs-lib';
import Logger from '../Logger';
import Swap from './models/Swap';
import ReverseSwap from './models/ReverseSwap';
import { Currency } from '../wallet/WalletManager';
import ChannelCreation from './models/ChannelCreation';
import DatabaseVersion from './models/DatabaseVersion';
import DatabaseVersionRepository from './DatabaseVersionRepository';
import { decodeInvoice, formatError, getChainCurrency, getHexBuffer, splitPairId } from '../Utils';

// TODO: integration tests for actual migrations
class Migration {
  private versionRepository: DatabaseVersionRepository;

  private static latestSchemaVersion = 3;

  constructor(private logger: Logger, private sequelize: Sequelize) {
    this.versionRepository = new DatabaseVersionRepository();
  }

  public migrate = async (currencies: Map<string, Currency>): Promise<void> => {
    await DatabaseVersion.sync();
    const versionRow = await this.versionRepository.getVersion();

    // When no version row is found, just insert the latest version into the database
    if (!versionRow) {
      this.logger.verbose('No schema version found in database');
      this.logger.debug(`Inserting latest schema version ${Migration.latestSchemaVersion} in database`);

      await this.versionRepository.createVersion(Migration.latestSchemaVersion);
      return;
    }

    if (versionRow.version === Migration.latestSchemaVersion) {
      this.logger.verbose(`Database has latest schema version ${Migration.latestSchemaVersion}`);
      return;
    }

    this.logOutdatedVersion(versionRow.version);

    switch (versionRow.version) {
      // The migration from schema version 1 to 2 adds support for Ether and ERC20 tokens
      // Which means that we can safely assume that all Swaps that are in the database
      // already were on a Bitcoin like chain
      case 1: {
        // Sanity check the chain clients
        for (const currency of currencies.values()) {
          try {
            if (currency.chainClient) {
              this.logger.debug(`Sanity checking ${currency.symbol} chain client for migration`);
              await currency.chainClient!.getBlockchainInfo();
              this.logger.debug(`${currency.symbol} chain client is ready for migration`);
            }
          } catch (error) {
            throw `could not connect to to chain client of ${currency.symbol}: ${formatError(error)}`;
          }
        }

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
          let lockupTransactionVout: number | null = null;

          if (swap.lockupTransactionId) {
            const { base, quote } = splitPairId(swap.pair);
            const chainCurrency = getChainCurrency(base, quote, swap.orderSide, false);
            const chainClient = currencies.get(chainCurrency)!.chainClient!;

            const lockupTransaction = Transaction.fromHex(await chainClient.getRawTransaction(swap.lockupTransactionId));

            lockupTransactionVout = detectSwap(getHexBuffer(swap.redeemScript!), lockupTransaction)!.vout;
          }

          await Swap.create({
            ...this.getModelDataValues(swap),
            lockupTransactionVout,
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
          // The "claimAddress" does not have to be set because it is only needed for Swaps on the Ethereum chain and
          // databases of the schema version 1 do not support Ethereum Swaps
          await ReverseSwap.create({
            ...this.getModelDataValues(reverseSwap),
            preimageHash: decodeInvoice(reverseSwap.invoice).paymentHash!,
          });
        }

        await this.finishMigration(versionRow.version, currencies);
        break;
      }

      // Database schema version 2 adds support for the prepay miner fee on the Ethereum chain
      case 2:
        this.logUpdatingTable('reverseSwaps');

        await this.sequelize.getQueryInterface().addColumn(
          'reverseSwaps',
          'minerFeeOnchainAmount',
          {
            type: new DataTypes.INTEGER(),
            allowNull: true,
          },
        );

        // Because adding unique columns is not possible with SQLite, that property is omitted here
        await this.sequelize.getQueryInterface().addColumn(
          'reverseSwaps',
          'minerFeeInvoicePreimage',
          {
            type: new DataTypes.STRING(64),
            allowNull: true,
          },
        );

        await this.finishMigration(versionRow.version, currencies);
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
    this.logger.verbose(`Updating database table ${table}`);
  }

  private finishMigration = async (updatedFromVersion: number, currencies: Map<string, Currency>) => {
    const currentVersion = updatedFromVersion + 1;

    this.logger.info(`Finished database migration to schema version ${currentVersion}`);
    await this.versionRepository.updateVersion(currentVersion);

    // Run the migration again if the current schema version is not the latest one
    if (currentVersion !== Migration.latestSchemaVersion) {
      await this.migrate(currencies);
    }
  }

  private logOutdatedVersion = (version: number) => {
    this.logger.warn(`Found database with outdated schema version ${version}`);
    this.logger.info(`Starting migration to database schema version ${version + 1}`);
  }
}

export default Migration;

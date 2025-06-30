import { types } from 'pg';
import Sequelize from 'sequelize';
import type { PostgresConfig } from '../Config';
import type Logger from '../Logger';
import type { Currency } from '../wallet/WalletManager';
import Migration from './Migration';
import ChainSwap from './models/ChainSwap';
import ChainSwapData from './models/ChainSwapData';
import ChainTip from './models/ChainTip';
import ChannelCreation from './models/ChannelCreation';
import DatabaseVersion from './models/DatabaseVersion';
import ExtraFee from './models/ExtraFee';
import KeyProvider from './models/KeyProvider';
import LightningPayment from './models/LightningPayment';
import MarkedSwap from './models/MarkedSwap';
import Pair from './models/Pair';
import PendingEthereumTransaction from './models/PendingEthereumTransaction';
import PendingLockupTransaction from './models/PendingLockupTransaction';
import Rebroadcast from './models/Rebroadcast';
import Referral from './models/Referral';
import RefundTransaction from './models/RefundTransaction';
import ReverseRoutingHint from './models/ReverseRoutingHint';
import ReverseSwap from './models/ReverseSwap';
import Swap from './models/Swap';
import TransactionLabel from './models/TransactionLabel';
import TransactionLabelRepository from './repositories/TransactionLabelRepository';

// To make sure that PostgreSQL types are parsed correctly
types.setTypeParser(types.builtins.INT8, parseInt);
types.setTypeParser(types.builtins.NUMERIC, parseFloat);
types.setTypeParser(types.builtins.FLOAT8, parseFloat);

class Database {
  public static readonly memoryDatabase = ':memory:';

  public static sequelize: Sequelize.Sequelize;

  private migration: Migration;

  /**
   * @param logger logger that should be used
   * @param sqlitePath the file path to the SQLite database; if ':memory:' the database will be stored in the memory
   * @param postgresConfig configuration of connection to a PostgreSQL database; takes precedence over SQLite if set
   * @param isTest in tests we still use SQLite, but we do not allow it when running the backend
   */
  constructor(
    private readonly logger: Logger,
    sqlitePath?: string,
    postgresConfig?: PostgresConfig,
    isTest: boolean = true,
  ) {
    if (
      postgresConfig !== undefined &&
      [postgresConfig.host, postgresConfig.port, postgresConfig.database].every(
        (value) => value !== undefined,
      )
    ) {
      Database.sequelize = new Sequelize.Sequelize({
        host: postgresConfig.host,
        port: postgresConfig.port,
        database: postgresConfig.database,
        username: postgresConfig.username,
        password: postgresConfig.password,
        dialect: 'postgres',
        logging: this.logger.silly,
      });
    } else {
      if (!isTest) {
        throw 'SQLite database not supported anymore';
      }

      Database.sequelize = new Sequelize.Sequelize({
        dialect: 'sqlite',
        storage: sqlitePath,
        logging: this.logger.silly,
        retry: {
          max: 3,
          match: ['SQLITE_BUSY'],
        },
      });
    }

    this.loadModels();

    this.migration = new Migration(this.logger, Database.sequelize);
  }

  public init = async (): Promise<void> => {
    try {
      await Database.sequelize.authenticate();
      this.logger.info('Connected to PostgreSQL database');
    } catch (error) {
      this.logger.error(`Could not connect to database: ${error}`);
      throw error;
    }

    await Promise.all([
      Pair.sync(),
      ChainTip.sync(),
      Referral.sync(),
      ExtraFee.sync(),
      KeyProvider.sync(),
      Rebroadcast.sync(),
      DatabaseVersion.sync(),
      TransactionLabel.sync(),
      PendingEthereumTransaction.sync(),
    ]);

    await Promise.all([Swap.sync(), ReverseSwap.sync(), ChainSwap.sync()]);
    await Promise.all([
      MarkedSwap.sync(),
      ChainSwapData.sync(),
      LightningPayment.sync(),
      ChannelCreation.sync(),
      ReverseRoutingHint.sync(),
      PendingLockupTransaction.sync(),
      RefundTransaction.sync(),
    ]);
  };

  public migrate = async (currencies: Map<string, Currency>): Promise<void> => {
    await this.migration.migrate(currencies);
  };

  public backFillMigrations = async (
    currencies: Map<string, Currency>,
  ): Promise<void> => {
    await this.migration.backFillMigrations(currencies);
  };

  public close = (): Promise<void> => {
    return Database.sequelize.close();
  };

  private loadModels = () => {
    Pair.load(Database.sequelize);
    ExtraFee.load(Database.sequelize);
    Referral.load(Database.sequelize);
    Swap.load(Database.sequelize);
    TransactionLabel.load(Database.sequelize);
    LightningPayment.load(Database.sequelize);
    ChainSwap.load(Database.sequelize);
    ChainSwapData.load(Database.sequelize);
    ChainTip.load(Database.sequelize);
    ReverseSwap.load(Database.sequelize);
    MarkedSwap.load(Database.sequelize);
    KeyProvider.load(Database.sequelize);
    ChannelCreation.load(Database.sequelize);
    DatabaseVersion.load(Database.sequelize);
    ReverseRoutingHint.load(Database.sequelize);
    PendingLockupTransaction.load(Database.sequelize);
    PendingEthereumTransaction.load(Database.sequelize);
    Rebroadcast.load(Database.sequelize);
    RefundTransaction.load(Database.sequelize);

    TransactionLabelRepository.setLogger(this.logger);
  };
}

export default Database;

import { types } from 'pg';
import Sequelize from 'sequelize';
import { PostgresConfig } from '../Config';
import Logger from '../Logger';
import { Currency } from '../wallet/WalletManager';
import Migration from './Migration';
import ChainSwap from './models/ChainSwap';
import ChainSwapData from './models/ChainSwapData';
import ChainTip from './models/ChainTip';
import ChannelCreation from './models/ChannelCreation';
import DatabaseVersion from './models/DatabaseVersion';
import KeyProvider from './models/KeyProvider';
import PendingPayment from './models/LightningPayment';
import MarkedSwap from './models/MarkedSwap';
import Pair from './models/Pair';
import PendingEthereumTransaction from './models/PendingEthereumTransaction';
import PendingLockupTransaction from './models/PendingLockupTransaction';
import Referral from './models/Referral';
import ReverseRoutingHint from './models/ReverseRoutingHint';
import ReverseSwap from './models/ReverseSwap';
import Swap from './models/Swap';

// To make sure that PostgreSQL types are parsed correctly
types.setTypeParser(types.builtins.INT8, parseInt);
types.setTypeParser(types.builtins.NUMERIC, parseFloat);
types.setTypeParser(types.builtins.FLOAT8, parseFloat);

enum DatabaseType {
  'SQLite',
  'PostgreSQL',
}

class Database {
  public static readonly memoryDatabase = ':memory:';

  public static type: DatabaseType = DatabaseType.PostgreSQL;
  public static sequelize: Sequelize.Sequelize;

  private migration: Migration;

  /**
   * @param logger logger that should be used
   * @param sqlitePath the file path to the SQLite database; if ':memory:' the database will be stored in the memory
   * @param postgresConfig configuration of connection to a PostgreSQL database; takes precedence over SQLite if set
   */
  constructor(
    private readonly logger: Logger,
    private readonly sqlitePath?: string,
    postgresConfig?: PostgresConfig,
  ) {
    if (
      postgresConfig !== undefined &&
      [postgresConfig.host, postgresConfig.port, postgresConfig.database].every(
        (value) => value !== undefined,
      )
    ) {
      Database.type = DatabaseType.PostgreSQL;
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
      Database.type = DatabaseType.SQLite;
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

      switch (Database.type) {
        case DatabaseType.PostgreSQL:
          this.logger.info('Connected to PostgreSQL database');
          break;

        case DatabaseType.SQLite:
          this.logger.info(
            `Connected to database: ${
              this.sqlitePath === Database.memoryDatabase
                ? 'in memory'
                : this.sqlitePath
            }`,
          );
          break;
      }
    } catch (error) {
      this.logger.error(`Could not connect to database: ${error}`);
      throw error;
    }

    await Promise.all([
      Pair.sync(),
      ChainTip.sync(),
      Referral.sync(),
      KeyProvider.sync(),
      DatabaseVersion.sync(),
      PendingEthereumTransaction.sync(),
    ]);

    await Promise.all([Swap.sync(), ReverseSwap.sync(), ChainSwap.sync()]);
    await Promise.all([
      MarkedSwap.sync(),
      ChainSwapData.sync(),
      PendingPayment.sync(),
      ChannelCreation.sync(),
      ReverseRoutingHint.sync(),
      PendingLockupTransaction.sync(),
    ]);
  };

  public migrate = async (currencies: Map<string, Currency>): Promise<void> => {
    await this.migration.migrate(currencies);
  };

  public close = (): Promise<void> => {
    return Database.sequelize.close();
  };

  private loadModels = () => {
    Pair.load(Database.sequelize);
    Referral.load(Database.sequelize);
    Swap.load(Database.sequelize);
    PendingPayment.load(Database.sequelize);
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
  };
}

export default Database;
export { DatabaseType };

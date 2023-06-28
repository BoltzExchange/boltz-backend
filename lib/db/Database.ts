import Sequelize from 'sequelize';
import Logger from '../Logger';
import Pair from './models/Pair';
import Swap from './models/Swap';
import Migration from './Migration';
import ChainTip from './models/ChainTip';
import Referral from './models/Referral';
import ReverseSwap from './models/ReverseSwap';
import KeyProvider from './models/KeyProvider';
import { Currency } from '../wallet/WalletManager';
import DatabaseVersion from './models/DatabaseVersion';
import ChannelCreation from './models/ChannelCreation';
import PendingEthereumTransaction from './models/PendingEthereumTransaction';

class Database {
  public static readonly memoryDatabase = ':memory:';

  public static sequelize: Sequelize.Sequelize;

  private migration: Migration;

  /**
   * @param logger logger that should be used
   * @param storage the file path to the SQLite database; if ':memory:' the database will be stored in the memory
   */
  constructor(private logger: Logger, private storage: string) {
    Database.sequelize = new Sequelize.Sequelize({
      storage,
      dialect: 'sqlite',
      logging: this.logger.silly,
    });

    this.loadModels();

    this.migration = new Migration(this.logger, Database.sequelize);
  }

  public init = async (): Promise<void> => {
    try {
      await Database.sequelize.authenticate();
      this.logger.info(
        `Connected to database: ${
          this.storage === ':memory:' ? 'in memory' : this.storage
        }`,
      );
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

    await Promise.all([Swap.sync(), ReverseSwap.sync()]);

    await ChannelCreation.sync();
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
    ChainTip.load(Database.sequelize);
    ReverseSwap.load(Database.sequelize);
    KeyProvider.load(Database.sequelize);
    ChannelCreation.load(Database.sequelize);
    DatabaseVersion.load(Database.sequelize);
    PendingEthereumTransaction.load(Database.sequelize);
  };
}

export default Database;

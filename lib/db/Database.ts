import Sequelize from 'sequelize';
import Logger from '../Logger';
import Pair from './models/Pair';
import Swap from './models/Swap';
import Migration from './Migration';
import ChainTip from './models/ChainTip';
import ReverseSwap from './models/ReverseSwap';
import KeyProvider from './models/KeyProvider';
import DatabaseVersion from './models/DatabaseVersion';
import ChannelCreation from './models/ChannelCreation';

class Db {
  public sequelize: Sequelize.Sequelize;

  private migration: Migration;

  /**
   * @param logger logger that should be used
   * @param storage the file path to the SQLite databse; if ':memory:' the databse will be stored in the memory
   */
  constructor(private logger: Logger, private storage: string) {
    this.sequelize = new Sequelize.Sequelize({
      storage,
      dialect: 'sqlite',
      logging: this.logger.silly,
    });

    this.loadModels();

    this.migration = new Migration(this.logger, this.sequelize);
  }

  public init = async (): Promise<void> => {
    try {
      await this.sequelize.authenticate();
      this.logger.info(`Connected to database: ${this.storage === ':memory:' ? 'in memory' : this.storage}`);
    } catch (error) {
      this.logger.error(`Could not connect to database: ${error}`);
      throw error;
    }

    await this.migration.migrate();

    await Promise.all([
      Pair.sync(),
      ChainTip.sync(),
      KeyProvider.sync(),
      DatabaseVersion.sync(),
    ]);

    await Promise.all([
      Swap.sync(),
      ReverseSwap.sync(),
    ]);

    await ChannelCreation.sync();
  }

  public close = (): Promise<void> => {
    return this.sequelize.close();
  }

  private loadModels = () => {
    Pair.load(this.sequelize);
    Swap.load(this.sequelize);
    ChainTip.load(this.sequelize);
    ReverseSwap.load(this.sequelize);
    KeyProvider.load(this.sequelize);
    ChannelCreation.load(this.sequelize);
    DatabaseVersion.load(this.sequelize);
  }
}

export default Db;

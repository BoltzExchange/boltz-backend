import Sequelize from 'sequelize';
import Logger from '../Logger';
import Pair from './models/Pair';
import Swap from './models/Swap';
import ReverseSwap from './models/ReverseSwap';
import KeyProvider from './models/KeyProvider';

class Db {
  public sequelize: Sequelize.Sequelize;

  /**
   * @param storage the file path to the SQLite databse; if ':memory:' the databse will be stored in the memory
   */
  constructor(private logger: Logger, private storage: string) {
    this.sequelize = new Sequelize.Sequelize({
      storage,
      dialect: 'sqlite',
      logging: this.logger.silly,
    });

    this.loadModels();
  }

  public init = async () => {
    try {
      await this.sequelize.authenticate();
      this.logger.info(`Connected to database: ${this.storage === ':memory:' ? 'in memory' : this.storage}`);
    } catch (error) {
      this.logger.error(`Could not connect to database: ${error}`);
      throw error;
    }

    await Promise.all([
      Pair.sync(),
      KeyProvider.sync(),
    ]);

    await Promise.all([
      Swap.sync(),
      ReverseSwap.sync(),
    ]);
  }

  public close = async () => {
    await this.sequelize.close();
  }

  private loadModels = () => {
    Pair.load(this.sequelize);
    Swap.load(this.sequelize);
    ReverseSwap.load(this.sequelize);
    KeyProvider.load(this.sequelize);
  }
}

export default Db;

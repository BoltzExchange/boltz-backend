import Sequelize from 'sequelize';
import Logger from '../Logger';
import Utxo from './models/Utxo';
import Pair from './models/Pair';
import Swap from './models/Swap';
import Output from './models/Output';
import Wallet from './models/Wallet';
import ReverseSwap from './models/ReverseSwap';

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

    await Wallet.sync();
    await Output.sync(),
    await Utxo.sync();

    await Pair.sync();

    await Promise.all([
      Swap.sync(),
      ReverseSwap.sync(),
    ]);
  }

  public close = async () => {
    await this.sequelize.close();
  }

  private loadModels = () => {
    Wallet.load(this.sequelize);
    Output.load(this.sequelize);
    Utxo.load(this.sequelize);
    Pair.load(this.sequelize);
    Swap.load(this.sequelize);
    ReverseSwap.load(this.sequelize);
  }
}

export default Db;

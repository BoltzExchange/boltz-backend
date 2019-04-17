import Sequelize from 'sequelize';
import Logger from '../Logger';
import Utxo from './models/Utxo';
import Output from './models/Output';
import Wallet from './models/Wallet';

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
  }

  public close = async () => {
    await this.sequelize.close();
  }

  private loadModels = () => {
    Wallet.load(this.sequelize);
    Output.load(this.sequelize);
    Utxo.load(this.sequelize);
  }
}

export default Db;

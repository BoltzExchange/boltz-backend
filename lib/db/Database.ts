import fs from 'fs';
import path from 'path';
import Sequelize from 'sequelize';
import * as db from '../consts/Database';
import Logger from '../Logger';

type Models = {
  Wallet: Sequelize.Model<db.WalletInstance, db.WalletAttributes>;
  Output: Sequelize.Model<db.OutputInstance, db.OutputAttributes>;
  Utxo: Sequelize.Model<db.UtxoInstance, db.UtxoAttributes>;
};

class Db {
  public sequelize: Sequelize.Sequelize;
  public models: Models;

  /**
   * @param storage the file path to the SQLite databse; if ':memory:' the databse will be stored in the memory
   */
  constructor(private logger: Logger, private storage: string) {
    this.sequelize = new Sequelize({
      storage,
      logging: this.logger.silly,
      dialect: 'sqlite',
      operatorsAliases: false,
    });

    this.models = this.loadModels();
  }

  public init = async () => {
    try {
      await this.sequelize.authenticate();
      this.logger.info(`Connected to database: ${this.storage === ':memory:' ? 'in memory' : this.storage}`);
    } catch (error) {
      this.logger.error(`Could not connect to database: ${error}`);
      throw error;
    }

    await this.models.Wallet.sync();

    await Promise.all([
      this.models.Output.sync(),
      this.models.Utxo.sync(),
    ]);
  }

  public close = async () => {
    await this.sequelize.close();
  }

  private loadModels = (): Models => {
    const models: { [index: string]: Sequelize.Model<any, any> } = {};
    const modelsFolder = path.join(__dirname, 'models');

    fs.readdirSync(modelsFolder)
      .filter(file => (file.indexOf('.') !== 0) && (file !== path.basename(__filename)) &&
       (file.endsWith('.js') || file.endsWith('.ts')) && !file.endsWith('.d.ts'))
      .forEach((file) => {
        const model = this.sequelize.import(path.join(modelsFolder, file));
        models[model.name] = model;
      });

    Object.keys(models).forEach((key) => {
      const model = models[key];
      if (model.associate) {
        model.associate(models);
      }
    });

    return <Models>models;
  }
}

export default Db;
export { Models };

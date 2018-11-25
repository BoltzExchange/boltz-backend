import Sequelize from 'sequelize';
import * as db from '../../consts/Database';

export default (sequelize: Sequelize.Sequelize, dataTypes: Sequelize.DataTypes) => {
  const attributes: db.SequelizeAttributes<db.WalletAttributes> = {
    symbol: { type: dataTypes.STRING, primaryKey: true, allowNull: true },
    highestUsedIndex: { type: dataTypes.INTEGER, allowNull: false },
    derivationPath: { type: dataTypes.STRING, allowNull: false },
  };

  const options: Sequelize.DefineOptions<db.WalletInstance> = {
    tableName: 'wallets',
    timestamps: false,
  };

  return sequelize.define<db.WalletInstance, db.WalletAttributes>('Wallet', attributes, options);
};

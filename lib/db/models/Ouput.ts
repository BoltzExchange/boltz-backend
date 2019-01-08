import Sequelize from 'sequelize';
import * as db from '../../consts/Database';

export default (sequelize: Sequelize.Sequelize, dataTypes: Sequelize.DataTypes) => {
  const attributes: db.SequelizeAttributes<db.OutputAttributes> = {
    id: { type: dataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    script: { type: dataTypes.STRING, allowNull: false },
    redeemScript: { type: dataTypes.STRING, allowNull: true },
    currency: { type: dataTypes.STRING, allowNull: false },
    keyIndex: { type: dataTypes.INTEGER, allowNull: false },
    type: { type: dataTypes.INTEGER, allowNull: false },
  };

  const options: Sequelize.DefineOptions<db.OutputInstance> = {
    tableName: 'outputs',
    timestamps: false,
  };

  const Output = sequelize.define<db.OutputInstance, db.OutputAttributes>('Output', attributes, options);

  Output.associate = (models: Sequelize.Models) => {
    models.Utxo.belongsTo(models.Wallet, {
      foreignKey: 'currency',
    });
  };

  return Output;
};

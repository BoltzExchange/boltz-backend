import Sequelize from 'sequelize';
import * as db from '../../consts/Database';

export default (sequelize: Sequelize.Sequelize, dataTypes: Sequelize.DataTypes) => {
  const attributes: db.SequelizeAttributes<db.UtxoAttributes> = {
    txHash: { type: dataTypes.STRING, primaryKey: true, allowNull: false },
    currency: { type: dataTypes.STRING, allowNull: false },
    keyIndex: { type: dataTypes.INTEGER, allowNull: false },
    vout: { type: dataTypes.INTEGER, allowNull: false },
    script: { type: dataTypes.STRING, allowNull: false },
    redeemScript: { type: dataTypes.STRING, allowNull: true },
    value: { type: dataTypes.INTEGER, allowNull: false },
    type: { type: dataTypes.INTEGER, allowNull: false },
    confirmed: { type: dataTypes.BOOLEAN, allowNull: true },
  };

  const options: Sequelize.DefineOptions<db.UtxoInstance> = {
    tableName: 'utxos',
    timestamps: false,
  };

  const Utxo = sequelize.define<db.UtxoInstance, db.UtxoAttributes>('Utxo', attributes, options);

  Utxo.associate = (models: Sequelize.Models) => {
    models.Utxo.belongsTo(models.Wallet, {
      foreignKey: 'currency',
    });
  };

  return Utxo;
};

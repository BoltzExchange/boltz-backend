import Sequelize from 'sequelize';
import * as db from '../../consts/Database';

export default (sequelize: Sequelize.Sequelize, dataTypes: Sequelize.DataTypes) => {
  const attributes: db.SequelizeAttributes<db.UtxoAttributes> = {
    id: { type: dataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    txHash: { type: dataTypes.STRING, allowNull: false },
    vout: { type: dataTypes.INTEGER, allowNull: false },
    currency: { type: dataTypes.STRING, allowNull: false },
    value: { type: dataTypes.INTEGER, allowNull: false },
    confirmed: { type: dataTypes.BOOLEAN, allowNull: true },
    outputId: { type: dataTypes.INTEGER, allowNull: false },
  };

  const options: Sequelize.DefineOptions<db.UtxoInstance> = {
    tableName: 'utxos',
    timestamps: false,
  };

  const Utxo = sequelize.define<db.UtxoInstance, db.UtxoAttributes>('Utxo', attributes, options);

  Utxo.associate = (models: Sequelize.Models) => {
    models.Utxo.belongsTo(models.Output, {
      foreignKey: 'outputId',
    });
  };

  return Utxo;
};

import { Model, Sequelize, DataTypes } from 'sequelize';
import Output from './Output';
import Wallet from './Wallet';

type UtxoType = {
  outputId: number;
  currency: string;

  txId: string;
  vout: number;
  value: number;

  confirmed: boolean;
  spent: boolean;
};

class Utxo extends Model implements UtxoType {
  public id!: number;

  public outputId!: number;
  public currency!: string;

  public txId!: string;
  public vout!: number;
  public value!: number;

  public confirmed!: boolean;
  public spent!: boolean;

  public static load = (sequelize: Sequelize) => {
    Utxo.init({
      id: { type: new DataTypes.INTEGER(), primaryKey: true, autoIncrement: true },
      outputId: { type: new DataTypes.INTEGER(), allowNull: false },
      currency: { type: new DataTypes.STRING(255), allowNull: false },
      txHash: { type: new DataTypes.STRING(255), allowNull: false },
      vout: { type: new DataTypes.INTEGER(), allowNull: false },
      value: { type: new DataTypes.INTEGER(), allowNull: false },
      confirmed: { type: DataTypes.BOOLEAN, allowNull: false },
      spent: { type: DataTypes.BOOLEAN, allowNull: false },
    }, {
      sequelize,
      timestamps: false,
      tableName: 'utxos',
    });

    Utxo.belongsTo(Output, {
      foreignKey: 'outputId',
    });

    Utxo.belongsTo(Wallet, {
      foreignKey: 'currency',
    });
  }
}

export default Utxo;
export { UtxoType };

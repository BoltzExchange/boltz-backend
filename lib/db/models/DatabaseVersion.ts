import { Model, Sequelize, DataTypes } from 'sequelize';

type DatabaseVersionType = {
  version: number;
};

class DatabaseVersion extends Model implements DatabaseVersionType {
  public version!: number;

  public static load = (sequelize: Sequelize): void => {
    DatabaseVersion.init({
      version: { type: new DataTypes.INTEGER, primaryKey: true, allowNull: false },
    }, {
      sequelize,
      timestamps: false,
      tableName: 'version',
    });
  }
}

export default DatabaseVersion;
export { DatabaseVersionType };

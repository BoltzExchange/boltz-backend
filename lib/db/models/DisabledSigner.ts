import { DataTypes, Model, type Sequelize } from 'sequelize';

type DisabledSignerType = {
  signer: string;
};

class DisabledSigner extends Model implements DisabledSignerType {
  declare signer: string;

  public static load = (sequelize: Sequelize): void => {
    DisabledSigner.init(
      {
        signer: {
          type: new DataTypes.TEXT(),
          primaryKey: true,
          allowNull: false,
        },
      },
      {
        sequelize,
        timestamps: false,
        tableName: 'disabled_signers',
      },
    );
  };
}

export default DisabledSigner;
export { DisabledSignerType };

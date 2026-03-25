import type { Sequelize } from 'sequelize';
import { DataTypes, Model } from 'sequelize';

type FundingAddressType = {
  id: string;
  status: string;
  symbol: string;
  keyIndex: number;
  theirPublicKey: Buffer;
  tree?: string;
  timeoutBlockHeight: number;
  lockupTransactionId?: string;
  lockupTransactionVout?: number;
  lockupAmount?: number;
  swapId?: string;
  presignedTx?: Buffer;
};

class FundingAddress extends Model implements FundingAddressType {
  declare id: string;
  declare status: string;
  declare symbol: string;
  declare keyIndex: number;
  declare theirPublicKey: Buffer;
  declare tree?: string;
  declare timeoutBlockHeight: number;
  declare lockupTransactionId?: string;
  declare lockupTransactionVout?: number;
  declare lockupAmount?: number;
  declare swapId?: string;
  declare presignedTx?: Buffer;

  public static load = (sequelize: Sequelize): void => {
    FundingAddress.init(
      {
        id: {
          type: new DataTypes.STRING(255),
          primaryKey: true,
          allowNull: false,
        },
        status: {
          type: new DataTypes.STRING(255),
          allowNull: false,
        },
        symbol: {
          type: new DataTypes.STRING(255),
          allowNull: false,
        },
        keyIndex: {
          type: new DataTypes.INTEGER(),
          allowNull: false,
        },
        theirPublicKey: {
          type: new DataTypes.BLOB(),
          allowNull: false,
        },
        tree: {
          type: new DataTypes.TEXT(),
          allowNull: true,
        },
        timeoutBlockHeight: {
          type: new DataTypes.INTEGER(),
          allowNull: false,
        },
        lockupTransactionId: {
          type: new DataTypes.STRING(255),
          allowNull: true,
        },
        lockupTransactionVout: {
          type: new DataTypes.INTEGER(),
          allowNull: true,
        },
        lockupAmount: {
          type: new DataTypes.BIGINT(),
          allowNull: true,
        },
        swapId: {
          type: new DataTypes.STRING(255),
          allowNull: true,
        },
        presignedTx: {
          type: DataTypes.BLOB,
          allowNull: true,
        },
      },
      {
        sequelize,
        tableName: 'funding_addresses',
        underscored: true,
      },
    );
  };
}

export default FundingAddress;
export { FundingAddressType };

import type { Sequelize } from 'sequelize';
import { DataTypes, Model } from 'sequelize';

type FundingAddressType = {
  id: string;
  symbol: string;
  keyIndex: number;
  theirPublicKey: string;
  timeoutBlockHeight: number;
  lockupTransactionId?: string;
  lockupTransactionVout?: number;
  lockupAmount?: number;
  swapId?: string;
  presignedTx?: Buffer;
};

class FundingAddress extends Model implements FundingAddressType {
  public id!: string;
  public symbol!: string;
  public keyIndex!: number;
  public theirPublicKey!: string;
  public timeoutBlockHeight!: number;
  public lockupTransactionId?: string;
  public lockupTransactionVout?: number;
  public lockupAmount?: number;
  public swapId?: string;
  public presignedTx?: Buffer;

  public static load = (sequelize: Sequelize): void => {
    FundingAddress.init(
      {
        id: {
          type: new DataTypes.STRING(255),
          primaryKey: true,
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
          type: new DataTypes.STRING(255),
          allowNull: false,
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

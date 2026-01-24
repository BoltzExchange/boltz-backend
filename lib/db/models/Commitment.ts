import { Signature } from 'ethers';
import type { Sequelize } from 'sequelize';
import { DataTypes, Model } from 'sequelize';
import { getHexString } from '../../Utils';

type CommitmentType = {
  swapId: string;
  transactionHash: string;
  logIndex: number;
  signature: Buffer;
};

class Commitment extends Model implements CommitmentType {
  declare swapId: string;
  declare transactionHash: string;
  declare logIndex: number;
  declare signature: Buffer;

  declare createdAt: Date;
  declare updatedAt: Date;

  public static load = (sequelize: Sequelize): void => {
    Commitment.init(
      {
        swapId: {
          type: new DataTypes.STRING(255),
          primaryKey: true,
          allowNull: false,
        },
        transactionHash: {
          type: new DataTypes.STRING(66),
          allowNull: false,
        },
        logIndex: {
          type: new DataTypes.INTEGER(),
          allowNull: false,
          validate: {
            min: 0,
          },
        },
        signature: {
          type: new DataTypes.BLOB(),
          allowNull: false,
        },
      },
      {
        sequelize,
        tableName: 'commitments',
        indexes: [
          {
            unique: true,
            fields: ['transactionHash', 'logIndex'],
          },
        ],
      },
    );
  };

  public get signatureEthers() {
    return Signature.from(`0x${getHexString(this.signature)}`);
  }
}

export default Commitment;
export { CommitmentType };
